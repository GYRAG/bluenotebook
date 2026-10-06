// Shared by the transformation figures: a draggable triangle ABC near the origin and the maps.
import type { Param } from './spec';
import { add, dot, scale, type V } from './geom';

const P = (label: string, min: number, max: number, value: number): Param => ({ label, sym: label, min, max, step: 0.1, value, hidden: true });
export const TRIANGLE_PARAMS = {
  ax: P('A', 1, 2.2, 1.5), ay: P('A', 0, 1, 0.4),
  bx: P('B', 3, 4.2, 3.6), by: P('B', 0.4, 1.6, 1),
  cx: P('C', 1.8, 3, 2.3), cy: P('C', 2, 3, 2.6),
};
export type TriParams = Record<keyof typeof TRIANGLE_PARAMS, number>;
export const triangle = (p: TriParams): [V, V, V] => [[p.ax, p.ay], [p.bx, p.by], [p.cx, p.cy]];
export const TRIANGLE_DRAG: Record<'A' | 'B' | 'C', (keyof TriParams)[]> = { A: ['ax', 'ay'], B: ['bx', 'by'], C: ['cx', 'cy'] };

/** Rotation about the origin by phi degrees, counter-clockwise. */
export const rotate = ([x, y]: V, phi: number): V => {
  const c = Math.cos((phi * Math.PI) / 180), s = Math.sin((phi * Math.PI) / 180);
  return [x * c - y * s, x * s + y * c];
};
/** Reflection in the line through the origin with unit direction u. */
export const reflect = (p: V, u: V): V => add(scale(u, 2 * dot(p, u)), scale(p, -1));
