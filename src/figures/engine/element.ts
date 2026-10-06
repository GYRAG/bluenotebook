// <geo-figure data-figure="parallelogram">: the interactive figure. Markup comes from
// Figure.astro (svg shell, stamp, hint) and FigureTools.astro (sliders, switches, readouts);
// this wires them to a figure spec. One figure per page owns the panel controls.
import { load, save } from '@/lib/store';
import { boardBounds } from './bounds';
import { classifyQuad, classifyTriangle, type Verdict } from './classify';
import { add, dist, mid, segDist, sub, type V } from './geom';
import { parseRefs, type Ref } from './refs';
import { renderScene, type View } from './render';
import { Sketch, isSized, type Tool } from './sketch';
import { snap, solveDrag } from './solve';
import type { FigureSpec, Params } from './spec';

const SPECS = import.meta.glob<{ default: FigureSpec }>(['../*.ts', '!../registry.ts']); // one lazy chunk per figure
const CELL_MAX = 24;
const ZOOM: [number, number] = [0.3, 5];

export interface ProofScene { set?: Partial<Params>; show?: string; hl?: string }

export class GeoFigure extends HTMLElement {
  spec!: FigureSpec;
  params: Params = {};
  private name = '';
  private svg!: SVGSVGElement;
  private layer!: SVGGElement;
  private handles!: SVGGElement;
  private tools: HTMLElement | null = null;
  private view: View = { W: 0, H: 0, k: 1, cell: 1, ox: 0, oy: 0 };
  private board: [number, number, number, number] = [0, 0, 1, 1];
  private toggles = new Set<string>();
  private dimsOn = true;
  private hover: [string, string] | null = null;
  private drag: string | null = null;
  private scene: ProofScene | null = null;
  private saved: Params | null = null; // slider state from before a proof scene
  private lastVerdict = '';
  private raf = 0;
  private poly: string[] = [];
  private base: Ref[] = [];
  private sketch!: Sketch;
  // the view: zoom and the unit point at the centre of the svg (null: the board's centre)
  private zoom = 1;
  private centre: V | null = null;
  private pointers = new Map<number, V>();                  // pointers down, in svg px (pinch)
  private pinch: { d: number; m: V } | null = null;
  private pan: { last: V; moved: boolean } | null = null;   // a drag on empty paper

  async connectedCallback() {
    this.name = this.dataset.figure!;
    const mod = SPECS[`../${this.name}.ts`];
    if (!mod) return this.fail(`ნახაზი "${this.name}" ვერ მოიძებნა`);
    try { this.spec = (await mod()).default; } catch { return this.fail('ნახაზი ვერ ჩაიტვირთა'); }
    const defaults = Object.fromEntries(Object.entries(this.spec.params).map(([k, d]) => [k, d.value]));
    this.params = snap(this.spec, { ...defaults, ...load<Params>(`fig:${this.name}`, {}) });
    this.setBase();
    this.board = boardBounds(this.spec);
    this.svg = this.querySelector('svg')!;
    this.layer = this.svg.querySelector('.layer')!;
    this.handles = this.svg.querySelector('.handles')!;
    this.tools = document.querySelector(`[data-figure-tools="${this.name}"]`);
    this.sketch = new Sketch(this.svg.querySelector('.sketch')!, `sketch:${this.name}`, () => this.view, e => this.units(e));
    this.buildHandles();
    this.bindInput();
    this.bindTools();
    this.bindSketch();
    const hint = this.querySelector<HTMLElement>('.hint');
    if (hint && !this.hasAttribute('data-alt') && !load('hint-seen', false)) hint.hidden = false;
    new ResizeObserver(() => { this.layout(); this.render(); }).observe(this);
    // Print lays out without running scripts, so draw for the print box (72×52mm in global.css) up front.
    addEventListener('beforeprint', () => { this.layout(272, 196); this.render(); });
    addEventListener('afterprint', () => { this.layout(); this.render(); });
    this.layout(); this.render();
    this.dispatchEvent(new Event('ready'));
  }

  private fail(msg: string) {
    const p = document.createElement('p');
    p.className = 'empty figure-error';
    p.textContent = msg;
    this.append(p);
  }

  // ---------- public API (proof stepper, M3) ----------
  setScene(scene: ProofScene | null) {
    if (scene && !this.scene) this.saved = { ...this.params };
    if (!scene && this.saved) { this.params = this.saved; this.saved = null; }
    this.scene = scene;
    if (scene?.set) this.params = snap(this.spec, { ...this.params, ...scene.set } as Params);
    this.classList.toggle('proving', !!scene);
    if (scene) this.querySelector<HTMLElement>('.hint')?.setAttribute('hidden', '');
    this.syncAll();
    this.schedule();
  }

  set(key: string, value: number) {
    this.params = snap(this.spec, { ...this.params, [key]: value });
    this.sync(key);
    this.persist();
    this.schedule();
  }

  // ---------- layout + render ----------
  private layout(W = this.svg.getBoundingClientRect().width, H = this.svg.getBoundingClientRect().height) {
    const [x0, y0, x1, y1] = this.board;
    const bw = x1 - x0, bh = y1 - y0;
    const kf = (this.spec.unitPx ?? Math.max(4, Math.min((W - Math.min(150, W * 0.24)) / bw, (H - Math.min(110, H * 0.22)) / bh))) * this.zoom;
    const n = Math.max(1, Math.ceil(kf / CELL_MAX)), cell = Math.max(1, Math.floor(kf / n)), k = cell * n; // one unit = whole cells
    const [cx, cy] = this.centre ?? [(x0 + x1) / 2, (y0 + y1) / 2];
    this.view = { W, H, k, cell, ox: Math.round(W / 2 - cx * k) + 0.5, oy: Math.round(H / 2 + cy * k) + 0.5 };
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }

  // ---------- moving the paper: pan, zoom about a point, reset ----------
  private at = (e: { clientX: number; clientY: number }): V => { const r = this.svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  private unitsAt = (p: V): V => [(p[0] - this.view.ox) / this.view.k, (this.view.oy - p[1]) / this.view.k];
  private panBy(d: V) {
    const [x0, y0, x1, y1] = this.board, [cx, cy] = this.centre ?? [(x0 + x1) / 2, (y0 + y1) / 2]; // exact, not re-read from the rounded view
    this.centre = [cx - d[0] / this.view.k, cy + d[1] / this.view.k];
    this.moved();
  }
  private zoomAt(p: V, factor: number) {
    const u = this.unitsAt(p);
    this.zoom = Math.min(ZOOM[1], Math.max(ZOOM[0], this.zoom * factor));
    this.layout(); // new scale; then put u back under p
    this.centre = [u[0] - (p[0] - this.view.W / 2) / this.view.k, u[1] + (p[1] - this.view.H / 2) / this.view.k];
    this.moved();
  }
  resetView() { this.zoom = 1; this.centre = null; this.moved(); }
  private moved() {
    this.layout(); this.schedule();
    const fit = this.querySelector<HTMLElement>('.sk-fit');
    if (fit) fit.hidden = this.zoom === 1 && !this.centre;
  }

  private schedule() {
    if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); });
  }

  private setBase() {
    const b = this.spec.base;
    this.base = parseRefs(typeof b === 'function' ? b(this.params) : b);
    this.poly = (this.base.find(r => r.k === 'poly') as { ps: string[] } | undefined)?.ps ?? [];
  }

  private render() {
    if (!this.view.W) return;
    if (typeof this.spec.base === 'function') this.setBase();
    const pts = this.spec.points(this.params), sc = this.scene;
    const dims = sc ? [] : [...(this.dimsOn ? parseRefs(this.spec.dims) : []), ...(this.hover ? parseRefs(`|${this.hover.join('')}|`) : [])];
    const extra = sc ? [] : [...this.toggles].flatMap(t => parseRefs(this.spec.toggles?.[t]));
    this.layer.innerHTML = renderScene({ pts, view: this.view, base: this.base, dims, extra, aux: parseRefs(sc?.show), hl: parseRefs(sc?.hl), poly: this.poly, unlabeled: this.spec.unlabeled ?? [] });
    for (const h of this.handles.querySelectorAll<SVGGElement>('.handle')) {
      const p = this.px(pts[h.dataset.p!]!);
      h.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
    }
    this.updateReadouts(pts);
    this.updateVerdict(pts);
    this.sketch.render();
  }

  private px = (u: V): V => [this.view.ox + u[0] * this.view.k, this.view.oy - u[1] * this.view.k];
  private units = (e: PointerEvent): V => {
    const r = this.svg.getBoundingClientRect();
    return [(e.clientX - r.left - this.view.ox) / this.view.k, (this.view.oy - (e.clientY - r.top)) / this.view.k];
  };

  private updateVerdict(pts: Record<string, V>) {
    const c = this.spec.classify;
    if (!c) return;
    const poly = this.poly.map(n => pts[n]!);
    const v: Verdict = c === 'quad' ? classifyQuad(poly) : classifyTriangle(poly);
    const stamp = this.querySelector<HTMLElement>('.stamp')!;
    stamp.hidden = v.name === this.spec.kind || !!this.scene; // the stamp is an event, not furniture
    stamp.querySelector('.stamp-v')!.textContent = v.name;
    stamp.querySelector('.stamp-why')!.textContent = v.why;
    if (v.name !== this.lastVerdict) {
      if (this.lastVerdict && !stamp.hidden) { stamp.classList.remove('bump'); void stamp.offsetWidth; stamp.classList.add('bump'); }
      this.querySelector('[data-live]')!.textContent = `ახლა: ${v.name}`;
      this.lastVerdict = v.name;
    }
    const vals = Object.entries(this.spec.params).map(([k, d]) => `${d.sym} = ${this.params[k]}${d.unit ?? ''}`).join(', ');
    this.svg.setAttribute('aria-label', `${this.spec.label}: ${vals}. ახლა: ${v.name}.`);
  }

  private updateReadouts(pts: Record<string, V>) {
    if (!this.tools || !this.spec.readouts) return;
    const ro = this.spec.readouts(pts, this.params);
    const fmt = (r: (typeof ro)[number]) => (r[2] !== undefined ? `${Math.round(r[1])}${r[2]}` : r[1].toFixed(2));
    this.tools.querySelectorAll<HTMLElement>('[data-ro]').forEach(el => { const r = ro[+el.dataset.ro!]; if (r) el.textContent = fmt(r); });
    document.querySelectorAll<HTMLElement>('[data-ro-label]').forEach(el => { // live values on formula cards
      const r = ro.find(x => x[0] === el.dataset.roLabel);
      if (r) el.textContent = `= ${fmt(r)}`;
    });
  }

  // ---------- input ----------
  private buildHandles() {
    const NS = 'http://www.w3.org/2000/svg';
    for (const p of Object.keys(this.spec.drag ?? {})) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'handle');
      g.dataset.p = p;
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `წვერო ${p}: გადაათრიე ან გადაადგილე ისრებით`);
      g.innerHTML = '<circle class="hit" r="22"/><circle class="ring" r="13"/><circle class="knob" r="6"/>';
      this.handles.append(g);
    }
  }

  private touched() {
    const hint = this.querySelector<HTMLElement>('.hint');
    if (hint && !hint.hidden) { hint.hidden = true; save('hint-seen', true); }
  }

  private dragTo(point: string, target: V) { // allowed during proofs too: the proof holds for any shape
    this.params = solveDrag(this.spec, this.params, point, target);
    this.touched();
    this.syncAll();
    this.persist();
    this.schedule();
  }

  private nearestSide(e: PointerEvent): [string, string] | null {
    const r = this.svg.getBoundingClientRect(), p: V = [e.clientX - r.left, e.clientY - r.top];
    const pts = this.spec.points(this.params);
    let best: [string, string] | null = null, bd = 16;
    this.poly.forEach((a, i) => {
      const b = this.poly[(i + 1) % this.poly.length]!, d = segDist(p, this.px(pts[a]!), this.px(pts[b]!));
      if (d < bd) { bd = d; best = [a, b]; }
    });
    return best;
  }
  private setHover(h: [string, string] | null) {
    if (h?.join('') !== this.hover?.join('')) { this.hover = h; this.schedule(); }
  }

  private bindInput() {
    const svg = this.svg;
    const pinchState = () => { const [a, b] = [...this.pointers.values()] as [V, V]; return { d: dist(a, b), m: mid(a, b) }; };
    svg.addEventListener('pointerdown', e => {
      this.pointers.set(e.pointerId, this.at(e));
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
      if (this.pointers.size === 2) { // a second finger: pinch and two-finger pan, whatever was going on
        this.sketch.cancel(); this.drag = null; this.pan = null;
        this.pinch = pinchState();
        return;
      }
      if (this.pointers.size > 2) return;
      const drawing = this.sketch.on && this.sketch.tool !== 'pan';
      if (drawing) return this.sketch.down(e);
      const h = !this.sketch.on && (e.target as Element).closest<SVGGElement>('.handle');
      if (h) { this.drag = h.dataset.p!; h.classList.add('dragging'); return; }
      this.pan = { last: this.at(e), moved: false }; // empty paper: a tap shows a side's length, a drag moves the paper
      if (!this.sketch.on) this.setHover(this.nearestSide(e));
    });
    svg.addEventListener('pointermove', e => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, this.at(e));
      if (this.pinch) {
        if (this.pointers.size !== 2) return;
        const now = pinchState();
        this.panBy(sub(now.m, this.pinch.m));
        if (this.pinch.d > 0) this.zoomAt(now.m, now.d / this.pinch.d);
        this.pinch = now;
        return;
      }
      if (this.sketch.on && this.sketch.tool !== 'pan') return this.sketch.move(e);
      if (this.drag) return this.dragTo(this.drag, this.units(e));
      if (this.pan) {
        const p = this.at(e), d = sub(p, this.pan.last);
        if (!this.pan.moved && Math.hypot(d[0], d[1]) < 4) return; // still a tap
        if (!this.pan.moved) { this.pan.moved = true; this.setHover(null); this.classList.add('panning'); this.touched(); }
        this.pan.last = p;
        return this.panBy(d);
      }
      if (e.pointerType === 'mouse' && !this.sketch.on) this.setHover(this.nearestSide(e));
    });
    svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !this.drag && !this.pan) this.setHover(null); });
    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pinch) { if (this.pointers.size < 2) this.pinch = null; return; }
      if (this.sketch.on && this.sketch.tool !== 'pan') this.sketch.up();
      this.drag = null; this.pan = null;
      this.classList.remove('panning');
      this.handles.querySelectorAll('.dragging').forEach(h => h.classList.remove('dragging'));
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', e => { // wheel and trackpad pinch: zoom about the pointer (the page itself never scrolls)
      e.preventDefault();
      this.zoomAt(this.at(e), Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)));
    }, { passive: false });
    this.handles.addEventListener('keydown', e => {
      const h = (e.target as Element).closest<SVGGElement>('.handle'), s = e.shiftKey ? 0.5 : 0.1;
      const d = ({ ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] } as Record<string, V>)[e.key];
      if (!h || !d) return;
      e.preventDefault();
      e.stopPropagation();
      this.dragTo(h.dataset.p!, add(this.spec.points(this.params)[h.dataset.p!]!, d));
    });
  }

  // ---------- drawing on the grid ----------
  private bindSketch() {
    const bar = this.querySelector<HTMLElement>('.sk');
    if (!bar) return;
    const tools = bar.querySelector<HTMLElement>('.sk-tools')!, toggle = bar.querySelector<HTMLButtonElement>('.sk-toggle')!;
    const live = this.querySelector('[data-live]')!;
    const size = bar.querySelector<HTMLDetailsElement>('.sk-size')!, note = size.querySelector<HTMLElement>('.sk-note')!, hint = note.textContent ?? '';
    const readSizes = () => {
      const group = size.querySelector(`[data-for="${this.sketch.tool}"]`);
      this.sketch.sizes = size.open && group ? [...group.querySelectorAll('input')].map(i => (i.value === '' ? NaN : +i.value)) : null;
    };
    this.sketch.onNote = msg => { note.textContent = msg || hint; };
    size.addEventListener('input', () => { readSizes(); note.textContent = hint; }); // a new number clears an old complaint
    size.addEventListener('toggle', readSizes);
    size.addEventListener('submit', e => { // Enter: the shape goes to the middle of the view
      e.preventDefault();
      readSizes();
      this.sketch.place(this.unitsAt([this.view.W / 2, this.view.H / 2]));
      sync();
    });
    const sync = () => {
      const on = this.sketch.on;
      toggle.setAttribute('aria-pressed', String(on));
      tools.hidden = !on;
      this.classList.toggle('drawing', on);
      this.dataset.tool = this.sketch.tool ?? '';
      size.hidden = !isSized(this.sketch.tool);
      size.querySelectorAll<HTMLElement>('[data-for]').forEach(f => { f.hidden = f.dataset.for !== this.sketch.tool; });
      readSizes();
      bar.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === this.sketch.tool)));
      bar.querySelector<HTMLButtonElement>('[data-sk=undo]')!.disabled = !this.sketch.canUndo;
      bar.querySelector<HTMLButtonElement>('[data-sk=clear]')!.disabled = !this.sketch.count;
    };
    bar.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button');
      if (!b) return;
      if (b.matches('.sk-fit')) { this.resetView(); return; }
      if (b === toggle) {
        this.sketch.setTool(this.sketch.on ? null : 'pen');
        live.textContent = this.sketch.on ? 'ხატვის რეჟიმი: ფანქარი' : 'ხატვის რეჟიმი გამორთულია';
        this.touched();
      } else if (b.dataset.tool) this.sketch.setTool(b.dataset.tool as Tool);
      else if (b.dataset.sk === 'undo') this.sketch.undo();
      else if (b.dataset.sk === 'clear') this.sketch.clear();
      sync();
    });
    this.svg.addEventListener('pointerup', sync); // undo / clear become available after a stroke
    if (this.hasAttribute('data-draw')) this.sketch.setTool('pen'); // a blank sheet opens ready to draw
    this.addEventListener('keydown', e => {
      if (!this.sketch.on) return;
      if (e.key === 'Escape') { this.sketch.cancel(); e.stopPropagation(); }
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey) && !(e.target as Element).matches('input')) { e.preventDefault(); this.sketch.undo(); sync(); }
    });
    sync();
  }

  private bindTools() {
    const t = this.tools;
    if (!t) return;
    t.addEventListener('input', e => {
      const el = e.target as HTMLInputElement, key = el.closest<HTMLElement>('[data-param]')?.dataset.param;
      if (key && el.matches('.rng')) { this.touched(); this.set(key, +el.value); }
    });
    t.addEventListener('change', e => {
      const el = e.target as HTMLInputElement, key = el.closest<HTMLElement>('[data-param]')?.dataset.param;
      if (key && el.matches('.num') && el.value !== '') { this.set(key, +el.value); this.sync(key, true); }
    });
    t.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button');
      if (!b) return;
      if (b.matches('.reset')) { const key = b.closest<HTMLElement>('[data-param]')!.dataset.param!; this.set(key, this.spec.params[key]!.value); }
      if (b.matches('[role=switch]')) {
        const key = b.dataset.toggle!, on = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', String(on));
        if (key === '__dims') this.dimsOn = on; else if (on) this.toggles.add(key); else this.toggles.delete(key);
        this.schedule();
      }
    });
    this.syncAll();
  }

  private sync(key: string, force = false) {
    const row = this.tools?.querySelector<HTMLElement>(`[data-param="${key}"]`);
    if (!row) return;
    const d = this.spec.params[key]!, v = this.params[key]!;
    const rng = row.querySelector<HTMLInputElement>('.rng')!, num = row.querySelector<HTMLInputElement>('.num')!;
    rng.value = String(v);
    rng.style.setProperty('--p', `${((v - d.min) / (d.max - d.min)) * 100}%`);
    if (force || document.activeElement !== num) num.value = v.toFixed((String(d.step).split('.')[1] ?? '').length);
    row.querySelector<HTMLElement>('.reset')!.hidden = v === d.value;
  }
  private syncAll() { Object.keys(this.spec.params).forEach(k => this.sync(k)); }

  private persistT = 0;
  private persist() {
    if (this.scene) return;
    clearTimeout(this.persistT);
    this.persistT = window.setTimeout(() => save(`fig:${this.name}`, this.params), 250);
  }
}

customElements.define('geo-figure', GeoFigure);
