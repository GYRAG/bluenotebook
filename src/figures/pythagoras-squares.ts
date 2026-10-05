import { angleAt, area, dist, near, type V } from './engine/geom';
import { figure } from './engine/spec';

// A square of side a + b with four copies of the right triangle (legs a, b) in its corners;
// what is left in the middle, KLMN, is a square on the hypotenuse c.
export default figure({
  kind: 'კვადრატი',
  label: 'კვადრატი გვერდით a + b, შიგნით ოთხი მართკუთხა სამკუთხედი',
  params: {
    a: { label: 'კათეტი', sym: 'a', min: 1.5, max: 4, step: 0.1, value: 3 },
    b: { label: 'კათეტი', sym: 'b', min: 1.5, max: 4, step: 0.1, value: 4 },
  },
  points: ({ a, b }) => {
    const s = a + b, o = s / 2, P = (x: number, y: number): V => [x - o, y - o];
    return { P: P(0, 0), Q: P(s, 0), R: P(s, s), S: P(0, s), K: P(a, 0), L: P(s, a), M: P(b, s), N: P(0, b) };
  },
  base: 'PQRS',
  dims: '|PK|a |KQ|b |KL|c',
  checks: {
    'pythagoras-areas': ({ P, Q, R, S, K, L, M, N }, { a, b }) =>
      near(area([P, Q, R, S]), 4 * ((a * b) / 2) + area([K, L, M, N])) && near(area([K, L, M, N]), dist(K, L) ** 2),
    'inner-square': ({ K, L, M, N }) =>
      [K, L, M, N].every((p, i, q) => near(angleAt(q[(i + 3) % 4]!, p, q[(i + 1) % 4]!), 90) && near(dist(p, q[(i + 1) % 4]!), dist(K, L))),
  },
});
