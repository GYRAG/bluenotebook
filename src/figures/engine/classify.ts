// Names the current shape. Quadrilaterals follow the Georgian school convention: a trapezoid
// has exactly one pair of parallel sides, so a parallelogram is never called a trapezoid.
import { angleAt, cross, dist, near, parallel, sub, type V } from './geom';

export interface Verdict { name: string; why: string }

export function classifyTriangle([A, B, C]: readonly V[]): Verdict {
  const s = [dist(B!, C!), dist(C!, A!), dist(A!, B!)];
  const eq = (i: number, j: number) => near(s[i]!, s[j]!);
  const bySides = eq(0, 1) && eq(1, 2) ? 'ტოლგვერდა' : eq(0, 1) || eq(1, 2) || eq(0, 2) ? 'ტოლფერდა' : 'სხვადასხვაგვერდა';
  const angles = [angleAt(B!, A!, C!), angleAt(A!, B!, C!), angleAt(A!, C!, B!)];
  const max = Math.max(...angles);
  const byAngles = near(max, 90) ? 'მართკუთხა' : max > 90 ? 'ბლაგვკუთხა' : 'მახვილკუთხა';
  const why = [bySides === 'სხვადასხვაგვერდა' ? 'გვერდები განსხვავებულია' : bySides === 'ტოლგვერდა' ? 'სამივე გვერდი ტოლია' : 'ორი გვერდი ტოლია',
    byAngles === 'მართკუთხა' ? 'ერთი კუთხე მართია' : byAngles === 'ბლაგვკუთხა' ? 'ერთი კუთხე ბლაგვია' : 'ყველა კუთხე მახვილია'].join(', ');
  return { name: `${bySides} ${byAngles} სამკუთხედი`, why };
}

export function classifyQuad(q: readonly V[]): Verdict {
  const [A, B, C, D] = q as [V, V, V, V];
  const turns = q.map((p, i) => Math.sign(cross(sub(q[(i + 1) % 4]!, p), sub(q[(i + 2) % 4]!, q[(i + 1) % 4]!))));
  if (!turns.every(t => t === turns[0])) return { name: 'ჩაზნექილი ოთხკუთხედი', why: 'ერთი კუთხე 180°-ზე მეტია' };
  const side = [dist(A, B), dist(B, C), dist(C, D), dist(D, A)];
  const p1 = parallel(A, B, D, C), p2 = parallel(B, C, A, D);
  const right = (i: number) => near(angleAt(q[(i + 3) % 4]!, q[i]!, q[(i + 1) % 4]!), 90);
  if (p1 && p2) {
    const r = right(0), h = near(side[0]!, side[1]!);
    if (r && h) return { name: 'კვადრატი', why: 'ყველა გვერდი ტოლია და ყველა კუთხე მართია' };
    if (r) return { name: 'მართკუთხედი', why: 'პარალელოგრამი, რომლის კუთხე მართია' };
    if (h) return { name: 'რომბი', why: 'პარალელოგრამი, რომლის მეზობელი გვერდები ტოლია' };
    return { name: 'პარალელოგრამი', why: 'მოპირდაპირე გვერდები პარალელურია' };
  }
  if (p1 || p2) {
    const legs = p1 ? [side[1]!, side[3]!] : [side[0]!, side[2]!];
    if ([0, 1, 2, 3].some(right)) return { name: 'მართკუთხა ტრაპეცია', why: 'ერთი წყვილი გვერდი პარალელურია და ფერდი ფუძის მართობულია' };
    if (near(legs[0]!, legs[1]!)) return { name: 'ტოლფერდა ტრაპეცია', why: 'ერთი წყვილი გვერდი პარალელურია და ფერდები ტოლია' };
    return { name: 'ტრაპეცია', why: 'მხოლოდ ერთი წყვილი გვერდია პარალელური' };
  }
  return { name: 'ოთხკუთხედი', why: 'პარალელური გვერდები არ აქვს' };
}
