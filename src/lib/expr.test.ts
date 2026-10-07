import { describe, expect, it } from 'vitest';
import { evaluate, matches, slip } from './expr';

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

  it('reads the number out of what is written around it', () => {
    for (const s of ['x = 5', 'AB=5', '5 სმ', '5cm', '5 cm²', ' 5 m', '5 ერთეული', '≈ 5', '5 ≈ 5,0'])
      expect(matches(s, 5), s).toBe(true);
    for (const s of ['60°', '60º', '60 გრადუსი', '60 degrees', '<A = 60']) expect(matches(s, 60), s).toBe(true);
    expect(matches('4√3 ≈ 6,93', 4 * Math.sqrt(3))).toBe(true);
    expect(matches('4√3 ≈ 7', 4 * Math.sqrt(3))).toBe(true); // the exact form counts
    expect(matches('16÷3', 16 / 3)).toBe(true);
  });

  it('names the common slips', () => {
    const r3 = 4 * Math.sqrt(3);
    const cases: [string, number, boolean, string | null][] = [
      ['4√3', r3, false, null], ['6,9', r3, false, 'close'], ['7', r3, false, 'close'], ['-5', 5, false, 'sign'],
      ['120', 60, true, 'supplement'], ['30', 60, true, 'complement'], ['120', 60, false, 'double'],
      ['10', 5, false, 'double'], ['2,5', 5, false, 'half'], ['5π', 5, false, 'pi'], ['25', 5, false, 'square'],
      ['√5', 5, false, 'root'], ['17', 5, false, null], ['abc', 5, false, 'unreadable'], ['2+', 5, false, 'unreadable'],
    ];
    for (const [s, x, angle, want] of cases) expect(slip(s, x, angle), `${s} for ${x}`).toBe(want);
  });
});
