import { near } from './engine/geom';
import { angle3, dist3, solid, type V3 } from './engine/solid';

// A cylinder: radius r, height h, axis O1O2 (dashed — it is inside). ABB1A1 is an axial section.
const radial = (q: V3): V3 => [q[0], q[1], 0];
const N = 4000; // fine regular prisms for the numeric checks

export default solid({
  kind: 'ცილინდრი',
  label: 'ცილინდრი, ღერძი O1O2, ღერძული კვეთა ABB1A1',
  params: {
    r: { label: 'რადიუსი', sym: 'r', min: 1, max: 2.6, step: 0.1, value: 1.8 },
    h: { label: 'სიმაღლე', sym: 'h', min: 2, max: 5, step: 0.1, value: 3.6 },
  },
  points3: ({ r, h }) => ({
    O1: [0, 0, -h / 2], O2: [0, 0, h / 2], A: [-r, 0, -h / 2], B: [r, 0, -h / 2], A1: [-r, 0, h / 2], B1: [r, 0, h / 2],
  }),
  curves: ({ r }, P) => [
    { name: 'U', c: P.O1!, u: [1, 0, 0], v: [0, 1, 0], r, cap: [0, 0, -1], normal: radial, silhouette: 'W' },
    { name: 'W', c: P.O2!, u: [1, 0, 0], v: [0, 1, 0], r, cap: [0, 0, 1], normal: radial },
  ],
  base: 'hid:O1O2 O1 O2',
  view: { yaw: -20, pitch: 20 },
  toggles: { 'ღერძული კვეთა': 'AB A1B1 AA1 BB1', 'რადიუსი და მსახველი': 'O1B BB1' },
  readouts: (_, { r, h }) => [['r', r], ['h', h], ['Sგ', 2 * Math.PI * r * h], ['V', Math.PI * r * r * h]].map(([l, v]) => [l === 'Sგ' ? 'S₁' : l, v] as [string, number]),
  checks: {
    'cylinder-lateral': (_, { r, h }) => near(2 * N * r * Math.sin(Math.PI / N) * h, 2 * Math.PI * r * h, 1e-6), // inscribed prism's sides
    'cylinder-volume': (_, { r, h }) => near(((N * r * r * Math.sin((2 * Math.PI) / N)) / 2) * h, Math.PI * r * r * h, 1e-6),
    'axial-section': (P, { r, h }) => near(dist3(P.A!, P.B!), 2 * r) && near(dist3(P.A!, P.A1!), h) && near(angle3(P.B!, P.A!, P.A1!), 90),
  },
});
