// Pagefind has no Georgian stemmer, but it matches word prefixes. Georgian nouns add case
// endings to a stem (სამკუთხედ-ი, სამკუთხედ-ის, სამკუთხედ-ში), so stripping the ending of each
// typed word lets prefix matching find every form of it.
// ponytail: suffix list covers the school cases + plural; a real stemmer if recall ever falls short.
const ENDINGS = [
  'ებისთვის', 'ისთვის', 'ებიდან', 'ებამდე', 'ებით', 'ებში', 'ებზე', 'ების', 'ებად', 'ებმა', 'ებს', 'ები',
  'იდან', 'ამდე', 'ისა', 'ში', 'ზე', 'ით', 'ის', 'ად', 'მა', 'ს', 'ი', 'ა', 'ე', 'ო', 'უ',
];
const MIN_STEM = 3;

// Mtavruli capitals (Ა..Ჿ) → Mkhedruli, so typed or pasted capitals still match.
const mkhedruli = (s: string) =>
  s.replace(/[Ა-Ჿ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x1c90 + 0x10d0));

export function stemKa(word: string): string {
  for (const e of ENDINGS) {
    if (word.endsWith(e) && word.length - e.length >= MIN_STEM) return word.slice(0, -e.length);
  }
  return word;
}

export function kaQuery(input: string): string {
  return mkhedruli(input.toLowerCase())
    .split(/\s+/)
    .filter(Boolean)
    .map(w => (/^[ა-ჿ]+$/.test(w) ? stemKa(w) : w))
    .join(' ');
}
