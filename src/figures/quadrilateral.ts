import { angleAt, area, dist, interiorAngles, intersect, isConvex, isSimpleQuad, mid, near, parallel, rad, type V } from './engine/geom';
import { figure } from './engine/spec';

const free = (sym: string, min: number, max: number, value: number) => ({ label: sym, sym, min, max, step: 0.1, value, hidden: true });

// Four free vertices (dragged, no sliders). Can become concave or even self-crossing.
export default figure({
  kind: 'ოთხკუთხედი',
  label: 'ოთხკუთხედი ABCD',
  params: {
    Ax: free('Ax', -5, 5, -3.5), Ay: free('Ay', -3, 3, -2),
    Bx: free('Bx', -5, 5, 3.5), By: free('By', -3, 3, -2.3),
    Cx: free('Cx', -5, 5, 2.6), Cy: free('Cy', -3, 3, 2),
    Dx: free('Dx', -5, 5, -2.4), Dy: free('Dy', -3, 3, 1.6),
  },
  points: p => {
    const A: V = [p.Ax, p.Ay], B: V = [p.Bx, p.By], C: V = [p.Cx, p.Cy], D: V = [p.Dx, p.Dy];
    return { A, B, C, D, O: intersect(A, C, B, D), K: mid(A, B), L: mid(B, C), M: mid(C, D), N: mid(D, A) };
  },
  drag: { A: ['Ax', 'Ay'], B: ['Bx', 'By'], C: ['Cx', 'Cy'], D: ['Dx', 'Dy'] },
  base: 'ABCD',
  boundsOf: ['A', 'B', 'C', 'D'], // O runs off to infinity as the diagonals turn parallel
  dims: '<A <B <C <D',
  toggles: {
    'გვერდები': '|AB| |BC| |CD| |DA|',
    'დიაგონალები': 'AC BD O',
    'შუაწერტილების ოთხკუთხედი': 'KLMN K L M N',
  },
  classify: 'quad',
  readouts: ({ A, B, C, D, O }) => [
    ['∑', isSimpleQuad([A, B, C, D]) ? interiorAngles([A, B, C, D]).reduce((s, x) => s + x, 0) : NaN, '°'],
    ['P', dist(A, B) + dist(B, C) + dist(C, D) + dist(D, A)],
    ['S', area([A, B, C, D])],
    ['d₁', dist(A, C)],
    ['d₂', dist(B, D)],
    ['φ', angleAt(A, O, B), '°'],
  ],
  checks: {
    'angle-sum': ({ A, B, C, D }) => !isSimpleQuad([A, B, C, D]) || near(interiorAngles([A, B, C, D]).reduce((s, x) => s + x, 0), 360),
    'side-inequality': ({ A, B, C, D }) => dist(A, B) < dist(B, C) + dist(C, D) + dist(D, A) + 1e-9,
    'area-diagonals': ({ A, B, C, D, O }) => !isConvex([A, B, C, D]) || near(area([A, B, C, D]), 0.5 * dist(A, C) * dist(B, D) * Math.sin(rad(angleAt(A, O, B)))),
    varignon: ({ A, C, K, L, M, N }) => parallel(K, L, N, M) && parallel(L, M, K, N) && near(dist(K, L), dist(A, C) / 2) && near(dist(N, M), dist(A, C) / 2),
  },
});
