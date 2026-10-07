# Content plan — geometry (exam scope = Topuria's contents, §1–34)

Status key: ✓ covered · ◐ partly · ✗ missing. Every new property gets a proof and a numeric check.

## Coverage map

| Topuria § | Topic | Site |
| --- | --- | --- |
| 1 | basic notions, axioms | ✗ (low value; fold a short page into angles) |
| 2 | angles | ✓ angles |
| 3 | congruence criteria, triangle elements | ✓ congruence, triangle |
| 4 | parallel lines criteria | ✓ angles |
| 5 | angle sum, isosceles triangle, sides ↔ angles | ✓ triangle, isosceles-triangle |
| 6 | right-triangle congruence, distance point → line | ◐ congruence; distance missing |
| 7 | perpendicular bisector, bisector property | ◐ triangle-centers; loci missing |
| 8 | circle, circumcircle, incircle | ◐ triangle-centers; circle itself missing |
| 9 | central and inscribed angles | ✗ |
| 10 | tangent–chord angle, angles inside/outside a circle | ✗ |
| 11 | polygons | ✗ |
| 12 | quadrilaterals, Thales, midlines, trapezoid, inscribed/circumscribed | ✓ (Thales ✗) |
| 13–14 | transformations, homothety | ✗ |
| 15 | similarity | ✓ similarity |
| 16 | Pythagoras | ✓ right-triangle |
| 17 | sin/cos/tan in a right triangle | ✗ |
| 18–19 | laws of sines and cosines, solving triangles | ✓ sine-cosine-laws (solving cases ◐) |
| 20 | areas | ✓ triangle-area + quadrilateral pages |
| 21 | regular polygons | ✗ |
| 22 | circumference, circle area | ✗ |
| 23 | coordinates: midpoint, distance, circle equation | ✗ |
| 24 | constructions | ✗ (low priority) |
| 25–34 | stereometry | ✗ (needs a 3D figure engine) |
| 30 | vectors | ✗ (plane first, then space) |

## Order of work

**C1 — niche formulas on existing pages** ✓ done
- Trapezoid: segment joining diagonal midpoints (a − b)/2; isosceles: leg projection (a − b)/2, diagonal
  projection (a + b)/2; perpendicular diagonals ⇒ h = (a + b)/2, S = h²; S_AOB = S_COD, S_AOB² = S_AOD·S_BOC;
  tangential: h = 2r, isosceles tangential h² = ab; leg-angle bisectors meet at 90° on the midline.
- Parallelogram: bisector cuts off an isosceles triangle; adjacent bisectors ⊥; diagonals make 4 equal areas;
  S = ½ d₁d₂ sin φ.
- Triangle: median length, bisector length, h_a = 2S/a, medians make 6 equal areas, ∠BIC = 90° + A/2,
  ∠BHC = 180° − A, Stewart.
- Right triangle: r = (a + b − c)/2, R = c/2, h = ab/c, h² = pq. Equilateral: R = 2r = a/√3.

**C2 — circle (section „წრეწირი“)** ✓ done (4 topics + Stewart added to C1): circle, chord, tangent · central and inscribed angles · angles between
chords/secants/tangents + chord·chord, secant·secant, tangent² · circumference, arc, sector, segment, two circles.

**C3** ✓ done — polygons, regular polygons, right-triangle trigonometry (§17), Thales and proportional segments,
distance and loci (§6–7), solving triangles (§19 cases).

**C4** ✓ done — coordinates (§23) and vectors (§30, plane).

**C5** ✓ done — transformations (§13–14): symmetry, rotation, translation, homothety.

**C6** ✓ done — stereometry: extend the engine to 3D points + projection, drag to rotate; then lines/planes,
three perpendiculars, angles, projection area S′ = S cos φ, prism, parallelepiped, pyramid, cylinder, cone,
sphere, areas and volumes.

**C7** — problems („ამოცანები“ tab): original problems of the types in Topuria's collection, answers typed and
checked, a hint, a step-by-step solution on the figure; every given and answer verified by `problems.test.ts`.
◐ engine done; each problem names the book problems of its type („წიგნში: 6.23“); proof problems (`prove`) too.
Batches (book problem sections → site topics):
1. ✓ §1–4 → angles, congruence, perpendicular bisector, triangle, isosceles triangle (29) + parallelogram pilot (7)
2. ✓ §5 → circle, inscribed angle, circle angles, triangle centres (circum/incircle radii) (19)
3. ✓ §6 → quadrilateral (incl. cyclic, tangential), rectangle, rhombus, square, trapezoid, Thales, triangle midline (30)
4. ✓ §7–9 → similarity, right triangle (incl. §4's right-triangle angle problems), trigonometry, sine/cosine laws, medians and bisectors (25)
5. ✓ §10–11 → triangle area, quadrilateral areas, polygons, regular polygons, arcs, sectors, segments (21)
6. ✓ §13 + §5 touching circles → „სხვადასხვა ამოცანები“ page (section `mixed`), figures tangent-circles and concentric (12)
7. §14–23 → stereometry (needs 3D measuring in problems.test.ts)
