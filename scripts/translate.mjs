// pnpm translate extract <slug> [<slug> …]  → prints JSON {slug: [georgian, …]}
// pnpm translate apply <file.json>           → writes src/content/topics-en/<subject>/<slug>.mdx
//
// A segment is a frontmatter value (title, summary, tags), an attribute value, or the text between
// two component tags: whatever contains Georgian letters. Everything else (markup, ids, numbers,
// figure parameters, formulas without Georgian) is copied unchanged, so the English file has exactly
// the Georgian file's structure (src/content/i18n.test.ts checks it). Translate the extracted list
// in order, keep the math as it is, and apply it.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = 'src/content';
const GEO = /[ა-ჿ]/;
const TAG = /<(\/?)([A-Z]\w*)((?:[^>"{]|"[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})*?)(\/?)>/dg;
const ATTR = /(\w+)="([^"]*)"/dg;
const FM_KEYS = ['title', 'summary', 'tags'];

const source = slug => {
  const hits = readdirSync(join(ROOT, 'topics'), { recursive: true }).filter(f => f.replaceAll('\\', '/').split('/').pop() === `${slug}.mdx`);
  if (hits.length !== 1) throw new Error(`no single topic file for ${slug}`);
  return hits[0];
};

// English conventions that need no translation: subscripts in formulas, function names, decimal points.
const normalize = s => s
  .replaceAll('\\text{გვ}', '\\text{lat}').replaceAll('\\text{სრ}', '\\text{tot}')
  .replaceAll('{,}', '.')
  .replaceAll('\\operatorname{tg}', '\\tan').replaceAll('\\operatorname{ctg}', '\\cot')
  .replace(ATTR, (_, k, v) => `${k}="${['answer', 'given', 'find', 'prove', 'labels'].includes(k) ? v.replace(/(\d),(\d)/g, '$1.$2') : v}"`);

// [start, end] of every Georgian segment, in order
function spans(s) {
  const out = [], fmEnd = s.indexOf('\n---', 3) + 4;
  for (const m of s.slice(0, fmEnd).matchAll(/^(\w+):[ \t]*(.*)$/dgm)) {
    if (FM_KEYS.includes(m[1]) && GEO.test(m[2])) out.push(m.indices[2]);
  }
  const text = (a, b) => {
    const t = s.slice(a, b);
    if (GEO.test(t)) out.push([a + t.length - t.trimStart().length, b - (t.length - t.trimEnd().length)]);
  };
  let pos = fmEnd;
  TAG.lastIndex = fmEnd;
  for (let m; (m = TAG.exec(s));) {
    text(pos, m.index);
    const base = m.indices[3][0];
    for (const a of m[3].matchAll(ATTR)) if (GEO.test(a[2])) out.push([base + a.indices[2][0], base + a.indices[2][1]]);
    pos = TAG.lastIndex;
  }
  text(pos, s.length);
  return out;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'extract') {
  const res = {};
  for (const slug of args) {
    const s = normalize(readFileSync(join(ROOT, 'topics', source(slug)), 'utf8'));
    res[slug] = spans(s).map(([a, b]) => s.slice(a, b));
  }
  console.log(JSON.stringify(res, null, 1));
} else if (cmd === 'apply') {
  for (const [slug, en] of Object.entries(JSON.parse(readFileSync(args[0], 'utf8')))) {
    const file = source(slug);
    let s = normalize(readFileSync(join(ROOT, 'topics', file), 'utf8'));
    const sp = spans(s), fmEnd = s.indexOf('\n---', 3);
    if (sp.length !== en.length) throw new Error(`${slug}: ${sp.length} segments, ${en.length} translations`);
    for (const [[a, b], text] of sp.map((p, i) => [p, en[i]]).reverse()) {
      if (GEO.test(text)) throw new Error(`${slug}: Georgian left in "${text.slice(0, 60)}"`);
      if (text.includes('"') && s[a - 1] === '"') throw new Error(`${slug}: a double quote inside an attribute: "${text.slice(0, 60)}"`);
      const yamlSafe = a < fmEnd && !text.startsWith('[') && /: |\s#|^['"&*!|>%@`{-]/.test(text);
      s = s.slice(0, a) + (yamlSafe ? JSON.stringify(text) : text) + s.slice(b);
    }
    const dst = join(ROOT, 'topics-en', file);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, s);
    console.log('wrote', dst);
  }
} else {
  console.error('usage: pnpm translate extract <slug> […] | pnpm translate apply <file.json>');
  process.exit(1);
}
