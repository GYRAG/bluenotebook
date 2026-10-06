import { add, angleAt, intersect, near, parallel, polar, rad, scale, sub, unit, type V } from './engine/geom';
import { figure } from './engine/spec';

// Two parallel lines (y = ±g/2) and a transversal through the origin at angle θ.
// E and F are where the transversal meets the lower and the upper line; L/R are far points
// to the left/right on each line, T1/T2 the ends of the transversal.
export default figure({
  kind: 'პარალელური წრფეები',
  label: 'ორი პარალელური წრფე და მკვეთი',
  params: {
    theta: { label: 'კუთხე', sym: 'θ', min: 30, max: 150, step: 1, value: 60, unit: '°' },
    g: { label: 'მანძილი წრფეებს შორის', sym: 'd', min: 1.5, max: 3, step: 0.1, value: 2.2 },
  },
  points: ({ theta, g }) => {
    const u = polar(1, theta), E = scale(u, -g / 2 / Math.sin(rad(theta))), F = scale(u, g / 2 / Math.sin(rad(theta)));
    return {
      E, F,
      L1: [-5, -g / 2] as V, R1: [5, -g / 2] as V, L2: [-5, g / 2] as V, R2: [5, g / 2] as V,
      T1: sub(E, scale(u, 1.8)), T2: add(F, scale(u, 1.8)),
      ...helpers(E, F, u, g),
    };
  },
  drag: { F: ['theta', 'g'] },
  base: 'L1R1 L2R2 T1T2 E F',
  boundsOf: ['L1', 'R1', 'L2', 'R2', 'T1', 'T2', 'E', 'F'],
  dims: '<R1EF <FEL1',
  toggles: {
    'ვერტიკალური': '<R1EF=<L1ET1',
    'შესაბამისი': '<R1EF=<R2FT2',
    'შიგა ჯვარედინი': '<L1EF=<R2FE',
    'შიგა ცალმხრივი': '<R1EF <R2FE',
  },
  readouts: (_, { theta }) => [['θ', theta, '°'], ['θ′', 180 - theta, '°']],
  checks: {
    'adjacent-angles': ({ E, F, L1, R1 }) => near(angleAt(R1, E, F) + angleAt(F, E, L1), 180),
    'vertical-angles': ({ E, F, L1, R1, T1 }) => near(angleAt(R1, E, F), angleAt(L1, E, T1)),
    'alternate-angles': ({ E, F, L1, R2 }) => near(angleAt(L1, E, F), angleAt(R2, F, E)),
    'corresponding-angles': ({ E, F, R1, R2, T2 }) => near(angleAt(R1, E, F), angleAt(R2, F, T2)),
    'co-interior-angles': ({ E, F, R1, R2 }) => near(angleAt(R1, E, F) + angleAt(R2, F, E), 180),
    'criterion-alternate': ({ E, F, L1, R1 }) => { // a line through F making an equal alternate angle is parallel to the lower line
      const a = angleAt(L1, E, F), dirEF = Math.atan2(F[1] - E[1], F[0] - E[0]) * 180 / Math.PI;
      const G = add(F, polar(1, dirEF + 180 + a)); // turn from FE by the same angle, on the other side
      return parallel(F, G, L1, R1) || parallel(F, add(F, polar(1, dirEF + 180 - a)), L1, R1);
    },
  },
});

/** For problems: G, where the bisector of ∠R1EF meets the upper line; M, where it meets the bisector of ∠R2FE. */
function helpers(E: V, F: V, u: V, g: number) {
  const w = unit(add(u, [1, 0])), v = unit(sub([1, 0], u));
  return { G: add(E, scale(w, g / w[1])), M: intersect(E, add(E, w), F, add(F, v)) };
}
