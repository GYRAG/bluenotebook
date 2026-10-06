import type { V } from './geom';

export interface Param {
  label: string;      // Georgian label shown on the slider, e.g. 'გვერდი'
  sym: string;        // the letter, e.g. 'a' or 'α'
  min: number; max: number; step: number; value: number;
  unit?: '°';
  hidden?: boolean;   // moved only by dragging (e.g. free vertex coordinates): no slider
}
export type Params<K extends string = string> = Record<K, number>;
export type Points = Record<string, V>;
export type Readout = readonly [label: string, value: number, unit?: '°' | '']; // a unit (even '') means a whole number: degrees, counts

export interface FigureSpec<K extends string = string, P extends string = string> {
  /** What the figure is, for its aria-label and for the classifier stamp (hidden while it matches). */
  kind: string;
  label: string;                       // e.g. 'პარალელოგრამი ABCD'
  params: Record<K, Param>;
  /** The whole figure: parameters → named points. Constraints live here (a rhombus has one side length). */
  points: (p: Params<K>) => Record<P, V>;
  /** Which parameters each draggable point moves; the engine inverts `points` numerically. */
  drag?: Record<string, NoInfer<K>[]>;
  base: string | ((p: Params<K>) => string); // refs always drawn; a function when the outline depends on the sliders (n-gon)
  unlabeled?: string[];                // helper points that get no letter (line ends etc.)
  boundsOf?: string[];                 // points that size the board (default: all)
  unitPx?: number;                     // fixed scale (px per unit) instead of fitting the board: the blank sheet, one square = 1
  dims?: string;                       // refs shown while "ზომები" is on (default on)
  toggles?: Record<string, string>;    // switch label → refs
  classify?: 'triangle' | 'quad';      // classifies the first polygon in `base`
  readouts?: (pts: Record<P, V>, p: Params<K>) => Readout[];
  /** Property id → numeric claim; Vitest runs each on random parameters. */
  checks?: Record<string, (pts: Record<P, V>, p: Params<K>) => boolean>;
}

/** Typed helper: point names are inferred from `points`, so checks can destructure them safely. */
export const figure = <K extends string, P extends string>(spec: FigureSpec<K, P>) => spec as unknown as FigureSpec;
