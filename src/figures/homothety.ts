import { angleAt, area, dist, near, parallel, scale, type V } from './engine/geom';
import { figure } from './engine/spec';
import { triangle, TRIANGLE_DRAG, TRIANGLE_PARAMS } from './engine/transform';

// Homothety with centre O and coefficient k: OA' = k·OA. k < 0 puts the image on the other side of O.
export default figure({
  kind: 'ჰომოთეტია',
  label: "სამკუთხედი ABC და მისი ჰომოთეტიური A'B'C' ცენტრით O",
  params: {
    k: { label: 'კოეფიციენტი', sym: 'k', min: -2, max: 2.5, step: 0.1, value: 1.8 },
    ...TRIANGLE_PARAMS,
  },
  points: p => {
    const [A, B, C] = triangle(p).map(v => scale(v, 0.6)) as [V, V, V]; // smaller, so images up to 2.5× still fit the board
    return { O: [0, 0] as V, A, B, C, "A'": scale(A, p.k), "B'": scale(B, p.k), "C'": scale(C, p.k) };
  },
  drag: TRIANGLE_DRAG,
  base: "ABC A'B'C' O",
  toggles: { 'წრფეები ცენტრზე': "line:OA line:OB line:OC" },
  readouts: (pts, { k }) => [
    ['k', k], ["A'B' : AB", dist(pts["A'"], pts["B'"]) / dist(pts.A, pts.B)],
    ["S' : S", area([pts["A'"], pts["B'"], pts["C'"]]) / area([pts.A, pts.B, pts.C])],
  ],
  checks: {
    'homothety-segment': (pts, { k }) => {
      const { A, B } = pts, A1 = pts["A'"], B1 = pts["B'"];
      return near(dist(A1, B1), Math.abs(k) * dist(A, B)) && (Math.abs(k) < 1e-9 || parallel(A, B, A1, B1));
    },
    'homothety-angles': pts => {
      const T = [pts.A, pts.B, pts.C], I = [pts["A'"], pts["B'"], pts["C'"]];
      return [0, 1, 2].every(i => near(angleAt(T[(i + 2) % 3]!, T[i]!, T[(i + 1) % 3]!), angleAt(I[(i + 2) % 3]!, I[i]!, I[(i + 1) % 3]!)));
    },
    'homothety-area': (pts, { k }) => near(area([pts["A'"], pts["B'"], pts["C'"]]), k * k * area([pts.A, pts.B, pts.C])),
  },
});
