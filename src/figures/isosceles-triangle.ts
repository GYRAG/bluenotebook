import { angleAt, area, circleIntersection, dist, foot, intersect, mid, near, perpendicular, polar, rad, type V } from './engine/geom';
import { figure } from './engine/spec';

// Isosceles ABC with AB = AC = b and apex angle θ at A; at θ = 60° it is equilateral exactly.
export default figure({
  kind: 'ტოლფერდა სამკუთხედი',
  label: 'ტოლფერდა სამკუთხედი ABC, AB = AC',
  params: {
    b: { label: 'ფერდი', sym: 'b', min: 2, max: 5, step: 0.1, value: 4 },
    theta: { label: 'კუთხე წვეროსთან', sym: 'θ', min: 30, max: 150, step: 1, value: 50, unit: '°' },
  },
  points: ({ b, theta }) => {
    const a = 2 * b * Math.sin(rad(theta / 2)), h = b * Math.cos(rad(theta / 2));
    const A: V = [0, h / 2], B: V = [-a / 2, -h / 2], C: V = [a / 2, -h / 2];
    return { A, B, C, H: mid(B, C) };
  },
  drag: { A: ['b'], C: ['b', 'theta'] }, // A only moves up and down: one parameter
  base: 'ABC',
  dims: '|BC|a |AB|b <A <B <C',
  toggles: {
    'სიმაღლე = მედიანა = ბისექტრისა': 'AH <AHC H',
    'აღნიშვნები': 'AB=AC <B=<C',
  },
  classify: 'triangle',
  readouts: ({ A, B, C, H }) => [['a', dist(B, C)], ['h', dist(A, H)], ['P', dist(A, B) + dist(B, C) + dist(C, A)], ['S', area([A, B, C])]],
  checks: {
    'base-angles-equal': ({ A, B, C }) => near(angleAt(A, B, C), angleAt(A, C, B)),
    'three-in-one': ({ A, B, C }) => { // the bisector from A is also the median and the altitude
      const L = bisectorFoot(A, B, C);
      return near(dist(B, L), dist(L, C)) && perpendicular(A, L, B, C);
    },
    'criterion-base-angles': (_, { b, theta }) => { // equal base angles, built from angles only ⇒ equal sides
      const beta = (180 - theta) / 2, B: V = [0, 0], C: V = [b, 0];
      const A = intersect(B, polar(1, beta), C, [b + Math.cos(rad(180 - beta)), Math.sin(rad(180 - beta))]);
      return near(dist(A, B), dist(A, C));
    },
    'criterion-median-altitude': (_, { b, theta }) => { // A on the perpendicular through the midpoint of BC
      const B: V = [-b / 2, 0], C: V = [b / 2, 0], A: V = [0, theta / 30];
      return near(dist(A, B), dist(A, C));
    },
    'equilateral-angles': (_, { b }) => { // three equal sides ⇒ every angle 60°
      const A: V = [0, 0], B: V = [b, 0], C = circleIntersection(A, b, B, b, [b / 2, -1]);
      return [angleAt(B, A, C), angleAt(A, B, C), angleAt(A, C, B)].every(x => near(x, 60));
    },
    'equilateral-height': (_, { b }) => {
      const A: V = [0, 0], B: V = [b, 0], C = circleIntersection(A, b, B, b, [b / 2, -1]);
      return near(dist(C, foot(C, A, B)), (b * Math.sqrt(3)) / 2) && near(area([A, B, C]), (b * b * Math.sqrt(3)) / 4);
    },
  },
});

function bisectorFoot(A: V, B: V, C: V): V { // divides BC in the ratio AB : AC
  const t = dist(A, B) / (dist(A, B) + dist(A, C));
  return [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t];
}
