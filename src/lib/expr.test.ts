import { describe, expect, it } from 'vitest';
import { evaluate, matches } from './expr';

describe('answer arithmetic', () => {
  it('reads what a student types', () => {
    const cases: [string, number][] = [
      ['7', 7], ['2,5', 2.5], ['2.5', 2.5], ['-3', -3], ['16/3', 16 / 3], ['16:3', 16 / 3],
      ['4√3', 4 * Math.sqrt(3)], ['4sqrt3', 4 * Math.sqrt(3)], ['√(25+144)', 13], ['8√3/3', (8 * Math.sqrt(3)) / 3],
      ['2π', 2 * Math.PI], ['3(1+2)', 9], ['2^3^2', 512], ['5√5', 5 * Math.sqrt(5)], ['60°', 60], ['1 − 0,5', 0.5],
    ];
    for (const [s, v] of cases) expect(evaluate(s), s).toBeCloseTo(v, 12);
  });

  it('rejects letters and broken input', () => {
    for (const s of ['', 'x', '2+', '(3', '3)', 'AB']) expect(() => evaluate(s), s).toThrow();
  });

  it('takes identifiers from the caller', () => {
    const atom = (s: string, at: number) => (s.startsWith('AB', at) ? { value: 5, end: at + 2 } : null);
    expect(evaluate('2AB+1', atom)).toBe(11);
  });

  it('accepts exact forms and two-decimal rounding, nothing looser', () => {
    expect(matches('4√3', 4 * Math.sqrt(3))).toBe(true);
    expect(matches('6,93', 4 * Math.sqrt(3))).toBe(true);
    expect(matches('6,9', 4 * Math.sqrt(3))).toBe(false);
    expect(matches('abc', 1)).toBe(false);
  });
});
