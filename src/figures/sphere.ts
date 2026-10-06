import { near } from './engine/geom';
import { angle3, dist3, solid, sub3, type V3 } from './engine/solid';

// A ball of radius R, centre O. The plane z = d cuts it in a circle of radius ρ around P; K is on that circle.
const N = 4000;
const cut = (R: number, d: number) => Math.min(d, 0.95 * R);

export default solid({
  kind: 'ბირთვი',
  label: 'ბირთვი ცენტრით O და მისი კვეთა სიბრტყით',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 1.5, max: 3, step: 0.1, value: 2.6 },
    d: { label: 'კვეთის მანძილი ცენტრამდე', sym: 'd', min: 0, max: 2.5, step: 0.1, value: 1.4 },
  },
  points3: ({ R, d }) => {
    const z = cut(R, d), rho = Math.sqrt(R * R - z * z);
    return { O: [0, 0, 0], P: [0, 0, z], K: [0, -rho, z] };
  },
  curves: ({ R, d }, P) => {
    const z = cut(R, d), out = (q: V3) => sub3(q, P.O!);
    return [
      { name: 'W', c: P.O!, u: [1, 0, 0], v: [0, 0, 1], r: R, screen: true },
      { name: 'U', c: P.O!, u: [1, 0, 0], v: [0, 1, 0], r: R, normal: out },
      { name: 'Q', c: P.P!, u: [1, 0, 0], v: [0, 1, 0], r: Math.sqrt(R * R - z * z), normal: out },
    ];
  },
  base: 'O',
  view: { yaw: -15, pitch: 16 },
  toggles: { 'კვეთის რადიუსი': 'OP PK OK P K <OPK' },
  readouts: (P, { R }) => [['R', R], ['d', dist3(P.O!, P.P!)], ['ρ', dist3(P.P!, P.K!)], ['V', (4 / 3) * Math.PI * R ** 3]],
  checks: {
    'section-radius': (P, { R }) => near(dist3(P.O!, P.K!), R) && near(angle3(P.O!, P.P!, P.K!) || 90, 90) && near(dist3(P.P!, P.K!) ** 2, R * R - dist3(P.O!, P.P!) ** 2),
    'sphere-volume': (_, { R }) => { // slices: area π(R² − z²) — Cavalieri, summed numerically
      let v = 0;
      for (let i = 0; i < N; i++) { const z = -R + ((i + 0.5) * 2 * R) / N; v += Math.PI * (R * R - z * z) * ((2 * R) / N); }
      return near(v, (4 / 3) * Math.PI * R ** 3, 1e-6);
    },
    'sphere-area': (_, { R }) => { // stacked frustums: lateral area π(r1 + r2)·slant, summed
      let s = 0;
      for (let i = 0; i < N; i++) {
        const a1 = (Math.PI * i) / N, a2 = (Math.PI * (i + 1)) / N, r1 = R * Math.sin(a1), r2 = R * Math.sin(a2);
        s += Math.PI * (r1 + r2) * Math.hypot(r2 - r1, R * Math.cos(a1) - R * Math.cos(a2));
      }
      return near(s, 4 * Math.PI * R * R, 1e-6);
    },
  },
});
