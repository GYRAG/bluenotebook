// Topic pages: proof stepper (drives the figure), problems (the figure takes the problem's
// shape and data; answers are checked here), deep links, pinned formulas.
import type { GeoFigure, ProofScene } from '@/figures/engine/element';
import { matches, slip, type Slip } from '@/lib/expr';
import { localUrl, plain, tc } from '@/i18n/client';
import { load, save } from '@/lib/store';
import { session, store } from '@/lib/practice';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const panel = $('.panel');
const body = $('.panel-body');
const mainFig = $<GeoFigure>('geo-figure:not([data-alt])');
let fig = mainFig; // the figure the open proof plays on
const ready = (f: GeoFigure | null) => new Promise<void>(res => {
  if (!f || f.spec) return res();
  f.addEventListener('ready', () => res(), { once: true });
});
/** Proofs with <Proof figure="…"> play on that figure; it replaces the main one meanwhile. */
function useFigure(name: string | undefined) {
  const alt = name ? $<GeoFigure>(`geo-figure[data-alt][data-figure="${name}"]`) : null;
  for (const f of $$<GeoFigure>('geo-figure')) f.hidden = alt ? f !== alt : f.hasAttribute('data-alt');
  fig = alt ?? mainFig;
}

// ---------- proof stepper (a problem's solution is one too) ----------
type Problem = Pick<ProofScene, 'set' | 'show' | 'tags'>;
// i = -1: a problem before its solution is opened — the figure shows the statement only.
// limit: the last step that may be shown (a problem's "first step" help stops at 0); help: stages taken.
let open: { li: HTMLElement; steps: HTMLElement[]; i: number; prob: Problem | null; limit: number; help: number } | null = null;

function scene(steps: HTMLElement[], i: number, prob: Problem | null): ProofScene {
  const upTo = steps.slice(0, i + 1);
  return {
    show: [prob?.show ?? '', ...upTo.map(s => s.dataset.show ?? '')].join(' '),
    hl: steps[i]?.dataset.hl ?? '',
    set: Object.assign({}, prob?.set, ...upTo.map(s => (s.dataset.set ? JSON.parse(s.dataset.set) : {}))),
    tags: prob?.tags,
  };
}
function play() {
  if (!open) return;
  const f = fig, sc = scene(open.steps, open.i, open.prob);
  void ready(f).then(() => f?.setScene(sc));
}

function go(i: number) {
  if (!open) return;
  const { steps, li } = open;
  const last = Math.min(steps.length - 1, open.limit);
  open.i = i = Math.max(0, Math.min(last, i));
  steps.forEach((s, j) => { s.hidden = j > i; s.classList.toggle('is-current', j === i); });
  $$('.step-tex', steps[i]).forEach(fit);
  $$<HTMLButtonElement>('.dot', li).forEach((d, j) => { d.setAttribute('aria-current', String(j === i)); d.disabled = j > last; });
  $('.count', li)!.textContent = `${i + 1} / ${steps.length}`;
  $<HTMLButtonElement>('[data-step=prev]', li)!.disabled = i === 0;
  $<HTMLButtonElement>('[data-step=next]', li)!.disabled = i === last;
  const cur = steps[i]!, r = cur.getBoundingClientRect(), pb = body!.getBoundingClientRect();
  if (r.bottom > pb.bottom - 96) body!.scrollTop += r.bottom - pb.bottom + 96; // keep it above the sticky controls
  else if (r.top < pb.top) body!.scrollTop += r.top - pb.top - 12;
  play();
}

/** A formula a little wider than the panel shrinks to fit (down to 80%); a wider one scrolls. */
function fit(t: HTMLElement) {
  const k = t.firstElementChild as HTMLElement | null;
  if (!k) return;
  k.style.fontSize = '';
  const r = t.clientWidth / t.scrollWidth;
  if (r < 1) k.style.fontSize = `${Math.max(0.8, r - 0.005) * 100}%`;
}
if (body) new ResizeObserver(() => { if (open) $$('.step:not([hidden]) .step-tex', open.li).forEach(fit); }).observe(body);

function openProof(li: HTMLElement) {
  if (open?.li === li) return;
  closeProof(false);
  const steps = $$('.step', li);
  if (!steps.length) return;
  const dots = $('.dots', li)!;
  if (!dots.childElementCount) dots.append(...steps.map((_, j) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dot'; b.dataset.goto = String(j); b.setAttribute('aria-label', `${tc('ნაბიჯი')} ${j + 1}`);
    return b;
  }));
  const prob = li.dataset.problem ? (JSON.parse(li.dataset.problem) as Problem) : null;
  open = { li, steps, i: prob ? -1 : 0, prob, limit: Infinity, help: 0 };
  useFigure($<HTMLElement>('.proof-body', li)?.dataset.figure);
  li.classList.add('open');
  panel?.classList.add('proof-open');
  $('.proof', li)!.hidden = false;
  $('.prop-row', li)!.setAttribute('aria-expanded', 'true');
  body!.scrollTop = 0;
  history.replaceState(null, '', `#${li.id}`);
  if (prob) play(); else go(0);
  $<HTMLElement>('.proof-h', li)!.setAttribute('tabindex', '-1');
  $<HTMLElement>('.proof-h', li)!.focus({ preventScroll: true });
}

function closeProof(restoreFocus = true) {
  if (!open) return;
  const { li } = open;
  li.classList.remove('open');
  panel?.classList.remove('proof-open');
  $('.proof', li)!.hidden = true;
  $('.prop-row', li)!.setAttribute('aria-expanded', 'false');
  if (open.prob) { // next time: try first
    $('.sol', li)!.hidden = true;
    const hint = $('[data-hint]', li), b = $<HTMLButtonElement>('[data-help]', li)!;
    if (hint) hint.hidden = true;
    b.hidden = false; b.textContent = (JSON.parse(b.dataset.labels!) as string[])[0]!;
  }
  open = null;
  history.replaceState(null, '', location.pathname);
  const f = fig;
  void ready(f).then(() => f?.setScene(null));
  useFigure(undefined);
  if (restoreFocus) { $<HTMLElement>('.prop-row', li)!.focus(); li.scrollIntoView({ block: 'nearest' }); }
}

document.addEventListener('click', e => {
  const t = e.target as Element;
  const row = t.closest('.prop-row');
  if (row) return openProof(row.closest<HTMLElement>('.prop')!);
  if (t.closest('[data-proof-close]')) return closeProof();
  if (t.closest('[data-help]') && open) return help(open.li);
  const key = t.closest<HTMLElement>('[data-key]');
  if (key) return typeKey(key);
  const step = t.closest<HTMLElement>('[data-step]');
  if (step && open) return go(open.i + (step.dataset.step === 'next' ? 1 : -1));
  const dot = t.closest<HTMLElement>('[data-goto]');
  if (dot && open) return go(+dot.dataset.goto!);
  if (t.closest('[role=tab]') && open) closeProof(false); // switching tabs leaves the proof
});

document.addEventListener('keydown', e => {
  if (!open || $<HTMLDialogElement>('#palette')?.open) return;
  if (e.key === 'Escape') return closeProof();
  const t = e.target as Element;
  if (t.matches?.('input, textarea, [role=tab]') || t.closest?.('.handle') || open.i < 0) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(open.i + (e.key === 'ArrowRight' ? 1 : -1)); }
});

// ---------- problems: type the answer, check it; solved ones are remembered ----------
const solved = () => load<string[]>('solved', []);
const keyOf = (li: HTMLElement) => `${plain(location.pathname)}#${li.id}`; // one progress for both languages
for (const li of $$('.prob')) li.classList.toggle('solved', solved().includes(keyOf(li)));

let lastInput: HTMLInputElement | null = null;
document.addEventListener('focusin', e => { if ((e.target as Element).matches('.ans-in')) lastInput = e.target as HTMLInputElement; });
function typeKey(b: HTMLElement) { // √ and π: phone keyboards have neither
  const form = b.closest('form')!, input = lastInput && form.contains(lastInput) ? lastInput : $<HTMLInputElement>('.ans-in', form)!;
  const at = input.selectionStart ?? input.value.length;
  input.setRangeText(b.dataset.key!, at, input.selectionEnd ?? at, 'end');
  input.focus();
}

// what a wrong answer most likely is (src/lib/expr.ts names the slip)
const SLIP: Record<Slip, string> = {
  unreadable: 'პასუხი ვერ წავიკითხე. ჩაწერე რიცხვი: შეიძლება √, π და წილადი.',
  close: 'თითქმის! ჩაწერე ზუსტი პასუხი (√, π, წილადი) ან დაამრგვალე მეასედებამდე.',
  sign: 'შეამოწმე ნიშანი.',
  supplement: 'ეს მოსაზღვრე კუთხეა: 180°-ს გამოაკელი.',
  complement: 'ეს კუთხე და პასუხი ერთად 90°-ია: 90°-ს გამოაკელი.',
  double: 'ორჯერ მეტი გამოგივიდა — ხომ არ იპოვე დიამეტრი რადიუსის ნაცვლად ან მთელი ნახევრის ნაცვლად?',
  half: 'ორჯერ ნაკლები გამოგივიდა — ხომ არ იპოვე რადიუსი დიამეტრის ნაცვლად ან ნახევარი მთელის ნაცვლად?',
  pi: 'შეამოწმე π: პასუხი π-ჯერ განსხვავდება.',
  square: 'ეს პასუხის კვადრატია — ამოიღე ფესვი.',
  root: 'ეს პასუხის ფესვია — ხომ არ დაგავიწყდა კვადრატში აყვანა?',
};

document.addEventListener('submit', e => {
  const form = (e.target as Element).closest<HTMLFormElement>('.ans');
  if (!form) return;
  e.preventDefault();
  const want = JSON.parse(form.dataset.answer!) as number[], angle = JSON.parse(form.dataset.angle!) as boolean[];
  const inputs = $$<HTMLInputElement>('.ans-in', form), msg = $('.ans-msg', form)!, li = form.closest<HTMLElement>('.prob')!;
  if (inputs.some(x => !x.value.trim())) { msg.textContent = tc('ჯერ ჩაწერე პასუხი.'); return; }
  const ok = inputs.map((x, j) => matches(x.value, want[j]!));
  inputs.forEach((x, j) => x.setAttribute('aria-invalid', String(!ok[j])));
  practiced(li, ok.every(Boolean));
  if (ok.every(Boolean)) {
    msg.textContent = `${tc('სწორია! პასუხი:')} ${form.dataset.shown!.split(';').join('; ')}`;
    li.classList.add('solved');
    if (!solved().includes(keyOf(li))) save('solved', [...solved(), keyOf(li)]);
    return;
  }
  const swapped = inputs.length > 1 && want.every(w => inputs.some(x => matches(x.value, w)));
  const j = ok.indexOf(false), why = slip(inputs[j]!.value, want[j]!, angle[j]);
  msg.textContent = swapped ? tc('რიცხვები სწორია, მაგრამ სხვა უჯრებშია.')
    : [tc(ok.some(Boolean) ? 'ნაწილი სწორია — შეამოწმე მონიშნული.' : why ? '' : 'ჯერ არა. სცადე კიდევ ერთხელ ან ნახე მინიშნება.'), why ? tc(SLIP[why]) : '']
      .filter(Boolean).join(' ');
});

// ---------- help in stages: the hint, the solution's first step, then the whole solution ----------
function help(li: HTMLElement) {
  if (!open) return;
  const b = $<HTMLButtonElement>('[data-help]', li)!, labels = JSON.parse(b.dataset.labels!) as string[];
  const hint = $('[data-hint]', li), stage = hint && hint.hidden ? 1 : $('.sol', li)!.hidden ? 2 : 3;
  if (stage === 1) hint!.hidden = false;
  if (stage === 2) { $('.sol', li)!.hidden = false; open.limit = 0; go(0); }
  if (stage === 3) { open.limit = Infinity; go(open.i + 1); }
  const whole = stage === 3 || (stage === 2 && open.steps.length === 1);
  if (whole) open.limit = Infinity;
  open.help = whole ? 3 : stage;
  b.textContent = stage === 1 ? labels[1]! : labels.at(-1)!; // after the hint: the first step; after that: all of it
  b.hidden = whole;
  practiced(li, null);
}

// ---------- practice (/practice/): a session of problems, worked through on their pages ----------
const drill = $('[data-drill]');
function practiced(li: HTMLElement, ok: boolean | null) { // an answer (ok) or help taken (null) on the session's problem
  const s = session(), key = keyOf(li);
  if (!s || s.end || s.items[s.i] !== key) return;
  if (ok === null) { if (!s.solved.includes(key)) s.used[key] = Math.max(s.used[key] ?? 0, open?.help ?? 0); }
  else if (ok) { if (!s.solved.includes(key)) s.solved.push(key); }
  else s.tries[key] = (s.tries[key] ?? 0) + 1;
  store(s);
  drillShow();
}
function drillShow() {
  const s = session();
  if (!drill || !s || s.end) return;
  const key = s.items[s.i]!, [path, id] = key.split('#') as [string, string];
  const [skip, next, finish] = JSON.parse(drill.dataset.labels!) as string[];
  const here = $<HTMLAnchorElement>('[data-drill-here]', drill)!;
  here.textContent = `${drill.dataset.name} ${s.i + 1} / ${s.items.length}`;
  here.href = path === plain(location.pathname) ? `#${id}` : `${localUrl(path)}#${id}`;
  const go = $('[data-drill-next]', drill)!, done = s.solved.includes(key);
  go.textContent = s.i === s.items.length - 1 ? finish! : done ? next! : skip!;
  go.classList.toggle('is-next', done);
  drill.hidden = false;
}
function drillEnd() {
  const s = session();
  if (s && !s.end) store({ ...s, end: Date.now() });
  location.href = localUrl('/practice/');
}
if (drill && session() && !session()!.end) {
  drillShow();
  $('[data-drill-next]', drill)!.addEventListener('click', () => {
    const s = session()!;
    if (s.i === s.items.length - 1) return drillEnd();
    store({ ...s, i: s.i + 1 });
    const [path, id] = s.items[s.i + 1]!.split('#') as [string, string];
    if (path !== plain(location.pathname)) { location.href = `${localUrl(path)}#${id}`; return; }
    drillShow();
    location.hash = id;
  });
  $('[data-drill-end]', drill)!.addEventListener('click', e => { e.preventDefault(); drillEnd(); });
  const time = $('[data-drill-time]', drill)!;
  const tick = () => {
    const s = session();
    if (!s || s.end) return;
    const ms = s.limit ? s.limit - (Date.now() - s.start) : Date.now() - s.start;
    if (s.limit && ms <= 0) return drillEnd();
    const sec = Math.floor(ms / 1000);
    time.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 1000);
}

// ---------- deep links: /geometry/parallelogram/#diagonals-bisect ----------
function follow(hash: string) {
  const el = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  const tabpanel = el?.closest<HTMLElement>('[role=tabpanel]');
  if (!el || !tabpanel) return;
  document.getElementById(tabpanel.getAttribute('aria-labelledby')!)?.click();
  if (el.matches('.prop')) return openProof(el);
  closeProof(false);
  el.scrollIntoView({ block: 'start' });
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}
addEventListener('hashchange', () => follow(location.hash));
follow(location.hash);
document.addEventListener('click', e => { // in-page links (e.g. a formula's "proof") go through the same path
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (a) { e.preventDefault(); follow(a.getAttribute('href')!); }
});

// ---------- pinned formulas ----------
export interface Pin { key: string; url: string; name: string; html: string; topic: string }
const pins = () => load<Pin[]>('pins', []);
const topicTitle = $('.title')?.textContent ?? '';
for (const b of $$<HTMLButtonElement>('[data-pin]')) {
  const card = b.closest<HTMLElement>('.fx')!, key = `${location.pathname}#${b.dataset.pin}`;
  const sync = () => b.setAttribute('aria-pressed', String(pins().some(p => p.key === key)));
  sync();
  b.addEventListener('click', () => {
    const list = pins(), on = !list.some(p => p.key === key);
    save('pins', on
      ? [...list, { key, url: key, name: $('h3', card)!.textContent ?? '', html: $('.fx-tex .katex', card)?.outerHTML ?? '', topic: topicTitle }]
      : list.filter(p => p.key !== key));
    sync();
    toast(tc(on ? 'ჩამაგრდა — იპოვი ძიებაში' : 'ჩამაგრება მოიხსნა'));
  });
}
let tt = 0;
function toast(msg: string) {
  const t = $('.toast');
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(tt); tt = window.setTimeout(() => { t.hidden = true; }, 2400);
}
