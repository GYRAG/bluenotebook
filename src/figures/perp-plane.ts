import { near } from './engine/geom';
import { add3, dist3, dot3, lerp3, scale3, solid, sub3, type V3 } from './engine/solid';

// Plane α (z = 0, outline P1…P4). AH ⊥ α, A' is A reflected in α. Lines b = HE and c = HF of α
// pass through H, X lies on EF (any line x = HX). B is a point of α; C1C2 ⊥ HB through B.
const dir = (deg: number): V3 => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180), 0];

export default solid({
  kind: 'წრფე და სიბრტყე',
  label: 'სიბრტყე α, მართობი AH, დახრილი AB და მისი გეგმილი HB',
  params: {
    h: { label: 'მართობი', sym: 'AH', min: 1.5, max: 3.5, step: 0.1, value: 2.6 },
    t: { label: 'X', sym: 't', min: 0.15, max: 0.85, step: 0.01, value: 0.4, hidden: true },
    th: { label: 'B', sym: 'B', min: -60, max: 20, step: 1, value: -25, hidden: true },
  },
  points3: ({ h, t, th }) => {
    const H: V3 = [-1, -0.4, 0], E = add3(H, scale3(dir(200), 2.4)), F = add3(H, scale3(dir(115), 2.1));
    const B = add3(H, scale3(dir(th), 3)), u = dir(th + 90);
    return {
      P1: [-4.5, -3, 0], P2: [4.5, -3, 0], P3: [4.5, 3, 0], P4: [-4.5, 3, 0],
      H, A: [H[0], H[1], h], "A'": [H[0], H[1], -h], E, F, X: lerp3(E, F, t), B, C1: add3(B, scale3(u, 1.6)), C2: add3(B, scale3(u, -1.6)),
    };
  },
  base: 'P1P2 P2P3 P3P4 P4P1 AH A H',
  unlabeled: ['P1', 'P2', 'P3', 'P4'],
  view: { yaw: -20, pitch: 24 },
  toggles: { 'დახრილი და გეგმილი': 'AB HB B C1C2 C1 C2' },
  readouts: (P, { h }) => [['AH', h], ['AB', dist3(P.A!, P.B!)], ['HB', dist3(P.H!, P.B!)]],
  checks: {
    'line-plane-perpendicular': P => {
      const A1 = P["A'"]!;
      return near(dist3(P.A!, P.E!), dist3(A1, P.E!)) && near(dist3(P.A!, P.F!), dist3(A1, P.F!))
        && near(dist3(P.A!, P.X!), dist3(A1, P.X!)) && near(dot3(sub3(P.A!, P.H!), sub3(P.X!, P.H!)), 0);
    },
    'three-perpendiculars': P => near(dot3(sub3(P.C1!, P.C2!), sub3(P.B!, P.H!)), 0) && near(dot3(sub3(P.C1!, P.C2!), sub3(P.B!, P.A!)), 0),
    'three-perpendiculars-converse': P => { // a line of α through B, perpendicular to AB, is perpendicular to HB
      const AB = sub3(P.B!, P.A!), c: V3 = [-AB[1], AB[0], 0]; // in α and ⊥ AB (its z-part is 0, so ⊥ the vertical too)
      return near(dot3(c, AB), 0) && near(dot3(c, sub3(P.B!, P.H!)), 0);
    },
    'perpendicular-shortest-3d': P => near(dist3(P.A!, P.B!) ** 2, dist3(P.A!, P.H!) ** 2 + dist3(P.H!, P.B!) ** 2) && dist3(P.A!, P.B!) > dist3(P.A!, P.H!),
  },
});
