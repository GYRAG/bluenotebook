import { getCollection, type CollectionEntry } from 'astro:content';
import { SUBJECTS, SUBJECT_IDS, type SubjectId } from '@/subjects';
import { localize, t, type Lang } from '@/i18n';

export type Topic = CollectionEntry<'topics'>; // the English collection has the same schema
export const topicUrl = (tp: Topic, lang: Lang = 'ka') => localize(lang, `/${tp.data.subject}/${tp.id}/`);

export async function allTopics(lang: Lang = 'ka'): Promise<Topic[]> {
  const list = (lang === 'en' ? await getCollection('topicsEn') : await getCollection('topics')) as Topic[];
  return list.sort((a, b) => a.data.order - b.data.order);
}

/** A subject's sections in registry order, each with its topics; empty sections dropped. */
export function sectionsOf(topics: Topic[], subject: SubjectId, lang: Lang = 'ka') {
  return Object.entries(SUBJECTS[subject].sections)
    .map(([id, label]) => ({ id, label: t(lang, label), items: topics.filter(tp => tp.data.subject === subject && tp.data.section === id) }))
    .filter(s => s.items.length);
}

export const subjectsWithContent = (topics: Topic[]) => SUBJECT_IDS.filter(id => topics.some(tp => tp.data.subject === id));

/** Every topic in reading order: subjects, then their sections, as the nav lists them. */
export const readingOrder = (topics: Topic[]) => subjectsWithContent(topics).flatMap(sub => sectionsOf(topics, sub).flatMap(s => s.items));

/** Every problem: `key` is language-free (the solved list and practice use it), `n` its number on the page. */
export interface ProblemRef { key: string; url: string; topic: string; section: string; n: number; calc: boolean }
const PROBLEM = /<Problem\s((?:[^>"{]|"[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})*?)\/?>/g;
export const problemsOf = (topics: Topic[], lang: Lang = 'ka'): ProblemRef[] => topics.flatMap(tp =>
  [...(tp.body ?? '').matchAll(PROBLEM)].map((m, i) => {
    const id = /(?:^|\s)id="([^"]*)"/.exec(m[1]!)![1]!;
    return { key: `${topicUrl(tp)}#${id}`, url: `${topicUrl(tp, lang)}#${id}`, topic: tp.data.title, section: tp.data.section, n: i + 1, calc: /\sfind="/.test(m[1]!) };
  }));
