import { angleAt, dist, intersect, near, polar, type V } from './engine/geom';
import { figure } from './engine/spec';

// Circle (O, R) with chords AC and BD crossing at E; the points keep the order D, A, B, C
// counter-clockwise, so the chords always cross inside. AX is the tangent at A (towards B).
export default figure({
  kind: 'წრეწირი',
  label: 'წრეწირი, AC და BD ქორდები, რომლებიც E წერტილში იკვეთება',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 2, max: 3.2, step: 0.1, value: 2.8 },
    tA: { label: 'A', sym: 'A', min: 135, max: 170, step: 1, value: 150, unit: '°', hidden: true },
    tB: { label: 'B', sym: 'B', min: 215, max: 260, step: 1, value: 235, unit: '°', hidden: true },
    tC: { label: 'C', sym: 'C', min: 290, max: 335, step: 1, value: 315, unit: '°', hidden: true },
    tD: { label: 'D', sym: 'D', min: 35, max: 90, step: 1, value: 60, unit: '°', hidden: true },
  },
  points: ({ R, tA, tB, tC, tD }) => {
    const A = polar(R, tA), B = polar(R, tB), C = polar(R, tC), D = polar(R, tD);
    return {
      O: [0, 0] as V, A, B, C, D, E: intersect(A, C, B, D), X: polar(2.2, tA + 90, A),
      U1: [R, 0] as V, U2: [0, R] as V, U3: [-R, 0] as V, U4: [0, -R] as V,
    };
  },
  drag: { A: ['tA'], B: ['tB'], C: ['tC'], D: ['tD'] },
  base: '(OA) AC BD E',
  unlabeled: ['U1', 'U2', 'U3', 'U4'],
  dims: '<AEB',
  toggles: { 'მხები A წერტილში': 'line:AX OA <OAX' },
  readouts: ({ A, B, C, D, E }) => [
    ['∠AEB', angleAt(A, E, B), '°'], ['AE·EC', dist(A, E) * dist(E, C)], ['BE·ED', dist(B, E) * dist(E, D)],
  ],
  checks: {
    'tangent-chord': ({ O, A, B, X }) => near(angleAt(X, A, B), angleAt(A, O, B) / 2) && near(angleAt(O, A, X), 90),
    'chords-angle': ({ O, A, B, C, D, E }) => near(angleAt(A, E, B), (angleAt(A, O, B) + angleAt(C, O, D)) / 2),
    'intersecting-chords': ({ A, B, C, D, E }) =>
      near(dist(A, E) * dist(E, C), dist(B, E) * dist(E, D)) && near(angleAt(D, A, C), angleAt(D, B, C)),
  },
});
