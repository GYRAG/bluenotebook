import { describe, expect, it } from 'vitest';
import { kaQuery, stemKa } from './ka-search';

describe('Georgian query stemming', () => {
  // every inflected form must start with the stem of the dictionary form
  const forms: Record<string, string[]> = {
    სამკუთხედი: ['სამკუთხედის', 'სამკუთხედში', 'სამკუთხედზე', 'სამკუთხედით', 'სამკუთხედები', 'სამკუთხედების'],
    დიაგონალი: ['დიაგონალის', 'დიაგონალები', 'დიაგონალებს', 'დიაგონალების'],
    ფუძე: ['ფუძის', 'ფუძეზე', 'ფუძეები'],
    მედიანა: ['მედიანის', 'მედიანები', 'მედიანით'],
    ბისექტრისა: ['ბისექტრისის', 'ბისექტრისები'],
    რომბი: ['რომბის', 'რომბში'],
  };
  for (const [word, inflected] of Object.entries(forms)) {
    it(`${word} finds all its forms`, () => {
      const stem = stemKa(word);
      for (const f of inflected) expect(f.startsWith(stem), `${f} vs ${stem}`).toBe(true);
    });
  }

  it('never strips a short word down to nothing', () => {
    expect(stemKa('და')).toBe('და');
    expect(stemKa('ის')).toBe('ის');
  });

  it('leaves Latin and numbers alone, folds Mtavruli', () => {
    expect(kaQuery('S = ab sin')).toBe('s = ab sin');
    expect(kaQuery('ᲠᲝᲛᲑᲘ')).toBe('რომბ');
    expect(kaQuery('  რომბის   დიაგონალები ')).toBe('რომბ დიაგონალ');
  });
});
