import { near } from './engine/geom';
import { angle3, area3, cross3, dist3, dot3, len3, mid3, solid, sub3, tetra, type V3 } from './engine/solid';

// A parallelepiped ABCDA1B1C1D1: base a × b, height c; tilt leans the top along AB
// (tilt = 0: a rectangular box). O — where the diagonals meet; H — the foot of A1 on the base.
type P = { a: number; b: number; c: number; tilt: number };
export function boxPoints({ a, b, c, tilt }: P): Record<string, V3> {
  const s = c * Math.tan((tilt * Math.PI) / 180), z0 = -c / 2, z1 = c / 2;
  const A: V3 = [-a / 2 - s / 2, -b / 2, z0], B: V3 = [a / 2 - s / 2, -b / 2, z0], C: V3 = [a / 2 - s / 2, b / 2, z0], D: V3 = [-a / 2 - s / 2, b / 2, z0];
  const up = (q: V3): V3 => [q[0] + s, q[1], z1];
  const A1 = up(A), B1 = up(B), C1 = up(C), D1 = up(D);
  return { A, B, C, D, A1, B1, C1, D1, O: mid3(A, C1), H: [A1[0], A1[1], z0] };
}
const normal = (a: V3, b: V3, c: V3) => cross3(sub3(b, a), sub3(c, a));
const parallelVec = (u: V3, v: V3) => near(len3(cross3(u, v)) / (len3(u) * len3(v)), 0);
/** Volume from six tetrahedra around the diagonal AC1 — independent of any formula. */
function volume(P: Record<string, V3>) {
  const g = (n: string) => P[n]!;
  return tetra(g('A'), g('B'), g('C'), g('C1')) + tetra(g('A'), g('C'), g('D'), g('C1')) + tetra(g('A'), g('B'), g('B1'), g('C1'))
    + tetra(g('A'), g('B1'), g('A1'), g('C1')) + tetra(g('A'), g('D'), g('D1'), g('C1')) + tetra(g('A'), g('D1'), g('A1'), g('C1'));
}

export default solid({
  kind: 'პარალელეპიპედი',
  label: 'პარალელეპიპედი ABCDA1B1C1D1',
  params: {
    a: { label: 'სიგრძე', sym: 'a', min: 2, max: 5, step: 0.1, value: 4 },
    b: { label: 'სიგანე', sym: 'b', min: 1.5, max: 4, step: 0.1, value: 2.8 },
    c: { label: 'სიმაღლე', sym: 'c', min: 1.5, max: 4, step: 0.1, value: 2.6 },
    tilt: { label: 'დახრა', sym: 'τ', min: 0, max: 35, step: 1, value: 0, unit: '°' },
  },
  points3: boxPoints,
  faces: [['A', 'B', 'C', 'D'], ['A1', 'B1', 'C1', 'D1'], ['A', 'B', 'B1', 'A1'], ['B', 'C', 'C1', 'B1'], ['C', 'D', 'D1', 'C1'], ['D', 'A', 'A1', 'D1']],
  unlabeled: ['O', 'H'],
  toggles: {
    'დიაგონალები': 'AC1 BD1 CA1 DB1 O',
    'სიმაღლე': 'A1H H',
  },
  readouts: (P, { a, b, c }) => [['d', dist3(P.A!, P.C1!)], ['S', a * b], ['h', c], ['V', a * b * c]],
  checks: {
    // lines and planes: the box is the model space
    'line-plane-parallel': P => { // A1B1 ∥ AB lies off the base plane and never meets it
      const n = normal(P.A!, P.B!, P.D!);
      return near(dot3(n, sub3(P.B1!, P.A1!)), 0) && !near(dot3(n, sub3(P.A1!, P.A!)), 0) && parallelVec(sub3(P.B1!, P.A1!), sub3(P.B!, P.A!));
    },
    'planes-parallel': P => parallelVec(normal(P.A!, P.B!, P.D!), normal(P.A1!, P.B1!, P.D1!)) && !near(dot3(normal(P.A!, P.B!, P.D!), sub3(P.A1!, P.A!)), 0),
    'parallel-cuts': P => parallelVec(sub3(P.C!, P.A!), sub3(P.C1!, P.A1!)), // the plane ACC1A1 cuts the two bases along parallel lines
    'skew-lines': P => !near(dot3(sub3(P.B!, P.A!), normal(P.A!, P.C!, P.C1!)), 0), // AB and CC1: not in one plane
    // prism and parallelepiped
    'box-diagonal': (_, p) => {
      const Q = boxPoints({ ...p, tilt: 0 });
      return near(dist3(Q.A!, Q.C1!) ** 2, p.a ** 2 + p.b ** 2 + p.c ** 2) && near(angle3(Q.A!, Q.C!, Q.C1!), 90);
    },
    'parallelepiped-diagonals': P => [['A', 'C1'], ['B', 'D1'], ['C', 'A1'], ['D', 'B1']].every(([x, y]) => near(dist3(mid3(P[x!]!, P[y!]!), P.O!), 0)),
    'prism-lateral': (_, p) => {
      const Q = boxPoints({ ...p, tilt: 0 });
      const sides = [['A', 'B', 'B1', 'A1'], ['B', 'C', 'C1', 'B1'], ['C', 'D', 'D1', 'C1'], ['D', 'A', 'A1', 'D1']].map(f => area3(f.map(n => Q[n]!)));
      return near(sides.reduce((s, x) => s + x, 0), 2 * (p.a + p.b) * p.c);
    },
    'prism-volume': (P, { a, b, c }) => near(volume(P), a * b * c) && near(dist3(P.A1!, P.H!), c),
  },
});
