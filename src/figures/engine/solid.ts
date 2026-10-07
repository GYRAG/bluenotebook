// Solids for stereometry. A solid spec gives 3D points (z up), its faces and its circles; it is
// turned into an ordinary figure spec whose points are the 3D points projected for the current
// view (yaw, pitch — two hidden parameters the reader changes by dragging the paper). Hidden edges
// and the back halves of circles come out dashed (hid:AB), the way textbooks draw solids.
// Checks and readouts receive the true 3D points.
import type { V } from './geom';
import { randomParams, rng } from './bounds';
import type { FigureSpec, Param, Params, Readout } from './spec';

export type V3 = [number, number, number];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const dist3 = (a: V3, b: V3) => len3(sub3(a, b));
export const mid3 = (a: V3, b: V3): V3 => scale3(add3(a, b), 0.5);
export const lerp3 = (a: V3, b: V3, t: number): V3 => add3(a, scale3(sub3(b, a), t));
export const unit3 = (a: V3): V3 => scale3(a, 1 / len3(a));
/** Angle at v between rays to a and b, in degrees. */
export const angle3 = (a: V3, v: V3, b: V3) => {
  const u = sub3(a, v), w = sub3(b, v);
  return (Math.acos(Math.max(-1, Math.min(1, dot3(u, w) / (len3(u) * len3(w))))) * 180) / Math.PI;
};
/** Volume of the tetrahedron abcd (unsigned). */
export const tetra = (a: V3, b: V3, c: V3, d: V3) => Math.abs(dot3(sub3(b, a), cross3(sub3(c, a), sub3(d, a)))) / 6;
/** Area of a planar polygon in space. */
export const area3 = (P: V3[]) => {
  let s: V3 = [0, 0, 0];
  for (let i = 0; i < P.length; i++) s = add3(s, cross3(P[i]!, P[(i + 1) % P.length]!));
  return len3(s) / 2;
};

/** World → camera: turn by −yaw about z, then tilt by pitch about x. Screen = (x, z), depth = y (away from the reader). */
export function camera(p: V3, yaw: number, pitch: number): V3 {
  const a = (yaw * Math.PI) / 180, b = (pitch * Math.PI) / 180;
  const x1 = Math.cos(a) * p[0] + Math.sin(a) * p[1], y1 = -Math.sin(a) * p[0] + Math.cos(a) * p[1];
  return [x1, Math.cos(b) * y1 - Math.sin(b) * p[2], Math.sin(b) * y1 + Math.cos(b) * p[2]];
}
/** Does a surface with outward normal n face the reader? */
export const facing = (n: V3, yaw: number, pitch: number) => camera(n, yaw, pitch)[1] < -1e-9;

/** A circle in space: centre c, radius r, in the plane spanned by unit vectors u, v. */
export interface Curve {
  name: string;                       // one capital letter: samples are named U0, U1, …
  c: V3; u: V3; v: V3; r: number;
  cap?: V3;                           // outward normal of the flat face it bounds: all of it shows when that face does
  normal?: (q: V3) => V3;             // outward normal of the curved surface at a point of the circle
  silhouette?: string;                // where the outline lines go: another curve's letter (cylinder) or a point (cone apex)
  screen?: boolean;                   // a sphere's outline: drawn in the screen plane, always visible
}
const N = 48;

export interface SolidOpts<K extends string> {
  kind: string;
  label: string;
  params: Record<K, Param>;
  points3: (p: Params<K>) => Record<string, V3>;
  faces?: string[][];                 // polyhedron faces (vertex names); edges are derived from them
  curves?: (p: Params<K>, P: Record<string, V3>) => Curve[];
  base?: string;                      // other refs always drawn (e.g. 'O' or a plane's outline)
  unlabeled?: string[];
  view?: { yaw: number; pitch: number };
  dims?: string;
  toggles?: Record<string, string>;
  readouts?: (P: Record<string, V3>, p: Params<K>) => Readout[];
  checks?: Record<string, (P: Record<string, V3>, p: Params<K>) => boolean>;
}

/** Every corner of the sliders' box (2^n combinations): the largest solid is usually at one of them. */
function extremes(params: Record<string, Param>): Params[] {
  let out: Params[] = [{}];
  for (const [k, d] of Object.entries(params)) out = out.flatMap(p => [{ ...p, [k]: d.min }, { ...p, [k]: d.max }]);
  return out.slice(0, 4096);
}

export function solid<K extends string>(o: SolidOpts<K>): FigureSpec {
  const view = o.view ?? { yaw: -32, pitch: 22 };
  const params: Record<string, Param> = {
    ...o.params,
    yaw: { label: 'მობრუნება', sym: 'ψ', min: -180, max: 180, step: 0.5, value: view.yaw, unit: '°', hidden: true },
    pitch: { label: 'დახრა', sym: 'θ', min: -30, max: 80, step: 0.5, value: view.pitch, unit: '°', hidden: true },
  };
  const P3 = (p: Params) => o.points3(p as Params<K>);
  const samples = (curve: Curve) => Array.from({ length: N }, (_, i) => {
    const t = (2 * Math.PI * i) / N;
    return add3(curve.c, add3(scale3(curve.u, curve.r * Math.cos(t)), scale3(curve.v, curve.r * Math.sin(t))));
  });
  /** A screen-plane circle (sphere outline): u, v are the screen's right and up directions in world space. */
  const screenCurve = (curve: Curve, yaw: number, pitch: number): Curve => {
    const a = (yaw * Math.PI) / 180, b = (pitch * Math.PI) / 180;
    const right: V3 = [Math.cos(a), Math.sin(a), 0], up: V3 = [-Math.sin(a) * Math.sin(b), Math.cos(a) * Math.sin(b), Math.cos(b)];
    return { ...curve, u: right, v: up };
  };
  const curvesAt = (p: Params, P: Record<string, V3>) =>
    (o.curves?.(p as Params<K>, P) ?? []).map(c => (c.screen ? screenCurve(c, p.yaw!, p.pitch!) : c));

  const points = (p: Params) => {
    const P = P3(p), out: Record<string, V> = {};
    const put = (n: string, q: V3) => { const c = camera(q, p.yaw!, p.pitch!); out[n] = [c[0], c[2]]; };
    for (const [n, q] of Object.entries(P)) put(n, q);
    for (const c of curvesAt(p, P)) samples(c).forEach((q, i) => put(`${c.name}${i}`, q));
    return out;
  };

  const base = (p: Params) => {
    const P = P3(p), yaw = p.yaw!, pitch = p.pitch!, refs: string[] = [];
    if (o.faces?.length) {
      const all = Object.values(P), centre = scale3(all.reduce(add3, [0, 0, 0] as V3), 1 / all.length);
      const edges = new Map<string, { a: string; b: string; seen: boolean }>();
      for (const f of o.faces) {
        const V = f.map(n => P[n]!), fc = scale3(V.reduce(add3, [0, 0, 0] as V3), 1 / V.length);
        let nrm = cross3(sub3(V[1]!, V[0]!), sub3(V[2]!, V[0]!));
        if (dot3(nrm, sub3(fc, centre)) < 0) nrm = scale3(nrm, -1);
        const front = facing(nrm, yaw, pitch);
        f.forEach((a, i) => {
          const b = f[(i + 1) % f.length]!, key = [a, b].sort().join('|'), e = edges.get(key);
          edges.set(key, { a, b, seen: (e?.seen ?? false) || front });
        });
      }
      for (const e of edges.values()) refs.push(e.seen ? `${e.a}${e.b}` : `hid:${e.a}${e.b}`);
    }
    const cs = curvesAt(p, P), names = new Set(cs.map(k => k.name));
    for (const c of cs) {
      const S = samples(c), vis = (i: number) => {
        if (c.screen) return true;
        if (c.cap && facing(c.cap, yaw, pitch)) return true;
        return !!c.normal && facing(c.normal(S[i]!), yaw, pitch);
      };
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, seg = `${c.name}${i}${c.name}${j}`;
        refs.push(vis(i) && vis(j) ? seg : `hid:${seg}`);
      }
      if (c.silhouette && c.normal) {
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N, fi = facing(c.normal(S[i]!), yaw, pitch), fj = facing(c.normal(S[j]!), yaw, pitch);
          if (fi !== fj) refs.push(`${c.name}${i}${names.has(c.silhouette) ? `${c.silhouette}${i}` : c.silhouette}`); // outline line
        }
      }
    }
    if (o.base) refs.push(o.base);
    return refs.join(' ');
  };

  const defaults = Object.fromEntries(Object.entries(params).map(([k, d]) => [k, d.value])) as Params;
  // No view can show a point farther from the origin than it is in space: the board is the square
  // around the largest such distance over the sliders' range (circles included), whatever the rotation.
  let reach = 0;
  const r = rng(11), shapes: Params[] = [defaults, ...Array.from({ length: 600 }, () => randomParams({ params: o.params } as unknown as FigureSpec, r))];
  for (const s of [...shapes, ...extremes(o.params)]) {
    const p = { ...defaults, ...s }, P = P3(p);
    for (const q of Object.values(P)) reach = Math.max(reach, len3(q));
    for (const c of curvesAt(p, P)) reach = Math.max(reach, len3(c.c) + c.r);
  }
  reach *= 1.02;
  const sampleNames = curvesAt(defaults, P3(defaults)).flatMap(c => Array.from({ length: N }, (_, i) => `${c.name}${i}`));

  return {
    kind: o.kind,
    label: o.label,
    params,
    points,
    base,
    unlabeled: [...(o.unlabeled ?? []), ...sampleNames],
    orbit: true,
    space: P3,
    board: [-reach, -reach, reach, reach],
    ...(o.dims ? { dims: o.dims } : {}),
    ...(o.toggles ? { toggles: o.toggles } : {}),
    ...(o.readouts ? { readouts: (_: Record<string, V>, p: Params) => o.readouts!(P3(p), p as Params<K>) } : {}),
    ...(o.checks ? { checks: Object.fromEntries(Object.entries(o.checks).map(([id, f]) => [id, (_: Record<string, V>, p: Params) => f(P3(p), p as Params<K>)])) } : {}),
  } as FigureSpec;
}
