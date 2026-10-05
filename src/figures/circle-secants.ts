import { add, angleAt, dist, near, polar, scale, type V } from './engine/geom';
import { figure } from './engine/spec';

// Circle (O, R) and an outside point P = (p, 0). Secant PAB turns s1 below PO, secant PCD turns s2
// above it (A, C the nearer points); PT is the tangent on the upper side.
// The secants always cross the circle: sin s < R / p holds over the whole parameter range.
export default figure({
  kind: 'წრეწირი',
  label: 'წრეწირი, P წერტილიდან გავლებული ორი მკვეთი და მხები',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 2.2, max: 3, step: 0.1, value: 2.6, hidden: true },
    p: { label: 'მანძილი ცენტრამდე', sym: 'OP', min: 4.2, max: 6, step: 0.1, value: 5, hidden: true },
    s1: { label: 'პირველი მკვეთი', sym: 's₁', min: 4, max: 20, step: 1, value: 13, unit: '°', hidden: true },
    s2: { label: 'მეორე მკვეთი', sym: 's₂', min: 4, max: 20, step: 1, value: 11, unit: '°', hidden: true },
  },
  points: ({ R, p, s1, s2 }) => {
    const P: V = [p, 0];
    const hits = (s: number): [V, V] => { // where the ray from P at angle 180° + s meets the circle
      const u = polar(1, 180 + s), b = p * u[0], q = Math.sqrt(b * b - p * p + R * R);
      return [add(P, scale(u, -b - q)), add(P, scale(u, -b + q))];
    };
    const [A, B] = hits(s1), [C, D] = hits(-s2);
    return {
      O: [0, 0] as V, P, A, B, C, D, T: polar(R, (Math.acos(R / p) * 180) / Math.PI),
      U1: [R, 0] as V, U2: [0, R] as V, U3: [-R, 0] as V, U4: [0, -R] as V,
    };
  },
  drag: { P: ['p'], A: ['s1'], C: ['s2'] },
  base: '(OA) PB PD PT O A C',
  unlabeled: ['U1', 'U2', 'U3', 'U4'],
  readouts: ({ P, A, B, C, D, T }) => [['PA·PB', dist(P, A) * dist(P, B)], ['PC·PD', dist(P, C) * dist(P, D)], ['PT²', dist(P, T) ** 2]],
  checks: {
    'secants-angle': ({ O, P, A, B, C, D }) => near(angleAt(B, P, D), (angleAt(B, O, D) - angleAt(A, O, C)) / 2),
    'secant-secant': ({ P, A, B, C, D }) => near(dist(P, A) * dist(P, B), dist(P, C) * dist(P, D)) && near(angleAt(P, D, A), angleAt(P, B, C)),
    'tangent-secant': ({ O, P, A, B, T }, { R }) =>
      near(dist(P, T) ** 2, dist(P, A) * dist(P, B)) && near(dist(P, T) ** 2, dist(O, P) ** 2 - R * R) && near(angleAt(P, T, A), angleAt(T, B, A)),
  },
});
