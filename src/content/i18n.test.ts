// The English topics (topics-en) are translations of the Georgian ones (topics): the same file, the
// same blocks in the same order, the same ids, figure data, givens and answers — only text differs.
import { describe, expect, it } from 'vitest';

const ka = import.meta.glob<string>('./topics/**/*.mdx', { query: '?raw', import: 'default', eager: true });
const en = import.meta.glob<string>('./topics-en/**/*.mdx', { query: '?raw', import: 'default', eager: true });

// what must match: frontmatter except title/summary/tags, and each block's tag with its data attributes
const FM_SKIP = new Set(['title', 'summary', 'tags']);
const DATA = ['id', 'set', 'given', 'find', 'answer', 'prove', 'k', 'show', 'hl', 'figure', 'live', 'proof', 'kind', 'book'];
const decimal = (v: string) => v.replace(/(\d),(\d)/g, '$1.$2');
function skeleton(src: string) {
  const end = src.indexOf('\n---', 3);
  const fm = src.slice(3, end).split('\n').filter(l => /^\w+:/.test(l) && !FM_SKIP.has(l.split(':')[0]!));
  const blocks = [...src.slice(end).matchAll(/<(\/?[A-Z]\w*)((?:[^>"{]|"[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})*?)\/?>/g)].map(m => {
    const attrs = Object.fromEntries([...m[2]!.matchAll(/(\w+)=("[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})/g)].map(a => [a[1]!, a[2]!]));
    const data = m[1] === 'Proof' ? DATA.filter(k => k !== 'given' && k !== 'prove') : DATA; // a proof's given/prove are text
    return [m[1], ...data.filter(k => k in attrs).map(k => `${k}=${decimal(attrs[k]!)}`)].join(' ');
  });
  return { fm, blocks };
}

const enOf = (path: string) => en[path.replace('./topics/', './topics-en/')];

describe('English topics mirror the Georgian ones', () => {
  for (const [path, src] of Object.entries(en)) {
    it(path, () => {
      const orig = ka[path.replace('./topics-en/', './topics/')];
      expect(orig, 'a Georgian original').toBeDefined();
      const a = skeleton(orig!), b = skeleton(src);
      expect(b.fm).toEqual(a.fm);
      expect(b.blocks).toEqual(a.blocks);
      expect(src.match(/[ა-ჿ]/), 'no Georgian left').toBeNull();
    });
  }

  it('every topic is translated', () => {
    expect(Object.keys(ka).filter(p => !enOf(p)), 'missing English: pnpm translate extract <slug>, translate the list, pnpm translate apply <file.json>').toEqual([]);
  });
});
