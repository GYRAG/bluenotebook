import { angleAt, area, centroid, circleIntersection, dist, foot, incenter, mid, near, sub, add, type V } from './engine/geom';
import { figure } from './engine/spec';

// Right angle at C; legs BC = a, AC = b; the centroid stays put.
export default figure({
  kind: 'სხვადასხვაგვერდა მართკუთხა სამკუთხედი', // the ordinary state: the stamp appears only when it turns isosceles
  label: 'მართკუთხა სამკუთხედი ABC, ∠C = 90°',
  params: {
    a: { label: 'კათეტი', sym: 'a', min: 1.5, max: 5, step: 0.1, value: 3 },
    b: { label: 'კათეტი', sym: 'b', min: 1.5, max: 5, step: 0.1, value: 4 },
  },
  points: ({ a, b }) => {
    const G = centroid([0, 0], [a, 0], [0, b]);
    const C = sub([0, 0], G), B = sub([a, 0], G), A = sub([0, b], G), M = mid(A, B);
    const I = incenter(A, B, C);
    return { A, B, C, H: foot(C, A, B), M, D: sub(add(M, M), C), I, K: foot(I, B, C), L: foot(I, A, C), T: foot(I, A, B) }; // incircle touch points
  },
  drag: { A: ['b'], B: ['a'] },
  base: 'ABC',
  dims: '|BC|a |AC|b |AB|c <C <A <B',
  toggles: {
    'სიმაღლე ჰიპოტენუზაზე': 'CH <CHB H',
    'მედიანა ჰიპოტენუზაზე': 'CM M',
  },
  classify: 'triangle',
  readouts: ({ A, B, C, H, I, T }) => [['c', dist(A, B)], ['h', dist(C, H)], ['α', angleAt(B, A, C), '°'], ['β', angleAt(A, B, C), '°'], ['S', area([A, B, C])], ['r', dist(I, T)]],
  checks: {
    inradius: ({ A, B, C, I, K, L, T }) => {
      const a = dist(B, C), b = dist(A, C), c = dist(A, B), r = dist(I, T);
      return near(r, (a + b - c) / 2) && near(dist(C, K), r) && near(dist(C, L), r) && near(dist(B, K), dist(B, T)) && near(dist(A, L), dist(A, T));
    },
    pythagoras: ({ A, B, C }) => near(dist(A, B) ** 2, dist(B, C) ** 2 + dist(A, C) ** 2),
    'pythagoras-converse': (_, { a, b }) => { // build a triangle with sides a, b, √(a²+b²) from circles only
      const C: V = [0, 0], B: V = [a, 0], A = circleIntersection(C, b, B, Math.hypot(a, b), [a / 2, -1]);
      return near(angleAt(A, C, B), 90);
    },
    'leg-projection': ({ A, B, C, H }) => near(dist(A, C) ** 2, dist(A, B) * dist(A, H)) && near(dist(B, C) ** 2, dist(A, B) * dist(B, H)),
    'altitude-relations': ({ A, B, C, H }) => near(dist(C, H) ** 2, dist(A, H) * dist(H, B)) && near(dist(C, H), (dist(A, C) * dist(B, C)) / dist(A, B)),
    'median-hypotenuse': ({ A, B, C, M }) => near(dist(C, M), dist(A, B) / 2),
    'median-proof': ({ A, B, C, D }) => near(angleAt(A, D, B), 90) && near(dist(C, D), dist(A, B)),
    'thirty-sixty': (_, { a }) => { // ∠A = 30° ⇒ the leg opposite it is half the hypotenuse
      const C: V = [0, 0], B: V = [a, 0], A: V = [0, a * Math.sqrt(3)];
      return near(angleAt(B, A, C), 30) && near(dist(B, C), dist(A, B) / 2);
    },
    'forty-five': (_, { a }) => { const C: V = [0, 0], B: V = [a, 0], A: V = [0, a]; return near(dist(A, B), a * Math.SQRT2) && near(angleAt(B, A, C), 45); },
    area: ({ A, B, C }, { a, b }) => near(area([A, B, C]), (a * b) / 2),
  },
});
