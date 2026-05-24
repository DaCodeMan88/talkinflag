/**
 * Lightweight rich-text renderer for static blog post bodies.
 * Handles the minimal formatting used in staticPosts:
 *  - **bold text** inline
 *  - [link text](url) inline links
 *  - A standalone paragraph that IS just **heading** → renders as <h3> with anchor ID
 *  - Blocks whose lines all start with "- " → renders as <ul>
 *  - Regular paragraphs
 *
 * No external dependencies needed — kept intentionally simple.
 */

import type { ReactNode } from "react";

/** Slugify a heading string for use as an anchor ID. */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Split a string on **bold** and [link](url) markers. */
function renderInline(text: string): ReactNode {
  // Split on **bold** or [text](url) tokens
  const parts = text.split(/(\*\*.+?\*\*|\[.+?\]\(.+?\))/g);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    // Bold
    const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) {
      return <strong key={i} className="text-brand-white font-semibold">{boldMatch[1]}</strong>;
    }
    // Link
    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith("http");
      return (
        <a
          key={i}
          href={linkMatch[2]}
          className="text-brand-yellow underline underline-offset-2 hover:text-yellow-300 transition-colors"
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
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
        // Standalone **heading** paragraph → render as section heading with anchor
        const headingMatch = block.match(/^\*\*(.+?)\*\*$/);
        if (headingMatch) {
          const headingText = headingMatch[1];
          const headingId = slugifyHeading(headingText);
          return (
            <h3
              key={i}
              id={headingId}
              className="font-display text-base uppercase tracking-wide text-brand-white pt-2 scroll-mt-24"
            >
              {headingText}
            </h3>
          );
        }

        // List block: all non-empty lines start with "- "
        const lines = block.split("\n").filter(Boolean);
        const isListBlock = lines.length > 1 && lines.every((l) => l.startsWith("- "));
        if (isListBlock) {
          return (
            <ul key={i} className="list-disc list-inside space-y-1.5 text-brand-white/70 leading-relaxed pl-2">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }

        // Mixed block: has a header line followed by list items
        // e.g. "**Required:**\n- item1\n- item2"
        const firstLine = lines[0];
        const restLines = lines.slice(1);
        const hasListRest = restLines.length > 0 && restLines.every((l) => l.startsWith("- "));
        if (hasListRest) {
          return (
            <div key={i} className="space-y-2">
              <p className="text-brand-white/70 leading-relaxed">{renderInline(firstLine)}</p>
              <ul className="list-disc list-inside space-y-1.5 text-brand-white/70 leading-relaxed pl-4">
                {restLines.map((line, j) => (
                  <li key={j}>{renderInline(line.slice(2))}</li>
                ))}
              </ul>
            </div>
          );
        }

        // Regular paragraph with possible inline bold/links
        return (
          <p key={i} className="text-brand-white/70 leading-relaxed">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
