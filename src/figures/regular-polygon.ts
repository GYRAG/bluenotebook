import { angleAt, area, dist, foot, mid, near, polar, type V } from './engine/geom';
import { figure } from './engine/spec';

// A regular n-gon (n = 3…12) inscribed in a circle of radius R around O, side AB at the bottom.
// Vertices past the n-th collapse onto the last one; the outline only uses the first n.
const L = 'ABCDEFGHIJKL';
const k = (n: number) => Math.round(n);
function vertices(n: number, R: number): V[] {
  const m = k(n);
  return Array.from({ length: 12 }, (_, i) => polar(R, -90 - 180 / m + (360 * Math.min(i, m - 1)) / m));
}

export default figure({
  kind: 'წესიერი მრავალკუთხედი',
  label: 'წესიერი მრავალკუთხედი, ცენტრი O',
  params: {
    n: { label: 'გვერდების რიცხვი', sym: 'n', min: 3, max: 12, step: 1, value: 6 },
    R: { label: 'შემოხაზული წრეწირის რადიუსი', sym: 'R', min: 1.5, max: 3.5, step: 0.1, value: 3 },
  },
  points: ({ n, R }) => {
    const V = vertices(n, R), out: Record<string, V> = { O: [0, 0], M: mid(V[0]!, V[1]!) };
    V.forEach((v, i) => { out[L[i]!] = v; });
    return out as Record<'O' | 'M' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L', V>;
  },
  drag: { B: ['R'] },
  base: ({ n }) => L.slice(0, k(n)),
  dims: '|AB|a <A',
  toggles: { 'შემოხაზული წრეწირი': '(OA) OA OB O', 'ჩახაზული წრეწირი': '(OM) OM M O' },
  readouts: ({ A, B, O, M }, { n, R }) => [
    ['n', k(n), ''], ['a', dist(A, B)], ['R', R], ['r', dist(O, M)], ['S', (k(n) * dist(A, B) * dist(O, M)) / 2], ['∠AOB', angleAt(A, O, B), '°'],
  ],
  checks: {
    'regular-circles': (pts, { n, R }) => {
      const V = Array.from(L.slice(0, k(n)), c => (pts as Record<string, V>)[c]!), O = pts.O!, r = dist(O, foot(O, V[0]!, V[1]!));
      return V.every((v, i) => near(dist(O, v), R) && near(dist(O, foot(O, v, V[(i + 1) % V.length]!)), r));
    },
    'regular-angles': ({ A, B, C, O }, { n }) => near(angleAt(A, B, C), ((k(n) - 2) * 180) / k(n)) && near(angleAt(A, O, B), 360 / k(n)),
    'regular-side': ({ A, B, O, M }, { n, R }) => near(dist(A, B), 2 * R * Math.sin(Math.PI / k(n))) && near(dist(O, M), R * Math.cos(Math.PI / k(n))),
    'regular-area': (pts, { n }) => {
      const V = Array.from(L.slice(0, k(n)), c => (pts as Record<string, V>)[c]!), a = dist(V[0]!, V[1]!), r = dist(pts.O!, pts.M!);
      return near(area(V), (k(n) * a * r) / 2);
    },
    'special-sides': (_, { R }) => {
      const side = (m: number) => { const V = vertices(m, R); return dist(V[0]!, V[1]!); };
      return near(side(6), R) && near(side(4), R * Math.SQRT2) && near(side(3), R * Math.sqrt(3));
    },
  },
});
