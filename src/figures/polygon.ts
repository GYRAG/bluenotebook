import { add, angleAt, near, polar, scale, sub, unit, type V } from './engine/geom';
import { figure } from './engine/spec';

// A convex hexagon: its vertices move along an ellipse in fixed angular order, so it stays convex.
// A1…F1 extend each side past its end point (exterior angles).
const N = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const sumInterior = (P: V[]) => P.reduce((s, p, i) => s + angleAt(P[(i + P.length - 1) % P.length]!, p, P[(i + 1) % P.length]!), 0);
const sumExterior = (P: V[]) => P.reduce((s, p, i) => {
  const prev = P[(i + P.length - 1) % P.length]!, ext = add(p, sub(p, prev));
  return s + angleAt(ext, p, P[(i + 1) % P.length]!);
}, 0);
/** A convex n-gon: n points on a circle, each nudged inside its own 1/n arc. */
const ngon = (n: number, wobble: number): V[] => Array.from({ length: n }, (_, i) => polar(3, ((i + 0.5 * Math.sin(i * 7 + wobble) * 0.6) * 360) / n));

export default figure({
  kind: 'მრავალკუთხედი',
  label: 'ამოზნექილი ექვსკუთხედი ABCDEF',
  params: {
    rx: { label: 'სიგანე', sym: 'rx', min: 2.5, max: 4, step: 0.1, value: 3.5 },
    ry: { label: 'სიმაღლე', sym: 'ry', min: 2, max: 3, step: 0.1, value: 2.6 },
    tA: { label: 'A', sym: 'A', min: 65, max: 115, step: 1, value: 95, unit: '°', hidden: true },
    tB: { label: 'B', sym: 'B', min: 125, max: 175, step: 1, value: 150, unit: '°', hidden: true },
    tC: { label: 'C', sym: 'C', min: 185, max: 235, step: 1, value: 205, unit: '°', hidden: true },
    tD: { label: 'D', sym: 'D', min: 245, max: 295, step: 1, value: 270, unit: '°', hidden: true },
    tE: { label: 'E', sym: 'E', min: 305, max: 355, step: 1, value: 325, unit: '°', hidden: true },
    tF: { label: 'F', sym: 'F', min: 5, max: 55, step: 1, value: 30, unit: '°', hidden: true },
  },
  points: p => {
    const V = N.map(k => [p.rx * Math.cos((p[`t${k}`] * Math.PI) / 180), p.ry * Math.sin((p[`t${k}`] * Math.PI) / 180)] as V);
    const out: Record<string, V> = {};
    V.forEach((v, i) => { out[N[i]!] = v; out[`${N[i]}1`] = add(v, scale(unit(sub(v, V[(i + 5) % 6]!)), 1.1)); });
    return out;
  },
  drag: { A: ['tA'], B: ['tB'], C: ['tC'], D: ['tD'], E: ['tE'], F: ['tF'] },
  base: 'ABCDEF',
  dims: '<A <B <C <D <E <F',
  toggles: {
    'დიაგონალები A-დან': 'AC AD AE',
    'გარე კუთხეები': 'AA1 BB1 CC1 DD1 EE1 FF1 <A1AB <B1BC <C1CD <D1DE <E1EF <F1FA',
  },
  readouts: pts => {
    const P = N.map(k => pts[k]!);
    return [['n', 6, ''], ['Σ', sumInterior(P), '°'], ['Σ′', sumExterior(P), '°']];
  },
  checks: {
    'polygon-angle-sum': (pts, { rx }) =>
      near(sumInterior(N.map(k => pts[k]!)), 720) && [3, 4, 5, 7, 9, 12].every(n => near(sumInterior(ngon(n, rx)), (n - 2) * 180)),
    'exterior-sum': (pts, { ry }) => near(sumExterior(N.map(k => pts[k]!)), 360) && [3, 5, 8, 11].every(n => near(sumExterior(ngon(n, ry)), 360)),
    'diagonals-count': () => [3, 4, 5, 6, 7, 10, 12].every(n => {
      let d = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (j - i !== 1 && !(i === 0 && j === n - 1)) d++;
      return d === (n * (n - 3)) / 2;
    }),
  },
});
