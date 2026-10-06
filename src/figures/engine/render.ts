// Draws a figure as an SVG string, in screen pixels so text and marks keep a fixed size
// however big the figure is. Layers: base (the shape), dims (sizes), extra (toggles,
// drawn as drafting centre lines), aux (proof constructions, dashed), hl (what is being
// shown: heavy line, hatched fill). Point labels are placed last, avoiding everything else.
import { add, angleAt, cross, dist, mid, perp, scale, sub, unit, type V } from './geom';
import type { Ang, Ref, Seg } from './refs';

export interface View { W: number; H: number; k: number; cell: number; ox: number; oy: number }
export interface Scene {
  pts: Record<string, V>;            // in units
  view: View;
  base: Ref[]; dims: Ref[]; extra: Ref[]; aux: Ref[]; hl: Ref[];
  poly: string[];                    // the base polygon, for interior angles like <A
  unlabeled?: string[];
  axes?: boolean;                    // coordinate axes through the origin, numbered every unit (or every 2, 5)
}
type Box = { x0: number; y0: number; x1: number; y1: number };

const f = (v: number) => v.toFixed(1);
export const fmtLen = (v: number) => (Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? v.toFixed(1) : v.toFixed(2));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function renderScene(s: Scene): string {
  const { k, ox, oy, W, H, cell } = s.view;
  const P = (n: string): V => { const u = s.pts[n]; if (!u) throw new Error(`unknown point ${n}`); return [ox + u[0] * k, oy - u[1] * k]; };
  const names = Object.keys(s.pts);
  const centre = (() => { const ps = (s.poly.length ? s.poly : names).map(P); return scale(ps.reduce(add, [0, 0]), 1 / ps.length); })();
  const segs: [V, V][] = [], boxes: Box[] = [], labelled = new Set<string>();
  let grid = '', fills = '', lines = '', marks = '', dims = '', dots = '', labels = '';

  const line = (a: V, b: V, c: string, obstacle = true) => {
    if (obstacle) segs.push([a, b]);
    return `<line class="${c}" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`;
  };
  /** Curves are label obstacles too: sampled as short chords (maths angles, counter-clockwise). */
  const curve = (C: V, R: number, a0: number, d: number) => {
    const n = Math.max(4, Math.ceil(Math.abs(d) / (Math.PI / 16)));
    for (let i = 0; i < n; i++) {
      const t1 = a0 + (d * i) / n, t2 = a0 + (d * (i + 1)) / n;
      segs.push([[C[0] + R * Math.cos(t1), C[1] - R * Math.sin(t1)], [C[0] + R * Math.cos(t2), C[1] - R * Math.sin(t2)]]);
    }
  };
  const text = (p: V, t: string, c: string, extra = '') => `<text class="${c}" x="${f(p[0])}" y="${f(p[1])}"${extra}>${t}</text>`;
  const textBox = (p: V, chars: number, h = 18): Box => ({ x0: p[0] - chars * 4.2 - 2, x1: p[0] + chars * 4.2 + 2, y0: p[1] - h / 2, y1: p[1] + h / 2 });

  // the paper: cells aligned to the origin, one unit = whole cells
  for (let x = ((ox % cell) + cell) % cell; x <= W; x += cell) grid += `<line class="grid" x1="${f(x)}" y1="0" x2="${f(x)}" y2="${H}"/>`;
  for (let y = ((oy % cell) + cell) % cell; y <= H; y += cell) grid += `<line class="grid" x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}"/>`;

  // coordinate axes: drawn on the paper, under the figure
  let axes = '';
  if (s.axes) {
    const step = k >= 28 ? 1 : k >= 14 ? 2 : 5;
    if (oy > 0 && oy < H) {
      axes += `<line class="axis" x1="0" y1="${f(oy)}" x2="${f(W - 4)}" y2="${f(oy)}" marker-end="url(#arw)"/>` + text([W - 12, oy - 14], 'x', 'axis-t');
      segs.push([[0, oy], [W, oy]]); boxes.push(textBox([W - 12, oy - 14], 1));
      for (let i = Math.ceil(-ox / k / step) * step; ox + i * k < W - 24; i += step) {
        if (i === 0) continue;
        const x = ox + i * k;
        axes += `<line class="axis" x1="${f(x)}" y1="${f(oy - 3)}" x2="${f(x)}" y2="${f(oy + 3)}"/>` + text([x, oy + 13], String(i), 'tick');
      }
    }
    if (ox > 0 && ox < W) {
      axes += `<line class="axis" x1="${f(ox)}" y1="${H}" x2="${f(ox)}" y2="4" marker-end="url(#arw)"/>` + text([ox + 14, 12], 'y', 'axis-t');
      segs.push([[ox, 0], [ox, H]]); boxes.push(textBox([ox + 14, 12], 1));
      for (let i = Math.ceil((oy - H) / k / step) * step; oy - i * k > 24; i += step) {
        if (i === 0) continue;
        const y = oy - i * k;
        axes += `<line class="axis" x1="${f(ox - 3)}" y1="${f(y)}" x2="${f(ox + 3)}" y2="${f(y)}"/>` + text([ox - 12, y], String(i), 'tick');
      }
    }
  }

  const polyUnits = s.poly.map(n => s.pts[n]!);
  const orient = Math.sign(polyUnits.reduce((acc, p, i) => acc + cross(p, polyUnits[(i + 1) % polyUnits.length]!), 0)) || 1;
  /** [ray end, vertex, ray end, reflex?]: interior angles of the base polygon can be reflex. */
  const angleOf = (a: Ang): [V, V, V, boolean] => {
    if (a.a && a.b) return [P(a.a), P(a.v), P(a.b), false];
    const i = s.poly.indexOf(a.v), n = s.poly.length;
    if (i < 0) throw new Error(`<${a.v}: not a vertex of the base polygon`);
    const pv = polyUnits[(i + n - 1) % n]!, v = polyUnits[i]!, nx = polyUnits[(i + 1) % n]!;
    return [P(s.poly[(i + n - 1) % n]!), P(a.v), P(s.poly[(i + 1) % n]!), Math.sign(cross(sub(v, pv), sub(nx, v))) === -orient];
  };
  function arc([p, v, q, reflex]: [V, V, V, boolean], r: number, count: number, c: string, value?: string) {
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]);
    let d = Math.atan2(q[1] - v[1], q[0] - v[0]) - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    if (reflex) d -= Math.sign(d) * 2 * Math.PI;
    const u = unit(sub(p, v)), w = unit(sub(q, v)), bis = scale(unit(add(u, w)), reflex ? -1 : 1);
    let out = '';
    if (!reflex && Math.abs(Math.abs(d) - Math.PI / 2) < 1e-6) { // right angle → square mark
      const z = 13, p1 = add(v, scale(u, z)), p3 = add(v, scale(w, z)), p2 = add(p1, scale(w, z));
      out = `<path class="${c}" d="M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}L${f(p3[0])} ${f(p3[1])}"/>`;
    } else {
      for (let i = 0; i < count; i++) {
        const R = r + i * 5, e1 = add(v, [R * Math.cos(a1), R * Math.sin(a1)]), e2 = add(v, [R * Math.cos(a1 + d), R * Math.sin(a1 + d)]);
        out += `<path class="${c}" d="M${f(e1[0])} ${f(e1[1])}A${R} ${R} 0 ${Math.abs(d) > Math.PI ? 1 : 0} ${d > 0 ? 1 : 0} ${f(e2[0])} ${f(e2[1])}"/>`;
      }
    }
    boxes.push(arcBox(v, bis, r));
    if (value) { // the value sits on the bisector, pushed out until it clears every line
      let pos = add(v, scale(bis, r + 18));
      for (let t = r + 18; t < r + 60; t += 4) { pos = add(v, scale(bis, t)); if (!hits(textBox(pos, value.length))) break; }
      boxes.push(textBox(pos, value.length));
      out += text(pos, value, 'val');
    }
    return out;
  }
  const arcBox = (v: V, bis: V, r: number): Box => { const c = add(v, scale(bis, r * 0.6)); return { x0: c[0] - r * 0.45, x1: c[0] + r * 0.45, y0: c[1] - r * 0.45, y1: c[1] + r * 0.45 }; };

  const ticks = ([a, b]: Seg, n: number, c: string) => {
    const A = P(a), B = P(b), m = mid(A, B), u = unit(sub(B, A)), v = perp(u);
    let out = '';
    for (let i = 0; i < n; i++) { const o = add(m, scale(u, (i - (n - 1) / 2) * 5)); out += line(add(o, scale(v, -7)), add(o, scale(v, 7)), c, false); }
    return out;
  };
  const arrows = ([a, b]: Seg, n: number, c: string) => {
    const A = P(a), B = P(b), m = mid(A, B), u = unit(sub(B, A)), v = perp(u);
    let out = '';
    for (let i = 0; i < n; i++) {
      const tip = add(m, scale(u, 4 + i * 6 - (n - 1) * 3));
      out += `<path class="${c}" d="M${f(tip[0] - u[0] * 7 + v[0] * 5)} ${f(tip[1] - u[1] * 7 + v[1] * 5)}L${f(tip[0])} ${f(tip[1])}L${f(tip[0] - u[0] * 7 - v[0] * 5)} ${f(tip[1] - u[1] * 7 - v[1] * 5)}"/>`;
    }
    return out;
  };
  function dimension([a, b]: Seg, sym?: string, off = 28, given?: string) {
    const A = P(a), B = P(b), u = unit(sub(B, A));
    let n = perp(u);
    if (cross(sub(B, A), sub(centre, A)) * cross(sub(B, A), n) > 0) n = scale(n, -1); // point away from the figure
    const A1 = add(A, scale(n, off)), B1 = add(B, scale(n, off));
    let ang = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
    if (ang > 90) ang -= 180;
    if (ang <= -90) ang += 180;
    const value = given ?? fmtLen(dist(s.pts[a]!, s.pts[b]!)), label = given ? esc(given) : sym ? `<tspan class="m">${esc(sym)}</tspan> = ${value}` : value;
    const tp = add(mid(A1, B1), scale(n, 12));
    boxes.push(textBox(tp, (sym ? sym.length + 3 : 0) + value.length));
    return line(add(A, scale(n, 6)), add(A, scale(n, off + 6)), 'dim-ext')
      + line(add(B, scale(n, 6)), add(B, scale(n, off + 6)), 'dim-ext')
      + `<line class="dim" x1="${f(A1[0])}" y1="${f(A1[1])}" x2="${f(B1[0])}" y2="${f(B1[1])}" marker-start="url(#arw)" marker-end="url(#arw)"/>`
      + (segs.push([A1, B1]), '')
      + text(tp, label, 'dim-t', ` transform="rotate(${f(ang)} ${f(tp[0])} ${f(tp[1])})"`);
  }

  // ---- draw every layer ----
  const baseKeys = new Set(s.base.flatMap(r => (r.k === 'seg' ? [r.s.join('')] : r.k === 'poly' ? r.ps.map((p, i) => p + r.ps[(i + 1) % r.ps.length]) : [])));
  const segClass = (seg: Seg, c: string) => (c === 'aux' || c === 'extra') && (baseKeys.has(seg.join('')) || baseKeys.has(seg[1] + seg[0])) ? 'base' : c;
  function draw(refs: Ref[], c: 'base' | 'extra' | 'aux' | 'hl' | 'dims') {
    let eq = 0, eqa = 0, par = 0;
    const markC = c === 'hl' ? 'mark mark-hl' : 'mark';
    for (const r of refs) {
      switch (r.k) {
        case 'point': labelled.add(r.p); dots += `<circle class="dot" cx="${f(P(r.p)[0])}" cy="${f(P(r.p)[1])}" r="3"/>`; break;
        case 'seg': r.s.forEach(p => labelled.add(p)); lines += line(P(r.s[0]), P(r.s[1]), segClass(r.s, c)); break;
        case 'line': case 'ray': {
          const A = P(r.s[0]), u = unit(sub(P(r.s[1]), A)), far = 4 * (W + H);
          r.s.forEach(p => labelled.add(p));
          lines += line(r.k === 'line' ? add(A, scale(u, -far)) : A, add(A, scale(u, far)), c === 'base' ? 'base' : c);
          break;
        }
        case 'poly': {
          r.ps.forEach(p => labelled.add(p));
          const pts = r.ps.map(P).map(p => `${f(p[0])},${f(p[1])}`).join(' ');
          if (c === 'hl') fills += `<polygon class="hl-fill" points="${pts}"/>`;
          else { lines += `<polygon class="${c === 'base' ? 'shape' : c}" points="${pts}"/>`; r.ps.forEach((p, i) => segs.push([P(p), P(r.ps[(i + 1) % r.ps.length]!)])); }
          break;
        }
        case 'angle': marks += arc(angleOf(r.ang), 22, 1, c === 'hl' ? 'arc arc-hl' : 'arc', c === 'dims' ? `${Math.round(angleValue(r.ang))}°` : undefined); break;
        case 'eqseg': eq++; for (const sg of r.segs) { if (c === 'hl') lines += line(P(sg[0]), P(sg[1]), 'hl'); marks += ticks(sg, eq, markC); } break;
        case 'eqang': eqa++; for (const a of r.angs) marks += arc(angleOf(a), 22, eqa, c === 'hl' ? 'arc arc-hl' : 'arc'); break;
        case 'par': par++; for (const sg of r.segs) marks += arrows(sg, par, markC); break;
        case 'hid': r.s.forEach(p => labelled.add(p)); lines += line(P(r.s[0]), P(r.s[1]), c === 'base' ? 'hid' : c); break;
        case 'vec': { // an arrow: the shaft stops short so the head ends exactly at the point
          const A = P(r.s[0]), B = P(r.s[1]);
          r.s.forEach(p => labelled.add(p));
          if (dist(A, B) < 2) break; // a zero vector (k = 0): nothing to draw
          const u = unit(sub(B, A)), end = sub(B, scale(u, 7));
          segs.push([A, B]);
          lines += `<line class="${c === 'base' ? 'base' : c} vec" x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(end[0])}" y2="${f(end[1])}" marker-end="url(#vec)"/>`;
          break;
        }
        case 'circle': {
          const C = P(r.c), R = dist(C, P(r.p));
          labelled.add(r.c);
          lines += `<circle class="${c === 'base' ? 'base' : c}" cx="${f(C[0])}" cy="${f(C[1])}" r="${f(R)}" fill="none"/>`;
          curve(C, R, 0, 2 * Math.PI);
          break;
        }
        case 'arc': { // counter-clockwise on the page from a to b (the page shows the maths orientation)
          const C = P(r.c), A = P(r.a), R = dist(C, A);
          const a0 = Math.atan2(-(A[1] - C[1]), A[0] - C[0]), B = P(r.b);
          let d = Math.atan2(-(B[1] - C[1]), B[0] - C[0]) - a0;
          while (d <= 0) d += 2 * Math.PI;
          const E: V = [C[0] + R * Math.cos(a0 + d), C[1] - R * Math.sin(a0 + d)];
          labelled.add(r.a); labelled.add(r.b);
          lines += `<path class="${c === 'base' ? 'base' : c}" d="M${f(A[0])} ${f(A[1])}A${f(R)} ${f(R)} 0 ${d > Math.PI ? 1 : 0} 0 ${f(E[0])} ${f(E[1])}" fill="none"/>`;
          curve(C, R, a0, d);
          break;
        }
        case 'dim': dims += dimension(r.s, r.sym); break;
        case 'tag': dims += dimension(r.s, undefined, 28, r.text); break;
        case 'atag': marks += arc(angleOf(r.ang), 22, 1, 'arc', esc(r.text)); break;
      }
    }
  }
  const angleValue = (a: Ang) => {
    if (a.a && a.b) return angleAt(s.pts[a.a]!, s.pts[a.v]!, s.pts[a.b]!);
    const i = s.poly.indexOf(a.v), n = s.poly.length;
    const x = angleAt(s.pts[s.poly[(i + n - 1) % n]!]!, s.pts[a.v]!, s.pts[s.poly[(i + 1) % n]!]!);
    return angleOf(a)[3] ? 360 - x : x;
  };
  draw(s.base, 'base'); draw(s.extra, 'extra'); draw(s.aux, 'aux'); draw(s.hl, 'hl'); draw(s.dims, 'dims');

  // ---- labels: outward from the figure, first spot that touches nothing ----
  function hits(b: Box) {
    return boxes.some(o => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) || segs.some(([a, c]) => segHitsBox(a, c, b));
  }
  for (const n of labelled) {
    if (s.unlabeled?.includes(n)) continue;
    const p = P(n), pref = Math.atan2(p[1] - centre[1], p[0] - centre[0]), half = { w: 6 + n.length * 4, h: 11 };
    let best: V | null = null;
    for (let i = 0; i < 24 && !best; i++) {
      const t = pref + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 12), r = 19 + (i > 12 ? 6 : 0);
      const c: V = [p[0] + r * Math.cos(t), p[1] + r * Math.sin(t)];
      if (!hits({ x0: c[0] - half.w, x1: c[0] + half.w, y0: c[1] - half.h, y1: c[1] + half.h })) best = c;
    }
    best ??= [p[0] + 19 * Math.cos(pref), p[1] + 19 * Math.sin(pref)];
    boxes.push({ x0: best[0] - half.w, x1: best[0] + half.w, y0: best[1] - half.h, y1: best[1] + half.h });
    labels += text(best, n.replace(/(\d+)/, '<tspan class="sub">$1</tspan>'), 'lbl'); // names are [A-Z][0-9']*: safe
  }
  for (const n of new Set(s.poly)) dots += `<circle class="vtx" cx="${f(P(n)[0])}" cy="${f(P(n)[1])}" r="3.5"/>`;
  return grid + axes + fills + lines + marks + dims + dots + labels;
}

/** Does segment AB cross (or lie inside) box b? */
export function segHitsBox(a: V, c: V, b: Box): boolean {
  const inside = (p: V) => p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1;
  if (inside(a) || inside(c)) return true;
  const corners: V[] = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
  return corners.some((p, i) => segsCross(a, c, p, corners[(i + 1) % 4]!));
}
function segsCross(a: V, b: V, c: V, d: V) {
  const d1 = cross(sub(b, a), sub(c, a)), d2 = cross(sub(b, a), sub(d, a)), d3 = cross(sub(d, c), sub(a, c)), d4 = cross(sub(d, c), sub(b, c));
  return d1 * d2 < 0 && d3 * d4 < 0;
}
