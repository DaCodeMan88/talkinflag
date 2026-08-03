import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import BlogEditor from "../BlogEditor";
import { buildLinkTargets } from "../link-targets";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  if (!(await getAdminUser())) redirect("/");
  const { postTargets, playerTargets } = await buildLinkTargets();
  return <BlogEditor mode="new" postTargets={postTargets} playerTargets={playerTargets} />;
}
