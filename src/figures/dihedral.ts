import { near } from './engine/geom';
import { angle3, area3, dist3, dot3, solid, sub3, type V3 } from './engine/solid';

// A dihedral angle φ: the horizontal half-plane P1P2P3P4 and the tilted one P1P2R2R1 share the edge P1P2.
// Triangle E1E2T lies in the tilted plane with E1E2 on the edge; T' is T's projection, K the foot of T on the edge.
// M1M2M3 is a second linear angle further along the edge.
const up = (x: number, d: number, phi: number): V3 => [x, d * Math.cos((phi * Math.PI) / 180), d * Math.sin((phi * Math.PI) / 180)];

export default solid({
  kind: 'ორწახნაგა კუთხე',
  label: 'ორწახნაგა კუთხე, სამკუთხედი E1E2T და მისი გეგმილი',
  params: {
    phi: { label: 'ორწახნაგა კუთხე', sym: 'φ', min: 20, max: 90, step: 1, value: 55, unit: '°' },
    tx: { label: 'T', sym: 'x', min: -1, max: 1, step: 0.1, value: 0.4, hidden: true },
    d: { label: 'TK', sym: 'd', min: 1.5, max: 3.5, step: 0.1, value: 3, hidden: true },
  },
  points3: ({ phi, tx, d }) => {
    const T = up(tx, d, phi);
    return {
      P1: [-3.5, 0, 0], P2: [3.5, 0, 0], P3: [3.5, 4, 0], P4: [-3.5, 4, 0], R1: up(-3.5, 4, phi), R2: up(3.5, 4, phi),
      E1: [-2, 0, 0], E2: [2, 0, 0], T, "T'": [T[0], T[1], 0], K: [tx, 0, 0],
      M1: [-2.9, 0, 0], M2: up(-2.9, 1.6, phi), M3: [-2.9, 1.6, 0],
    };
  },
  base: 'P1P2 P2P3 P3P4 P4P1 P2R2 R2R1 R1P1',
  unlabeled: ['P1', 'P2', 'P3', 'P4', 'R1', 'R2'],
  view: { yaw: -25, pitch: 18 },
  toggles: {
    'სამკუთხედი და გეგმილი': "E1E2T E1T' E2T' TT' T'",
    'წრფივი კუთხე': "KT KT' <TKT' K",
  },
  readouts: (P, { phi }) => [['φ', phi, '°'], ['S', area3([P.E1!, P.E2!, P.T!])], ["S'", area3([P.E1!, P.E2!, P["T'"]!])]],
  checks: {
    'linear-angle-equal': (P, { phi }) => near(angle3(P.T!, P.K!, P["T'"]!), phi) && near(angle3(P.M2!, P.M1!, P.M3!), phi),
    'projection-area': (P, { phi }) => near(area3([P.E1!, P.E2!, P["T'"]!]), area3([P.E1!, P.E2!, P.T!]) * Math.cos((phi * Math.PI) / 180)),
    'planes-perpendicular': (_, { tx, d }) => { // φ = 90°: KT is perpendicular to the lower plane and lies in the upper one
      const T = up(tx, d, 90), K: V3 = [tx, 0, 0];
      return near(dot3(sub3(T, K), [1, 0, 0]), 0) && near(dot3(sub3(T, K), [0, 1, 0]), 0) && near(dist3(T, K), d);
    },
  },
});
