// "Given these facts, what quadrilateral is it?" — the deductions are exactly the criteria
// proved on the topic pages, so every step can name its reason.
export const FACTS = {
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
} as const;
export type Fact = keyof typeof FACTS;

export interface Answer { shape: string; slug?: string; steps: string[]; contradiction?: boolean }

export function deduce(facts: Set<Fact>): Answer {
  const has = (f: Fact) => facts.has(f), steps: string[] = [];
  const pg: Fact[] = (['bothParallel', 'oppSides', 'allSides', 'oppAngles', 'diagBisect'] as Fact[]).filter(has);
  const parallelogram = pg.length > 0;
  if (parallelogram) steps.push(`${FACTS[pg[0]!]} ⇒ პარალელოგრამი`);
  if (has('oneParallel') && parallelogram) {
    return { shape: 'ასეთი ოთხკუთხედი არ არსებობს', steps: [...steps, 'პარალელოგრამს ორივე წყვილი გვერდი პარალელური აქვს — „ზუსტად ერთს“ ეწინააღმდეგება'], contradiction: true };
  }
  if (parallelogram) {
    const rhombus = has('allSides') || has('diagPerp');
    const rectangle = has('rightAngle') || has('diagEqual');
    if (rhombus) steps.push(has('allSides') ? 'ოთხივე გვერდი ტოლია ⇒ რომბი' : 'პარალელოგრამი მართობი დიაგონალებით ⇒ რომბი');
    if (rectangle) steps.push(has('rightAngle') ? 'პარალელოგრამი მართი კუთხით ⇒ მართკუთხედი' : 'პარალელოგრამი ტოლი დიაგონალებით ⇒ მართკუთხედი');
    if (rhombus && rectangle) return { shape: 'კვადრატი', slug: 'square', steps: [...steps, 'რომბიც და მართკუთხედიც ⇒ კვადრატი'] };
    if (rhombus) return { shape: 'რომბი', slug: 'rhombus', steps };
    if (rectangle) return { shape: 'მართკუთხედი', slug: 'rectangle', steps };
    return { shape: 'პარალელოგრამი', slug: 'parallelogram', steps };
  }
  if (has('oneParallel')) {
    steps.push('ზუსტად ერთი წყვილი პარალელური გვერდი ⇒ ტრაპეცია');
    const iso = has('legsEqual') || has('diagEqual'), right = has('rightAngle');
    if (iso && right) {
      return { shape: 'ასეთი ტრაპეცია არ არსებობს', steps: [...steps, 'ტოლფერდა ტრაპეციის ფუძესთან კუთხეები ტოლია; ერთი მართი კუთხე ყველას მართს გახდიდა — ეს მართკუთხედი იქნებოდა'], contradiction: true };
    }
    if (iso) return { shape: 'ტოლფერდა ტრაპეცია', slug: 'trapezoid', steps: [...steps, has('legsEqual') ? 'ფერდები ტოლია ⇒ ტოლფერდა' : 'დიაგონალები ტოლია ⇒ ტოლფერდა'] };
    if (right) return { shape: 'მართკუთხა ტრაპეცია', slug: 'trapezoid', steps: [...steps, 'მართი კუთხე ⇒ მართკუთხა ტრაპეცია'] };
    return { shape: 'ტრაპეცია', slug: 'trapezoid', steps };
  }
  const notEnough = (['diagEqual', 'diagPerp', 'rightAngle', 'legsEqual'] as Fact[]).filter(has);
  return {
    shape: 'ოთხკუთხედი',
    slug: 'quadrilateral',
    steps: notEnough.length
      ? [`${notEnough.map(f => FACTS[f]).join('; ')} — ეს მარტო არაფერს ამტკიცებს (მაგ. ტოლი დიაგონალები ტოლფერდა ტრაპეციასაც აქვს, მართობი — ბევრ სხვა ოთხკუთხედსაც)`]
      : ['აირჩიე ცნობილი ფაქტები'],
  };
}
