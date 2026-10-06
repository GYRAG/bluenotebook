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

/** A typed answer against the exact one: rounding to two decimals is accepted. */
export function matches(typed: string, exact: number): boolean {
  try {
    const v = evaluate(typed);
    return Number.isFinite(v) && Math.abs(v - exact) <= Math.max(0.006, 1e-3 * Math.abs(exact));
  } catch {
    return false;
  }
}
