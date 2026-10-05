import { add, angleAt, circleIntersection, dist, intersect, near, polar, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// Triangle ABC on the left and a congruent copy A1B1C1 on the right, turned by φ.
// The copy is built from the same two sides and the angle between them (SAS).
const tri = (c: number, b: number, alpha: number, phi: number, at: V) => {
  const A: V = [0, 0], B = polar(c, phi), C = polar(b, phi + alpha);
  const g: V = [(B[0] + C[0]) / 3, (B[1] + C[1]) / 3]; // centroid of A, B, C
  return [sub(add(A, at), g), sub(add(B, at), g), sub(add(C, at), g)] as const;
};
export default figure({
  kind: '',
  label: 'ორი ტოლი სამკუთხედი ABC და A₁B₁C₁',
  params: {
    c: { label: 'გვერდი', sym: 'c', min: 2.5, max: 4.5, step: 0.1, value: 4 },
    b: { label: 'გვერდი', sym: 'b', min: 2, max: 4, step: 0.1, value: 3 },
    alpha: { label: 'კუთხე', sym: 'α', min: 35, max: 110, step: 1, value: 65, unit: '°' },
    phi: { label: 'მობრუნება', sym: 'φ', min: -60, max: 60, step: 1, value: 25, unit: '°' },
  },
  points: ({ c, b, alpha, phi }) => {
    const [A, B, C] = tri(c, b, alpha, 0, [-3.6, 0]), [A1, B1, C1] = tri(c, b, alpha, phi, [3.6, 0]);
    return { A, B, C, A1, B1, C1 };
  },
  drag: { B: ['c'], C: ['b', 'alpha'], B1: ['phi'] },
  base: 'ABC A1B1C1',
  dims: '<A <B <C',
  toggles: {
    'გკგ': 'AB=A1B1 AC=A1C1 <BAC=<B1A1C1',
    'კგკ': 'AB=A1B1 <BAC=<B1A1C1 <ABC=<A1B1C1',
    'გგგ': 'AB=A1B1 BC=B1C1 CA=C1A1',
  },
  checks: {
    sas: ({ B, C, B1, C1 }) => near(dist(B, C), dist(B1, C1)),
    asa: ({ A, B, C }, { c }) => { // rebuild from AB and the two angles on it: the third vertex lands at the same distances
      const a = angleAt(B, A, C), bb = angleAt(A, B, C), A2: V = [0, 0], B2: V = [c, 0];
      const C2 = intersect(A2, polar(1, a), B2, add(B2, polar(1, 180 - bb)));
      return near(dist(A2, C2), dist(A, C)) && near(dist(B2, C2), dist(B, C));
    },
    sss: ({ A, B, C }) => { // rebuild from three sides only: the angles come out equal
      const A2: V = [0, 0], B2: V = [dist(A, B), 0], C2 = circleIntersection(A2, dist(A, C), B2, dist(B, C), [0, -1]);
      return near(angleAt(B2, A2, C2), angleAt(B, A, C)) && near(angleAt(A2, B2, C2), angleAt(A, B, C));
    },
    'right-criteria': (_, { c, b }) => { // hypotenuse and leg fix the other leg (and so the triangle)
      const hyp = Math.max(c, b) + 0.5, leg = Math.min(c, b), other = Math.sqrt(hyp * hyp - leg * leg);
      const C: V = [0, 0], B: V = [leg, 0], A = circleIntersection(B, hyp, C, other, [leg / 2, -1]);
      return near(angleAt(A, C, B), 90);
    },
  },
});
