import { near } from './engine/geom';
import { dist3, len3, solid, type V3 } from './engine/solid';

// A cone: apex S, base centre O, radius r, height h; SAB is an axial section, SA a generator (მსახველი).
const N = 4000; // fine regular pyramids for the numeric checks

export default solid({
  kind: 'კონუსი',
  label: 'კონუსი, წვერო S, ფუძის ცენტრი O, ღერძული კვეთა SAB',
  params: {
    r: { label: 'რადიუსი', sym: 'r', min: 1, max: 2.8, step: 0.1, value: 2 },
    h: { label: 'სიმაღლე', sym: 'h', min: 2, max: 5, step: 0.1, value: 3.6 },
  },
  points3: ({ r, h }) => ({ S: [0, 0, h / 2], O: [0, 0, -h / 2], A: [-r, 0, -h / 2], B: [r, 0, -h / 2] }),
  curves: ({ r, h }, P) => [{
    name: 'U', c: P.O!, u: [1, 0, 0], v: [0, 1, 0], r, cap: [0, 0, -1], silhouette: 'S',
    normal: (q: V3): V3 => { const rho = len3([q[0], q[1], 0]); return [(h * q[0]) / rho, (h * q[1]) / rho, r]; }, // h·radial + r·up
  }],
  base: 'hid:SO S O',
  view: { yaw: -20, pitch: 18 },
  toggles: { 'ღერძული კვეთა': 'SA SB AB', 'რადიუსი და მსახველი': 'OB SB' },
  readouts: (P, { r, h }) => [['r', r], ['h', h], ['l', dist3(P.S!, P.A!)], ['V', (Math.PI * r * r * h) / 3]],
  checks: {
    'cone-generator': (P, { r, h }) => near(dist3(P.S!, P.A!) ** 2, r * r + h * h),
    'cone-lateral': (_, { r, h }) => { // a fine regular pyramid: n triangles of base 2r·sin(π/n) and slant height
      const l = Math.hypot(h, r * Math.cos(Math.PI / N)), side = 2 * r * Math.sin(Math.PI / N);
      return near((N * side * l) / 2, Math.PI * r * Math.hypot(r, h), 1e-6);
    },
    'cone-volume': (_, { r, h }) => near((((N * r * r * Math.sin((2 * Math.PI) / N)) / 2) * h) / 3, (Math.PI * r * r * h) / 3, 1e-6),
  },
});
