// Two languages: Georgian (the default, at /…) and English (at /en/…). Interface strings are looked
// up by their Georgian original; topic content has its own English files (src/content/topics-en).
// Server-side helpers live here; the browser uses client.ts (and figures.ts with a figure).
import { CLIENT_EN, type Lang } from './client';
import { FIG_EN } from './figures';
import { UI_EN } from './ui';

export type { Lang };
export const LANGS: Lang[] = ['ka', 'en'];
export const langOf = (u: URL | string): Lang => ((typeof u === 'string' ? u : u.pathname).startsWith('/en/') ? 'en' : 'ka');
/** A site path in a language: /geometry/x/ → /en/geometry/x/. */
export const localize = (lang: Lang, path: string) => (lang === 'en' ? `/en${path}` : path);
/** The language-free path: /en/geometry/x/ → /geometry/x/. */
export const delocalize = (path: string) => path.replace(/^\/en(?=\/)/, '');
/** An interface string in a language (interface words first, then figure words). */
export const t = (lang: Lang, s: string) => (lang === 'en' ? UI_EN[s] ?? CLIENT_EN[s] ?? FIG_EN[s] ?? s : s);
export const SITE = { ka: 'ლურჯი რვეული', en: 'Blue Notebook' } as const;
/** Capitals for a chapter name: Georgian becomes Mtavruli (CSS text-transform leaves Georgian alone; Latin gets it there). */
export const caps = (s: string) => s.replace(/[ა-ჺჽ-ჿ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xbc0));
