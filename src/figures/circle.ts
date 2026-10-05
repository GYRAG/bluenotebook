import { angleAt, dist, foot, mid, near, perpendicular, polar, type V } from './engine/geom';
import { figure } from './engine/spec';

// Circle (centre O, radius R) with a chord AB and the two tangents from an outside point P.
// A, B and P move along their tracks; CD is AB turned by −100° (an equal chord, for one proof).
// U1–U4 are the circle's extreme points: they only size the board.
export default figure({
  kind: 'წრეწირი',
  label: 'წრეწირი ცენტრით O, ქორდა AB და მხებები P წერტილიდან',
  params: {
    R: { label: 'რადიუსი', sym: 'R', min: 2, max: 3, step: 0.1, value: 2.6 },
    p: { label: 'მანძილი ცენტრამდე', sym: 'OP', min: 4, max: 5.5, step: 0.1, value: 4.6, hidden: true },
    tA: { label: 'A', sym: 'A', min: 190, max: 250, step: 1, value: 215, unit: '°', hidden: true },
    tB: { label: 'B', sym: 'B', min: 280, max: 340, step: 1, value: 285, unit: '°', hidden: true },
    tP: { label: 'P', sym: 'P', min: -15, max: 35, step: 1, value: 30, unit: '°', hidden: true },
  },
  points: ({ R, p, tA, tB, tP }) => {
    const A = polar(R, tA), B = polar(R, tB), C = polar(R, tA - 100), D = polar(R, tB - 100);
    const phi = (Math.acos(R / p) * 180) / Math.PI; // ∠POT: cos = R / OP
    return {
      O: [0, 0] as V, A, B, M: mid(A, B), C, D, N: mid(C, D),
      P: polar(p, tP), T1: polar(R, tP + phi), T2: polar(R, tP - phi),
      U1: [R, 0] as V, U2: [0, R] as V, U3: [-R, 0] as V, U4: [0, -R] as V,
    };
  },
  drag: { A: ['tA'], B: ['tB'], P: ['p', 'tP'] },
  base: '(OA) AB PT1 PT2 O',
  unlabeled: ['U1', 'U2', 'U3', 'U4'],
  dims: '|AB| |PT1|',
  toggles: {
    'მართობი ქორდაზე': 'OM M <OMB',
    'რადიუსები შეხების წერტილებში': 'OT1 OT2 OP <OT1P <OT2P',
  },
  readouts: ({ O, A, B, M, P, T1 }, { R }) => [['R', R], ['AB', dist(A, B)], ['d', dist(O, M)], ['PT', dist(P, T1)], ['OP', dist(O, P)]],
  checks: {
    'chord-perpendicular': ({ O, A, B, M }) => near(dist(foot(O, A, B), M), 0) && perpendicular(O, M, A, B),
    'chord-length': ({ O, A, B, M }, { R }) => near(dist(A, B), 2 * Math.sqrt(R * R - dist(O, M) ** 2)),
    'equal-chords': ({ O, A, B, C, D, M }, { R }) => {
      const d = dist(O, M), n = polar(d, 37), s = Math.sqrt(R * R - d * d), E = polar(s, 127, n), F = polar(s, -53, n); // a chord at distance d
      return near(dist(C, D), dist(A, B)) && near(dist(O, foot(O, C, D)), d) && near(dist(O, E), R) && near(dist(E, F), dist(A, B));
    },
    'tangent-radius': ({ O, P, T1, T2 }) => perpendicular(O, T1, P, T1) && perpendicular(O, T2, P, T2) && near(dist(foot(O, P, T1), T1), 0),
    'two-tangents': ({ O, P, T1, T2 }) =>
      near(dist(P, T1), dist(P, T2)) && near(angleAt(T1, P, O), angleAt(O, P, T2)) && near(angleAt(T1, O, P), angleAt(P, O, T2)),
    'tangent-length': ({ O, P, T1 }, { R }) => near(dist(P, T1) ** 2, dist(O, P) ** 2 - R * R),
  },
});
