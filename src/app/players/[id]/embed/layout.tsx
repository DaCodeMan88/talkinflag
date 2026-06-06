// Bare layout — no Nav, no Footer, no providers
// This overrides the root layout for embed pages only
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
