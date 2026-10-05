import { add, angleAt, area, dist, intersect, lerp, mid, near, parallel, polar, rad, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// Georgian convention: AD ∥ BC are the bases (AD below, BC on top), AB and CD the legs.
// s shifts the top base: s = (a − b)/2 is isosceles, s = 0 a right trapezoid.
export default figure({
  kind: 'ტრაპეცია',
  label: 'ტრაპეცია ABCD, AD ∥ BC',
  params: {
    a: { label: 'ფუძე', sym: 'a', min: 3, max: 7, step: 0.1, value: 6 },
    b: { label: 'ფუძე', sym: 'b', min: 1, max: 5, step: 0.1, value: 3 },
    h: { label: 'სიმაღლე', sym: 'h', min: 1.5, max: 3.5, step: 0.1, value: 2.5 },
    s: { label: 'წანაცვლება', sym: 's', min: -1, max: 3, step: 0.1, value: 0.8 },
  },
  points: ({ a, b, h, s }) => {
    const x0 = -a / 2; // anchored (re-centring while dragging would move the target under the pointer)
    const A: V = [x0, -h / 2], D: V = [x0 + a, -h / 2], B: V = [x0 + s, h / 2], C: V = [x0 + s + b, h / 2];
    const O = intersect(A, C, B, D), t = (O[1] - A[1]) / h;
    return {
      A, B, C, D, O,
      M: mid(A, B), N: mid(D, C), // midline
      H: [B[0], A[1]] as V, K: [C[0], A[1]] as V, // feet of the heights from B and C
      E: add(D, sub(C, B)), // on line AD with DE = BC (midline and diagonal proofs)
      P: lerp(A, B, t), Q: lerp(D, C, t), // segment through O parallel to the bases
    };
  },
  drag: { B: ['s', 'h'], C: ['b', 'h'], D: ['a'] },
  base: 'ABCD',
  dims: '|AD|a |BC|b <A <D',
  toggles: {
    'სიმაღლე': 'BH <BHD',
    'საშუალო ხაზი': 'MN M N',
    'დიაგონალები': 'AC BD O',
    'მონაკვეთი O-ზე': 'PQ P Q O',
  },
  classify: 'quad',
  readouts: ({ A, B, C, D, M, N, O, P, Q }, { h }) => [
    ['h', h], ['m', dist(M, N)], ['S', area([A, B, C, D])], ['c', dist(A, B)], ['d', dist(C, D)], ['PQ', dist(P, Q)],
    ['AO:OC', dist(A, O) / dist(O, C)],
  ],
  checks: {
    'angles-on-legs': ({ A, B, C, D }) => near(angleAt(D, A, B) + angleAt(A, B, C), 180) && near(angleAt(B, C, D) + angleAt(C, D, A), 180),
    midline: ({ A, D, M, N }, { a, b }) => parallel(M, N, A, D) && near(dist(M, N), (a + b) / 2),
    'midline-proof': ({ B, N, E, D }, { b }) => near(dist(N, mid(B, E)), 0) && near(dist(D, E), b), // N is the midpoint of BE; DE = BC
    area: ({ A, B, C, D }, { a, b, h }) => near(area([A, B, C, D]), ((a + b) / 2) * h),
    'diagonals-ratio': ({ A, B, C, D, O }, { a, b }) => near(dist(A, O) / dist(O, C), a / b) && near(dist(D, O) / dist(O, B), a / b),
    'segment-through-o': ({ O, P, Q }, { a, b }) => near(dist(P, Q), (2 * a * b) / (a + b)) && near(dist(P, O), dist(O, Q)),
    'isosceles-base-angles': (_, { a, b, h }) => { const [A, B, C, D] = iso(a, b, h); return near(angleAt(D, A, B), angleAt(A, D, C)); },
    'isosceles-diagonals': (_, { a, b, h }) => { const [A, B, C, D] = iso(a, b, h); return near(dist(A, C), dist(B, D)); },
    'isosceles-cyclic': (_, { a, b, h }) => { const [A, B, C, D] = iso(a, b, h); return near(angleAt(D, A, B) + angleAt(B, C, D), 180); },
    'criterion-base-angles': (_, { a, h }) => { // equal angles at the larger base ⇒ equal legs
      const t = 0.5 + h / 5, A: V = [0, 0], D: V = [a, 0], B: V = [h / Math.tan(t), h], C: V = [a - h / Math.tan(t), h];
      return near(dist(A, B), dist(D, C));
    },
    'criterion-diagonals': (_, { a, b, h }) => { // AC = BD forces x = (a − b)/2, i.e. equal legs
      const x = (a - b) / 2, A: V = [0, 0], D: V = [a, 0], B: V = [x, h], C: V = [x + b, h];
      return near(dist(A, C), dist(B, D)) && near(dist(A, B), dist(D, C));
    },
    'cyclic-is-isosceles': (_, { a, b }) => { // a trapezoid inscribed in a circle has equal legs
      const R = 4, f1 = Math.acos(a / 8), f2 = Math.acos(b / 8);
      const A = polar(R, 180 + deg(f1)), D = polar(R, -deg(f1)), B = polar(R, 180 - deg(f2)), C = polar(R, deg(f2));
      return parallel(A, D, B, C) && near(dist(A, B), dist(D, C));
    },
    'incircle-condition': (_, { a, b }) => { // a trapezoid drawn around a circle: a + b = c + d
      const r = 1, t1 = 120 + (30 * (a - 3)) / 4, t2 = -40 + (30 * (b - 1)) / 4;
      const x = (t: number, y: number) => (r - y * Math.sin(rad(t))) / Math.cos(rad(t));
      const A: V = [x(t1, -r), -r], B: V = [x(t1, r), r], D: V = [x(t2, -r), -r], C: V = [x(t2, r), r];
      return near(dist(A, D) + dist(B, C), dist(A, B) + dist(C, D));
    },
  },
});

const deg = (r: number) => (r * 180) / Math.PI;

/** An isosceles trapezoid with bases a (below) and b (above). */
function iso(a: number, b: number, h: number): [V, V, V, V] {
  return [[0, 0], [(a - b) / 2, h], [(a + b) / 2, h], [a, 0]];
}
