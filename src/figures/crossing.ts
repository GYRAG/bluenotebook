import { polar, type V } from './engine/geom';
import { figure } from './engine/spec';

// Two segments AB and CD crossing at O: AB along the x-axis, CD turned by φ (∠BOC). Each of the four
// arms has its own length, so one figure covers "bisect each other", kites and equal crossings.
export default figure({
  kind: 'გადამკვეთი მონაკვეთები',
  label: 'მონაკვეთები AB და CD, რომლებიც O წერტილში იკვეთება',
  params: {
    a: { label: 'მონაკვეთი', sym: 'OA', min: 1, max: 3.5, step: 0.1, value: 2.5 },
    b: { label: 'მონაკვეთი', sym: 'OB', min: 1, max: 3.5, step: 0.1, value: 2.5 },
    c: { label: 'მონაკვეთი', sym: 'OC', min: 1, max: 3.5, step: 0.1, value: 2 },
    d: { label: 'მონაკვეთი', sym: 'OD', min: 1, max: 3.5, step: 0.1, value: 2 },
    phi: { label: 'კუთხე', sym: 'φ', min: 30, max: 150, step: 1, value: 70, unit: '°' },
  },
  points: ({ a, b, c, d, phi }) => ({ O: [0, 0] as V, A: [-a, 0] as V, B: [b, 0] as V, C: polar(c, phi), D: polar(d, phi + 180) }),
  drag: { A: ['a'], B: ['b'], C: ['c', 'phi'], D: ['d'] },
  base: 'AB CD O',
  dims: '<BOC',
});
