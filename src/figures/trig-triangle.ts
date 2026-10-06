import { angleAt, centroid, dist, lerp, near, perpendicular, rad, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// Right angle at C; α at A. a = BC (opposite α), b = AC (adjacent), c = AB (hypotenuse).
// B1C1 cuts a smaller similar triangle off the same angle α (the ratios depend only on α).
export default figure({
  kind: 'სხვადასხვაგვერდა მართკუთხა სამკუთხედი', // the ordinary state: the stamp appears only when it turns isosceles
  label: 'მართკუთხა სამკუთხედი ABC, ∠C = 90°, ∠A = α',
  params: {
    c: { label: 'ჰიპოტენუზა', sym: 'c', min: 3, max: 6, step: 0.1, value: 5 },
    alpha: { label: 'კუთხე', sym: 'α', min: 15, max: 75, step: 1, value: 35, unit: '°' },
  },
  points: ({ c, alpha }) => {
    const b = c * Math.cos(rad(alpha)), a = c * Math.sin(rad(alpha));
    const G = centroid([0, 0], [b, 0], [b, a]), A = sub([0, 0], G), C = sub([b, 0], G), B = sub([b, a], G);
    return { A, B, C, B1: lerp(A, B, 0.55), C1: lerp(A, C, 0.55) };
  },
  drag: { B: ['c', 'alpha'] },
  base: 'ABC',
  dims: '|BC|a |AC|b |AB|c <A <C',
  toggles: { 'მსგავსი სამკუთხედი': 'B1C1 B1 C1 <B1C1A' },
  classify: 'triangle',
  readouts: ({ A, B, C }) => {
    const a = dist(B, C), b = dist(A, C), c = dist(A, B);
    return [['sin α', a / c], ['cos α', b / c], ['tg α', a / b], ['ctg α', b / a]];
  },
  checks: {
    'trig-angle-only': ({ A, B, C, B1, C1 }) => perpendicular(B1, C1, A, C) && near(dist(B1, C1) / dist(A, B1), dist(B, C) / dist(A, B)) && near(dist(A, C1) / dist(A, B1), dist(A, C) / dist(A, B)),
    'pythagorean-identity': ({ A, B, C }) => near((dist(B, C) / dist(A, B)) ** 2 + (dist(A, C) / dist(A, B)) ** 2, 1),
    'tan-ratio': ({ A, B, C }) => {
      const s = dist(B, C) / dist(A, B), co = dist(A, C) / dist(A, B), t = dist(B, C) / dist(A, C);
      return near(t, s / co) && near(t * (dist(A, C) / dist(B, C)), 1);
    },
    complementary: ({ A, B, C }) => near(angleAt(A, B, C), 90 - angleAt(B, A, C)) && near(Math.sin(rad(angleAt(A, B, C))), dist(A, C) / dist(A, B)),
    'special-values': () => { // from the half-equilateral (1, √3, 2) and the isosceles right triangle (1, 1, √2)
      const half: [V, V, V] = [[0, 0], [Math.sqrt(3), 0], [Math.sqrt(3), 1]], iso: [V, V, V] = [[0, 0], [1, 0], [1, 1]];
      const s = ([A, C, B]: [V, V, V]) => dist(B, C) / dist(A, B), at = ([A, C, B]: [V, V, V]) => angleAt(C, A, B);
      return near(at(half), 30) && near(s(half), 1 / 2) && near(at(iso), 45) && near(s(iso), Math.SQRT2 / 2)
        && near(Math.cos(rad(at(half))), Math.sqrt(3) / 2);
    },
    'one-plus-tan': ({ A, B, C }) => near(1 + (dist(B, C) / dist(A, C)) ** 2, 1 / (dist(A, C) / dist(A, B)) ** 2),
  },
});
