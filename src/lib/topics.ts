import { getCollection, type CollectionEntry } from 'astro:content';
import { SUBJECTS, SUBJECT_IDS, type SubjectId } from '@/subjects';

export type Topic = CollectionEntry<'topics'>;
export const topicUrl = (t: Topic) => `/${t.data.subject}/${t.id}/`;

export async function allTopics(): Promise<Topic[]> {
  return (await getCollection('topics')).sort((a, b) => a.data.order - b.data.order);
}

/** A subject's sections in registry order, each with its topics; empty sections dropped. */
export function sectionsOf(topics: Topic[], subject: SubjectId) {
  return Object.entries(SUBJECTS[subject].sections)
    .map(([id, label]) => ({ id, label, items: topics.filter(t => t.data.subject === subject && t.data.section === id) }))
    .filter(s => s.items.length);
}

export const subjectsWithContent = (topics: Topic[]) => SUBJECT_IDS.filter(id => topics.some(t => t.data.subject === id));
