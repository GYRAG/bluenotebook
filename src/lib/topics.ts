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
