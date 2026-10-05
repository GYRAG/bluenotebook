import { angleAt, area, dist, intersect, near, polar, add, type V } from './engine/geom';
import { figure } from './engine/spec';

const right = (...vs: V[]) => vs.every((_, i) => near(angleAt(vs[(i + 3) % 4]!, vs[i]!, vs[(i + 1) % 4]!), 90));

export default figure({
  kind: 'მართკუთხედი',
  label: 'მართკუთხედი ABCD',
  params: {
    a: { label: 'გვერდი', sym: 'a', min: 2, max: 6, step: 0.1, value: 5 },
    b: { label: 'გვერდი', sym: 'b', min: 1.5, max: 4, step: 0.1, value: 3 },
  },
  points: ({ a, b }) => ({ A: [-a / 2, -b / 2], B: [a / 2, -b / 2], C: [a / 2, b / 2], D: [-a / 2, b / 2], O: [0, 0] }),
  drag: { C: ['a', 'b'] },
  base: 'ABCD',
  dims: '|AB|a |BC|b',
  toggles: {
    'დიაგონალები': 'AC BD O',
    'შემოხაზული წრე': '(OA) O',
    'აღნიშვნები': 'AB=CD BC=DA AO=BO=CO=DO',
  },
  classify: 'quad',
  readouts: ({ A, B, C, D }) => [['d', dist(A, C)], ['R', dist(A, C) / 2], ['P', 2 * (dist(A, B) + dist(B, C))], ['S', area([A, B, C, D])]],
  checks: {
    'diagonals-equal': ({ A, B, C, D }) => near(dist(A, C), dist(B, D)),
    circumcircle: ({ A, B, C, D }) => {
      const O = intersect(A, C, B, D);
      return [B, C, D].every(P => near(dist(O, P), dist(O, A)));
    },
    'diagonal-length': ({ A, C }, { a, b }) => near(dist(A, C) ** 2, a * a + b * b),
    area: ({ A, B, C, D }, { a, b }) => near(area([A, B, C, D]), a * b),
    'criterion-right-angle': (_, { a, b }) => { // a parallelogram with one right angle
      const A: V = [0, 0], B: V = [a, 0], D = polar(b, 90);
      return right(A, B, add(B, D), D);
    },
    'criterion-equal-diagonals': (_, { a, b }) => { // diagonals bisect each other (parallelogram) and are equal
      const u = polar(a / 2, 0), v = polar(a / 2, 25 + 13 * b);
      return right([-u[0], -u[1]], [-v[0], -v[1]], u, v);
    },
    'criterion-three-right-angles': (_, { a, b }) => { // right angles at A, B, C force the fourth
      const A: V = [0, 0], B: V = [a, 0], C: V = [a, b];
      const D = intersect(A, [0, 1], C, [a - 1, b]); // ⟂ AB through A meets ⟂ BC through C
      return near(angleAt(C, D, A), 90);
    },
  },
});
