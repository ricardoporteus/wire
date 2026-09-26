/** Parse model JSON tolerantly: strip fences, then salvage the outermost object.
 *  Returns null (never throws) so only genuinely non-JSON routes to a repair pass. */
export function parseJson(text: string): unknown {
  const clean = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const tryParse = (s: string): unknown => { try { return JSON.parse(s); } catch { return undefined; } };
  const direct = tryParse(clean);
  if (direct !== undefined) return direct;
  const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
  if (a !== -1 && b > a) { const s = tryParse(clean.slice(a, b + 1)); if (s !== undefined) return s; }
  return null;
}
