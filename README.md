# მათემატიკის ბაზა

A personal math reference in Georgian: definitions, formulas, properties and step-by-step proofs, with
interactive figures you can drag. Built for one high-school student; geometry first, other subjects added
as plain content files.

- Interactive figures: drag vertices, sliders, live measurements, a stamp when the shape becomes special
  (e.g. a parallelogram turns into a rhombus).
- Proofs play on the figure step by step (← / →); every property has a deep link (`/geometry/rhombus/#diagonals-perpendicular`).
- Search (`/` or Ctrl+K) with Georgian word-ending handling; pinned formulas (★) show in the empty search.
- Cheat sheet, shape-relationship page, one-page print per topic, light/dark themes.

## Stack
Astro (static) + MDX + TypeScript strict, KaTeX at build time, Pagefind search, self-hosted Noto fonts,
a small custom SVG geometry engine (no JSXGraph: ~259 KB gzipped). Vitest + Playwright. pnpm.

## Run
```bash
pnpm install
pnpm dev          # http://localhost:4321 (search needs a build)
pnpm build        # dist/ + Pagefind index
pnpm preview
```

## Quality gates
```bash
pnpm check        # frontmatter schema + content lint (links, prerequisites, glossary, proof ↔ figure)
pnpm test         # engine + every figure's numeric property checks on random shapes
pnpm typecheck
pnpm e2e          # Playwright on a production build, 4 viewports × 2 themes
```

## Adding content
```bash
pnpm new topic algebra/quadratic-equations equations
```
creates `src/content/topics/algebra/quadratic-equations.mdx` as a draft with every available block.
Fill it in, run `pnpm check`, then `pnpm dev`. A new subject is one entry in `src/subjects.ts`.
The day-to-day guide (in Georgian) is [docs/guide-ka.md](docs/guide-ka.md); repo conventions are in
[CLAUDE.md](CLAUDE.md).

Topics with a figure reference a spec in `src/figures/` (`figure: rhombus`); each `<Property>` id must have a
numeric check in that spec, which `pnpm check` enforces.

## Deploy (Vercel)
1. Push the repo to GitHub and import it in Vercel. Framework preset: Astro (detected).
2. Build command `pnpm build`, output directory `dist` (both set in `vercel.json`).
3. Vercel picks pnpm from `packageManager` in `package.json`. If the build complains about the pnpm
   version, set the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1`.
4. Set `site` in `astro.config.mjs` to the final domain.

No server code, no environment variables, no analytics.
