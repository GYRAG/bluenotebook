// A practice session (/practice/): problems picked at random, worked through on their own topic
// pages one by one, then scored. Kept in localStorage as mb:practice; problems are named by their
// language-free key, "/geometry/trapezoid/#p-trap-perimeter", like the solved list.
import { load, save } from './store';

export interface Session {
  items: string[];
  i: number; // the problem being worked on
  start: number;
  limit: number | null; // ms, or no time limit
  end?: number;
  solved: string[];
  used: Record<string, number>; // help taken before solving: 1 hint, 2 first step, 3 the whole solution
  tries: Record<string, number>; // wrong answers
}
export type Result = 'right' | 'helped' | 'shown' | 'skipped';

export const session = () => load<Session | null>('practice', null);
export const store = (s: Session | null) => save('practice', s);

export function start(items: string[], limitMin: number): Session {
  return { items, i: 0, start: Date.now(), limit: limitMin ? limitMin * 60_000 : null, solved: [], used: {}, tries: {} };
}

export function resultOf(s: Session, key: string): Result {
  const used = s.used[key] ?? 0;
  if (used >= 3) return 'shown';
  if (s.solved.includes(key)) return used ? 'helped' : 'right';
  return 'skipped';
}

/** n items at random (all of them, shuffled, when there are fewer). */
export function pick<T>(pool: T[], n: number, rnd = Math.random): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}
