import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import BlogEditor from "../BlogEditor";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  if (!(await getAdminUser())) redirect("/");
  return <BlogEditor mode="new" />;
}
