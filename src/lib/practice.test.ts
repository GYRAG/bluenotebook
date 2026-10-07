import { describe, expect, it } from 'vitest';
import { pick, resultOf, start } from './practice';

describe('practice', () => {
  it('picks n distinct items, or all of them shuffled', () => {
    const pool = [...Array(20).keys()];
    const five = pick(pool, 5);
    expect(new Set(five).size).toBe(5);
    expect(five.every(x => pool.includes(x))).toBe(true);
    expect(pick(pool, 50).sort((a, b) => a - b)).toEqual(pool);
  });

  it('scores a problem by the help taken before it was solved', () => {
    const s = { ...start(['a', 'b', 'c', 'd', 'e'], 0), solved: ['a', 'b', 'c'], used: { b: 1, c: 3, d: 2 } };
    expect(['a', 'b', 'c', 'd', 'e'].map(k => resultOf(s, k))).toEqual(['right', 'helped', 'shown', 'skipped', 'skipped']);
    expect(start([], 20).limit).toBe(1_200_000);
    expect(start([], 0).limit).toBeNull();
  });
});
