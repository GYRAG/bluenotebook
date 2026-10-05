import { describe, expect, it } from 'vitest';
import { deduce, type Fact } from './quad-facts';

const shape = (...f: Fact[]) => deduce(new Set(f)).shape;

describe('what quadrilateral is it', () => {
  it('follows the parallelogram criteria', () => {
    for (const f of ['bothParallel', 'oppSides', 'oppAngles', 'diagBisect'] as Fact[]) expect(shape(f)).toBe('პარალელოგრამი');
    expect(shape('allSides')).toBe('რომბი');
  });
  it('specialises parallelograms', () => {
    expect(shape('diagBisect', 'diagEqual')).toBe('მართკუთხედი');
    expect(shape('bothParallel', 'rightAngle')).toBe('მართკუთხედი');
    expect(shape('diagBisect', 'diagPerp')).toBe('რომბი');
    expect(shape('diagBisect', 'diagEqual', 'diagPerp')).toBe('კვადრატი');
    expect(shape('allSides', 'rightAngle')).toBe('კვადრატი');
  });
  it('handles trapezoids by the Georgian convention', () => {
    expect(shape('oneParallel')).toBe('ტრაპეცია');
    expect(shape('oneParallel', 'legsEqual')).toBe('ტოლფერდა ტრაპეცია');
    expect(shape('oneParallel', 'diagEqual')).toBe('ტოლფერდა ტრაპეცია');
    expect(shape('oneParallel', 'rightAngle')).toBe('მართკუთხა ტრაპეცია');
    expect(deduce(new Set<Fact>(['oneParallel', 'legsEqual', 'rightAngle'])).contradiction).toBe(true);
    expect(deduce(new Set<Fact>(['oneParallel', 'diagBisect'])).contradiction).toBe(true);
  });
  it('never over-claims from facts that prove nothing alone', () => {
    expect(shape('diagEqual')).toBe('ოთხკუთხედი');
    expect(shape('diagPerp')).toBe('ოთხკუთხედი');
    expect(shape('diagEqual', 'diagPerp')).toBe('ოთხკუთხედი');
    expect(shape('rightAngle', 'legsEqual')).toBe('ოთხკუთხედი');
  });
});
