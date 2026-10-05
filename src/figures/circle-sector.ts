import { area, dist, near, polar, rad, type V } from './engine/geom';
import { figure } from './engine/spec';

// Sector AOB of a circle (O, R) with central angle α, symmetric about the vertical axis.
// The checks measure the curved lengths and areas numerically (fine polygons), never with π-formulas.
const N = 4000;
const polygonPerimeter = (R: number, n = N) => 2 * n * R * Math.sin(Math.PI / n);
const fan = (R: number, alpha: number, n = N) => (n * R * R * Math.sin(rad(alpha) / n)) / 2; // n thin triangles at O
const chordSum = (R: number, alpha: number, n = N) => 2 * n * R * Math.sin(rad(alpha) / (2 * n));

export default figure({
  kind: 'წრიული სექტორი',
  label: 'წრიული სექტორი AOB',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 1.5, max: 3.2, step: 0.1, value: 2.8 },
    alpha: { label: 'ცენტრალური კუთხე', sym: 'α', min: 20, max: 180, step: 1, value: 100, unit: '°' },
  },
  points: ({ R, alpha }) => ({
    O: [0, 0] as V, A: polar(R, 90 - alpha / 2), B: polar(R, 90 + alpha / 2),
    U1: [R, 0] as V, U2: [0, R] as V, U3: [-R, 0] as V, U4: [0, -R] as V,
  }),
  drag: { A: ['alpha'] },
  base: 'OA OB arc:OAB',
  unlabeled: ['U1', 'U2', 'U3', 'U4'],
  dims: '<AOB |OA|R',
  toggles: { 'მთელი წრეწირი': '(OA)', 'სეგმენტი (ქორდა AB)': 'AB' },
  readouts: (_, { R, alpha }) => [
    ['C', 2 * Math.PI * R], ['S', Math.PI * R * R], ['l', (Math.PI * R * alpha) / 180],
    ['S₁', (Math.PI * R * R * alpha) / 360], ['S₂', ((R * R) / 2) * ((Math.PI * alpha) / 180 - Math.sin(rad(alpha)))],
  ],
  checks: {
    circumference: (_, { R }) => near(polygonPerimeter(R) / (2 * R), polygonPerimeter(1) / 2, 1e-9) && near(polygonPerimeter(R), 2 * Math.PI * R, 1e-6),
    'arc-length': (_, { R, alpha }) => near(chordSum(R, alpha), (Math.PI * R * alpha) / 180, 1e-6),
    'circle-area': (_, { R }) => near(fan(R, 360), Math.PI * R * R, 1e-6),
    'sector-area': (_, { R, alpha }) => near(fan(R, alpha), (Math.PI * R * R * alpha) / 360, 1e-6) && near(fan(R, alpha), (chordSum(R, alpha) * R) / 2, 1e-6),
    'segment-area': ({ O, A, B }, { R, alpha }) =>
      near(fan(R, alpha) - area([O, A, B]), ((R * R) / 2) * ((Math.PI * alpha) / 180 - Math.sin(rad(alpha))), 1e-6) && near(dist(O, A), R),
  },
});
