import { add, angleAt, circumcenter, dist, foot, near, rad, sub, triangleSAS, type V } from './engine/geom';
import { figure } from './engine/spec';

// a = BC, b = CA, c = AB. O is the circumcentre, D the point of the circle opposite B
// (BD is a diameter), H the foot of the altitude from A onto line BC.
export default figure({
  kind: 'სამკუთხედი',
  label: 'სამკუთხედი ABC და შემოხაზული წრეწირი',
  params: {
    c: { label: 'გვერდი', sym: 'c', min: 3, max: 7, step: 0.1, value: 5.5 },
    b: { label: 'გვერდი', sym: 'b', min: 2, max: 6, step: 0.1, value: 4 },
    alpha: { label: 'კუთხე', sym: 'α', min: 25, max: 130, step: 1, value: 65, unit: '°' },
  },
  points: ({ c, b, alpha }) => {
    const { A, B, C } = triangleSAS(c, b, alpha), O = circumcenter(A, B, C);
    return { A, B, C, O, D: sub(add(O, O), B), H: foot(A, B, C) };
  },
  drag: { B: ['c'], C: ['b', 'alpha'] },
  base: 'ABC',
  boundsOf: ['A', 'B', 'C', 'D'],
  dims: '|BC|a |CA|b |AB|c <A <B <C',
  toggles: {
    'შემოხაზული წრე': '(OA) O',
    'სიმაღლე A-დან': 'AH <AHB H',
  },
  classify: 'triangle',
  readouts: ({ A, B, C, O }) => {
    const a = dist(B, C), al = angleAt(B, A, C);
    return [['R', dist(O, A)], ['a / sin α', a / Math.sin(rad(al))], ['2R', 2 * dist(O, A)]];
  },
  checks: {
    'sine-law': ({ A, B, C, O }) => {
      const R2 = 2 * dist(O, A), s = (v: V, p: V, q: V) => Math.sin(rad(angleAt(p, v, q)));
      return near(dist(B, C) / s(A, B, C), R2) && near(dist(C, A) / s(B, A, C), R2) && near(dist(A, B) / s(C, A, B), R2);
    },
    'sine-law-proof': ({ A, B, C, D }) =>
      near(angleAt(B, C, D), 90) && near(Math.sin(rad(angleAt(B, D, C))), Math.sin(rad(angleAt(B, A, C)))) && near(dist(B, C), dist(B, D) * Math.sin(rad(angleAt(B, D, C)))),
    'cosine-law': ({ A, B, C }) => {
      const a = dist(B, C), b = dist(C, A), c = dist(A, B), g = angleAt(A, C, B);
      return near(c * c, a * a + b * b - 2 * a * b * Math.cos(rad(g)));
    },
    'cosine-law-proof': ({ A, B, C, H }) => { // AH = b·sin C, and BH = |a − b·cos C|
      const a = dist(B, C), b = dist(C, A), g = rad(angleAt(A, C, B));
      return near(dist(A, H), b * Math.sin(g)) && near(dist(B, H), Math.abs(a - b * Math.cos(g)));
    },
    'angle-type': ({ A, B, C }) => {
      const a = dist(B, C), b = dist(C, A), c = dist(A, B), g = angleAt(A, C, B);
      return Math.sign(Math.round((a * a + b * b - c * c) * 1e6)) === Math.sign(Math.round((90 - g) * 1e6));
    },
  },
});
