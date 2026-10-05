import { add, angleAt, area, circleIntersection, dist, intersect, near, parallel, polar, scale, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// ABC on the left; A1B1C1 = ABC scaled by k on the right. B2, C2 on rays AB, AC with
// AB2 = A1B1 and B2C2 ∥ BC (the copy moved inside the first triangle, for the proofs).
export default figure({
  kind: '',
  label: 'მსგავსი სამკუთხედები ABC და A₁B₁C₁',
  params: {
    c: { label: 'გვერდი', sym: 'c', min: 2, max: 4, step: 0.1, value: 3.4 },
    b: { label: 'გვერდი', sym: 'b', min: 1.5, max: 3.5, step: 0.1, value: 2.6 },
    alpha: { label: 'კუთხე', sym: 'α', min: 35, max: 110, step: 1, value: 60, unit: '°' },
    k: { label: 'მსგავსების კოეფიციენტი', sym: 'k', min: 0.5, max: 1.6, step: 0.1, value: 1.4 },
  },
  points: ({ c, b, alpha, k }) => {
    const o: V = [-5, -1.6], A = o, B = add(o, [c, 0]), C = add(o, polar(b, alpha));
    const o1: V = [0.8, -1.6], A1 = o1, B1 = add(o1, [k * c, 0]), C1 = add(o1, polar(k * b, alpha));
    return { A, B, C, A1, B1, C1, B2: add(A, scale(sub(B, A), k)), C2: add(A, scale(sub(C, A), k)) };
  },
  drag: { B: ['c'], C: ['b', 'alpha'], B1: ['k'] },
  base: 'ABC A1B1C1',
  boundsOf: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
  dims: '<A <B <C',
  toggles: {
    'ტოლი კუთხეები': '<BAC=<B1A1C1 <ABC=<A1B1C1',
    'გადატანილი ასლი': 'B2C2 B2 C2',
  },
  readouts: ({ A, B, C, A1, B1, C1 }, { k }) => [
    ['k', k], ['P₁ : P', (dist(A1, B1) + dist(B1, C1) + dist(C1, A1)) / (dist(A, B) + dist(B, C) + dist(C, A))], ['S₁ : S', area([A1, B1, C1]) / area([A, B, C])],
  ],
  checks: {
    'parallel-lemma': ({ A, B, C, B2, C2 }) => parallel(B2, C2, B, C) && near(dist(A, B2) / dist(A, B), dist(A, C2) / dist(A, C)) && near(dist(B2, C2) / dist(B, C), dist(A, B2) / dist(A, B)),
    aa: ({ A, B, C }, { k }) => { // rebuild from two angles at another size: the sides come out proportional
      const al = angleAt(B, A, C), be = angleAt(A, B, C), c2 = k * 3, A2: V = [0, 0], B2: V = [c2, 0];
      const C2 = intersect(A2, polar(1, al), B2, add(B2, polar(1, 180 - be)));
      return near(dist(A2, C2) / dist(A, C), c2 / dist(A, B)) && near(dist(B2, C2) / dist(B, C), c2 / dist(A, B));
    },
    'sas-similarity': ({ A, B, C, A1, B1, C1 }) => near(dist(B1, C1) / dist(B, C), dist(A1, B1) / dist(A, B)) && near(angleAt(A1, B1, C1), angleAt(A, B, C)),
    'sss-similarity': ({ A, B, C }, { k }) => { // rebuild from proportional sides only: the angles come out equal
      const A2: V = [0, 0], B2: V = [k * dist(A, B), 0], C2 = circleIntersection(A2, k * dist(A, C), B2, k * dist(B, C), [0, -1]);
      return near(angleAt(B2, A2, C2), angleAt(B, A, C)) && near(angleAt(A2, B2, C2), angleAt(A, B, C));
    },
    'area-ratio': ({ A, B, C, A1, B1, C1 }, { k }) => near(area([A1, B1, C1]) / area([A, B, C]), k * k),
    'perimeter-ratio': ({ A, B, C, A1, B1, C1 }, { k }) => near((dist(A1, B1) + dist(B1, C1) + dist(C1, A1)) / (dist(A, B) + dist(B, C) + dist(C, A)), k),
  },
});
