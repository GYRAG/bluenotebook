import type { FigureSpec, Params } from './spec';

/** Deterministic PRNG so bounds (and tests) are reproducible. */
export function rng(seed = 1) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export function randomParams(spec: FigureSpec, r: () => number): Params {
  return Object.fromEntries(Object.entries(spec.params).map(([k, d]) => [k, d.min + (d.max - d.min) * r()]));
}

/** Every point the figure can ever reach: the fixed board, so the scale never changes. */
export function boardBounds(spec: FigureSpec): [number, number, number, number] {
  const keys = Object.keys(spec.params), r = rng(7), samples: Params[] = [];
  for (let mask = 0; mask < 1 << keys.length; mask++) {
    samples.push(Object.fromEntries(keys.map((k, i) => [k, mask & (1 << i) ? spec.params[k]!.max : spec.params[k]!.min])));
  }
  for (let i = 0; i < 400; i++) samples.push(randomParams(spec, r));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of samples) for (const [x, y] of Object.values(spec.points(p))) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}
