/**
 * Serialize an object for safe embedding inside a
 * `<script type="application/ld+json">` tag.
 *
 * JSON.stringify does NOT escape <, >, &, or the line separators
 * U+2028 / U+2029. When the object contains user-controlled values (player
 * names, bios, school/team, etc.) an attacker could embed a closing script
 * tag and break out of the element to achieve stored XSS. Escaping these to
 * their backslash-u forms is still valid JSON, parsed identically by search
 * engines, while making break-out impossible.
 */
const SEP = new RegExp("[\\u2028\\u2029]", "g");

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(SEP, (c) => "\\u" + c.charCodeAt(0).toString(16));
}
