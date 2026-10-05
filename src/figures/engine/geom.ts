// Plane geometry on plain [x, y] tuples. Angles in the public API are in degrees.
export type V = readonly [number, number];

export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
export const scale = (a: V, s: number): V => [a[0] * s, a[1] * s];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
export const cross = (a: V, b: V) => a[0] * b[1] - a[1] * b[0];
export const len = (a: V) => Math.hypot(a[0], a[1]);
export const dist = (a: V, b: V) => len(sub(a, b));
export const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const unit = (a: V): V => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const perp = (a: V): V => [-a[1], a[0]];
export const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

/** Point at distance r and direction `angle` (degrees, counter-clockwise from +x). */
export const polar = (r: number, angle: number, o: V = [0, 0]): V => [o[0] + r * Math.cos(rad(angle)), o[1] + r * Math.sin(rad(angle))];

/** Intersection of lines AB and CD (they must not be parallel). */
export function intersect(a: V, b: V, c: V, d: V): V {
  const r = sub(b, a), s = sub(d, c), den = cross(r, s);
  return add(a, scale(r, cross(sub(c, a), s) / den));
}

/** Foot of the perpendicular from P to line AB. */
export function foot(p: V, a: V, b: V): V {
  const ab = sub(b, a);
  return add(a, scale(ab, dot(sub(p, a), ab) / dot(ab, ab)));
}

/** Angle PVQ at vertex V, in degrees, 0..180. */
export const angleAt = (p: V, v: V, q: V) => deg(Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(p, v)), unit(sub(q, v)))))));

/** Signed shoelace area (positive = counter-clockwise). */
export function signedArea(poly: readonly V[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) s += cross(poly[i]!, poly[(i + 1) % poly.length]!);
  return s / 2;
}
export const area = (poly: readonly V[]) => Math.abs(signedArea(poly));
export const perimeter = (poly: readonly V[]) => poly.reduce((s, p, i) => s + dist(p, poly[(i + 1) % poly.length]!), 0);

/** Equal up to a relative tolerance (values here come from snapped sliders, so 1e-6 is plenty). */
export const near = (x: number, y: number, tol = 1e-6) => Math.abs(x - y) <= tol * Math.max(1, Math.abs(x), Math.abs(y));
export const parallel = (a: V, b: V, c: V, d: V, tol = 1e-6) => Math.abs(cross(unit(sub(b, a)), unit(sub(d, c)))) <= tol;
export const perpendicular = (a: V, b: V, c: V, d: V, tol = 1e-6) => Math.abs(dot(unit(sub(b, a)), unit(sub(d, c)))) <= tol;

/** Distance from P to segment AB. */
export function segDist(p: V, a: V, b: V): number {
  const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
  return dist(p, add(a, scale(ab, t)));
}
