"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RichText } from "@/components/blog/RichText";
import {
  slugify,
  autoSeoTitle,
  autoMetaDescription,
  keyTakeawaysSuggestion,
  seoChecklist,
} from "@/lib/blog/seo";
import {
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  archivePost,
  deletePost,
} from "./actions";
import {
  BLOG_CATEGORIES,
  type BlogEditorInput,
  type FaqInput,
  type ActionResult,
} from "./constants";
import { suggestInternalLinks, type LinkTarget } from "@/lib/blog/links";

type Status = "draft" | "published" | "archived";

export interface BlogEditorPost extends BlogEditorInput {
  id: string;
  status: Status;
}

interface BlogEditorProps {
  mode: "new" | "edit";
  post?: BlogEditorPost;
  /** Other posts that body mentions could link to (self-slug already excluded upstream). */
  postTargets?: LinkTarget[];
  /** Approved players that body mentions could link to. */
  playerTargets?: LinkTarget[];
}

const LABEL = "block text-[10px] font-display uppercase tracking-widest text-white/40 mb-1.5";
const INPUT =
  "w-full bg-[#0d0d0d] border border-white/10 focus:border-[#FDDD58]/60 outline-none text-white text-sm px-3 py-2 transition-colors";
const SECTION = "border border-white/10 bg-[#0a0a0a] p-4 sm:p-5 space-y-4";
const SECTION_TITLE = "font-display text-sm uppercase tracking-widest text-[#FDDD58]";

export default function BlogEditor({
  mode,
  post,
  postTargets,
  playerTargets,
}: BlogEditorProps) {
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
  // Delete is irreversible, so it takes two clicks: the button arms, then confirms.
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Image-upload state
  const [coverUploading, setCoverUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // SEO & GEO panel collapse state (open by default so it's discoverable)
  const [seoOpen, setSeoOpen] = useState(true);

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

  /**
   * Permanently delete, then go back to the list. Unlike `runLifecycle` this
   * does NOT save first — persisting edits to a row we're about to drop is
   * pointless, and a validation error there would block the delete.
   */
  function handleDelete() {
    if (!post) return;
    setMessage(null);
    startTransition(async () => {
      const res = await deletePost(post.id);
      if (!res.ok) {
        setConfirmDelete(false);
        setMessage({ ok: false, text: res.error });
        return;
      }
      router.push("/admin/blog");
      router.refresh();
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

  // Cleaned repeater values shared by the checklist + JSON-LD preview.
  const cleanTakeaways = keyTakeaways.map((t) => t.trim()).filter(Boolean);
  const cleanFaqItems = faqItems
    .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
    .filter((f) => f.q || f.a);

  // Live SEO/GEO checklist — recomputes every render as fields change.
  const checklist = seoChecklist({
    title,
    seoDescription,
    body,
    coverImageUrl,
    coverImageAlt,
    faqItems: cleanFaqItems,
    keyTakeaways: cleanTakeaways,
  });
  const checklistPass = checklist.filter((c) => c.pass).length;

  // Effective values shown in the previews (fall back to the content fields).
  const previewTitle = seoTitle.trim() || title.trim() || "Untitled post";
  const previewDescription =
    seoDescription.trim() || excerpt.trim() || "Add a meta description…";
  const previewOgImage = ogImageUrl.trim() || coverImageUrl.trim();

  // Reset SEO helpers to their auto-derived values from the current content.
  const resetSeoToAuto = () => {
    setSeoTitle(autoSeoTitle(title));
    setSeoDescription(autoMetaDescription(excerpt || body));
  };

  // Fill key takeaways from the body when the repeater is empty-ish.
  const suggestTakeaways = () => {
    const suggested = keyTakeawaysSuggestion(body);
    if (suggested.length > 0) setKeyTakeaways(suggested);
  };

  // Live internal-link suggestions (recompute as the body/targets change).
  const linkSuggestions = suggestInternalLinks(body, {
    posts: postTargets ?? [],
    players: playerTargets ?? [],
  });

  /** Wrap the FIRST not-already-linked occurrence of `text` in the body with [text](href). */
  const insertInternalLink = (text: string, href: string) => {
    setBody((prev) => {
      // Ranges already inside a markdown link — skip matches overlapping them.
      const linked: Array<[number, number]> = [];
      const linkRe = /\[[^\]]*\]\([^)]*\)/g;
      let lm: RegExpExecArray | null;
      while ((lm = linkRe.exec(prev)) !== null) {
        linked.push([lm.index, lm.index + lm[0].length]);
      }
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(prev)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        const overlaps = linked.some(([s, e]) => start < e && end > s);
        if (overlaps) continue;
        return prev.slice(0, start) + `[${m[0]}](${href})` + prev.slice(end);
      }
      return prev; // nothing to replace (already linked / gone)
    });
  };

  // Counter colour bands.
  const titleLen = seoTitle.length;
  const titleColor =
    titleLen >= 50 && titleLen <= 60
      ? "text-green-400"
      : titleLen > 60
        ? "text-red-400"
        : "text-white/40";
  const descLen = seoDescription.length;
  const descColor =
    descLen > 160
      ? "text-red-400"
      : descLen >= 120 && descLen <= 160
        ? "text-green-400"
        : "text-white/40";

  // Read-only JSON-LD preview mirroring what the public page emits.
  const jsonLdPreview = (() => {
    const url = `https://talkinflag.com/blog/${slugPreview}`;
    const objects: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title || "Untitled post",
        description: seoDescription.trim() || excerpt.trim(),
        author: { "@type": "Person", name: author || "Talkin Flag", url: "https://talkinflag.com/about" },
        publisher: {
          "@type": "Organization",
          name: "Talkin Flag",
          url: "https://talkinflag.com",
          logo: { "@type": "ImageObject", url: "https://talkinflag.com/og-image.png" },
        },
        url,
        mainEntityOfPage: url,
        articleSection: category,
        ...(previewOgImage ? { image: { "@type": "ImageObject", url: previewOgImage } } : {}),
      },
    ];
    if (cleanFaqItems.length > 0) {
      objects.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: cleanFaqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      });
    }
    return JSON.stringify(objects.length === 1 ? objects[0] : objects, null, 2);
  })();

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
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="border border-red-500/60 bg-red-500/10 text-red-300 font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  {pending ? "Deleting…" : "Delete forever"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={pending}
                  className="text-white/40 font-display uppercase tracking-widest text-xs py-2.5 px-3 hover:text-white disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
                className="border border-white/10 text-white/40 font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:border-red-500/40 hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {confirmDelete && (
        <p className="mb-6 text-red-300/80 text-xs">
          This permanently removes “{title || "this post"}” and its URL
          (/blog/{slugPreview}). It cannot be undone — use Archive instead if you
          only want it off the site.
        </p>
      )}

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

          {/* Suggested internal links */}
          <div className={SECTION}>
            <h2 className={SECTION_TITLE}>Suggested internal links</h2>
            <p className="text-white/30 text-[11px]">
              Unlinked mentions of other posts + players found in the body. Insert wraps
              the first occurrence in a markdown link — great for SEO and reader flow.
            </p>
            {linkSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {linkSuggestions.map((s) => (
                  <li
                    key={`${s.text}|${s.href}`}
                    className="flex items-center justify-between gap-3 border border-white/10 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="text-white text-sm break-words">“{s.text}”</span>
                      <span className="block text-white/40 text-[11px]">
                        {s.reason} · {s.href}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => insertInternalLink(s.text, s.href)}
                      className="shrink-0 border border-[#FDDD58]/50 text-[#FDDD58] font-display uppercase tracking-widest text-[10px] py-1.5 px-3 hover:bg-[#FDDD58]/10 transition-colors"
                    >
                      Insert
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/25 text-[11px] italic">
                No unlinked mentions found yet — write more body copy, or nothing left to link.
              </p>
            )}
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
            <div className="flex items-center justify-between gap-2">
              <h2 className={SECTION_TITLE}>Key takeaways</h2>
              <button
                type="button"
                onClick={suggestTakeaways}
                className="shrink-0 border border-white/20 text-white/80 font-display uppercase tracking-widest text-[10px] py-1.5 px-3 hover:bg-white/5 transition-colors"
              >
                Suggest from body
              </button>
            </div>
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

          {/* SEO & GEO panel */}
          <div className={SECTION}>
            <button
              type="button"
              onClick={() => setSeoOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2"
            >
              <h2 className={SECTION_TITLE}>SEO &amp; GEO</h2>
              <span className="flex items-center gap-3">
                <span
                  className={`font-display text-[10px] uppercase tracking-widest ${
                    checklistPass === checklist.length ? "text-green-400" : "text-white/40"
                  }`}
                >
                  {checklistPass}/{checklist.length} checks
                </span>
                <span className="text-white/40 text-xs" aria-hidden="true">
                  {seoOpen ? "▾" : "▸"}
                </span>
              </span>
            </button>

            {seoOpen && (
              <div className="space-y-5 pt-1">
                <p className="text-white/25 text-[11px]">
                  Leave the title/description blank to auto-derive, or edit them below.
                </p>

                {/* Reset to auto */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/40 text-[10px] font-display uppercase tracking-widest">
                    Search fields
                  </span>
                  <button
                    type="button"
                    onClick={resetSeoToAuto}
                    className="shrink-0 border border-white/20 text-white/80 font-display uppercase tracking-widest text-[10px] py-1.5 px-3 hover:bg-white/5 transition-colors"
                  >
                    Reset to auto
                  </button>
                </div>

                {/* SEO title + counter */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL}>SEO title</label>
                    <span className={`text-[10px] font-mono ${titleColor}`}>
                      {titleLen} / 50–60
                    </span>
                  </div>
                  <input
                    className={INPUT}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={autoSeoTitle(title) || "Auto from title"}
                  />
                </div>

                {/* SEO description + counter */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL}>SEO description</label>
                    <span className={`text-[10px] font-mono ${descColor}`}>{descLen} / ≤160</span>
                  </div>
                  <textarea
                    className={`${INPUT} min-h-[60px]`}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={autoMetaDescription(excerpt || body) || "Auto from excerpt/body"}
                  />
                </div>

                {/* OG image URL */}
                <div>
                  <label className={LABEL}>OG image URL (defaults to cover image)</label>
                  <input
                    className={INPUT}
                    value={ogImageUrl}
                    onChange={(e) => setOgImageUrl(e.target.value)}
                    placeholder="Paste a URL or leave blank to use the cover image"
                  />
                </div>

                {/* Google result preview */}
                <div>
                  <p className="text-white/40 text-[10px] font-display uppercase tracking-widest mb-2">
                    Google result preview
                  </p>
                  <div className="bg-white rounded px-4 py-3">
                    <p className="text-[#1a0dab] text-[16px] leading-snug truncate">
                      {previewTitle}
                    </p>
                    <p className="text-[#006621] text-[12px] leading-snug">
                      talkinflag.com › blog › {slugPreview}
                    </p>
                    <p className="text-[#4d5156] text-[13px] leading-snug line-clamp-2 mt-0.5">
                      {previewDescription}
                    </p>
                  </div>
                </div>

                {/* OG / social card preview */}
                <div>
                  <p className="text-white/40 text-[10px] font-display uppercase tracking-widest mb-2">
                    Social / OG card preview
                  </p>
                  <div className="border border-white/10 rounded overflow-hidden bg-[#0d0d0d]">
                    {previewOgImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewOgImage}
                        alt="OG card preview"
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-white/5 text-white/25 text-xs">
                        No cover / OG image set
                      </div>
                    )}
                    <div className="px-3 py-2">
                      <p className="text-white/30 text-[10px] uppercase tracking-widest">
                        talkinflag.com
                      </p>
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2">
                        {previewTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live checklist */}
                <div>
                  <p className="text-white/40 text-[10px] font-display uppercase tracking-widest mb-2">
                    Content checklist
                  </p>
                  <ul className="space-y-2">
                    {checklist.map((c) => (
                      <li key={c.id} className="flex items-start gap-2">
                        <span
                          className={`shrink-0 text-sm leading-5 ${
                            c.pass ? "text-green-400" : "text-red-400"
                          }`}
                          aria-hidden="true"
                        >
                          {c.pass ? "✓" : "✗"}
                        </span>
                        <span>
                          <span
                            className={`text-xs ${c.pass ? "text-white/70" : "text-white/90"}`}
                          >
                            {c.label}
                          </span>
                          {!c.pass && (
                            <span className="block text-white/40 text-[11px] leading-snug">
                              {c.hint}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* JSON-LD preview (read-only) */}
                <div>
                  <p className="text-white/40 text-[10px] font-display uppercase tracking-widest mb-2">
                    Structured data (JSON-LD) — read only
                  </p>
                  <pre className="bg-black border border-white/10 text-white/50 text-[11px] leading-relaxed p-3 overflow-x-auto max-h-72">
                    {jsonLdPreview}
                  </pre>
                </div>
              </div>
            )}
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
