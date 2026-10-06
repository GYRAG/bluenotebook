import { angleAt, add, dist, foot, intersect, near, perp, perpendicular, polar, scale, unit, type V } from './engine/geom';
import { figure } from './engine/spec';

// Angle XOY, symmetric about the x-axis (its bisector); P on the bisector, K and L its feet on the sides.
export default figure({
  kind: 'კუთხე',
  label: 'კუთხე XOY და მისი ბისექტრისა',
  params: {
    phi: { label: 'კუთხე', sym: 'φ', min: 30, max: 140, step: 1, value: 70, unit: '°', hidden: true },
    d: { label: 'P', sym: 'OP', min: 2, max: 5, step: 0.1, value: 3.6, hidden: true },
  },
  points: ({ phi, d }) => {
    const X = polar(5.5, -phi / 2), Y = polar(5.5, phi / 2), O: V = [0, 0], P: V = [d, 0];
    return { O, X, Y, P, K: foot(P, O, X), L: foot(P, O, Y) };
  },
  drag: { Y: ['phi'], P: ['d'] },
  base: 'OX OY O',
  readouts: ({ P, K, L }) => [['PK', dist(P, K)], ['PL', dist(P, L)]],
  checks: {
    'bisector-equidistant': ({ O, X, Y, P, K, L }) => near(dist(P, K), dist(P, L)) && perpendicular(P, K, O, X) && perpendicular(P, L, O, Y),
    'bisector-converse': ({ O, X, Y }, { d }) => { // a point at the same distance h from both sides lies on the bisector
      const h = d * 0.4, ux = unit(X), uy = unit(Y), n1 = perp(ux), n2 = scale(perp(uy), -1); // inward normals
      const a = scale(n1, h), b = scale(n2, h), Q = intersect(a, add(a, ux), b, add(b, uy));
      return near(angleAt(X, O, Q), angleAt(Q, O, Y));
    },
  },
});
