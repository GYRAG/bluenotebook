// App-shell behaviour shared by every page: theme, panel tabs, bottom sheet, search,
// last-viewed topic. The nav drawer is a native popover and needs no script.
import { kaQuery } from '@/lib/ka-search';
import { load, save } from '@/lib/store';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// ---------- theme: system → day → night ----------
type Theme = 'system' | 'light' | 'dark';
const THEME_LABEL: Record<Theme, string> = { system: 'თემა: სისტემის', light: 'თემა: დღე', dark: 'თემა: ღამე' };
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
function applyTheme(t: Theme) {
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  $$('[data-theme-label]').forEach(el => { el.textContent = THEME_LABEL[t]; });
}
let theme = load<Theme>('theme', 'system');
applyTheme(theme);
$$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
  theme = NEXT[theme]; save('theme', theme); applyTheme(theme);
}));

// ---------- panel tabs (arrow keys move between them) ----------
const tabs = $$<HTMLButtonElement>('[role=tab]');
function selectTab(tab: HTMLButtonElement, focus = false) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls')!);
    if (panel) panel.hidden = !on;
  }
  if (focus) tab.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length]!, true); }
  });
});

// ---------- bottom sheet: the grip trades figure height for panel height ----------
$('[data-sheet-toggle]')?.addEventListener('click', e => {
  const up = $('.app')!.classList.toggle('sheet-up');
  (e.currentTarget as HTMLElement).setAttribute('aria-expanded', String(up));
});

// ---------- last-viewed topic ----------
const topic = document.body.dataset.topic;
if (topic) save('last', { url: topic, title: $('.title')?.textContent ?? '' });

// ---------- search (Pagefind, built after `astro build`) ----------
interface PagefindSub { title: string; url: string; excerpt: string }
interface PagefindData { url: string; meta: { title?: string }; excerpt: string; sub_results: PagefindSub[] }
interface Pagefind {
  search(q: string): Promise<{ results: { data(): Promise<PagefindData> }[] } | null>;
  options(o: object): Promise<void>;
}
const dialog = $<HTMLDialogElement>('#palette')!;
const input = $<HTMLInputElement>('input', dialog)!;
const list = $('.pal-res', dialog)!;
const status = $('.pal-status', dialog)!;
let pagefind: Promise<Pagefind> | undefined;
const loadPagefind = () => (pagefind ??= import(/* @vite-ignore */ `${'/pagefind/pagefind.js'}`).then(async (m: Pagefind) => {
  await m.options({ excerptLength: 14 });
  return m;
}));

function openPalette() {
  if (dialog.open) return;
  dialog.showModal();
  input.select();
  void loadPagefind().catch(() => {});
}
$$('[data-open-palette]').forEach(b => b.addEventListener('click', openPalette));
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }); // click on the backdrop
document.addEventListener('keydown', e => {
  const typing = (e.target as Element).matches?.('input, textarea, [contenteditable]');
  if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
    e.preventDefault();
    openPalette();
  }
});

let seq = 0;
async function runSearch() {
  const q = kaQuery(input.value);
  const my = ++seq;
  if (!q) { list.replaceChildren(); status.textContent = 'დაწერე რამდენიმე ასო.'; return; }
  status.textContent = 'ვეძებ…';
  let pf: Pagefind;
  try { pf = await loadPagefind(); } catch {
    status.textContent = 'ძიების ინდექსი ვერ ჩაიტვირთა. ლოკალურად ის მხოლოდ pnpm build-ის შემდეგ მუშაობს.';
    return;
  }
  const res = await pf.search(q);
  if (my !== seq || !res) return; // a newer keystroke won
  const pages = await Promise.all(res.results.slice(0, 8).map(r => r.data()));
  if (my !== seq) return;
  status.textContent = pages.length ? '' : 'ვერაფერი ვიპოვე. სცადე სიტყვის დასაწყისი — მაგ. „სამკუთხ“.';
  list.replaceChildren(...pages.flatMap(p => {
    const title = p.meta.title ?? p.url;
    const subs = p.sub_results.filter(s => s.title !== title).slice(0, 3);
    return [item(p.url, title, p.excerpt), ...subs.map(s => item(s.url, s.title, s.excerpt, true))];
  }));
}
function item(href: string, title: string, excerpt: string, sub = false) {
  const li = document.createElement('li');
  li.innerHTML = `<a class="${sub ? 'sub' : ''}" href="${href}"><span></span><span class="pal-ex">${excerpt}</span></a>`;
  li.querySelector('span')!.textContent = title; // titles as text; Pagefind excerpts carry only <mark>
  return li;
}
input.addEventListener('input', () => void runSearch());
dialog.addEventListener('keydown', e => { // arrows walk the results, Enter follows the link
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const links = $$<HTMLAnchorElement>('a', list);
  if (!links.length) return;
  e.preventDefault();
  const i = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (e.key === 'ArrowUp' && i <= 0) return input.focus();
  links[Math.min(links.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))]!.focus();
});
