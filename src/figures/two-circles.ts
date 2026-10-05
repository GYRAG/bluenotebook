import { add, dist, near, perpendicular, scale, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// Two circles (O1, R) and (O2, r), d = O1O2 > R + r. K1K2 is a common outer tangent, L1L2 a common
// inner one; n and m are their unit normals. F and G are the proof helpers: O2F ∥ K1K2, O2G ∥ L1L2.
export default figure({
  kind: 'ორი წრეწირი',
  label: 'ორი წრეწირი და მათი საერთო მხებები',
  params: {
    R: { label: 'დიდი რადიუსი', sym: 'R', min: 1.6, max: 2.4, step: 0.1, value: 2 },
    r: { label: 'პატარა რადიუსი', sym: 'r', min: 0.6, max: 1.3, step: 0.1, value: 1 },
    d: { label: 'ცენტრებს შორის მანძილი', sym: 'd', min: 4.2, max: 6, step: 0.1, value: 4.8, hidden: true },
  },
  points: ({ R, r, d }) => {
    const O1: V = [-d / 2, 0], O2: V = [d / 2, 0];
    const nx = (R - r) / d, n: V = [nx, Math.sqrt(1 - nx * nx)]; // outer: n·O1 + R = n·O2 + r
    const mx = (R + r) / d, m: V = [mx, -Math.sqrt(1 - mx * mx)]; // inner: m·O1 + R = m·O2 − r
    return {
      O1, O2,
      K1: add(O1, scale(n, R)), K2: add(O2, scale(n, r)), F: add(O1, scale(n, R - r)),
      L1: add(O1, scale(m, R)), L2: sub(O2, scale(m, r)), G: add(O1, scale(m, R + r)),
      U1: [-d / 2 - R, 0] as V, U2: [-d / 2, R] as V, U3: [-d / 2, -R] as V, U4: [d / 2 + r, 0] as V,
    };
  },
  drag: { O2: ['d'] },
  base: '(O1K1) (O2K2) K1K2 L1L2 O1 O2',
  unlabeled: ['U1', 'U2', 'U3', 'U4'],
  dims: '|O1O2|d',
  readouts: ({ K1, K2, L1, L2, O1, O2 }) => [['d', dist(O1, O2)], ['K₁K₂', dist(K1, K2)], ['L₁L₂', dist(L1, L2)]],
  checks: {
    'outer-tangent': ({ O1, O2, K1, K2, F }, { R, r, d }) =>
      near(dist(K1, K2), Math.sqrt(d * d - (R - r) ** 2)) && perpendicular(O1, K1, K1, K2) && perpendicular(O2, K2, K1, K2)
      && perpendicular(O1, F, F, O2) && near(dist(F, O2), dist(K1, K2)),
    'inner-tangent': ({ O1, O2, L1, L2, G }, { R, r, d }) =>
      near(dist(L1, L2), Math.sqrt(d * d - (R + r) ** 2)) && perpendicular(O1, L1, L1, L2) && perpendicular(O2, L2, L1, L2)
      && perpendicular(O1, G, G, O2) && near(dist(G, O2), dist(L1, L2)),
  },
});
