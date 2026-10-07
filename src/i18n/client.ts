// Strings the browser scripts show (shell.ts, topic.ts). Kept small: every page loads it.
// Keys are the Georgian originals; a missing key shows the Georgian text (the e2e test catches it).
export type Lang = 'ka' | 'en';

export const CLIENT_EN: Record<string, string> = {
  'თემა: სისტემის': 'Theme: system',
  'თემა: დღე': 'Theme: day',
  'თემა: ღამე': 'Theme: night',
  'ჩამაგრებული ფორმულები': 'Pinned formulas',
  'ბოლოს ნანახი': 'Last viewed',
  'დაწერე რამდენიმე ასო. ★-ით ჩამაგრებული ფორმულები აქ გამოჩნდება.': 'Type a few letters. Formulas you pin with ★ show up here.',
  'ვეძებ…': 'Searching…',
  'ძიების ინდექსი ვერ ჩაიტვირთა. ლოკალურად ის მხოლოდ pnpm build-ის შემდეგ მუშაობს.': 'The search index did not load. Locally it only works after pnpm build.',
  'ვერაფერი ვიპოვე. სცადე სიტყვის დასაწყისი — მაგ. „სამკუთხ“.': 'Nothing found. Try the start of a word, e.g. “triang”.',
  'ნაბიჯი': 'Step',
  'ჯერ ჩაწერე პასუხი.': 'Type an answer first.',
  'სწორია! პასუხი:': 'Correct! Answer:',
  'ნაწილი სწორია — შეამოწმე მონიშნული.': 'Partly right: check the marked boxes.',
  'ჯერ არა. სცადე კიდევ ერთხელ ან ნახე მინიშნება.': 'Not yet. Try again or open the hint.',
  'ჩამაგრდა — იპოვი ძიებაში': 'Pinned: you will find it in search',
  'ჩამაგრება მოიხსნა': 'Unpinned',
};

/** The page's language (set on <html lang>). */
export const pageLang = (): Lang => (document.documentElement.lang === 'en' ? 'en' : 'ka');
/** Is a saved site URL (last topic, a pin) in the page's language? */
export const sameLang = (url: string) => url.startsWith('/en/') === (pageLang() === 'en');
/** Client-side translation of a fixed string. */
export const tc = (s: string) => (pageLang() === 'en' ? CLIENT_EN[s] ?? s : s);
