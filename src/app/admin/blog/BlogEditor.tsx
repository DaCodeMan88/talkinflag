"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RichText } from "@/components/blog/RichText";
import { slugify } from "@/lib/blog/seo";
import {
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  archivePost,
} from "./actions";
import {
  BLOG_CATEGORIES,
  type BlogEditorInput,
  type FaqInput,
  type ActionResult,
} from "./constants";

type Status = "draft" | "published" | "archived";

export interface BlogEditorPost extends BlogEditorInput {
  id: string;
  status: Status;
}

interface BlogEditorProps {
  mode: "new" | "edit";
  post?: BlogEditorPost;
}

const LABEL = "block text-[10px] font-display uppercase tracking-widest text-white/40 mb-1.5";
const INPUT =
  "w-full bg-[#0d0d0d] border border-white/10 focus:border-[#FDDD58]/60 outline-none text-white text-sm px-3 py-2 transition-colors";
const SECTION = "border border-white/10 bg-[#0a0a0a] p-4 sm:p-5 space-y-4";
const SECTION_TITLE = "font-display text-sm uppercase tracking-widest text-[#FDDD58]";

export default function BlogEditor({ mode, post }: BlogEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState(post?.category ?? BLOG_CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [author, setAuthor] = useState(post?.author ?? "Talkin Flag");
  const [guestName, setGuestName] = useState(post?.guestName ?? "");
  const [guestRole, setGuestRole] = useState(post?.guestRole ?? "");
  const [youtubeVideoId, setYoutubeVideoId] = useState(post?.youtubeVideoId ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(post?.ogImageUrl ?? "");
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    post?.keyTakeaways && post.keyTakeaways.length > 0 ? post.keyTakeaways : [""]
  );
  const [faqItems, setFaqItems] = useState<FaqInput[]>(
    post?.faqItems && post.faqItems.length > 0 ? post.faqItems : [{ q: "", a: "" }]
  );

  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Image-upload state
  const [coverUploading, setCoverUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const status = post?.status;
  const slugPreview = slugify(title) || "post";

  /** Upload a single image file to Supabase Storage; returns the public URL or throws. */
  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/blog/image", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    return data.url as string;
  }

  async function handleCoverUpload(file: File | null | undefined) {
    if (!file) return;
    setMessage(null);
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImageUrl(url);
      setMessage({ ok: true, text: "Cover image uploaded." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setCoverUploading(false);
    }
  }

  /** Insert a markdown-lite image token into the body at the cursor (or append). */
  function insertImageToken(url: string, alt: string) {
    const token = `![${alt}](${url})`;
    const el = bodyRef.current;
    setBody((prev) => {
      // If we can find the textarea + a selection, insert as its own block there.
      if (el) {
        const start = el.selectionStart ?? prev.length;
        const end = el.selectionEnd ?? prev.length;
        const before = prev.slice(0, start);
        const after = prev.slice(end);
        const sep = before && !before.endsWith("\n\n") ? "\n\n" : "";
        const trailing = after && !after.startsWith("\n\n") ? "\n\n" : "";
        return `${before}${sep}${token}${trailing}${after}`;
      }
      // Fallback: append as a new block.
      return prev ? `${prev}\n\n${token}` : token;
    });
  }

  async function handleBodyImageUpload(file: File | null | undefined) {
    if (!file) return;
    setMessage(null);
    setBodyUploading(true);
    try {
      const url = await uploadImage(file);
      const alt = window.prompt("Alt text for this image (for SEO + accessibility):", "") ?? "";
      insertImageToken(url, alt.trim());
      setMessage({ ok: true, text: "Image inserted into body." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setBodyUploading(false);
    }
  }

  function collectInput(): BlogEditorInput {
    return {
      title,
      category,
      excerpt,
      body,
      author,
      coverImageUrl,
      coverImageAlt,
      seoTitle,
      seoDescription,
      ogImageUrl,
      keyTakeaways: keyTakeaways.map((t) => t.trim()).filter(Boolean),
      faqItems: faqItems
        .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
        .filter((f) => f.q || f.a),
      youtubeVideoId,
      guestName,
      guestRole,
    };
  }

  function handleResult(result: ActionResult, successText: string) {
    if (result.ok) {
      setMessage({ ok: true, text: successText });
      if (mode === "new") {
        router.push(`/admin/blog/${result.id}`);
      } else {
        router.refresh();
      }
    } else {
      setMessage({ ok: false, text: result.error });
    }
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      if (mode === "new") {
        handleResult(await createPost(collectInput()), "Draft created.");
      } else if (post) {
        handleResult(await updatePost(post.id, collectInput()), "Saved.");
      }
    });
  }

  function runLifecycle(
    fn: (id: string) => Promise<ActionResult>,
    successText: string
  ) {
    if (!post) return;
    setMessage(null);
    startTransition(async () => {
      // Persist current edits first so lifecycle acts on saved content.
      const saved = await updatePost(post.id, collectInput());
      if (!saved.ok) {
        setMessage({ ok: false, text: saved.error });
        return;
      }
      handleResult(await fn(post.id), successText);
    });
  }

  // Key-takeaways repeater helpers
  const setTakeaway = (i: number, v: string) =>
    setKeyTakeaways((prev) => prev.map((t, j) => (j === i ? v : t)));
  const addTakeaway = () => setKeyTakeaways((prev) => [...prev, ""]);
  const removeTakeaway = (i: number) =>
    setKeyTakeaways((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : [""]));

  // FAQ repeater helpers
  const setFaq = (i: number, key: "q" | "a", v: string) =>
    setFaqItems((prev) => prev.map((f, j) => (j === i ? { ...f, [key]: v } : f)));
  const addFaq = () => setFaqItems((prev) => [...prev, { q: "", a: "" }]);
  const removeFaq = (i: number) =>
    setFaqItems((prev) =>
      prev.length > 1 ? prev.filter((_, j) => j !== i) : [{ q: "", a: "" }]
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="border-l-4 border-[#FDDD58] pl-5">
          <p className="text-white/30 text-[10px] font-display uppercase tracking-widest">
            {mode === "new" ? "New post" : "Edit post"}
            {status ? ` · ${status}` : ""}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl uppercase text-white leading-none mt-1">
            {title || "Untitled"}
          </h1>
          <p className="text-white/30 text-xs mt-2">/blog/{slugPreview}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6 sticky top-0 z-10 bg-black/80 backdrop-blur py-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-[#FDDD58]/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Working…" : mode === "new" ? "Create draft" : "Save"}
        </button>
        {mode === "edit" && (
          <>
            {status !== "published" && (
              <button
                type="button"
                onClick={() => runLifecycle(publishPost, "Published.")}
                disabled={pending}
                className="border border-[#FDDD58]/50 text-[#FDDD58] font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-[#FDDD58]/10 disabled:opacity-50 transition-colors"
              >
                Publish
              </button>
            )}
            {status === "published" && (
              <button
                type="button"
                onClick={() => runLifecycle(unpublishPost, "Unpublished (back to draft).")}
                disabled={pending}
                className="border border-white/20 text-white/80 font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              onClick={() => runLifecycle(archivePost, "Archived.")}
              disabled={pending}
              className="border border-white/10 text-white/40 font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-white/5 disabled:opacity-50 transition-colors ml-auto"
            >
              Archive
            </button>
          </>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 text-sm border ${
            message.ok
              ? "border-[#FDDD58]/40 bg-[#FDDD58]/5 text-[#FDDD58]"
              : "border-red-500/40 bg-red-500/5 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: form */}
        <div className="space-y-6">
          {/* Core */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>Content</h2>
            <div>
              <label className={LABEL}>Title</label>
              <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} />
              <p className="text-white/25 text-[11px] mt-1">Slug preview: /blog/{slugPreview}</p>
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <select
                className={INPUT}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0d0d0d]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Excerpt</label>
              <textarea
                className={`${INPUT} min-h-[70px]`}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Author</label>
              <input className={INPUT} value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
          </div>

          {/* Body */}
          <div className={SECTION}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={SECTION_TITLE}>Body</h2>
              <label
                className={`shrink-0 cursor-pointer border border-white/20 text-white/80 font-display uppercase tracking-widest text-[10px] py-1.5 px-3 hover:bg-white/5 transition-colors ${
                  bodyUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {bodyUploading ? "Uploading…" : "+ Insert image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={bodyUploading}
                  onChange={(e) => {
                    handleBodyImageUpload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="text-white/40 text-[11px] leading-relaxed border border-white/10 bg-black/40 px-3 py-2">
              <span className="font-semibold text-white/60">Markdown-lite:</span>{" "}
              <code>**bold**</code> · <code>[text](url)</code> ·{" "}
              <code>![alt](url)</code> on its own line → image ·{" "}
              <code>**Heading**</code> on its own line → heading ·{" "}
              <code>- item</code> lines → bullet list · blank line between paragraphs.
            </div>
            <textarea
              ref={bodyRef}
              className={`${INPUT} min-h-[340px] font-mono text-[13px] leading-relaxed`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Interview / guest */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>Interview / guest (optional)</h2>
            <div>
              <label className={LABEL}>Guest name</label>
              <input
                className={INPUT}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>Guest role</label>
              <input
                className={INPUT}
                value={guestRole}
                onChange={(e) => setGuestRole(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>YouTube video ID</label>
              <input
                className={INPUT}
                value={youtubeVideoId}
                onChange={(e) => setYoutubeVideoId(e.target.value)}
                placeholder="e.g. dQw4w9WgXcQ (not the full URL)"
              />
            </div>
          </div>

          {/* Key takeaways */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>Key takeaways</h2>
            <p className="text-white/30 text-[11px]">
              Quotable one-liners for readers and AI answer engines (aim for 3+).
            </p>
            {keyTakeaways.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={INPUT}
                  value={t}
                  onChange={(e) => setTakeaway(i, e.target.value)}
                  placeholder={`Takeaway ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeTakeaway(i)}
                  className="shrink-0 border border-white/10 text-white/40 px-3 hover:bg-white/5 transition-colors"
                  aria-label="Remove takeaway"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTakeaway}
              className="text-[#FDDD58] text-xs font-display uppercase tracking-widest hover:underline"
            >
              + Add takeaway
            </button>
          </div>

          {/* FAQ */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>FAQ / Q&amp;A</h2>
            <p className="text-white/30 text-[11px]">
              Q&amp;A blocks power FAQ structured data and are what AI engines quote.
            </p>
            {faqItems.map((f, i) => (
              <div key={i} className="space-y-2 border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[10px] font-display uppercase tracking-widest">
                    Q&amp;A {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-white/40 text-xs hover:text-white"
                    aria-label="Remove FAQ"
                  >
                    ✕
                  </button>
                </div>
                <input
                  className={INPUT}
                  value={f.q}
                  onChange={(e) => setFaq(i, "q", e.target.value)}
                  placeholder="Question"
                />
                <textarea
                  className={`${INPUT} min-h-[60px]`}
                  value={f.a}
                  onChange={(e) => setFaq(i, "a", e.target.value)}
                  placeholder="Answer"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addFaq}
              className="text-[#FDDD58] text-xs font-display uppercase tracking-widest hover:underline"
            >
              + Add Q&amp;A
            </button>
          </div>

          {/* Cover image */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>Cover image</h2>
            <p className="text-white/25 text-[11px]">
              Upload an image (JPG/PNG/WebP, max 5MB) or paste a URL directly.
            </p>

            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt={coverImageAlt || "Cover preview"}
                className="w-full max-h-52 object-cover rounded border border-white/10"
              />
            )}

            <div className="flex items-center gap-2">
              <label
                className={`shrink-0 cursor-pointer bg-white/5 border border-white/20 text-white/80 font-display uppercase tracking-widest text-[10px] py-2 px-4 hover:bg-white/10 transition-colors ${
                  coverUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {coverUploading ? "Uploading…" : coverImageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={coverUploading}
                  onChange={(e) => {
                    handleCoverUpload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl("")}
                  className="text-white/40 text-xs hover:text-white transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className={LABEL}>Cover image URL</label>
              <input
                className={INPUT}
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="Filled by upload, or paste a URL"
              />
            </div>
            <div>
              <label className={LABEL}>
                Cover image alt text <span className="text-[#FDDD58]">*required</span>
              </label>
              <input
                className={INPUT}
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Describe the image for SEO + accessibility"
              />
              {coverImageUrl && !coverImageAlt.trim() && (
                <p className="text-red-300/80 text-[11px] mt-1">
                  Add alt text — required for SEO and accessibility.
                </p>
              )}
            </div>
          </div>

          {/* SEO — Task 8 will enhance with previews + checklist */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>SEO / social</h2>
            <p className="text-white/25 text-[11px]">
              Leave blank to auto-derive from the title/excerpt. The full SEO panel
              (previews + checklist) comes in a later step.
            </p>
            <div>
              <label className={LABEL}>SEO title</label>
              <input
                className={INPUT}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>SEO description</label>
              <textarea
                className={`${INPUT} min-h-[60px]`}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>OG image URL</label>
              <input
                className={INPUT}
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div className="lg:sticky lg:top-16 lg:self-start">
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>Live preview</h2>
            <div className="border-t border-white/10 pt-4">
              <p className="text-[#FDDD58] text-[10px] font-display uppercase tracking-widest">
                {category}
              </p>
              <h3 className="font-display text-2xl uppercase text-white leading-tight mt-1">
                {title || "Untitled"}
              </h3>
              {(guestName || author) && (
                <p className="text-white/40 text-xs mt-2">
                  {guestName ? `${guestName}${guestRole ? ` · ${guestRole}` : ""}` : `By ${author}`}
                </p>
              )}
              {excerpt && (
                <p className="text-white/60 text-sm mt-4 italic border-l-2 border-[#FDDD58]/40 pl-3">
                  {excerpt}
                </p>
              )}
              <div className="mt-6">
                {body.trim() ? (
                  <RichText body={body} />
                ) : (
                  <p className="text-white/25 text-sm">Body preview appears here…</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
