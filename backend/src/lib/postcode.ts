// NIPOST postcode parsing, formatting and comparison.
// Format: 11 chars, 5 segments  AA 99 H77 BB 55
//   state(2 alpha) lga(2 num) district(3 alnum) area(2 alpha) unit(2 num)
// Reference: https://docs.postcode.gov.ng/concepts/postcode-format.md

export interface PostcodeParts {
  state: string; // 2 alpha
  lga: string; // 2 num
  district: string; // 3 alnum
  area: string; // 2 alpha
  unit: string; // 2 num
}

export const SEGMENT_ORDER: (keyof PostcodeParts)[] = [
  "state",
  "lga",
  "district",
  "area",
  "unit",
];

export type MatchDepth = "none" | "state" | "lga" | "district" | "area" | "unit";

/** Strip spaces/hyphens, uppercase. Accepts canonical, display or compact input. */
export function normalize(code: string): string {
  return (code || "").replace(/[\s-]/g, "").toUpperCase();
}

/** Parse to parts, or null if the shape is invalid. */
export function parse(code: string): PostcodeParts | null {
  const c = normalize(code);
  if (c.length !== 11) return null;
  const parts: PostcodeParts = {
    state: c.slice(0, 2),
    lga: c.slice(2, 4),
    district: c.slice(4, 7),
    area: c.slice(7, 9),
    unit: c.slice(9, 11),
  };
  return isValid(parts) ? parts : null;
}

export function isValid(p: PostcodeParts): boolean {
  return (
    /^[A-Z]{2}$/.test(p.state) &&
    /^(0[1-9]|[1-9][0-9])$/.test(p.lga) && // 01-99, never 00
    /^[A-Z0-9]{3}$/.test(p.district) &&
    /^[A-Z]{2}$/.test(p.area) &&
    /^(0[1-9]|[1-9][0-9])$/.test(p.unit)
  );
}

export function isValidCode(code: string): boolean {
  return parse(code) !== null;
}

/** Canonical hyphenated form: EK-01-A03-FK-01 */
export function format(code: string): string {
  const p = parse(code);
  if (!p) return normalize(code);
  return `${p.state}-${p.lga}-${p.district}-${p.area}-${p.unit}`;
}

/** Spaced display form: EK 01 A03 FK 01 */
export function display(code: string): string {
  return format(code).replace(/-/g, " ");
}

/**
 * How deep two postcodes match, walking state -> lga -> district -> area -> unit.
 * Returns the deepest consecutively-matching segment, or "none".
 */
export function matchDepth(a: string, b: string): MatchDepth {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return "none";
  let depth: MatchDepth = "none";
  for (const seg of SEGMENT_ORDER) {
    if (pa[seg] === pb[seg]) depth = seg;
    else break;
  }
  return depth;
}

export function depthRank(d: MatchDepth): number {
  return ["none", "state", "lga", "district", "area", "unit"].indexOf(d);
}
