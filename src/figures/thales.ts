import { add, dist, intersect, near, parallel, polar, scale, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

// An angle with vertex O; A1 A2 A3 on one side, parallel lines (direction ψ) meet the other side at B1 B2 B3.
// C2, C3 are the proof's helper points: B1C2 ∥ A1A2 and B2C3 ∥ A2A3 (parallelograms).
type P = { m: number; n: number; theta: number; psi: number };
function build({ m, n, theta, psi }: P) {
  const O: V = [-4, -1.5], u1 = polar(1, 0), u2 = polar(1, theta), w = polar(1, psi);
  const A1 = add(O, scale(u1, 2)), A2 = add(O, scale(u1, 2 + m)), A3 = add(O, scale(u1, 2 + m + n));
  const on2 = (A: V) => intersect(A, add(A, w), O, add(O, u2));
  const B1 = on2(A1), B2 = on2(A2), B3 = on2(A3);
  return { O, A1, A2, A3, B1, B2, B3, C2: add(B1, sub(A2, A1)), C3: add(B2, sub(A3, A2)) };
}

export default figure({
  kind: 'თალესის თეორემა',
  label: 'კუთხე O, პარალელური წრფეები A1B1, A2B2, A3B3',
  params: {
    m: { label: 'A₁A₂', sym: 'm', min: 1, max: 3, step: 0.1, value: 2 },
    n: { label: 'A₂A₃', sym: 'n', min: 1, max: 3, step: 0.1, value: 2 },
    theta: { label: 'კუთხე', sym: 'θ', min: 25, max: 60, step: 1, value: 40, unit: '°' },
    psi: { label: 'პარალელების მიმართულება', sym: 'ψ', min: 95, max: 150, step: 1, value: 115, unit: '°', hidden: true },
  },
  points: p => build(p),
  drag: { A2: ['m'], A3: ['n'], B3: ['theta'], B1: ['psi'] },
  base: 'OA3 OB3 A1B1 A2B2 A3B3',
  dims: '|A1A2| |A2A3| |B1B2| |B2B3|',
  toggles: { 'პარალელურობა': 'A1B1||A2B2||A3B3' },
  readouts: ({ A1, A2, A3, B1, B2, B3 }) => [
    ['A₁A₂ : A₂A₃', dist(A1, A2) / dist(A2, A3)], ['B₁B₂ : B₂B₃', dist(B1, B2) / dist(B2, B3)],
  ],
  checks: {
    thales: (_, p) => { const f = build({ ...p, n: p.m }); return near(dist(f.B1, f.B2), dist(f.B2, f.B3)); },
    'thales-proof': ({ A1, A2, A3, B1, B2, B3, C2, C3 }) =>
      parallel(A2, C2, A2, B2) && parallel(A3, C3, A3, B3) && near(dist(B1, C2), dist(A1, A2)) && near(dist(B2, C3), dist(A2, A3)),
    proportional: ({ O, A1, A2, A3, B1, B2, B3 }) =>
      near(dist(O, A1) / dist(A1, A2), dist(O, B1) / dist(B1, B2)) && near(dist(A1, A2) / dist(A2, A3), dist(B1, B2) / dist(B2, B3)),
  },
});
