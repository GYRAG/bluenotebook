import { angleAt, dist, near, perpendicular, polar, rad, scale, type V } from './engine/geom';
import { figure } from './engine/spec';

// Circle (O, R); AB a chord, C and D on the major arc (inscribed angles on the minor arc AB).
// E is opposite C (diameter CE, the proof), F opposite A (diameter AF, right angle and chord length).
export default figure({
  kind: 'ჩახაზული კუთხე',
  label: 'ცენტრალური კუთხე AOB და ჩახაზული კუთხე ACB',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 2, max: 3.2, step: 0.1, value: 2.8 },
    tA: { label: 'A', sym: 'A', min: 195, max: 240, step: 1, value: 210, unit: '°', hidden: true },
    tB: { label: 'B', sym: 'B', min: 300, max: 345, step: 1, value: 330, unit: '°', hidden: true },
    tC: { label: 'C', sym: 'C', min: 60, max: 150, step: 1, value: 100, unit: '°', hidden: true },
    tD: { label: 'D', sym: 'D', min: 25, max: 165, step: 1, value: 40, unit: '°', hidden: true },
  },
  points: ({ R, tA, tB, tC, tD }) => {
    const A = polar(R, tA), C = polar(R, tC);
    return {
      O: [0, 0] as V, A, B: polar(R, tB), C, D: polar(R, tD), E: scale(C, -1), F: scale(A, -1),
      U1: [R, 0] as V, U2: [0, R] as V, U3: [-R, 0] as V, U4: [0, -R] as V,
    };
  },
  drag: { A: ['tA'], B: ['tB'], C: ['tC'] }, // D only appears in its toggle and proof: no stray handle
  base: '(OA) CA CB OA OB',
  unlabeled: ['U1', 'U2', 'U3', 'U4'],
  dims: '<ACB <AOB',
  toggles: {
    'მეორე ჩახაზული კუთხე': 'DA DB <ADB D',
    'ქორდა AB': 'AB',
  },
  readouts: ({ A, B, C, O }, { R }) => [['∠ACB', angleAt(A, C, B), '°'], ['∠AOB', angleAt(A, O, B), '°'], ['AB', dist(A, B)], ['R', R]],
  checks: {
    'inscribed-angle': ({ A, B, C, O }) => near(angleAt(A, C, B), angleAt(A, O, B) / 2),
    'inscribed-proof': ({ A, B, C, E, O }) => near(angleAt(A, C, E), angleAt(A, O, E) / 2) && near(angleAt(E, C, B), angleAt(E, O, B) / 2),
    'same-arc': ({ A, B, C, D }) => near(angleAt(A, C, B), angleAt(A, D, B)),
    'diameter-right': ({ A, B, C, F }) => perpendicular(B, A, B, F) && perpendicular(C, A, C, F),
    'chord-sine': ({ A, B, C, F }, { R }) => near(dist(A, B), 2 * R * Math.sin(rad(angleAt(A, C, B)))) && near(angleAt(A, F, B), angleAt(A, C, B)),
  },
});
