import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SUBJECTS, SUBJECT_IDS } from './subjects';

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase-kebab-case');

const topics = defineCollection({
  loader: glob({ base: './src/content/topics', pattern: '**/*.mdx' }),
  schema: z.strictObject({
    title: z.string().min(1),
    slug, // becomes the entry id; must match the file name and be unique site-wide (pnpm check)
    subject: z.enum(SUBJECT_IDS),
    section: z.string(), // a key of SUBJECTS[subject].sections
    order: z.number().int().nonnegative(),
    summary: z.string().min(1).max(160),
    tags: z.array(z.string()).default([]),
    prerequisites: z.array(slug).default([]),
    status: z.enum(['draft', 'done']),
    level: z.enum(['school', 'olympiad']).default('school'),
    figure: z.string().optional(), // a spec in src/figures/
    figures: z.array(z.string()).default([]), // extra figures that some proofs switch to (<Proof figure="…">)
    parent: slug.optional(), // "is a" link for the definition breadcrumb and the hierarchy page
  }).refine(t => t.section in SUBJECTS[t.subject].sections, {
    message: 'section must be one of the subject\'s sections in src/subjects.ts',
    path: ['section'],
  }),
});

export const collections = { topics };
