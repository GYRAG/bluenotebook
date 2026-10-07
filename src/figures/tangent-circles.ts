import { add, dist, intersect, scale, type V } from './engine/geom';
import { figure } from './engine/spec';

// Two circles touching externally at C (the origin); AB is their common outer tangent above, and the
// common inner tangent at C (the y-axis) meets AB at M. F lies on O1A with O1F = R − r, so O2F ∥ AB.
export default figure({
  kind: 'გარედან შეხებული წრეწირები',
  label: 'ორი წრეწირი, რომლებიც ერთმანეთს გარედან C წერტილში ეხება',
  params: {
    R: { label: 'დიდი რადიუსი', sym: 'R', min: 2, max: 3, step: 0.1, value: 2.6 },
    r: { label: 'პატარა რადიუსი', sym: 'r', min: 0.8, max: 2, step: 0.1, value: 1.4 },
  },
  points: ({ R, r }) => {
    const O1: V = [-R, 0], O2: V = [r, 0], C: V = [0, 0];
    const nx = (R - r) / (R + r), n: V = [nx, Math.sqrt(1 - nx * nx)]; // the tangent's normal: n·O1 + R = n·O2 + r
    const A = add(O1, scale(n, R)), B = add(O2, scale(n, r));
    return {
      O1, O2, C, A, B, M: intersect(A, B, C, [0, 1]), F: add(O1, scale(n, R - r)),
      U1: [-2 * R, 0] as V, U2: [-R, R] as V, U3: [-R, -R] as V, U4: [2 * r, 0] as V, U5: [r, -r] as V, // the circles' extremes: they size the board
    };
  },
  base: '(O1C) (O2C) AB O1 O2 C',
  unlabeled: ['U1', 'U2', 'U3', 'U4', 'U5'],
  dims: '|O1C|R |O2C|r',
  readouts: ({ A, B }) => [['AB', dist(A, B)]],
});
