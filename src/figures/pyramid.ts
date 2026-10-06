import { near } from './engine/geom';
import { area3, dist3, mid3, solid, tetra, type V3 } from './engine/solid';

// A regular quadrilateral pyramid SABCD: square base of side a, height h; O the centre of the base,
// M the midpoint of AB (SM is the apothem).
export default solid({
  kind: 'პირამიდა',
  label: 'წესიერი ოთხკუთხა პირამიდა SABCD',
  params: {
    a: { label: 'ფუძის გვერდი', sym: 'a', min: 2, max: 5, step: 0.1, value: 4 },
    h: { label: 'სიმაღლე', sym: 'h', min: 1.5, max: 5, step: 0.1, value: 3.6 },
  },
  points3: ({ a, h }) => {
    const z = -h / 2, A: V3 = [-a / 2, -a / 2, z], B: V3 = [a / 2, -a / 2, z], C: V3 = [a / 2, a / 2, z], D: V3 = [-a / 2, a / 2, z];
    return { A, B, C, D, S: [0, 0, h / 2], O: [0, 0, z], M: mid3(A, B) };
  },
  faces: [['A', 'B', 'C', 'D'], ['S', 'A', 'B'], ['S', 'B', 'C'], ['S', 'C', 'D'], ['S', 'D', 'A']],
  view: { yaw: -28, pitch: 18 },
  toggles: {
    'სიმაღლე': 'SO O',
    'აპოთემა': 'SM OM M <SOM',
    'ფუძის დიაგონალები': 'AC BD',
  },
  readouts: (P, { a, h }) => [
    ['h', h], ['l', dist3(P.S!, P.M!)], ['SA', dist3(P.S!, P.A!)], ['S', a * a], ['V', (a * a * h) / 3],
  ],
  checks: {
    'equal-edges-circumcenter': P => {
      const e = ['A', 'B', 'C', 'D'].map(n => dist3(P.S!, P[n]!)), o = ['A', 'B', 'C', 'D'].map(n => dist3(P.O!, P[n]!));
      return e.every(x => near(x, e[0]!)) && o.every(x => near(x, o[0]!));
    },
    'apothem-relations': (P, { a, h }) => near(dist3(P.S!, P.M!) ** 2, h * h + (a / 2) ** 2) && near(dist3(P.S!, P.A!) ** 2, h * h + a * a / 2),
    'regular-lateral-area': (P, { a }) => {
      const faces = [['S', 'A', 'B'], ['S', 'B', 'C'], ['S', 'C', 'D'], ['S', 'D', 'A']].map(f => area3(f.map(n => P[n]!)));
      return near(faces.reduce((s, x) => s + x, 0), 0.5 * 4 * a * dist3(P.S!, P.M!));
    },
    'pyramid-volume': (P, { a, h }) => {
      const V = tetra(P.S!, P.A!, P.B!, P.C!) + tetra(P.S!, P.A!, P.C!, P.D!);
      // the prism split: three tetrahedra of one triangular prism have equal volumes
      const A: V3 = [0, 0, 0], B: V3 = [a, 0, 0], C: V3 = [a * 0.3, a * 0.8, 0], up = (q: V3): V3 => [q[0] + 0.4, q[1], h];
      const A1 = up(A), B1 = up(B), C1 = up(C), t1 = tetra(A, B, C, A1), t2 = tetra(A1, B1, C1, B), t3 = tetra(A1, B, C, C1);
      return near(V, (a * a * h) / 3) && near(t1, t2) && near(t2, t3) && near(t1 + t2 + t3, area3([A, B, C]) * h);
    },
  },
});
