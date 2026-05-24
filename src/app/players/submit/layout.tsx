import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Submit Player Profile | Talkin Flag — Flag Football Database",
  description: "Submit your flag football player profile to the Talkin Flag database. Get discovered by coaches, scouts, and national team selectors worldwide. Free.",
  path: "/players/submit",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
