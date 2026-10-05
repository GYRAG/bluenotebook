// Doodling on the figure's grid: pencil, segment, circle, rectangle, triangle; move, erase, undo.
// Sketches live in figure units, like the figure's own points, so they stay on the grid when the
// page resizes. Shape corners snap to grid crossings; the pencil is free. Kept per figure.
import { load, save } from '@/lib/store';
import { add, dist, sub, type V } from './geom';
import type { View } from './render';

export type Tool = 'pen' | 'line' | 'circle' | 'rect' | 'tri' | 'move' | 'erase';
export type Shape =
  | { t: 'pen' | 'tri'; p: V[] }               // tri: three corners (fewer while being drawn)
  | { t: 'line' | 'rect' | 'circle'; p: V[] }; // two points: ends / opposite corners / centre and a point on it

export const snapTo = (u: V, step: number): V => [Math.round(u[0] / step) * step, Math.round(u[1] / step) * step];
export const moveShape = (s: Shape, d: V): Shape => ({ ...s, p: s.p.map(q => add(q, d)) });
const round = (s: Shape): Shape => ({ ...s, p: s.p.map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000] as V) });

/** One shape as SVG, in screen pixels. `i` marks a stored shape (move / erase find it by that). */
export function shapeSvg(s: Shape, px: (u: V) => V, cls: string, i?: number): string {
  const f = (v: number) => v.toFixed(1), P = s.p.map(px), at = i === undefined ? '' : ` data-i="${i}"`;
  const pts = (q: V[]) => q.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
  switch (s.t) {
    case 'pen': return `<polyline class="${cls}"${at} points="${pts(P)}"/>`;
    case 'tri': return P.length === 3 ? `<polygon class="${cls}"${at} points="${pts(P)}"/>` : `<polyline class="${cls}"${at} points="${pts(P)}"/>`;
    case 'line': return `<line class="${cls}"${at} x1="${f(P[0]![0])}" y1="${f(P[0]![1])}" x2="${f(P[1]![0])}" y2="${f(P[1]![1])}"/>`;
    case 'circle': return `<circle class="${cls}"${at} cx="${f(P[0]![0])}" cy="${f(P[0]![1])}" r="${f(dist(P[0]!, P[1]!))}"/>`;
    case 'rect': {
      const [a, b] = P as [V, V];
      return `<rect class="${cls}"${at} x="${f(Math.min(a[0], b[0]))}" y="${f(Math.min(a[1], b[1]))}" width="${f(Math.abs(a[0] - b[0]))}" height="${f(Math.abs(a[1] - b[1]))}"/>`;
    }
  }
}

export class Sketch {
  tool: Tool | null = null;
  private shapes: Shape[];
  private history: Shape[][] = [];
  private draft: Shape | null = null;                              // being drawn
  private cursor: V | null = null;                                 // triangle: where the next corner would go
  private moving: { i: number; from: V; now: Shape } | null = null;
  private erasing = false;

  constructor(private g: SVGGElement, private key: string, private view: () => View, private units: (e: PointerEvent) => V) {
    this.shapes = load<Shape[]>(key, []);
  }

  get on() { return this.tool !== null; }
  get count() { return this.shapes.length; }
  get canUndo() { return this.history.length > 0; }

  setTool(t: Tool | null) { this.tool = t; this.draft = null; this.cursor = null; this.render(); }
  undo() { const prev = this.history.pop(); if (prev) { this.shapes = prev; save(this.key, prev); this.render(); } }
  clear() { if (this.shapes.length) { this.commit([]); this.render(); } }
  cancel() { this.draft = null; this.cursor = null; this.render(); }

  private commit(next: Shape[]) {
    this.history.push(this.shapes);
    this.shapes = next.map(round);
    save(this.key, this.shapes);
  }
  private step() { const v = this.view(); return v.cell / v.k; } // one grid cell, in units
  private snap = (u: V) => snapTo(u, this.step());
  private hit = (e: PointerEvent) => { const el = (e.target as Element).closest<SVGElement>('[data-i]'); return el ? +el.dataset.i! : -1; };

  down(e: PointerEvent) {
    const u = this.units(e), t = this.tool;
    if (t === 'pen') this.draft = { t, p: [u] };
    else if (t === 'line' || t === 'circle' || t === 'rect') { const s = this.snap(u); this.draft = { t, p: [s, s] }; }
    else if (t === 'tri') {
      const s = this.snap(u);
      this.draft = this.draft ? { t, p: [...this.draft.p, s] } : { t, p: [s] };
      if (this.draft.p.length === 3) { this.commit([...this.shapes, this.draft]); this.draft = null; this.cursor = null; }
    } else if (t === 'move') {
      const i = this.hit(e);
      if (i >= 0) this.moving = { i, from: u, now: this.shapes[i]! };
    } else if (t === 'erase') { this.erasing = true; this.eraseAt(e); }
    this.render();
  }

  move(e: PointerEvent) {
    const u = this.units(e), d = this.draft;
    if (this.tool === 'pen' && d) {
      const last = d.p[d.p.length - 1]!;
      if (dist(last, u) * this.view().k > 2) d.p.push(u); // a point every 2px keeps strokes light
    } else if (d && d.t !== 'pen' && d.t !== 'tri') d.p[1] = this.snap(u);
    else if (this.tool === 'tri') this.cursor = this.snap(u);
    else if (this.moving) {
      const m = this.moving, s = this.shapes[m.i]!, delta = sub(u, m.from);
      m.now = moveShape(s, s.t === 'pen' ? delta : this.snap(delta)); // shapes stay on the grid
    } else if (this.erasing) this.eraseAt(e);
    else return;
    this.render();
  }

  up() {
    const d = this.draft;
    if (d && d.t === 'pen' && d.p.length > 1) this.commit([...this.shapes, d]);
    if (d && (d.t === 'line' || d.t === 'circle' || d.t === 'rect') && dist(d.p[0]!, d.p[1]!) > 1e-9) this.commit([...this.shapes, d]);
    if (d && d.t !== 'tri') this.draft = null;
    const m = this.moving;
    if (m && m.now !== this.shapes[m.i]) this.commit(this.shapes.map((s, i) => (i === m.i ? m.now : s)));
    this.moving = null;
    this.erasing = false;
    this.render();
  }

  private eraseAt(e: PointerEvent) {
    // pointer capture sends every move to the svg, so look under the pointer ourselves
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<SVGElement>('[data-i]');
    if (el && this.g.contains(el)) this.commit(this.shapes.filter((_, i) => i !== +el.dataset.i!));
  }

  render() {
    const v = this.view(), px = (u: V): V => [v.ox + u[0] * v.k, v.oy - u[1] * v.k];
    const pick = this.tool === 'move' || this.tool === 'erase';
    let out = '';
    this.shapes.forEach((s, i) => {
      const shown = this.moving?.i === i ? this.moving.now : s;
      if (pick) out += shapeSvg(shown, px, s.t === 'pen' ? 'sk-hit sk-hit-line' : 'sk-hit', i); // fat invisible target
      out += shapeSvg(shown, px, `sk-ink${this.moving?.i === i ? ' sk-active' : ''}`);
    });
    if (this.draft) {
      const d = this.draft.t === 'tri' && this.cursor ? { ...this.draft, p: [...this.draft.p, this.cursor] } : this.draft;
      out += shapeSvg(d, px, 'sk-ink sk-draft');
      if (this.draft.t !== 'pen') for (const p of this.draft.p.map(px)) out += `<circle class="sk-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3"/>`;
    }
    this.g.innerHTML = out;
  }
}
