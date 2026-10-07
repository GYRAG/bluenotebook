// Strings the browser scripts show (shell.ts, topic.ts). Kept small: every page loads it.
// Keys are the Georgian originals; a missing key shows the Georgian text (the e2e test catches it).
export type Lang = 'ka' | 'en';

export const CLIENT_EN: Record<string, string> = {
  'თემა:': 'Theme:',
  'ავტო': 'Auto',
  'დღე': 'Day',
  'ღამე': 'Night',
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
  // why a wrong answer is wrong (topic.ts)
  'რიცხვები სწორია, მაგრამ სხვა უჯრებშია.': 'The numbers are right, but in the wrong boxes.',
  'პასუხი ვერ წავიკითხე. ჩაწერე რიცხვი: შეიძლება √, π და წილადი.': 'I cannot read that. Type a number: √, π and fractions are fine.',
  'თითქმის! ჩაწერე ზუსტი პასუხი (√, π, წილადი) ან დაამრგვალე მეასედებამდე.': 'Almost! Give the exact answer (√, π, a fraction) or round to hundredths.',
  'შეამოწმე ნიშანი.': 'Check the sign.',
  'ეს მოსაზღვრე კუთხეა: 180°-ს გამოაკელი.': 'That is the adjacent angle: subtract it from 180°.',
  'ეს კუთხე და პასუხი ერთად 90°-ია: 90°-ს გამოაკელი.': 'That angle and the answer add up to 90°: subtract it from 90°.',
  'ორჯერ მეტი გამოგივიდა — ხომ არ იპოვე დიამეტრი რადიუსის ნაცვლად ან მთელი ნახევრის ნაცვლად?': 'Twice the answer: did you find a diameter instead of a radius, or a whole instead of a half?',
  'ორჯერ ნაკლები გამოგივიდა — ხომ არ იპოვე რადიუსი დიამეტრის ნაცვლად ან ნახევარი მთელის ნაცვლად?': 'Half the answer: did you find a radius instead of a diameter, or a half instead of the whole?',
  'შეამოწმე π: პასუხი π-ჯერ განსხვავდება.': 'Check π: the answer is off by a factor of π.',
  'ეს პასუხის კვადრატია — ამოიღე ფესვი.': 'That is the square of the answer: take the square root.',
  'ეს პასუხის ფესვია — ხომ არ დაგავიწყდა კვადრატში აყვანა?': 'That is the square root of the answer: did you forget to square?',
};

/** The page's language (set on <html lang>). */
export const pageLang = (): Lang => (document.documentElement.lang === 'en' ? 'en' : 'ka');
/** Is a saved site URL (last topic, a pin) in the page's language? */
export const sameLang = (url: string) => url.startsWith('/en/') === (pageLang() === 'en');
/** A site path without its language: /en/geometry/x/ → /geometry/x/. */
export const plain = (path: string) => path.replace(/^\/en(?=\/)/, '');
/** A language-free site path in the page's language. */
export const localUrl = (path: string) => (pageLang() === 'en' ? `/en${path}` : path);
/** Client-side translation of a fixed string. */
export const tc = (s: string) => (pageLang() === 'en' ? CLIENT_EN[s] ?? s : s);
