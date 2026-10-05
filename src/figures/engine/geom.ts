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
  if (Math.abs(den) < 1e-12) return mid(a, c); // parallel: no intersection; stay finite
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

/** Do segments AB and CD cross at an interior point? */
export function segmentsCross(a: V, b: V, c: V, d: V): boolean {
  const d1 = cross(sub(b, a), sub(c, a)), d2 = cross(sub(b, a), sub(d, a)), d3 = cross(sub(d, c), sub(a, c)), d4 = cross(sub(d, c), sub(b, c));
  return d1 * d2 < 0 && d3 * d4 < 0;
}
/** A quadrilateral whose sides do not cross each other. */
export const isSimpleQuad = ([a, b, c, d]: readonly V[]) => !segmentsCross(a!, b!, c!, d!) && !segmentsCross(b!, c!, d!, a!);
export const isConvex = (poly: readonly V[]) => {
  const t = poly.map((p, i) => Math.sign(cross(sub(p, poly[(i + poly.length - 1) % poly.length]!), sub(poly[(i + 1) % poly.length]!, p))));
  return t.every(x => x === t[0]);
};
/** Interior angles (degrees) of a simple polygon, reflex angles included. */
export function interiorAngles(poly: readonly V[]): number[] {
  const o = Math.sign(signedArea(poly)) || 1;
  return poly.map((p, i) => {
    const a = poly[(i + poly.length - 1) % poly.length]!, b = poly[(i + 1) % poly.length]!;
    const turn = deg(Math.atan2(cross(sub(p, a), sub(b, p)), dot(sub(p, a), sub(b, p))));
    return 180 - o * turn;
  });
}
/** The intersection of circles (c1, r1), (c2, r2) on the other side of line c1c2 from `away`. */
export function circleIntersection(c1: V, r1: number, c2: V, r2: number, away: V): V {
  const d = dist(c1, c2), x = (d * d + r1 * r1 - r2 * r2) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - x * x));
  const u: V = [(c2[0] - c1[0]) / d, (c2[1] - c1[1]) / d], base = add(c1, scale(u, x));
  const p1 = add(base, scale(perp(u), h)), p2 = add(base, scale(perp(u), -h));
  return Math.sign(cross(sub(c2, c1), sub(p1, c1))) !== Math.sign(cross(sub(c2, c1), sub(away, c1))) ? p1 : p2;
}
/** Circumcentre of triangle ABC. */
export function circumcenter(a: V, b: V, c: V): V {
  return intersect(mid(a, b), add(mid(a, b), perp(sub(b, a))), mid(a, c), add(mid(a, c), perp(sub(c, a))));
}

/** Incentre of triangle ABC (weighted by the opposite side lengths). */
export function incenter(a: V, b: V, c: V): V {
  const la = dist(b, c), lb = dist(c, a), lc = dist(a, b), s = la + lb + lc;
  return [(la * a[0] + lb * b[0] + lc * c[0]) / s, (la * a[1] + lb * b[1] + lc * c[1]) / s];
}
/** Orthocentre: where two altitudes meet. */
export const orthocenter = (a: V, b: V, c: V): V => intersect(a, foot(a, b, c), b, foot(b, c, a));
export const centroid = (...ps: V[]): V => scale(ps.reduce(add, [0, 0] as V), 1 / ps.length);

/** Triangle from two sides and the angle between them (AB = c, AC = b, ∠A = alpha),
 *  shifted so its centroid sits at the origin (the figure stays put while it changes). */
export function triangleSAS(c: number, b: number, alpha: number): { A: V; B: V; C: V } {
  const A: V = [0, 0], B: V = [c, 0], C = polar(b, alpha), G = centroid(A, B, C);
  return { A: sub(A, G), B: sub(B, G), C: sub(C, G) };
}
