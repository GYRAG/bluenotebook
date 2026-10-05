/* Prototype D — ლურჯი რვეული, UX pass 2: "the figure first, everything else on demand".
   Throwaway: the real build starts in M1. URL params (theme, tab, proof, step, palette,
   active, hover, diag, dims, marks, a, b, alpha) let screenshots open any state. */
(() => {
'use strict';
const qs = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const F1 = new Intl.NumberFormat('ka-GE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const F2 = new Intl.NumberFormat('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rad = d => d * Math.PI / 180;
// Georgian case suffixes hang off math (O-ს, 180°-ით): keep them on the formula's line.
const glue = s => s.replace(/(\$[^$]+\$-[ა-ჿ]+)/g, '<span class="nw">$1</span>');
const CELL_MAX = 24; // px; one unit is always a whole number of paper cells
const TOPIC = 'პარალელოგრამი';

// ---------- content (comes from MDX + a figure spec in the real site) ----------
const PARAMS = {
  a:     { label: 'გვერდი', sym: 'a', min: 2,   max: 6,   step: 0.1, def: 5 },
  b:     { label: 'გვერდი', sym: 'b', min: 1.5, max: 4,   step: 0.1, def: 3 },
  alpha: { label: 'კუთხე',  sym: 'α', min: 40,  max: 140, step: 1,   def: 60 },
};
const TOGGLES = [['diag', 'დიაგონალები'], ['dims', 'ყველა ზომა'], ['marks', 'აღნიშვნები']];
const SECTIONS = [
  ['საფუძვლები', ['კუთხეები და პარალელური წრფეები', 'სამკუთხედების ტოლობა', 'მსგავსება']],
  ['სამკუთხედი', ['სამკუთხედი', 'ტოლფერდა სამკუთხედი', 'მართკუთხა სამკუთხედი', 'ღირსშესანიშნავი წერტილები', 'სამკუთხედის ფართობი', 'სინუსებისა და კოსინუსების თეორემები']],
  ['ოთხკუთხედები', ['ოთხკუთხედი', 'პარალელოგრამი', 'მართკუთხედი', 'რომბი', 'კვადრატი', 'ტრაპეცია']],
];
const ALL = SECTIONS.flatMap(s => s[1]);
const EXTRA = ['ფიგურების კავშირები', 'შპარგალკა'];
const DEF = 'ოთხკუთხედი, რომლის მოპირდაპირე გვერდები წყვილ-წყვილად პარალელურია.';
const FORMULAS = [
  { id: 'area-height', name: 'ფართობი — ფუძე და სიმაღლე', tex: String.raw`S = a\,h_a`, val: m => m.S, pinned: true },
  { id: 'area-sine', name: 'ფართობი — ორი გვერდი და კუთხე', tex: String.raw`S = ab\sin\alpha`, val: m => m.S },
  { id: 'height', name: 'სიმაღლე', tex: String.raw`h_a = b\sin\alpha`, val: m => m.h },
  { id: 'perimeter', name: 'პერიმეტრი', tex: String.raw`P = 2(a+b)`, val: m => m.P, pinned: true },
  { id: 'diagonals', name: 'დიაგონალები', tex: String.raw`d_1^2 + d_2^2 = 2\left(a^2+b^2\right)`, val: m => m.d1 ** 2 + m.d2 ** 2 },
];
const PROPS = [
  { id: 'opposite-sides', t: 'მოპირდაპირე გვერდები ტოლია', why: 'დიაგონალი ყოფს ორ ტოლ სამკუთხედად.' },
  { id: 'opposite-angles', t: 'მოპირდაპირე კუთხეები ტოლია', why: 'იგივე ორი ტოლი სამკუთხედი.' },
  { id: 'adjacent-angles', t: 'ერთ გვერდზე მდებარე კუთხეების ჯამი 180°-ია', why: 'ცალმხრივი კუთხეები პარალელურ წრფეებთან.' },
  { id: 'diagonals-bisect', t: 'დიაგონალები გადაკვეთის წერტილით შუაზე იყოფა', why: 'ფიგურა სიმეტრიულია ამ წერტილის მიმართ.', proof: true },
  { id: 'diagonal-squares', t: 'დიაგონალების კვადრატების ჯამი ოთხივე გვერდის კვადრატების ჯამის ტოლია', why: 'კოსინუსების თეორემა ორჯერ.' },
];
const PROOF = {
  title: 'დიაგონალები გადაკვეთის წერტილით შუაზე იყოფა',
  given: 'ABCD — პარალელოგრამი, $O$ — დიაგონალების გადაკვეთის წერტილი',
  prove: String.raw`$AO = OC,\ BO = OD$`,
  why: String.raw`მოაბრუნე ფიგურა $O$-ს გარშემო $180^\circ$-ით — პარალელოგრამი თავის თავს დაემთხვევა, ამიტომ $O$ ორივე დიაგონალის შუაშია.`,
  steps: [
    { hl: ['diag'], text: 'გავავლოთ დიაგონალები $AC$ და $BD$; მათი გადაკვეთის წერტილი აღვნიშნოთ $O$-თი.' },
    { hl: ['AB=CD'], text: 'პარალელოგრამის მოპირდაპირე გვერდები ტოლია (თვისება 1).', tex: 'AB = CD' },
    { hl: ['angles'], text: String.raw`$AB \parallel CD$, ხოლო $AC$ და $BD$ მკვეთებია, ამიტომ შიგა ჯვარედინი კუთხეები ტოლია.`, tex: String.raw`\begin{gathered}\angle BAO = \angle DCO \\ \angle ABO = \angle CDO\end{gathered}` },
    { hl: ['tri'], text: String.raw`$\triangle ABO$ და $\triangle CDO$ ტოლია გვერდისა და მასთან მდებარე ორი კუთხის მიხედვით (კგკ).`, tex: String.raw`\triangle ABO = \triangle CDO` },
    { hl: ['halves'], text: 'ტოლ სამკუთხედებში ტოლი კუთხეების პირდაპირ მდებარე გვერდები ტოლია.', tex: String.raw`AO = OC,\qquad BO = OD \quad \blacksquare` },
  ],
};
const PAL = [
  ['პარალელოგრამი', 'თემა'], ['რომბი', 'თემა'], ['მართკუთხედი', 'თემა'], ['ტრაპეცია', 'თემა'],
  ['დიაგონალები გადაკვეთის წერტილით შუაზე იყოფა', 'თვისება · პარალელოგრამი'],
  ['რომბის დიაგონალები ურთიერთმართობია', 'თვისება · რომბი'],
  ['S = ab · sin α', 'ფორმულა · პარალელოგრამი'], ['ჰერონის ფორმულა', 'ფორმულა · სამკუთხედი'],
  ['პითაგორას თეორემა', 'თვისება · მართკუთხა სამკუთხედი'],
];
const RO = [['β', m => m.beta + '°'], ['h<sub>a</sub>', m => F2.format(m.h)], ['d<sub>1</sub>', m => F2.format(m.d1)],
  ['d<sub>2</sub>', m => F2.format(m.d2)], ['P', m => F2.format(m.P)], ['S', m => F2.format(m.S)]];

// ---------- markup ----------
const I = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  star: '<path d="M12 3.6l2.55 5.2 5.75.84-4.15 4.05.98 5.72L12 16.72l-5.13 2.69.98-5.72L3.7 9.64l5.75-.84z"/>',
  reset: '<path d="M4.6 12a7.4 7.4 0 1 0 2.17-5.23M4.6 4.2v4.4H9"/>',
  left: '<path d="M14.5 5.5L8 12l6.5 6.5"/>', right: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  theme: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 0 0 15z" fill="currentColor"/>',
  chev: '<path d="M8 10l4 4 4-4"/>',
};
const icon = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const TABS = [['tools', 'ხელსაწყოები'], ['formulas', 'ფორმულები'], ['props', 'თვისებები']];

document.body.insertAdjacentHTML('afterbegin', `
<div class="app">
  <header class="topbar">
    <button class="icon-btn" data-act="nav" aria-label="თემები">${icon('menu')}</button>
    <b class="tb-h">${TOPIC}</b>
    <button class="icon-btn" data-act="palette" aria-label="ძიება და ჩემი ფორმულები">${icon('search')}</button>
  </header>
  <nav class="nav" aria-label="თემები">
    <div class="brand"><span class="brand-t">მათემატიკის ბაზა</span><span class="brand-s">რვეული № 1</span></div>
    <button class="search" data-act="palette">${icon('search')}<span>ძიება</span><kbd>/</kbd></button>
    <button class="subject" data-act="subject">გეომეტრია ${icon('chev')}</button>
    ${SECTIONS.map(([name, topics]) => {
      const open = topics.includes(TOPIC);
      return `<section class="sec${open ? ' open' : ''}">
        <button class="sec-h" aria-expanded="${open}">${name}${icon('chev', 'chev')}</button>
        <ul class="topics">${topics.map(t => `<li><a href="#"${t === TOPIC ? ' aria-current="page"' : ''}><span class="t-t">${t}</span><span class="t-n">${String(ALL.indexOf(t) + 1).padStart(2, '0')}</span></a></li>`).join('')}</ul>
      </section>`;
    }).join('')}
    <ul class="extra">${EXTRA.map(t => `<li><a href="#">${t}</a></li>`).join('')}</ul>
    <div class="nav-foot"><button class="nf" data-act="theme">${icon('theme')}<span data-theme-label></span></button></div>
  </nav>
  <main class="stage">
    <h1>${TOPIC}</h1>
    <p class="lede">${DEF}</p>
    <div class="figure-wrap">
      <svg class="fig" role="img"><defs>
        <marker id="arw" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path class="arw" d="M0 1.8L10 5L0 8.2z"/></marker>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="hatch-l" x1="0" y1="0" x2="0" y2="6"/></pattern>
      </defs><g class="layer"></g><g class="handles"></g></svg>
      <div class="cls" hidden><span class="cls-k">ახლა</span><b class="cls-v"></b><span class="cls-why"></span></div>
      <p class="hint">გადაათრიე <i>B</i> ან <i>D</i> · შეეხე გვერდს</p>
      <p class="sr-only" aria-live="polite" data-live></p>
    </div>
  </main>
  <aside class="panel">
    <button class="grip" data-act="grip" aria-label="პანელის გაშლა" aria-expanded="false"><span></span></button>
    <div class="tabs" role="tablist" aria-label="განყოფილებები">
      ${TABS.map(([id, l], i) => `<button role="tab" id="t-${id}" data-tab="${id}" aria-controls="p-${id}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}">${l}</button>`).join('')}
    </div>
    <div class="panel-body">
      <section role="tabpanel" id="p-tools" aria-labelledby="t-tools">
        ${Object.entries(PARAMS).map(([key, p]) => `
        <div class="ctl" data-k="${key}">
          <label class="ctl-l" for="r-${key}">${p.label} <i>${p.sym}</i></label>
          <button class="reset" aria-label="${p.sym} — საწყისზე დაბრუნება" hidden>${icon('reset')}</button>
          <input class="num" type="number" inputmode="decimal" min="${p.min}" max="${p.max}" step="${p.step}" aria-label="${p.label} ${p.sym}">
          <input class="rng" id="r-${key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}">
        </div>`).join('')}
        <div class="toggles">${TOGGLES.map(([key, l]) => `<button class="sw" role="switch" data-k="${key}" aria-checked="false"><span>${l}</span><span class="sw-t" aria-hidden="true"></span></button>`).join('')}</div>
        <dl class="ro">${RO.map(([sym], i) => `<div><dt>${sym}</dt><dd data-ro="${i}"></dd></div>`).join('')}</dl>
      </section>
      <section role="tabpanel" id="p-formulas" aria-labelledby="t-formulas" hidden>
        ${FORMULAS.map((fx, i) => `<article class="fx" id="${fx.id}">
          <div class="fx-h"><h3>${fx.name}</h3><button class="pin" aria-pressed="${!!fx.pinned}" aria-label="ჩამაგრება: ${fx.name}">${icon('star')}</button></div>
          <div class="fx-row"><div class="fx-tex">$$${fx.tex}$$</div><output class="fx-val" data-fx="${i}"></output></div>
        </article>`).join('')}
      </section>
      <section role="tabpanel" id="p-props" aria-labelledby="t-props" hidden>
        <p class="def"><b>განმარტება.</b> ${DEF}</p>
        <ol class="props">${PROPS.map((p, i) => `<li><button class="prop" data-prop="${p.id}"><span class="prop-n">${i + 1}</span><span class="prop-b"><span class="prop-t">${p.t}</span><span class="prop-w">${p.why}</span></span>${icon('right')}</button></li>`).join('')}</ol>
      </section>
      <section class="proof" id="p-proof" hidden aria-labelledby="proof-h">
        <button class="back" data-act="close-proof">${icon('left')}<span>თვისებები</span></button>
        <h2 id="proof-h">${PROOF.title}</h2>
        <dl class="given"><div><dt>მოც.</dt><dd>${glue(PROOF.given)}</dd></div><div><dt>დას.</dt><dd>${PROOF.prove}</dd></div></dl>
        <p class="why"><b>იდეა.</b> ${glue(PROOF.why)}</p>
        <ol class="steps">${PROOF.steps.map((s, i) => `<li class="step" data-i="${i}"><div><p>${glue(s.text)}</p>${s.tex ? `<div class="step-tex">$$${s.tex}$$</div>` : ''}</div></li>`).join('')}</ol>
        <div class="stepper">
          <button class="sbtn" data-act="prev" aria-label="წინა ნაბიჯი">${icon('left')}</button>
          <div class="dots">${PROOF.steps.map((_, i) => `<button class="dot" data-step="${i}" aria-label="ნაბიჯი ${i + 1}"></button>`).join('')}</div>
          <span class="count" aria-live="polite"></span>
          <button class="sbtn" data-act="next" aria-label="შემდეგი ნაბიჯი">${icon('right')}</button>
        </div>
      </section>
    </div>
  </aside>
</div>
<div class="pal-scrim" hidden><div class="pal" role="dialog" aria-modal="true" aria-label="ძიება">
  <label class="pal-in">${icon('search')}<input type="search" placeholder="თემა, თვისება ან ფორმულა…" aria-controls="pal-res" autocomplete="off"><kbd>Esc</kbd></label>
  <div class="pal-body">
    <section class="pal-pins"><h2 class="pal-h">ჩემი ფორმულები</h2><ul class="pins-list"></ul><p class="pins-empty">ჯერ ცარიელია — ფორმულასთან დააჭირე ვარსკვლავს.</p></section>
    <section><h2 class="pal-h" data-res-h></h2><ul class="pal-res" id="pal-res" role="listbox"></ul>
      <p class="pal-empty" hidden>ვერაფერი ვიპოვე. სცადე სიტყვის დასაწყისი — მაგ. „სამკუთხ“.</p></section>
  </div>
</div></div>
<div class="scrim"></div>
<div class="toast" role="status" hidden></div>`);

// ---------- state + geometry ----------
const root = document.documentElement;
const st = { a: 5, b: 3, alpha: 60, diag: false, dims: true, marks: false, proof: false, step: 0,
  drag: null, hover: null, active: new Set(), touched: false };
const svg = $('.fig'), layer = $('.layer', svg), handles = $('.handles', svg), app = $('.app'), nav = $('.nav');
const BW = 9.5, BH = 4.5; // board in units: worst case over the slider ranges, so the scale never changes
let W = 0, H = 0, k = 1, cell = 1, ox = 0, oy = 0, lastCls = '';

function pts() { // the centre O stays fixed; the shape breathes around it
  const { a, b, alpha } = st, c = Math.cos(rad(alpha)), s = Math.sin(rad(alpha));
  const cx = (a + b * c) / 2, cy = b * s / 2;
  return { A: [-cx, -cy], B: [a - cx, -cy], C: [cx, cy], D: [b * c - cx, b * s - cy], O: [0, 0] };
}
function measure() {
  const { a, b, alpha } = st, c = Math.cos(rad(alpha)), s = Math.sin(rad(alpha));
  return { a, b, alpha, beta: 180 - alpha, h: b * s, P: 2 * (a + b), S: a * b * s,
    d1: Math.sqrt(a * a + b * b + 2 * a * b * c), d2: Math.sqrt(a * a + b * b - 2 * a * b * c) };
}
function set(key, v) {
  const p = PARAMS[key];
  v = Math.min(p.max, Math.max(p.min, v));
  st[key] = +(Math.round(v / p.step) * p.step).toFixed(p.step < 1 ? 1 : 0);
  sync(key); schedule();
}
function dragTo(n, x, y) { // inverse of pts() for the handle being dragged
  if (n === 'B') { set('a', 2 * x + st.b * Math.cos(rad(st.alpha))); return touch(['a']); }
  const bx = 2 * x + st.a, by = 2 * y;
  set('alpha', Math.atan2(by, bx) * 180 / Math.PI); set('b', Math.hypot(bx, by)); touch(['b', 'alpha']);
}
// Annotations for what you are touching appear, then fade 1.4 s after you let go.
let activeT;
function touch(keys) {
  keys.forEach(key => st.active.add(key));
  if (!st.touched) { st.touched = true; $('.hint').hidden = true; }
  clearTimeout(activeT);
  if (!st.drag) activeT = setTimeout(() => { st.active.clear(); schedule(); }, 1400);
  schedule();
}

// ---------- drawing (all in screen px so text never scales) ----------
const f = v => v.toFixed(1);
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const along = (p, d, t) => [p[0] + d[0] * t, p[1] + d[1] * t];
const line = (p, q, c) => `<line class="${c}" x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}"/>`;
const poly = (ps, c) => `<polygon class="${c}" points="${ps.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}"/>`;
const txt = (p, t, c, extra = '') => `<text class="${c}" x="${f(p[0])}" y="${f(p[1])}"${extra}>${t}</text>`;
const toPx = u => [ox + u[0] * k, oy - u[1] * k];
const outward = (P, Q, O) => { const u = unit(sub(Q, P)); let n = [-u[1], u[0]]; const m = sub(mid(P, Q), O); if (m[0] * n[0] + m[1] * n[1] < 0) n = [-n[0], -n[1]]; return { u, n }; };

function ticks(P, Q, count, c = 'tick') {
  const m = mid(P, Q), u = unit(sub(Q, P)), v = [-u[1], u[0]];
  let s = '';
  for (let i = 0; i < count; i++) { const o = along(m, u, (i - (count - 1) / 2) * 5); s += line(along(o, v, -7), along(o, v, 7), c); }
  return s;
}
function arc(V, P, Q, r, count = 1, c = 'arc') {
  const a1 = Math.atan2(P[1] - V[1], P[0] - V[0]);
  let d = Math.atan2(Q[1] - V[1], Q[0] - V[0]) - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  if (Math.abs(Math.abs(d) - Math.PI / 2) < 1e-6) { // right angle: square mark
    const u = unit(sub(P, V)), w = unit(sub(Q, V)), z = 13;
    const p1 = along(V, u, z), p3 = along(V, w, z), p2 = along(p1, w, z);
    return `<path class="${c}" d="M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}L${f(p3[0])} ${f(p3[1])}"/>`;
  }
  let s = '';
  for (let i = 0; i < count; i++) {
    const R = r + i * 5, p1 = [V[0] + R * Math.cos(a1), V[1] + R * Math.sin(a1)], p2 = [V[0] + R * Math.cos(a1 + d), V[1] + R * Math.sin(a1 + d)];
    s += `<path class="${c}" d="M${f(p1[0])} ${f(p1[1])}A${R} ${R} 0 0 ${d > 0 ? 1 : 0} ${f(p2[0])} ${f(p2[1])}"/>`;
  }
  return s;
}
function angleText(V, P, Q, r, t) {
  const u = unit(sub(P, V)), w = unit(sub(Q, V));
  return txt(along(V, unit([u[0] + w[0], u[1] + w[1]]), r + 20), t, 'val');
}
function dim(P, Q, t, O, off = 28) {
  const { u, n } = outward(P, Q, O), P1 = along(P, n, off), Q1 = along(Q, n, off);
  let ang = Math.atan2(u[1], u[0]) * 180 / Math.PI;
  if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
  const tp = along(mid(P1, Q1), n, 12);
  return line(along(P, n, 6), along(P, n, off + 6), 'dim-ext') + line(along(Q, n, 6), along(Q, n, off + 6), 'dim-ext')
    + `<line class="dim" x1="${f(P1[0])}" y1="${f(P1[1])}" x2="${f(Q1[0])}" y2="${f(Q1[1])}" marker-start="url(#arw)" marker-end="url(#arw)"/>`
    + txt(tp, t, 'dim-t', ` transform="rotate(${f(ang)} ${f(tp[0])} ${f(tp[1])})"`);
}
const label = (P, t, d, off) => txt(along(P, d, off), t, 'lbl');
function drawGrid() { // the paper: cells aligned to the figure's centre, units = whole cells
  let s = '';
  for (let x = ox % cell; x <= W; x += cell) s += line([x, 0], [x, H], 'grid');
  for (let y = oy % cell; y <= H; y += cell) s += line([0, y], [W, y], 'grid');
  return s;
}
function layout() {
  const r = svg.getBoundingClientRect();
  W = r.width; H = r.height;
  const kf = Math.min((W - Math.min(150, W * .24)) / BW, (H - Math.min(110, H * .22)) / BH);
  const n = Math.max(1, Math.ceil(kf / CELL_MAX));
  cell = Math.floor(kf / n); k = cell * n;
  ox = Math.round(W / 2) + .5; oy = Math.round(H / 2) + .5;
}

const SIDES = [['AB', 'A', 'B', 'a'], ['BC', 'B', 'C', 'b'], ['CD', 'C', 'D', 'a'], ['DA', 'D', 'A', 'b']];
function render() {
  const u = pts(), p = {};
  for (const n in u) p[n] = toPx(u[n]);
  const m = measure(), hl = new Set(st.proof ? PROOF.steps[st.step].hl : []);
  const rt = st.alpha === 90, rh = st.a === st.b, diag = st.proof || st.diag, act = st.active;
  let s = drawGrid() + poly([p.A, p.B, p.C, p.D], 'shape');
  if (hl.has('tri')) s += poly([p.A, p.B, p.O], 'hl-fill') + poly([p.C, p.D, p.O], 'hl-fill');
  if (diag) { const c = st.proof ? (hl.has('diag') ? 'hl' : 'aux') : 'diag'; s += line(p.A, p.C, c) + line(p.B, p.D, c); }
  if (hl.has('AB=CD')) s += line(p.A, p.B, 'hl') + line(p.C, p.D, 'hl') + ticks(p.A, p.B, 1, 'tick tick-hl') + ticks(p.C, p.D, 1, 'tick tick-hl');
  if (hl.has('angles')) s += arc(p.A, p.B, p.O, 26, 1, 'arc arc-hl') + arc(p.C, p.D, p.O, 26, 1, 'arc arc-hl') + arc(p.B, p.A, p.O, 26, 2, 'arc arc-hl') + arc(p.D, p.C, p.O, 26, 2, 'arc arc-hl');
  if (hl.has('halves')) s += line(p.A, p.C, 'hl') + line(p.B, p.D, 'hl') + ticks(p.A, p.O, 1, 'tick tick-hl') + ticks(p.O, p.C, 1, 'tick tick-hl') + ticks(p.B, p.O, 2, 'tick tick-hl') + ticks(p.O, p.D, 2, 'tick tick-hl');
  if (!st.proof) {
    if (st.marks) s += ticks(p.A, p.B, 1) + ticks(p.C, p.D, 1) + ticks(p.B, p.C, rh ? 1 : 2) + ticks(p.D, p.A, rh ? 1 : 2)
      + arc(p.A, p.B, p.D, 22) + arc(p.C, p.D, p.B, 22) + arc(p.B, p.C, p.A, 22, rt ? 1 : 2) + arc(p.D, p.A, p.C, 22, rt ? 1 : 2);
    for (const [id, P, Q, sym] of SIDES) {
      const own = id === 'AB' || id === 'DA';
      if ((own && (st.dims || act.has(sym))) || st.hover === id) s += dim(p[P], p[Q], `<tspan class="m">${sym}</tspan> = ${F1.format(st[sym])}`, p.O);
    }
    if (st.dims || act.has('alpha')) s += arc(p.A, p.B, p.D, 22) + angleText(p.A, p.B, p.D, 22, `${st.alpha}°`) + arc(p.B, p.C, p.A, 22) + angleText(p.B, p.C, p.A, 22, `${180 - st.alpha}°`);
  }
  for (const n of 'AC') s += `<circle class="vtx" cx="${f(p[n][0])}" cy="${f(p[n][1])}" r="3.5"/>`;
  if (diag) s += `<circle class="vtx" cx="${f(p.O[0])}" cy="${f(p.O[1])}" r="3"/>` + label(p.O, 'O', unit(sub(mid(p.B, p.C), p.O)), 17);
  for (const n of 'ABCD') s += label(p[n], n, unit(sub(p[n], p.O)), 20);
  layer.innerHTML = s;
  svg.classList.toggle('proving', st.proof);
  $('.hint').hidden = st.touched || st.proof;
  for (const h of $$('.handle', handles)) { const q = p[h.dataset.p]; h.setAttribute('transform', `translate(${f(q[0])} ${f(q[1])})`); }
  $$('[data-ro]').forEach(e => { e.textContent = RO[e.dataset.ro][1](m); });
  $$('[data-fx]').forEach(e => { e.textContent = '= ' + F2.format(FORMULAS[e.dataset.fx].val(m)); });
  classify(m);
}
function classify(m) {
  const sq = st.a === st.b, rt = st.alpha === 90;
  const [name, why] = sq && rt ? ['კვადრატი', 'a = b და α = 90°'] : rt ? ['მართკუთხედი', 'α = 90° — ყველა კუთხე მართია']
    : sq ? ['რომბი', 'a = b — ყველა გვერდი ტოლია'] : [TOPIC, ''];
  const box = $('.cls');
  box.hidden = name === TOPIC || st.proof; // the stamp is an event, not furniture
  $('.cls-v', box).textContent = name; $('.cls-why', box).textContent = why;
  if (name !== lastCls) {
    if (lastCls && !box.hidden) { box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
    $('[data-live]').textContent = `ახლა: ${name}`;
  }
  lastCls = name;
  svg.setAttribute('aria-label', `პარალელოგრამი ABCD: a = ${F1.format(m.a)}, b = ${F1.format(m.b)}, α = ${m.alpha}°. ახლა: ${name}.`);
}
let raf = 0;
const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };

// ---------- figure input: drag, keys, hover/tap a side ----------
handles.innerHTML = ['B', 'D'].map(n => `<g class="handle" data-p="${n}" tabindex="0" role="button" aria-label="წვერო ${n}: გადაათრიე ან გადაადგილე ისრებით"><circle class="hit" r="22"/><circle class="ring" r="13"/><circle class="knob" r="6"/></g>`).join('');
const toUnits = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left - ox) / k, (oy - (e.clientY - r.top)) / k, e.clientX - r.left, e.clientY - r.top]; };
function nearestSide(px, py) {
  const u = pts(); let best = null, bd = 16;
  for (const [id, P, Q] of SIDES) {
    const a = toPx(u[P]), ab = sub(toPx(u[Q]), a), t = Math.max(0, Math.min(1, ((px - a[0]) * ab[0] + (py - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)));
    const d = Math.hypot(px - a[0] - ab[0] * t, py - a[1] - ab[1] * t);
    if (d < bd) { bd = d; best = id; }
  }
  return best;
}
const setHover = id => { if (id !== st.hover) { st.hover = id; schedule(); } };
svg.addEventListener('pointerdown', e => {
  const h = e.target.closest('.handle');
  if (!h) { const [, , px, py] = toUnits(e); return setHover(nearestSide(px, py)); } // tap a side → its length
  st.drag = h.dataset.p; h.classList.add('dragging'); svg.setPointerCapture(e.pointerId); e.preventDefault();
});
svg.addEventListener('pointermove', e => {
  const [x, y, px, py] = toUnits(e);
  if (st.drag) dragTo(st.drag, x, y); else if (e.pointerType === 'mouse') setHover(nearestSide(px, py));
});
svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !st.drag) setHover(null); });
const endDrag = () => { if (!st.drag) return; st.drag = null; $$('.handle.dragging').forEach(h => h.classList.remove('dragging')); touch([]); };
svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
handles.addEventListener('keydown', e => {
  const h = e.target.closest('.handle'), s = e.shiftKey ? 0.5 : 0.1;
  const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[e.key];
  if (!h || !d) return;
  e.preventDefault(); e.stopPropagation();
  const q = pts()[h.dataset.p]; dragTo(h.dataset.p, q[0] + d[0], q[1] + d[1]);
});

// ---------- controls ----------
function sync(key) {
  const p = PARAMS[key], c = $(`.ctl[data-k="${key}"]`), v = st[key], n = $('.num', c), r = $('.rng', c);
  r.value = v; r.style.setProperty('--p', `${(v - p.min) / (p.max - p.min) * 100}%`);
  if (document.activeElement !== n) n.value = p.step < 1 ? v.toFixed(1) : v;
  $('.reset', c).hidden = v === p.def;
}
Object.keys(PARAMS).forEach(sync);

// ---------- panels, proof, palette ----------
const pal = $('.pal-scrim'), palIn = $('.pal-in input'), palList = $('.pal-res');
let palSel = 0, palItems = PAL;
function selectTab(id, focus = false) {
  $$('[role=tab]').forEach(t => { const on = t.dataset.tab === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
  $$('[role=tabpanel]').forEach(p => { p.hidden = p.id !== 'p-' + id; });
  if (st.proof) { st.proof = false; $('#p-proof').hidden = true; schedule(); }
}
function openProof() {
  selectTab('props'); st.proof = true;
  $('#p-props').hidden = true; $('#p-proof').hidden = false; $('.panel-body').scrollTop = 0;
  go(0);
}
function closeProof() { st.proof = false; $('#p-proof').hidden = true; $('#p-props').hidden = false; schedule(); }
function scrollPanelTo(el, pad = 96) { // scroll only the panel (scrollIntoView would also scroll an embedding page)
  const body = $('.panel-body'), r = el.getBoundingClientRect(), pb = body.getBoundingClientRect();
  if (r.bottom > pb.bottom - pad) body.scrollTop += r.bottom - pb.bottom + pad; else if (r.top < pb.top) body.scrollTop += r.top - pb.top - 12;
}
function go(i) {
  const n = PROOF.steps.length; st.step = Math.max(0, Math.min(n - 1, i));
  $$('.step').forEach((li, j) => { li.hidden = j > st.step; li.classList.toggle('is-current', j === st.step); li.classList.toggle('is-past', j < st.step); });
  $$('.dot').forEach((d, j) => d.setAttribute('aria-current', j === st.step));
  $('.count').textContent = `${st.step + 1} / ${n}`;
  $('[data-act=prev]').disabled = st.step === 0; $('[data-act=next]').disabled = st.step === n - 1;
  scrollPanelTo($('.step.is-current'));
  schedule();
}
function drawPins() {
  const pins = $$('.fx').filter(fx => $('.pin', fx).getAttribute('aria-pressed') === 'true');
  $('.pins-list').innerHTML = pins.map(fx => `<li><button class="pin-go" data-fx-id="${fx.id}"><span class="pin-n">${$('h3', fx).textContent}</span><span class="pin-tex">${$('.katex', fx)?.outerHTML ?? ''}</span></button></li>`).join('');
  $('.pins-empty').hidden = pins.length > 0;
}
function openPal(q = '') { pal.hidden = false; palIn.value = q; drawPins(); filterPal(); palIn.focus(); }
const closePal = () => { pal.hidden = true; };
function filterPal() {
  const q = palIn.value.trim();
  palItems = q ? PAL.filter(([t, kind]) => t.includes(q) || kind.includes(q)) : PAL.slice(0, 4);
  $('.pal-pins').hidden = !!q;
  $('[data-res-h]').textContent = q ? 'შედეგები' : 'თემები';
  palSel = 0; drawPal();
}
function drawPal() {
  palList.innerHTML = palItems.map(([t, kind], i) => `<li role="option" id="po-${i}" data-i="${i}" aria-selected="${i === palSel}"><span class="pal-t">${t}</span><span class="pal-k">${kind}</span></li>`).join('');
  $('.pal-empty').hidden = palItems.length > 0;
  palIn.setAttribute('aria-activedescendant', palItems.length ? `po-${palSel}` : '');
}
function choosePal(i) {
  const it = palItems[i]; if (!it) return;
  closePal();
  if (it[0].startsWith('დიაგონალები')) openProof(); else toast(`→ ${it[0]}`);
}
function jumpToFormula(id) {
  closePal(); selectTab('formulas');
  const card = $('#' + id); scrollPanelTo(card, 24);
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}
const toggleNav = on => { const v = nav.classList.toggle('open', on); $('.scrim').classList.toggle('on', v); };
function setTheme(t) { root.dataset.theme = t; $('[data-theme-label]').textContent = t === 'dark' ? 'ღამის თემა' : 'დღის თემა'; }
let tt;
function toast(msg) { const t = $('.toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 2400); }

document.addEventListener('input', e => {
  if (e.target === palIn) return filterPal();
  const c = e.target.closest('.ctl'); if (c && e.target.matches('.rng')) { set(c.dataset.k, +e.target.value); touch([c.dataset.k]); }
});
document.addEventListener('change', e => {
  const c = e.target.closest('.ctl'); if (!c || !e.target.matches('.num')) return;
  const key = c.dataset.k; set(key, +e.target.value); touch([key]);
  e.target.value = PARAMS[key].step < 1 ? st[key].toFixed(1) : st[key];
});
document.addEventListener('click', e => {
  if (e.target === pal) return closePal();
  if (e.target.matches('.scrim')) return toggleNav(false);
  const o = e.target.closest('[role=option]'); if (o) return choosePal(+o.dataset.i);
  const t = e.target.closest('button, a'); if (!t) return;
  if (t.matches('a[href="#"]')) { e.preventDefault(); if (!t.hasAttribute('aria-current')) toast('პროტოტიპში მხოლოდ პარალელოგრამია'); return; }
  if (t.matches('.reset')) { const key = t.closest('.ctl').dataset.k; set(key, PARAMS[key].def); return touch([key]); }
  if (t.matches('.sw')) { st[t.dataset.k] = !st[t.dataset.k]; t.setAttribute('aria-checked', st[t.dataset.k]); return schedule(); }
  if (t.matches('[role=tab]')) return selectTab(t.dataset.tab);
  if (t.matches('.sec-h')) { const s = t.parentElement; t.setAttribute('aria-expanded', s.classList.toggle('open')); return; }
  if (t.matches('.pin')) { const on = t.getAttribute('aria-pressed') !== 'true'; t.setAttribute('aria-pressed', on); return toast(on ? 'ჩამაგრდა — იპოვი ძიებაში' : 'ჩამაგრება მოიხსნა'); }
  if (t.matches('.pin-go')) return jumpToFormula(t.dataset.fxId);
  if (t.matches('.prop')) return PROPS.find(p => p.id === t.dataset.prop).proof ? openProof() : toast('ამ თვისების დამტკიცება სრულ ვერსიაშია');
  if (t.matches('.dot')) return go(+t.dataset.step);
  switch (t.dataset.act) {
    case 'palette': return openPal();
    case 'nav': return toggleNav();
    case 'theme': return setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    case 'subject': return toast('საგნები: გეომეტრია · ალგებრა · ტრიგონომეტრია …');
    case 'close-proof': return closeProof();
    case 'prev': return go(st.step - 1);
    case 'next': return go(st.step + 1);
    case 'grip': { const up = app.classList.toggle('sheet-up'); t.setAttribute('aria-expanded', up); return; }
  }
});
document.addEventListener('keydown', e => {
  const t = e.target instanceof Element ? e.target : document.body;
  const typing = t.matches('input:not([type=range]), textarea');
  if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); return openPal(); }
  if (e.key === 'Escape') { if (!pal.hidden) closePal(); else if (nav.classList.contains('open')) toggleNav(false); else if (st.proof) closeProof(); return; }
  if (!pal.hidden) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel + (e.key === 'ArrowDown' ? 1 : -1) + palItems.length) % (palItems.length || 1); drawPal(); }
    if (e.key === 'Enter') choosePal(palSel);
    return;
  }
  const tab = t.closest('[role=tab]');
  if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const i = TABS.findIndex(([id]) => id === tab.dataset.tab), j = (i + (e.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
    return selectTab(TABS[j][0], true);
  }
  if (st.proof && !typing && !t.matches('[type=range]') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); go(st.step + (e.key === 'ArrowRight' ? 1 : -1)); }
});

// ---------- boot ----------
setTheme(qs.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
for (const key of Object.keys(PARAMS)) if (qs.has(key)) set(key, +qs.get(key));
$('.sw[data-k=dims]').setAttribute('aria-checked', true);
for (const [key] of TOGGLES) if (qs.get(key) === '1') { st[key] = true; $(`.sw[data-k=${key}]`).setAttribute('aria-checked', true); }
if (qs.get('active')) { st.active = new Set(qs.get('active').split(',')); st.touched = true; $('.hint').hidden = true; }
if (qs.get('hover')) st.hover = qs.get('hover');
if (window.renderMathInElement) renderMathInElement(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
if (qs.get('tab')) selectTab(qs.get('tab'));
if (qs.get('proof')) { openProof(); go(+qs.get('step') - 1 || 0); }
if (qs.get('nav')) toggleNav(true);
if (qs.has('palette')) openPal(qs.get('palette'));
layout(); render();
new ResizeObserver(() => { layout(); render(); }).observe($('.figure-wrap'));
})();
