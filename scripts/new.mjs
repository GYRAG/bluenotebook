// pnpm new topic <subject>/<slug> [section]
// Writes a draft MDX file with every block a topic can use. Fill it in, then `pnpm check`.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { SUBJECTS } from '../src/subjects.ts';

const [kind, target, sectionArg] = process.argv.slice(2);
const die = msg => { console.error(msg); process.exit(1); };
if (kind !== 'topic' || !target?.includes('/')) die('usage: pnpm new topic <subject>/<slug> [section]');

const [subject, slug] = target.split('/');
const subj = SUBJECTS[subject];
if (!subj) die(`unknown subject "${subject}". Known: ${Object.keys(SUBJECTS).join(', ')} (add one in src/subjects.ts)`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die(`slug must be lowercase-kebab-case: "${slug}"`);
const sections = Object.keys(subj.sections);
const section = sectionArg ?? sections[0];
if (!sections.includes(section)) die(`unknown section "${section}" for ${subject}. Known: ${sections.join(', ')}`);

const dir = new URL(`../src/content/topics/${subject}/`, import.meta.url);
const file = new URL(`${slug}.mdx`, dir);
if (existsSync(file)) die(`already exists: src/content/topics/${subject}/${slug}.mdx`);
mkdirSync(dir, { recursive: true });
const orders = readdirSync(dir).filter(f => f.endsWith('.mdx'))
  .map(f => +(readFileSync(new URL(f, dir), 'utf8').match(/^order:\s*(\d+)/m)?.[1] ?? 0));
const order = Math.max(0, ...orders) + 1;

writeFileSync(file, `---
title: ${slug}
slug: ${slug}
subject: ${subject}
section: ${section}
order: ${order}
summary: ერთი წინადადება — რას შეიტყობ ამ თემაში. ფორმულები აქ არა, მხოლოდ ტექსტი.
tags: []
prerequisites: []
status: draft
---

<Definition>**ტერმინი** — განმარტება. მათემატიკა: $x^2$. ახალი ტერმინი ჩაამატე glossary.json-ში.</Definition>

<Formulas>
<Formula id="main" name="ფორმულის სახელი" tex="a^2 + b^2 = c^2" proof="main-property" />
</Formulas>

<Properties>

<Property id="main-property" title="თვისების ფორმულირება" why="ერთი წინადადება — რატომ არის ასე.">
<Proof given="$\\ldots$" prove="$\\ldots$">
<Step tex="\\ldots">პირველი ნაბიჯი.</Step>
<Step tex="\\ldots \\quad \\blacksquare">ბოლო ნაბიჯი.</Step>
</Proof>
</Property>

</Properties>

<Remark kind="mistake">გავრცელებული შეცდომა.</Remark>
`);
console.log(`created src/content/topics/${subject}/${slug}.mdx (section ${section}, order ${order}, draft)`);
