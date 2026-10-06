// Topic pages: proof stepper (drives the figure), problems (the figure takes the problem's
// shape and data; answers are checked here), deep links, pinned formulas.
import type { GeoFigure, ProofScene } from '@/figures/engine/element';
import { matches } from '@/lib/expr';
import { load, save } from '@/lib/store';

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
// i = -1: a problem before its solution is opened — the figure shows the statement only
let open: { li: HTMLElement; steps: HTMLElement[]; i: number; prob: Problem | null } | null = null;

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
  open.i = i = Math.max(0, Math.min(steps.length - 1, i));
  steps.forEach((s, j) => { s.hidden = j > i; s.classList.toggle('is-current', j === i); });
  $$('.dot', li).forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
  $('.count', li)!.textContent = `${i + 1} / ${steps.length}`;
  $<HTMLButtonElement>('[data-step=prev]', li)!.disabled = i === 0;
  $<HTMLButtonElement>('[data-step=next]', li)!.disabled = i === steps.length - 1;
  const cur = steps[i]!, r = cur.getBoundingClientRect(), pb = body!.getBoundingClientRect();
  if (r.bottom > pb.bottom - 96) body!.scrollTop += r.bottom - pb.bottom + 96; // keep it above the sticky controls
  else if (r.top < pb.top) body!.scrollTop += r.top - pb.top - 12;
  play();
}

function openProof(li: HTMLElement) {
  if (open?.li === li) return;
  closeProof(false);
  const steps = $$('.step', li);
  if (!steps.length) return;
  const dots = $('.dots', li)!;
  if (!dots.childElementCount) dots.append(...steps.map((_, j) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dot'; b.dataset.goto = String(j); b.setAttribute('aria-label', `ნაბიჯი ${j + 1}`);
    return b;
  }));
  const prob = li.dataset.problem ? (JSON.parse(li.dataset.problem) as Problem) : null;
  open = { li, steps, i: prob ? -1 : 0, prob };
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
  if (open.prob) { $('.sol', li)!.hidden = true; $('[data-solution]', li)!.hidden = false; } // next time: try first
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
  if (t.closest('[data-solution]') && open) { $('.sol', open.li)!.hidden = false; (t.closest('[data-solution]') as HTMLElement).hidden = true; return go(0); }
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
const keyOf = (li: HTMLElement) => `${location.pathname}#${li.id}`;
for (const li of $$('.prob')) li.classList.toggle('solved', solved().includes(keyOf(li)));

let lastInput: HTMLInputElement | null = null;
document.addEventListener('focusin', e => { if ((e.target as Element).matches('.ans-in')) lastInput = e.target as HTMLInputElement; });
function typeKey(b: HTMLElement) { // √ and π: phone keyboards have neither
  const form = b.closest('form')!, input = lastInput && form.contains(lastInput) ? lastInput : $<HTMLInputElement>('.ans-in', form)!;
  const at = input.selectionStart ?? input.value.length;
  input.setRangeText(b.dataset.key!, at, input.selectionEnd ?? at, 'end');
  input.focus();
}

document.addEventListener('submit', e => {
  const form = (e.target as Element).closest<HTMLFormElement>('.ans');
  if (!form) return;
  e.preventDefault();
  const want = JSON.parse(form.dataset.answer!) as number[], inputs = $$<HTMLInputElement>('.ans-in', form), msg = $('.ans-msg', form)!;
  if (inputs.some(x => !x.value.trim())) { msg.textContent = 'ჯერ ჩაწერე პასუხი.'; return; }
  const ok = inputs.map((x, j) => matches(x.value, want[j]!));
  inputs.forEach((x, j) => x.setAttribute('aria-invalid', String(!ok[j])));
  if (ok.every(Boolean)) {
    msg.textContent = `სწორია! პასუხი: ${form.dataset.shown!.split(';').join('; ')}`;
    const li = form.closest<HTMLElement>('.prob')!;
    li.classList.add('solved');
    if (!solved().includes(keyOf(li))) save('solved', [...solved(), keyOf(li)]);
  } else {
    msg.textContent = ok.some(Boolean) ? 'ნაწილი სწორია — შეამოწმე მონიშნული.' : 'ჯერ არა. სცადე კიდევ ერთხელ ან ნახე მინიშნება.';
  }
});

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
    toast(on ? 'ჩამაგრდა — იპოვი ძიებაში' : 'ჩამაგრება მოიხსნა');
  });
}
let tt = 0;
function toast(msg: string) {
  const t = $('.toast');
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(tt); tt = window.setTimeout(() => { t.hidden = true; }, 2400);
}
