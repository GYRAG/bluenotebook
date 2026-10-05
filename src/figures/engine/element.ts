// <geo-figure data-figure="parallelogram">: the interactive figure. Markup comes from
// Figure.astro (svg shell, stamp, hint) and FigureTools.astro (sliders, switches, readouts);
// this wires them to a figure spec. One figure per page owns the panel controls.
import { load, save } from '@/lib/store';
import { boardBounds } from './bounds';
import { classifyQuad, classifyTriangle, type Verdict } from './classify';
import { add, segDist, type V } from './geom';
import { parseRefs, type Ref } from './refs';
import { renderScene, type View } from './render';
import { snap, solveDrag } from './solve';
import type { FigureSpec, Params } from './spec';

const SPECS = import.meta.glob<{ default: FigureSpec }>(['../*.ts', '!../registry.ts']); // one lazy chunk per figure
const CELL_MAX = 24;

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

  async connectedCallback() {
    this.name = this.dataset.figure!;
    const mod = SPECS[`../${this.name}.ts`];
    if (!mod) return this.fail(`ნახაზი "${this.name}" ვერ მოიძებნა`);
    try { this.spec = (await mod()).default; } catch { return this.fail('ნახაზი ვერ ჩაიტვირთა'); }
    const defaults = Object.fromEntries(Object.entries(this.spec.params).map(([k, d]) => [k, d.value]));
    this.params = snap(this.spec, { ...defaults, ...load<Params>(`fig:${this.name}`, {}) });
    this.base = parseRefs(this.spec.base);
    this.poly = (this.base.find(r => r.k === 'poly') as { ps: string[] } | undefined)?.ps ?? [];
    this.board = boardBounds(this.spec);
    this.svg = this.querySelector('svg')!;
    this.layer = this.svg.querySelector('.layer')!;
    this.handles = this.svg.querySelector('.handles')!;
    this.tools = document.querySelector(`[data-figure-tools="${this.name}"]`);
    this.buildHandles();
    this.bindInput();
    this.bindTools();
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
    const kf = Math.max(4, Math.min((W - Math.min(150, W * 0.24)) / bw, (H - Math.min(110, H * 0.22)) / bh));
    const n = Math.max(1, Math.ceil(kf / CELL_MAX)), cell = Math.floor(kf / n), k = cell * n;
    this.view = { W, H, k, cell, ox: Math.round(W / 2 - ((x0 + x1) / 2) * k) + 0.5, oy: Math.round(H / 2 + ((y0 + y1) / 2) * k) + 0.5 };
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }

  private schedule() {
    if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); });
  }

  private render() {
    if (!this.view.W) return;
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
    const fmt = (r: (typeof ro)[number]) => (r[2] ? `${Math.round(r[1])}${r[2]}` : r[1].toFixed(2));
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
    svg.addEventListener('pointerdown', e => {
      const h = (e.target as Element).closest<SVGGElement>('.handle');
      if (!h) return this.setHover(this.nearestSide(e)); // tap a side → its length
      this.drag = h.dataset.p!;
      h.classList.add('dragging');
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
      if (this.drag) this.dragTo(this.drag, this.units(e));
      else if (e.pointerType === 'mouse') this.setHover(this.nearestSide(e));
    });
    svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !this.drag) this.setHover(null); });
    const end = () => { this.drag = null; this.handles.querySelectorAll('.dragging').forEach(h => h.classList.remove('dragging')); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    this.handles.addEventListener('keydown', e => {
      const h = (e.target as Element).closest<SVGGElement>('.handle'), s = e.shiftKey ? 0.5 : 0.1;
      const d = ({ ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] } as Record<string, V>)[e.key];
      if (!h || !d) return;
      e.preventDefault();
      e.stopPropagation();
      this.dragTo(h.dataset.p!, add(this.spec.points(this.params)[h.dataset.p!]!, d));
    });
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
