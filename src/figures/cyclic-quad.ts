import { add, angleAt, dist, intersect, near, polar, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// Four points on a circle (centre O, radius R), placed by angle; E is Ptolemy's helper point.
const dir = (v: V) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
export default figure({
  kind: 'ჩახაზული ოთხკუთხედი',
  label: 'წრეწირში ჩახაზული ოთხკუთხედი ABCD',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 2.5, max: 3.5, step: 0.1, value: 3 },
    tA: { label: 'A', sym: 'A', min: 195, max: 250, step: 1, value: 215, unit: '°', hidden: true },
    tB: { label: 'B', sym: 'B', min: 280, max: 340, step: 1, value: 315, unit: '°', hidden: true },
    tC: { label: 'C', sym: 'C', min: 10, max: 70, step: 1, value: 40, unit: '°', hidden: true },
    tD: { label: 'D', sym: 'D', min: 105, max: 165, step: 1, value: 130, unit: '°', hidden: true },
  },
  points: ({ R, tA, tB, tC, tD }) => {
    const A = polar(R, tA), B = polar(R, tB), C = polar(R, tC), D = polar(R, tD);
    // E on BD with ∠BAE = ∠CAD: turn ray AB towards AD by ∠CAD
    const turn = dir(sub(D, A)) - dir(sub(C, A));
    return { A, B, C, D, O: [0, 0] as V, E: intersect(A, add(A, polar(1, dir(sub(B, A)) + turn)), B, D) };
  },
  drag: { A: ['tA'], B: ['tB'], C: ['tC'], D: ['tD'] },
  base: 'ABCD (OA)',
  dims: '<A <B <C <D',
  classify: 'quad',
  checks: {
    'cyclic-opposite-angles': ({ A, B, C, D }) => near(angleAt(D, A, B) + angleAt(B, C, D), 180) && near(angleAt(A, B, C) + angleAt(C, D, A), 180),
    'cyclic-criterion': ({ A, B, C, D }) => { // contrapositive: move C off the circle and the sum is no longer 180°
      const inside: V = [C[0] * 0.8, C[1] * 0.8], outside: V = [C[0] * 1.2, C[1] * 1.2];
      return angleAt(D, A, B) + angleAt(B, inside, D) > 180 + 1e-6 && angleAt(D, A, B) + angleAt(B, outside, D) < 180 - 1e-6;
    },
    ptolemy: ({ A, B, C, D }) => near(dist(A, C) * dist(B, D), dist(A, B) * dist(C, D) + dist(A, D) * dist(B, C)),
    'ptolemy-steps': ({ A, B, C, D, E }) =>
      near(dist(A, B) * dist(C, D), dist(A, C) * dist(B, E)) && near(dist(A, D) * dist(B, C), dist(A, C) * dist(E, D)),
  },
});
