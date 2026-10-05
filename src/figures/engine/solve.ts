// Dragging a point = finding the parameters that put it under the pointer. Every figure is
// "parameters → points", so instead of hand-writing an inverse per shape we solve it:
// damped Gauss–Newton over the parameters the point owns, with a numeric Jacobian, clamped
// to the slider ranges. Constraints hold automatically because points are always rebuilt.
import type { V } from './geom';
import type { FigureSpec, Params } from './spec';

export function snap(spec: FigureSpec, p: Params): Params {
  const out = { ...p };
  for (const [k, d] of Object.entries(spec.params)) {
    const v = Math.min(d.max, Math.max(d.min, out[k]!));
    const decimals = (String(d.step).split('.')[1] ?? '').length;
    out[k] = +(Math.round(v / d.step) * d.step).toFixed(decimals);
  }
  return out;
}

/** Solve linear system A x = b (n ≤ ~4) by Gaussian elimination with partial pivoting. */
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[piv]![c]!)) piv = r;
    [M[c], M[piv]] = [M[piv]!, M[c]!];
    const d = M[c]![c]! || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r]![c]! / d;
      for (let k = c; k <= n; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  return M.map((row, i) => row[n]! / (row[i]! || 1e-12));
}

export function solveDrag(spec: FigureSpec, params: Params, point: string, target: V, opts: { snap?: boolean } = {}): Params {
  const owned = spec.drag?.[point] ?? [];
  let p = { ...params };
  const at = (q: Params) => spec.points(q)[point]!;
  for (let it = 0; it < 20 && owned.length; it++) {
    const cur = at(p), r = [target[0] - cur[0], target[1] - cur[1]];
    if (Math.hypot(r[0]!, r[1]!) < 1e-9) break;
    const J = owned.map(k => {
      const d = spec.params[k]!, h = (d.max - d.min) * 1e-6;
      const c = at({ ...p, [k]: p[k]! + h });
      return [(c[0] - cur[0]) / h, (c[1] - cur[1]) / h] as const;
    });
    // normal equations (JᵀJ + λI) δ = Jᵀ r, lightly damped so a point at the edge of its range stays calm
    const n = owned.length;
    const JtJ = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => J[i]![0] * J[j]![0] + J[i]![1] * J[j]![1]));
    const lambda = 1e-9 * (JtJ.reduce((s, row, i) => s + row[i]!, 0) || 1);
    JtJ.forEach((row, i) => { row[i]! += lambda; });
    const delta = solveLinear(JtJ, J.map(j => j[0] * r[0]! + j[1] * r[1]!));
    const next = { ...p };
    owned.forEach((k, i) => {
      const d = spec.params[k]!;
      next[k] = Math.min(d.max, Math.max(d.min, p[k]! + delta[i]!));
    });
    p = next;
  }
  return opts.snap === false ? p : snap(spec, p);
}
