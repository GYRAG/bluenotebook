import { angleAt, dist, mid, near, parallel, type V } from './engine/geom';
import { figure } from './engine/spec';
import { rotate, triangle, TRIANGLE_DRAG, TRIANGLE_PARAMS } from './engine/transform';

// Triangle ABC turned about O by φ into A'B'C'. φ = 180° is the central symmetry.
const build = (p: Parameters<typeof triangle>[0] & { phi: number }) => {
  const [A, B, C] = triangle(p);
  return { O: [0, 0] as V, A, B, C, "A'": rotate(A, p.phi), "B'": rotate(B, p.phi), "C'": rotate(C, p.phi) };
};

export default figure({
  kind: 'მობრუნება',
  label: "სამკუთხედი ABC და მისი სახე A'B'C' მობრუნებისას O ცენტრის გარშემო",
  params: {
    phi: { label: 'მობრუნების კუთხე', sym: 'φ', min: 15, max: 180, step: 1, value: 80, unit: '°' },
    ...TRIANGLE_PARAMS,
  },
  points: p => build(p),
  drag: TRIANGLE_DRAG,
  base: "ABC A'B'C' O",
  dims: "<AOA'",
  toggles: { 'რადიუსები': "OA OA' OB OB'" },
  readouts: pts => [['AB', dist(pts.A, pts.B)], ["A'B'", dist(pts["A'"], pts["B'"])], ['OA', dist(pts.O, pts.A)], ["OA'", dist(pts.O, pts["A'"])]],
  checks: {
    'rotation-isometry': (pts, { phi }) => {
      const { O, A, B } = pts, A1 = pts["A'"], B1 = pts["B'"];
      return near(dist(A1, B1), dist(A, B)) && near(dist(O, A1), dist(O, A)) && near(angleAt(A, O, A1), phi) && near(angleAt(A1, O, B1), angleAt(A, O, B));
    },
    'central-symmetry': (_, p) => {
      const f = build({ ...p, phi: 180 }), A1 = f["A'"], B1 = f["B'"];
      return near(dist(mid(f.A, A1), f.O), 0) && parallel(f.A, f.B, A1, B1) && near(dist(A1, B1), dist(f.A, f.B));
    },
    'isometry-congruent': pts => {
      const T = [pts.A, pts.B, pts.C], I = [pts["A'"], pts["B'"], pts["C'"]];
      return [0, 1, 2].every(i => near(dist(T[i]!, T[(i + 1) % 3]!), dist(I[i]!, I[(i + 1) % 3]!))
        && near(angleAt(T[(i + 2) % 3]!, T[i]!, T[(i + 1) % 3]!), angleAt(I[(i + 2) % 3]!, I[i]!, I[(i + 1) % 3]!)));
    },
  },
});
