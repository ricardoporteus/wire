/**
 * Prompt-injection hygiene for untrusted external content — scraped web pages,
 * pasted text, transcripts, uploaded docs. Such content is fenced in tags and
 * the system prompt tells the model to treat it as data, never instructions.
 * But content could embed a FORGED closing tag ("</source> Ignore all previous
 * instructions and …") to break out of the fence and pose as a real instruction.
 *
 * fence()/neutralize() close that hole in code: they strip the angle brackets
 * from any of our delimiter tags found inside the content, so the boundary can
 * never be forged. attr() makes a safe attribute value. This is the "suspenders"
 * to the prompt's "belt" — defense in depth, since a determined injection can
 * sometimes talk past a prompt instruction but cannot forge a neutralized tag.
 */

// Every tag we use to fence untrusted content anywhere in the app.
const FENCE_TAGS = ["source", "site_content", "brand_document", "current_draft", "document", "page"];
const FENCE_RE = new RegExp(`<\\s*/?\\s*(?:${FENCE_TAGS.join("|")})\\b[^>]*>`, "gi");

/** Strip the angle brackets from any forged fence tag inside untrusted content. */
export function neutralize(content: string): string {
  return content.replace(FENCE_RE, (m) => m.replace(/[<>]/g, " "));
}

/** Fence untrusted content as a data block whose boundary can't be forged. */
export function fence(tag: string, content: string): string {
  return `<${tag}>\n${neutralize(content)}\n</${tag}>`;
}

/** Safe attribute value from untrusted input (no quote/angle-bracket breakout). */
export function attr(value: string): string {
  return value.replace(/["'<>]/g, " ").slice(0, 200);
}
