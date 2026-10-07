import { dist, type V } from './engine/geom';
import { figure } from './engine/spec';

// Two concentric circles (radii R and r = qR). AB is the chord of the large circle that touches the
// small one at T (on top); P1Q1Q2P2 is a diameter of the large circle, crossing the small one at Q1, Q2.
export default figure({
  kind: 'კონცენტრული წრეწირები',
  label: 'ორი კონცენტრული წრეწირი საერთო ცენტრით O',
  params: {
    R: { label: 'დიდი რადიუსი', sym: 'R', min: 2, max: 3.2, step: 0.1, value: 3 },
    q: { label: 'რადიუსების შეფარდება', sym: 'r/R', min: 0.3, max: 0.85, step: 0.01, value: 0.6 },
  },
  points: ({ R, q }) => {
    const r = q * R, h = Math.sqrt(R * R - r * r);
    return {
      O: [0, 0] as V, T: [0, r] as V, A: [-h, r] as V, B: [h, r] as V,
      P1: [-R, 0] as V, Q1: [-r, 0] as V, Q2: [r, 0] as V, P2: [R, 0] as V,
      U1: [0, R] as V, U2: [0, -R] as V, // the large circle's top and bottom: they size the board
    };
  },
  base: '(OP2) (OQ2) O',
  unlabeled: ['U1', 'U2'],
  dims: '|OP2|R |OQ2|r',
  readouts: ({ A, B }) => [['AB', dist(A, B)]],
});
