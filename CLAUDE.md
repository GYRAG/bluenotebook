# ლურჯი რვეული (bluenotebook) — notes for AI sessions

A personal Georgian math reference for a high-school student. Static Astro site; all UI and
content in Georgian. This repo is self-contained — ignore `C:\Users\kinkl\AGENTS.md` (another project).

## Commands
- `pnpm dev` (4321) · `pnpm build` (Astro + Pagefind index; search works only after a build) · `pnpm preview`
- `pnpm check` — content linter: Zod frontmatter (`astro sync`) + `src/content/content.test.ts`
- `pnpm test` — Vitest: geometry engine, every figure's numeric checks on 500 random samples, content lint,
  every problem's givens and answer measured on its figure (`src/content/problems.test.ts`)
- `pnpm e2e` — Playwright on a production build at 4322 (system Chrome)
- `pnpm typecheck` — `astro check` (TypeScript pinned to 6; `astro check` rejects 7)
- `pnpm new topic <subject>/<slug> [section]` — draft MDX scaffold

## Rules
- **Never invent theorems or terminology.** Unsure Georgian term → ask the user (one question at a time).
  Uncertain proof → `status: draft`. Every new defined term goes into `src/content/glossary.json`.
- Every `<Property>` on a page with a figure needs a numeric check with the same id in the figure spec
  (`checks`); criteria are checked by building the shape from the hypothesis only. `pnpm check` enforces it.
- Problems are original, modelled on the problem types and difficulty of Topuria's collection (§1–23 of
  its second half); never copy the book's problems word for word (the repo and site are public). The scan is
  `sources/topuria-geometry.pdf` (git-ignored; no text layer — read pages as images; book page = PDF page).
- Phase 2 subjects must stay content-only: a new MDX file (+ a `src/subjects.ts` entry for a new subject).
- Calm, uncluttered UI; the "blue notebook" look (cobalt #2657ff paper, white ink, navy night) is deliberate.
  No neobrutalism, no generic UI kit look. Colours only from `src/styles/tokens.css`.
- The page never scrolls; only the nav and the panel do. Touch targets ≥ 44px. WCAG AA in both themes.
- Commits: plain messages, **no `Co-Authored-By: Claude` trailer** (the owner's request). README: no icons or emoji.
- Terminology follows the school/exam usage (Topuria's textbook): e.g. შუახაზი, ჩახაზული/შემოხაზული წრეწირი.
  The glossary's `avoid` lists catch wrong variants.

## Architecture
- `src/content/topics/<subject>/<slug>.mdx` — topics. MDX imports nothing: the page renders the same
  file twice with different component maps (`formulasView`, `propertiesView`; `cheatView` for /cheatsheet/).
- `<Problems>` / `<Problem>` (the „ამოცანები“ tab): `set` = figure params (exact, not snapped), `given` =
  `lhs=rhs` facts in figure terms (`AB=5`, `<A=60`, `AB-AD=7`, `S(ABCD)`, `P(ABCD)`), `find` + `answer`
  (one value each; `√`, `π`, `2,5` allowed), `k` = problem units per figure unit (default: first given length).
  A find item may be an expression (`BC/AB`); `labels="\sin A"` names its answer box. `prove` instead of find
  makes a proof problem; `book` lists Topuria's problems of the same type.
  Atomic givens label the figure; finds show as "?". Steps are a hidden solution that drives the figure.
  A page with only problems (no Formula/Property/Definition) gets just the problems tab and is left off the cheat sheet.
- `src/content.config.ts` — Zod schema. `src/subjects.ts` — subjects and nav sections.
- `src/figures/<name>.ts` — figure specs (every `.ts` there is a figure; shared helpers live in `engine/`):
  params → named points (constraints by construction); dragging inverts `points` numerically (`engine/solve.ts`).
  Ref grammar in `engine/refs.ts`: `A`, `AB`, `ABC…`, `line:AB`, `ray:AB`, `vec:AB`, `arc:OAB`, `hid:AB`, `<ABC`,
  `<A`, `AB=CD`, `<A=<C`, `AB||CD`, `(OA)`, `|AB|a`. `base` may be a function of the params (regular n-gon).
  Options: `axes` (coordinate axes), `unitPx` (fixed scale, blank sheet), `board` (fixed board).
- `src/figures/engine/solid.ts` — solids: 3D points + faces + circles, projected per view (hidden params
  `yaw`, `pitch`; dragging the paper turns them). Hidden edges and back halves are emitted as `hid:` refs.
  Checks/readouts receive true 3D points. Never use dimension lines (`|AB|`) on solids: they measure 2D.
- `src/figures/engine/sketch.ts` — the pencil (drawing on the grid), stored per figure as `mb:sketch:<name>`.
- `src/figures/engine/element.ts` — `<geo-figure>`; renders in screen pixels (fixed text size), fixed board
  (`bounds.ts`), whole-cell unit. Proof steps call `setScene({ set, show, hl })`.
- `src/scripts/shell.ts` (theme, tabs, sheet, search palette, pins in empty search),
  `src/scripts/topic.ts` (proof stepper, deep links `#property-id`, pins).
- localStorage keys are prefixed `mb:` (`theme`, `last`, `seen`, `solved`, `pins`, `fig:<name>`, `sketch:<name>`, `hint-seen`); every access is guarded.

## Gotchas
- MDX attribute strings take LaTeX with **single** backslashes: `tex="\frac{a}{b}"`. `\\` is a KaTeX line break.
- No math in frontmatter `summary` (it is plain text in meta tags and the lede).
- Georgian suffixes after math (`$O$-ს`) are glued to the formula by `rehype-glue` / `md()`; keep the hyphen.
- Astro 7 needs the unified Markdown processor in `astro.config.mjs` for KaTeX.
- Pagefind has no Georgian stemmer: `src/lib/ka-search.ts` strips case endings before prefix search.
- Topics without a figure get the text layout (`.app.no-figure`) and no tools tab.
- KaTeX is pinned to 0.19 for every package (pnpm override): rehype-katex otherwise pulls 0.16, whose markup
  the 0.19 stylesheet does not style. KaTeX has no Georgian glyphs: Georgian in `\text{}` falls back to the
  browser font — fine for short subscripts (`S_{\text{გვ}}`), but keep words in the prose, not in formulas.
- Shell heredocs on this machine collapse `\\` to `\`: write scripts with the Write tool when they contain LaTeX.

## Milestone routine
Commit per milestone; screenshots at 375×667, 390×844, 768×1024, 1440×900 in light and dark; design critique;
`pnpm check && pnpm test && pnpm typecheck && pnpm e2e`; Lighthouse mobile a11y ≥ 95, perf ≥ 90.
