import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Submit an Event | Talkin Flag — Flag Football Calendar",
  description: "Submit a flag football event to the Talkin Flag calendar. Tournaments, championships, and qualifiers from around the world welcome.",
  path: "/events/submit",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
