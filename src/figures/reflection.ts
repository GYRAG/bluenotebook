import { dist, foot, mid, near, perpendicular, polar, type V } from './engine/geom';
import { figure } from './engine/spec';
import { reflect, triangle, TRIANGLE_DRAG, TRIANGLE_PARAMS } from './engine/transform';

// Axial symmetry: the axis passes through O in direction ψ (L only gives it its direction);
// K is the foot of A on the axis.
export default figure({
  kind: 'ღერძული სიმეტრია',
  label: "სამკუთხედი ABC და მისი სიმეტრიული A'B'C' ღერძის მიმართ",
  params: {
    psi: { label: 'ღერძი', sym: 'ψ', min: 60, max: 120, step: 1, value: 95, unit: '°', hidden: true },
    ...TRIANGLE_PARAMS,
  },
  points: p => {
    const [A, B, C] = triangle(p), u = polar(1, p.psi), O: V = [0, 0];
    return { O, L: polar(4, p.psi), A, B, C, "A'": reflect(A, u), "B'": reflect(B, u), "C'": reflect(C, u), K: foot(A, O, u) };
  },
  drag: { ...TRIANGLE_DRAG, L: ['psi'] },
  base: "line:OL ABC A'B'C'",
  unlabeled: ['O'],
  checks: {
    'reflection-isometry': pts => {
      const { O, L, A, B, K } = pts, A1 = pts["A'"], B1 = pts["B'"];
      return near(dist(A1, B1), dist(A, B)) && near(dist(mid(A, A1), K), 0) && perpendicular(A, A1, O, L);
    },
  },
});
