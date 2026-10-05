import type { V } from './geom';

export interface Param {
  label: string;      // Georgian label shown on the slider, e.g. 'გვერდი'
  sym: string;        // the letter, e.g. 'a' or 'α'
  min: number; max: number; step: number; value: number;
  unit?: '°';
}
export type Params<K extends string = string> = Record<K, number>;
export type Points = Record<string, V>;
export type Readout = readonly [label: string, value: number, unit?: '°'];

export interface FigureSpec<K extends string = string> {
  /** What the figure is, for its aria-label and for the classifier stamp (hidden while it matches). */
  kind: string;
  label: string;                       // e.g. 'პარალელოგრამი ABCD'
  params: Record<K, Param>;
  /** The whole figure: parameters → named points. Constraints live here (a rhombus has one side length). */
  points: (p: Params<K>) => Points;
  /** Which parameters each draggable point moves; the engine inverts `points` numerically. */
  drag?: Record<string, K[]>;
  base: string;                        // refs always drawn
  dims?: string;                       // refs shown while "ზომები" is on (default on)
  toggles?: Record<string, string>;    // switch label → refs
  classify?: 'triangle' | 'quad';      // classifies the first polygon in `base`
  readouts?: (pts: Points, p: Params<K>) => Readout[];
  /** Property id → numeric claim; Vitest runs each on random parameters. */
  checks?: Record<string, (pts: Points, p: Params<K>) => boolean>;
}

export const figure = <K extends string>(spec: FigureSpec<K>) => spec;
