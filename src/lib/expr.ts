// Arithmetic for problem answers and the checks behind them: numbers (2,5 or 2.5), + − * / : ^,
// parentheses, √ (or sqrt), π (or pi), implicit multiplication (4√3, 2π, 3(1+2)). A caller may
// add identifiers through `atom` (lengths, angles, areas measured on a figure); without it a
// letter is an error, so a student's answer can only be a number.
export type Atom = (s: string, at: number) => { value: number; end: number } | null;

export function evaluate(src: string, atom?: Atom): number {
  const s = src.replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-').replace(/[·×]/g, '*')
    .replace(/sqrt/g, '√').replace(/pi/g, 'π').replace(/°/g, '');
  let i = 0;
  const fail = (): never => { throw new Error(`"${src}": unexpected "${s.slice(i) || 'end'}"`); };

  const expr = (): number => {
    let v = term();
    while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const t = term(); v = op === '+' ? v + t : v - t; }
    return v;
  };
  const term = (): number => {
    let v = unary();
    for (;;) {
      const c = s[i];
      if (c === '*' || c === '/' || c === ':') { i++; const f = unary(); v = c === '*' ? v * f : v / f; }
      else if (c !== undefined && /[\d.(√πA-Z<]/.test(c)) v *= power(); // 4√3, 2π, 3(1+2), 2AB
      else return v;
    }
  };
  const unary = (): number => (s[i] === '-' ? (i++, -unary()) : s[i] === '+' ? (i++, unary()) : power());
  const power = (): number => { const b = primary(); return s[i] === '^' ? (i++, b ** unary()) : b; };
  const primary = (): number => {
    const c = s[i];
    if (c === '(') { i++; const v = expr(); if (s[i++] !== ')') fail(); return v; }
    if (c === '√') { i++; return Math.sqrt(primary()); }
    if (c === 'π') { i++; return Math.PI; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (m) { i += m[0].length; return +m[0]; }
    const a = atom?.(s, i);
    if (a) { i = a.end; return a.value; }
    return fail();
  };

  const v = expr();
  if (i < s.length) fail();
  return v;
}

/** What a student writes around the number: "x = 5", "AB=5", "5 სმ", "60 გრადუსი", "4√3 ≈ 6,93". */
export function clean(typed: string): string {
  const s = typed.toLowerCase().replace(/[º˚]/g, '°').replace(/÷/g, '/')
    .split('≈').map(p => p.trim()).find(Boolean) ?? ''; // the exact form when both are given
  return s.replace(/^[^=]*=/, '') // a name in front
    .replace(/\s*(სმ|მმ|დმ|კმ|მ|cm|mm|dm|km|m|ერთეული|units?|გრადუსი|degrees?|deg)\.?\s*(\^?[23²³])?$/, '');
}

const value = (typed: string) => { try { return evaluate(clean(typed)); } catch { return NaN; } };
const near = (v: number, x: number) => Math.abs(v - x) <= Math.max(0.006, 1e-3 * Math.abs(x));

/** A typed answer against the exact one: rounding to two decimals is accepted. */
export const matches = (typed: string, exact: number) => near(value(typed), exact);

/** Why a wrong answer is wrong, when a common slip explains it (null: no idea, or not wrong). */
export type Slip = 'unreadable' | 'close' | 'sign' | 'supplement' | 'complement' | 'double' | 'half' | 'pi' | 'square' | 'root';
export function slip(typed: string, exact: number, angle = false): Slip | null {
  const v = value(typed), is = (x: number) => near(v, x);
  if (!Number.isFinite(v)) return 'unreadable';
  if (is(exact)) return null;
  if (Math.abs(v - exact) <= 0.02 * Math.abs(exact)) return 'close'; // rounded too early (6,93 → 7)
  if (exact !== 0 && is(-exact)) return 'sign';
  if (angle && is(180 - exact)) return 'supplement';
  if (angle && is(90 - exact)) return 'complement';
  if (is(2 * exact)) return 'double';
  if (is(exact / 2)) return 'half';
  if (is(exact * Math.PI) || is(exact / Math.PI)) return 'pi';
  if (exact > 0 && exact !== 1 && is(exact * exact)) return 'square';
  if (exact > 0 && exact !== 1 && is(Math.sqrt(exact))) return 'root';
  return null;
}
