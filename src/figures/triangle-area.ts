import { angleAt, area, circumcenter, dist, foot, incenter, lerp, near, rad, triangleSAS } from './engine/geom';
import { figure } from './engine/spec';

// Sides a = BC, b = CA, c = AB; H is the foot of the altitude from C, I the incentre with
// touch points T1 T2 T3, O the circumcentre.
export default figure({
  kind: 'სამკუთხედი',
  label: 'სამკუთხედი ABC — ფართობი',
  params: {
    c: { label: 'გვერდი', sym: 'c', min: 3, max: 7, step: 0.1, value: 6 },
    b: { label: 'გვერდი', sym: 'b', min: 2, max: 6, step: 0.1, value: 4 },
    alpha: { label: 'კუთხე', sym: 'α', min: 25, max: 130, step: 1, value: 55, unit: '°' },
  },
  points: ({ c, b, alpha }) => {
    const { A, B, C } = triangleSAS(c, b, alpha), I = incenter(A, B, C);
    return { A, B, C, H: foot(C, A, B), I, T1: foot(I, A, B), T2: foot(I, B, C), T3: foot(I, C, A), O: circumcenter(A, B, C), D: lerp(A, C, 1 / 3) }; // D: for problems
  },
  drag: { B: ['c'], C: ['b', 'alpha'] },
  base: 'ABC',
  dims: '|BC|a |CA|b |AB|c',
  toggles: {
    'სიმაღლე': 'CH <CHB H',
    'ჩახაზული წრეწირი': '(IT1) I',
    'შემოხაზული წრეწირი': '(OA) O',
  },
  classify: 'triangle',
  readouts: ({ A, B, C, H, I, T1, O }) => {
    const a = dist(B, C), b = dist(C, A), c = dist(A, B);
    return [['h', dist(C, H)], ['p', (a + b + c) / 2], ['r', dist(I, T1)], ['R', dist(O, A)], ['S', area([A, B, C])]];
  },
  checks: {
    'area-height': ({ A, B, C, H }) => near(area([A, B, C]), 0.5 * dist(A, B) * dist(C, H)),
    'area-sine': ({ A, B, C }) => near(area([A, B, C]), 0.5 * dist(C, A) * dist(A, B) * Math.sin(rad(angleAt(B, A, C)))),
    heron: ({ A, B, C }) => {
      const a = dist(B, C), b = dist(C, A), c = dist(A, B), p = (a + b + c) / 2;
      return near(area([A, B, C]), Math.sqrt(p * (p - a) * (p - b) * (p - c)));
    },
    'area-inradius': ({ A, B, C, I, T1 }) => near(area([A, B, C]), ((dist(B, C) + dist(C, A) + dist(A, B)) / 2) * dist(I, T1)),
    'area-circumradius': ({ A, B, C, O }) => near(area([A, B, C]), (dist(B, C) * dist(C, A) * dist(A, B)) / (4 * dist(O, A))),
  },
});
