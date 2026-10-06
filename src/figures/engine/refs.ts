// The figure reference grammar. A figure declares only points; everything drawn on top of
// them (in the figure spec, toggles and proof steps) is written as short tokens:
//
//   A          point              AB        segment          ABC…   polygon (3+ points)
//   line:AB    full line          ray:AB    ray from A        (OA)   circle, centre O through A
//   arc:OAB    arc of the circle centred at O (radius OA), counter-clockwise from A to B
//   vec:AB     vector from A to B (an arrow)        hid:AB   hidden edge of a solid (dashed)
//   <ABC       angle at B         <A        interior angle of the base polygon at A
//                                           (drawn as a square mark when it is 90°)
//   AB=CD      equal-length ticks <A=<C     equal-angle arcs  AB||CD parallel arrows
//   |AB|       dimension line     |AB|a     dimension labelled "a = …"
//
// Point names: one capital letter, optionally followed by digits or primes (A, A1, B').
export type Seg = readonly [string, string];
export type Ang = { a?: string; v: string; b?: string }; // a/b missing → interior angle at v
export type Ref =
  | { k: 'point'; p: string }
  | { k: 'seg'; s: Seg }
  | { k: 'line' | 'ray' | 'vec' | 'hid'; s: Seg }
  | { k: 'poly'; ps: string[] }
  | { k: 'angle'; ang: Ang }
  | { k: 'eqseg'; segs: Seg[] }
  | { k: 'eqang'; angs: Ang[] }
  | { k: 'par'; segs: Seg[] }
  | { k: 'circle'; c: string; p: string }
  | { k: 'arc'; c: string; a: string; b: string }
  | { k: 'dim'; s: Seg; sym?: string };

const NAME = /[A-Z][0-9']*/y;

/** Split "ABO" into ["A", "B", "O"]; throws on anything that is not a point name. */
export function names(s: string): string[] {
  const out: string[] = [];
  NAME.lastIndex = 0;
  while (NAME.lastIndex < s.length) {
    const at = NAME.lastIndex, m = NAME.exec(s);
    if (!m) throw new Error(`"${s}": expected a point name at "${s.slice(at)}"`);
    out.push(m[0]);
  }
  return out;
}

function seg(s: string): Seg {
  const n = names(s);
  if (n.length !== 2) throw new Error(`"${s}" is not a segment (two points)`);
  return [n[0]!, n[1]!];
}

function ang(s: string): Ang {
  if (!s.startsWith('<')) throw new Error(`"${s}" is not an angle (starts with <)`);
  const n = names(s.slice(1));
  if (n.length === 1) return { v: n[0]! };
  if (n.length === 3) return { a: n[0]!, v: n[1]!, b: n[2]! };
  throw new Error(`"${s}": an angle is <A or <ABC`);
}

export function parseRef(tok: string): Ref {
  let m: RegExpMatchArray | null;
  if ((m = tok.match(/^\|([^|]+)\|([A-Za-zα-ω]\w*)?$/))) return { k: 'dim', s: seg(m[1]!), ...(m[2] ? { sym: m[2] } : {}) };
  if ((m = tok.match(/^(line|ray|vec|hid):(.+)$/))) return { k: m[1] as 'line' | 'ray' | 'vec' | 'hid', s: seg(m[2]!) };
  if ((m = tok.match(/^arc:(.+)$/))) {
    const n = names(m[1]!);
    if (n.length !== 3) throw new Error(`"${tok}": an arc is arc:OAB (centre, from, to)`);
    return { k: 'arc', c: n[0]!, a: n[1]!, b: n[2]! };
  }
  if ((m = tok.match(/^\(([^)]+)\)$/))) { const [c, p] = seg(m[1]!); return { k: 'circle', c, p }; }
  if (tok.includes('||')) return { k: 'par', segs: tok.split('||').map(seg) };
  if (tok.includes('=')) {
    const parts = tok.split('=');
    return parts[0]!.startsWith('<') ? { k: 'eqang', angs: parts.map(ang) } : { k: 'eqseg', segs: parts.map(seg) };
  }
  if (tok.startsWith('<')) return { k: 'angle', ang: ang(tok) };
  const n = names(tok);
  if (n.length === 1) return { k: 'point', p: n[0]! };
  if (n.length === 2) return { k: 'seg', s: [n[0]!, n[1]!] };
  return { k: 'poly', ps: n };
}

export const parseRefs = (s = ''): Ref[] => s.split(/\s+/).filter(Boolean).map(parseRef);

/** Every point a reference mentions (used by the content linter). */
export function refPoints(r: Ref): string[] {
  const angPts = (a: Ang) => [a.a, a.v, a.b].filter((x): x is string => !!x);
  switch (r.k) {
    case 'point': return [r.p];
    case 'seg': case 'line': case 'ray': case 'vec': case 'hid': case 'dim': return [...r.s];
    case 'poly': return r.ps;
    case 'angle': return angPts(r.ang);
    case 'eqseg': case 'par': return r.segs.flat();
    case 'eqang': return r.angs.flatMap(angPts);
    case 'circle': return [r.c, r.p];
    case 'arc': return [r.c, r.a, r.b];
  }
}
