import type { V } from './engine/geom';
import { figure } from './engine/spec';

// A blank sheet of the notebook (/sheet/): no figure, only the grid to draw on.
// U1 and U2 just size the board: 16 × 10 units around the origin.
export default figure({
  kind: 'სუფთა ფურცელი',
  label: 'სუფთა ფურცელი ბადით',
  params: {},
  points: () => ({ U1: [-8, -5] as V, U2: [8, 5] as V }),
  base: '',
  unlabeled: ['U1', 'U2'],
});
