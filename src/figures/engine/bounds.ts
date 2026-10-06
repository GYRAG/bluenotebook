import type { FigureSpec, Params } from './spec';

/** Deterministic PRNG so bounds (and tests) are reproducible. */
export function rng(seed = 1) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export function randomParams(spec: FigureSpec, r: () => number): Params {
  return Object.fromEntries(Object.entries(spec.params).map(([k, d]) => [k, d.min + (d.max - d.min) * r()]));
}

/** Every point the figure can ever reach: the fixed board, so the scale never changes.
 *  An even grid over the sliders (extremes of a shape are often mid-range, e.g. a rhombus is
 *  tallest at 90°) plus random samples for figures with many parameters. */
export function boardBounds(spec: FigureSpec): [number, number, number, number] {
  if (spec.board) return spec.board;
  const keys = Object.keys(spec.params), r = rng(7), samples: Params[] = [];
  const per = Math.max(2, Math.floor(Math.pow(4000, 1 / keys.length)));
  if (Math.pow(per, keys.length) <= 20000) {
    const grid = (i: number, acc: Params) => {
      if (i === keys.length) return void samples.push({ ...acc });
      const d = spec.params[keys[i]!]!;
      for (let j = 0; j < per; j++) grid(i + 1, { ...acc, [keys[i]!]: d.min + ((d.max - d.min) * j) / (per - 1) });
    };
    grid(0, {});
  }
  for (let i = 0; i < 2000; i++) samples.push(randomParams(spec, r));
  const only = spec.boundsOf;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of samples) for (const [n, [x, y]] of Object.entries(spec.points(p))) {
    if (only && !only.includes(n)) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const m = 0.01 * Math.max(x1 - x0, y1 - y0); // grid steps can miss a peak by a hair
  return [x0 - m, y0 - m, x1 + m, y1 + m];
}
