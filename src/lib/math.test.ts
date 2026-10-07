import { expect, it } from 'vitest';
import { md } from './math';

it('keeps a case ending or punctuation after math on the formula’s line', () => {
  expect(md('$x$-ის და $y$.')).toMatch(/^<span class="nw">.*-ის<\/span> და <span class="nw">.*\.<\/span>$/);
  expect(md('a $x$ b')).not.toContain('nw');
});
