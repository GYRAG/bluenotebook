// "Given these facts, what quadrilateral is it?" — the deductions are exactly the criteria
// proved on the topic pages, so every step can name its reason. Texts in both languages.
import type { Lang } from '@/i18n/client';

export const FACTS = {
  ka: {
    bothParallel: 'ორივე წყვილი მოპირდაპირე გვერდი პარალელურია',
    oneParallel: 'ზუსტად ერთი წყვილი მოპირდაპირე გვერდია პარალელური',
    oppSides: 'მოპირდაპირე გვერდები წყვილ-წყვილად ტოლია',
    allSides: 'ოთხივე გვერდი ტოლია',
    oppAngles: 'მოპირდაპირე კუთხეები წყვილ-წყვილად ტოლია',
    rightAngle: 'ერთი კუთხე მართია',
    diagBisect: 'დიაგონალები ერთმანეთს შუაზე ყოფს',
    diagEqual: 'დიაგონალები ტოლია',
    diagPerp: 'დიაგონალები ურთიერთმართობია',
    legsEqual: 'არაპარალელური გვერდები (ფერდები) ტოლია',
  },
  en: {
    bothParallel: 'both pairs of opposite sides are parallel',
    oneParallel: 'exactly one pair of opposite sides is parallel',
    oppSides: 'both pairs of opposite sides are equal',
    allSides: 'all four sides are equal',
    oppAngles: 'both pairs of opposite angles are equal',
    rightAngle: 'one angle is right',
    diagBisect: 'the diagonals bisect each other',
    diagEqual: 'the diagonals are equal',
    diagPerp: 'the diagonals are perpendicular',
    legsEqual: 'the non-parallel sides (legs) are equal',
  },
} as const;
export type Fact = keyof typeof FACTS.ka;

const T = {
  ka: {
    parallelogram: 'პარალელოგრამი', rhombus: 'რომბი', rectangle: 'მართკუთხედი', square: 'კვადრატი', trapezoid: 'ტრაპეცია',
    isoTrapezoid: 'ტოლფერდა ტრაპეცია', rightTrapezoid: 'მართკუთხა ტრაპეცია', quadrilateral: 'ოთხკუთხედი',
    noQuad: 'ასეთი ოთხკუთხედი არ არსებობს', noTrapezoid: 'ასეთი ტრაპეცია არ არსებობს',
    oneVsBoth: 'პარალელოგრამს ორივე წყვილი გვერდი პარალელური აქვს — „ზუსტად ერთს“ ეწინააღმდეგება',
    allSidesRhombus: 'ოთხივე გვერდი ტოლია ⇒ რომბი', perpRhombus: 'პარალელოგრამი მართობი დიაგონალებით ⇒ რომბი',
    rightRect: 'პარალელოგრამი მართი კუთხით ⇒ მართკუთხედი', equalRect: 'პარალელოგრამი ტოლი დიაგონალებით ⇒ მართკუთხედი',
    bothSquare: 'რომბიც და მართკუთხედიც ⇒ კვადრატი', oneTrapezoid: 'ზუსტად ერთი წყვილი პარალელური გვერდი ⇒ ტრაპეცია',
    isoRight: 'ტოლფერდა ტრაპეციის ფუძესთან კუთხეები ტოლია; ერთი მართი კუთხე ყველას მართს გახდიდა — ეს მართკუთხედი იქნებოდა',
    legsIso: 'ფერდები ტოლია ⇒ ტოლფერდა', diagIso: 'დიაგონალები ტოლია ⇒ ტოლფერდა', rightRightTrap: 'მართი კუთხე ⇒ მართკუთხა ტრაპეცია',
    proveNothing: 'ეს მარტო არაფერს ამტკიცებს (მაგ. ტოლი დიაგონალები ტოლფერდა ტრაპეციასაც აქვს, მართობი — ბევრ სხვა ოთხკუთხედსაც)',
    pick: 'აირჩიე ცნობილი ფაქტები',
  },
  en: {
    parallelogram: 'parallelogram', rhombus: 'rhombus', rectangle: 'rectangle', square: 'square', trapezoid: 'trapezoid',
    isoTrapezoid: 'isosceles trapezoid', rightTrapezoid: 'right trapezoid', quadrilateral: 'quadrilateral',
    noQuad: 'no such quadrilateral', noTrapezoid: 'no such trapezoid',
    oneVsBoth: 'a parallelogram has both pairs of sides parallel, which contradicts “exactly one”',
    allSidesRhombus: 'all four sides are equal ⇒ rhombus', perpRhombus: 'a parallelogram with perpendicular diagonals ⇒ rhombus',
    rightRect: 'a parallelogram with a right angle ⇒ rectangle', equalRect: 'a parallelogram with equal diagonals ⇒ rectangle',
    bothSquare: 'both a rhombus and a rectangle ⇒ square', oneTrapezoid: 'exactly one pair of parallel sides ⇒ trapezoid',
    isoRight: 'an isosceles trapezoid has equal base angles; one right angle would make them all right, and that is a rectangle',
    legsIso: 'the legs are equal ⇒ isosceles', diagIso: 'the diagonals are equal ⇒ isosceles', rightRightTrap: 'a right angle ⇒ right trapezoid',
    proveNothing: 'this alone proves nothing (equal diagonals also belong to an isosceles trapezoid; perpendicular ones to many other quadrilaterals)',
    pick: 'choose the facts you know',
  },
} as const;

export interface Answer { shape: string; slug?: string; steps: string[]; contradiction?: boolean }

export function deduce(facts: Set<Fact>, lang: Lang = 'ka'): Answer {
  const F = FACTS[lang], X = T[lang];
  const has = (f: Fact) => facts.has(f), steps: string[] = [];
  const pg: Fact[] = (['bothParallel', 'oppSides', 'allSides', 'oppAngles', 'diagBisect'] as Fact[]).filter(has);
  const parallelogram = pg.length > 0;
  if (parallelogram) steps.push(`${F[pg[0]!]} ⇒ ${X.parallelogram}`);
  if (has('oneParallel') && parallelogram) return { shape: X.noQuad, steps: [...steps, X.oneVsBoth], contradiction: true };
  if (parallelogram) {
    const rhombus = has('allSides') || has('diagPerp');
    const rectangle = has('rightAngle') || has('diagEqual');
    if (rhombus) steps.push(has('allSides') ? X.allSidesRhombus : X.perpRhombus);
    if (rectangle) steps.push(has('rightAngle') ? X.rightRect : X.equalRect);
    if (rhombus && rectangle) return { shape: X.square, slug: 'square', steps: [...steps, X.bothSquare] };
    if (rhombus) return { shape: X.rhombus, slug: 'rhombus', steps };
    if (rectangle) return { shape: X.rectangle, slug: 'rectangle', steps };
    return { shape: X.parallelogram, slug: 'parallelogram', steps };
  }
  if (has('oneParallel')) {
    steps.push(X.oneTrapezoid);
    const iso = has('legsEqual') || has('diagEqual'), right = has('rightAngle');
    if (iso && right) return { shape: X.noTrapezoid, steps: [...steps, X.isoRight], contradiction: true };
    if (iso) return { shape: X.isoTrapezoid, slug: 'trapezoid', steps: [...steps, has('legsEqual') ? X.legsIso : X.diagIso] };
    if (right) return { shape: X.rightTrapezoid, slug: 'trapezoid', steps: [...steps, X.rightRightTrap] };
    return { shape: X.trapezoid, slug: 'trapezoid', steps };
  }
  const notEnough = (['diagEqual', 'diagPerp', 'rightAngle', 'legsEqual'] as Fact[]).filter(has);
  return {
    shape: X.quadrilateral,
    slug: 'quadrilateral',
    steps: notEnough.length ? [`${notEnough.map(f => F[f]).join('; ')} — ${X.proveNothing}`] : [X.pick],
  };
}
