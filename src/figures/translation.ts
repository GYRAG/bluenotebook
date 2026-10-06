import { add, dist, near, parallel, type V } from './engine/geom';
import { figure } from './engine/spec';
import { triangle, TRIANGLE_DRAG, TRIANGLE_PARAMS } from './engine/transform';

// Parallel translation by v = (vx; vy): every point moves by the same vector.
export default figure({
  kind: 'პარალელური გადატანა',
  label: "სამკუთხედი ABC და მისი სახე A'B'C' პარალელური გადატანისას",
  params: {
    vx: { label: 'v-ს x', sym: 'a', min: -4, max: -1.5, step: 0.1, value: -3, hidden: true },
    vy: { label: 'v-ს y', sym: 'b', min: -3, max: 1, step: 0.1, value: -2.2, hidden: true },
    ...TRIANGLE_PARAMS,
  },
  points: p => {
    const [A, B, C] = triangle(p), v: V = [p.vx, p.vy];
    return { A, B, C, "A'": add(A, v), "B'": add(B, v), "C'": add(C, v) };
  },
  drag: { ...TRIANGLE_DRAG, "A'": ['vx', 'vy'] },
  base: "ABC A'B'C' vec:AA'",
  checks: {
    'translation-isometry': pts => {
      const { A, B } = pts, A1 = pts["A'"], B1 = pts["B'"];
      return near(dist(A1, B1), dist(A, B)) && parallel(A, B, A1, B1) && near(dist(A, A1), dist(B, B1)) && parallel(A, A1, B, B1);
    },
  },
});
