import type { V } from './engine/geom';
import { figure } from './engine/spec';

// A blank sheet of the notebook (/sheet/): no figure, only the grid to draw on.
// One grid square is one unit at the start (unitPx = the largest cell), like a school notebook;
// U1 and U2 only centre the view on the origin.
export default figure({
  kind: 'სუფთა ფურცელი',
  label: 'სუფთა ფურცელი ბადით',
  params: {},
  points: () => ({ U1: [-8, -5] as V, U2: [8, 5] as V }),
  base: '',
  unlabeled: ['U1', 'U2'],
  unitPx: 24,
});
