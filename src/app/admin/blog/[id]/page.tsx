import { redirect, notFound } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { parseJsonArray } from "@/lib/blog/posts";
import type { FaqItem } from "@/lib/static-posts";
import BlogEditor, { type BlogEditorPost } from "../BlogEditor";

export const dynamic = "force-dynamic";

type Status = "draft" | "published" | "archived";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");

  const { id } = await params;
  const db = createAdminClient();
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("EditBlogPostPage:", error.message);
  if (!data) notFound();

  const post: BlogEditorPost = {
    id: data.id as string,
    status: (data.status as Status) ?? "draft",
    title: (data.title as string) ?? "",
    category: (data.category as string) ?? "",
    excerpt: (data.excerpt as string) ?? "",
    body: (data.body as string) ?? "",
    author: (data.author as string) ?? "Talkin Flag",
    coverImageUrl: (data.cover_image_url as string) ?? "",
    coverImageAlt: (data.cover_image_alt as string) ?? "",
    seoTitle: (data.seo_title as string) ?? "",
    seoDescription: (data.seo_description as string) ?? "",
    ogImageUrl: (data.og_image_url as string) ?? "",
    keyTakeaways: parseJsonArray<string>(data.key_takeaways),
    faqItems: parseJsonArray<FaqItem>(data.faq_items),
    youtubeVideoId: (data.youtube_video_id as string) ?? "",
    guestName: (data.guest_name as string) ?? "",
    guestRole: (data.guest_role as string) ?? "",
  };

  return <BlogEditor mode="edit" post={post} />;
}
