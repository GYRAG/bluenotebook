import {
  add, angleAt, area, centroid, circumcenter, dist, foot, incenter, intersect, lerp, mid, near, orthocenter, parallel, perpendicular, sub, triangleSAS,
} from './engine/geom';
import { figure } from './engine/spec';

// One triangle, all its remarkable lines: midline, medians (G), bisectors (I), perpendicular
// bisectors (O), altitudes (H). A1 B1 C1 are midpoints, A2 B2 C2 feet of the altitudes,
// A3 B3 C3 the triangle whose midpoints are A, B, C (orthocentre proof).
export default figure({
  kind: 'სამკუთხედი',
  label: 'სამკუთხედი ABC და მისი ღირსშესანიშნავი წერტილები',
  params: {
    c: { label: 'გვერდი', sym: 'c', min: 3, max: 7, step: 0.1, value: 6 },
    b: { label: 'გვერდი', sym: 'b', min: 2, max: 6, step: 0.1, value: 4.5 },
    alpha: { label: 'კუთხე', sym: 'α', min: 25, max: 110, step: 1, value: 60, unit: '°' },
  },
  points: ({ c, b, alpha }) => {
    const { A, B, C } = triangleSAS(c, b, alpha), I = incenter(A, B, C);
    const L = lerp(B, C, dist(A, B) / (dist(A, B) + dist(A, C))); // bisector from A meets BC
    return {
      A, B, C,
      A1: mid(B, C), B1: mid(C, A), C1: mid(A, B), G: centroid(A, B, C),
      I, L, T: foot(I, B, C), E: intersect(B, A, C, add(C, sub(L, A))), // E: on line BA, CE ∥ AL
      O: circumcenter(A, B, C),
      H: orthocenter(A, B, C), A2: foot(A, B, C), B2: foot(B, C, A), C2: foot(C, A, B),
      A3: sub(add(B, C), A), B3: sub(add(C, A), B), C3: sub(add(A, B), C),
    };
  },
  drag: { B: ['c'], C: ['b', 'alpha'] },
  base: 'ABC',
  boundsOf: ['A', 'B', 'C'], // O, H and A3B3C3 may leave the page for extreme shapes; proofs pick fitting ones
  dims: '<A <B <C',
  toggles: {
    'შუახაზი': 'B1C1 B1 C1',
    'მედიანები': 'AA1 BB1 CC1 G',
    'ბისექტრისები': 'AL BI CI I',
    'ჩახაზული წრე': '(IT) I T',
    'შუამართობები': 'OA1 OB1 OC1 O',
    'შემოხაზული წრე': '(OA) O',
    'სიმაღლეები': 'AA2 BB2 CC2 H',
  },
  classify: 'triangle',
  readouts: ({ A, B, C, G, A1, I, T, O }) => [
    ['r', dist(I, T)], ['R', dist(O, A)], ['AG:GA₁', dist(A, G) / dist(G, A1)], ['S', area([A, B, C])],
  ],
  checks: {
    midline: ({ B, C, B1, C1 }) => parallel(B1, C1, B, C) && near(dist(B1, C1), dist(B, C) / 2),
    medians: ({ A, B, C, A1, B1, C1, G }) =>
      [[A, A1], [B, B1], [C, C1]].every(([v, m]) => near(dist(v!, G) / dist(G, m!), 2) && near(dist(v!, G) + dist(G, m!), dist(v!, m!))),
    'bisector-theorem': ({ A, B, C, L }) => near(dist(B, L) / dist(L, C), dist(A, B) / dist(A, C)) && near(angleAt(B, A, L), angleAt(L, A, C)),
    'bisector-theorem-proof': ({ A, C, E }) => near(dist(A, E), dist(A, C)),
    incenter: ({ A, B, C, I }) => [[A, B], [B, C], [C, A]].every(([p, q]) => near(dist(I, foot(I, p!, q!)), dist(I, foot(I, A, B)))),
    circumcenter: ({ A, B, C, O }) => near(dist(O, A), dist(O, B)) && near(dist(O, B), dist(O, C)),
    orthocenter: ({ A, B, C, H }) => perpendicular(A, H, B, C) && perpendicular(B, H, C, A) && (near(dist(C, H), 0, 1e-9) || perpendicular(C, H, A, B)),
    'orthocenter-proof': ({ A, B, C, A3, B3, C3 }) =>
      near(dist(A, mid(B3, C3)), 0) && near(dist(B, mid(C3, A3)), 0) && near(dist(C, mid(A3, B3)), 0) && parallel(B3, C3, B, C),
  },
});
