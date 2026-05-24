/**
 * Lightweight rich-text renderer for static blog post bodies.
 * Handles the minimal formatting used in staticPosts:
 *  - **bold text** inline
 *  - A standalone paragraph that IS just **heading** → renders as <h3>
 *  - Regular paragraphs
 *
 * No external dependencies needed — kept intentionally simple.
 */

import type { ReactNode } from "react";

/** Split a text string on **...** markers, returning alternating plain/bold segments. */
function renderInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 0 ? part : <strong key={i} className="text-brand-white font-semibold">{part}</strong>
  );
}

interface RichTextProps {
  body: string;
  className?: string;
}

export function RichText({ body, className = "" }: RichTextProps) {
  const blocks = body
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-5 ${className}`}>
      {blocks.map((block, i) => {
        // Standalone **heading** paragraph → render as section heading
        const headingMatch = block.match(/^\*\*(.+?)\*\*$/);
        if (headingMatch) {
          return (
            <h3 key={i} className="font-display text-base uppercase tracking-wide text-brand-white pt-2">
              {headingMatch[1]}
            </h3>
          );
        }

        // Regular paragraph with possible inline bold
        return (
          <p key={i} className="text-brand-white/70 leading-relaxed">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
