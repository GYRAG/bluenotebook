import { near } from './engine/geom';
import { angle3, dist3, dot3, len3, mid3, solid, type V3 } from './engine/solid';

// Coordinates in space: axes OX, OY, OZ; A(x; y; z) with its feet on the axes (A1, A2, A3) and on
// the plane Oxy (A4). B is a second point (dot product).
export default solid({
  kind: 'კოორდინატები სივრცეში',
  label: 'დეკარტის კოორდინატები სივრცეში, წერტილი A(x; y; z)',
  params: {
    x: { label: 'აბსცისა', sym: 'x', min: 0.5, max: 3, step: 0.5, value: 2.5 },
    y: { label: 'ორდინატა', sym: 'y', min: 0.5, max: 3, step: 0.5, value: 2 },
    z: { label: 'აპლიკატა', sym: 'z', min: 0.5, max: 2.5, step: 0.5, value: 1.5 },
    bx: { label: 'B', sym: 'x₂', min: -1, max: 1.5, step: 0.5, value: 0.5, hidden: true },
    by: { label: 'B', sym: 'y₂', min: 1.5, max: 3, step: 0.5, value: 2.5, hidden: true },
    bz: { label: 'B', sym: 'z₂', min: 0.5, max: 2, step: 0.5, value: 1, hidden: true },
  },
  points3: ({ x, y, z, bx, by, bz }) => ({
    O: [0, 0, 0], X: [3.8, 0, 0], Y: [0, 3.8, 0], Z: [0, 0, 3.2],
    A: [x, y, z], A1: [x, 0, 0], A2: [0, y, 0], A3: [0, 0, z], A4: [x, y, 0], M: mid3([0, 0, 0], [x, y, z]), B: [bx, by, bz],
  }),
  base: 'vec:OX vec:OY vec:OZ O A hid:A1A4 hid:A2A4 hid:A4A',
  unlabeled: ['M'],
  view: { yaw: -35, pitch: 20 },
  toggles: { 'მანძილი OA': 'OA OA4 <OA4A', 'შუაწერტილი': 'OA M', 'ვექტორები OA, OB': 'vec:OA vec:OB B <AOB' },
  readouts: (P, { x, y, z }) => [['x', x], ['y', y], ['z', z], ['|OA|', dist3(P.O!, P.A!)], ['OA·OB', dot3(P.A!, P.B!)]],
  checks: {
    'distance-3d': (P, { x, y, z }) =>
      near(dist3(P.O!, P.A4!) ** 2, x * x + y * y) && near(angle3(P.O!, P.A4!, P.A!), 90) && near(dist3(P.O!, P.A!) ** 2, x * x + y * y + z * z),
    'midpoint-3d': (P, { x, y, z }) => near(P.M![0], x / 2) && near(P.M![1], y / 2) && near(P.M![2], z / 2) && near(dist3(P.O!, P.M!), dist3(P.M!, P.A!)),
    'sphere-equation': P => { // points of the sphere centred A through O satisfy the equation, others do not
      const R = dist3(P.A!, P.O!), f = (q: V3) => (q[0] - P.A![0]) ** 2 + (q[1] - P.A![1]) ** 2 + (q[2] - P.A![2]) ** 2;
      const on: V3[] = [[P.A![0] + R, P.A![1], P.A![2]], [P.A![0], P.A![1] - R, P.A![2]], [P.A![0], P.A![1], P.A![2] + R]];
      return on.every(q => near(f(q), R * R)) && near(f(P.O!), R * R) && !near(f(P.B!), R * R);
    },
    'dot-3d': P => near(dot3(P.A!, P.B!), len3(P.A!) * len3(P.B!) * Math.cos((angle3(P.A!, P.O!, P.B!) * Math.PI) / 180)),
  },
});
