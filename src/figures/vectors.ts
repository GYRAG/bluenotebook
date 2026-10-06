import { add, angleAt, cross, dist, dot, len, near, parallel, scale, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// a = OA, b = OB from the origin. C = A + B (sum, OACB a parallelogram), K = k·a.
export default figure({
  kind: 'ვექტორები',
  label: 'ვექტორები a = OA და b = OB',
  params: {
    ax: { label: 'a-ს x', sym: 'x₁', min: 0.5, max: 3, step: 0.5, value: 3, hidden: true },
    ay: { label: 'a-ს y', sym: 'y₁', min: -1, max: 2.5, step: 0.5, value: 1, hidden: true },
    bx: { label: 'b-ს x', sym: 'x₂', min: -3, max: 2, step: 0.5, value: 1, hidden: true },
    by: { label: 'b-ს y', sym: 'y₂', min: 0.5, max: 3, step: 0.5, value: 2.5, hidden: true },
    k: { label: 'რიცხვი', sym: 'k', min: -1.5, max: 2, step: 0.1, value: 1.5 },
  },
  points: ({ ax, ay, bx, by, k }) => {
    const A: V = [ax, ay], B: V = [bx, by];
    return { O: [0, 0] as V, A, B, C: add(A, B), K: scale(A, k) };
  },
  drag: { A: ['ax', 'ay'], B: ['bx', 'by'] },
  base: 'vec:OA vec:OB O',
  axes: true,
  dims: '<AOB',
  toggles: {
    'ჯამი a + b': 'vec:OC vec:AC BC C',
    'სხვაობა a − b': 'vec:BA',
    'ka': 'vec:OK K',
  },
  readouts: ({ A, B, O }) => [['a·b', dot(A, B)], ['|a|', len(A)], ['|b|', len(B)], ['φ', angleAt(A, O, B), '°']],
  checks: {
    'vector-length': ({ A, B }, { ax, ay }) => near(len(A), Math.hypot(ax, ay)) && near(dist(B, A), len(sub(A, B))),
    'vector-addition': ({ O, A, B, C }) => near(C[0], A[0] + B[0]) && near(C[1], A[1] + B[1]) && parallel(O, A, B, C) && parallel(O, B, A, C),
    'scalar-multiple': ({ A, K }, { k }) => near(cross(A, K), 0) && near(len(K), Math.abs(k) * len(A)) && (k === 0 || Math.sign(dot(A, K)) === Math.sign(k)),
    'dot-product': ({ A, B, O }) => near(dot(A, B), len(A) * len(B) * Math.cos((angleAt(A, O, B) * Math.PI) / 180)),
    'perpendicular-vectors': ({ A, O }) => { const P: V = [-A[1], A[0]]; return near(dot(A, P), 0) && near(angleAt(A, O, P), 90); },
  },
});
