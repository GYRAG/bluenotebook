// Build-time registry: every spec in src/figures/*.ts by file name. Server-side only
// (the browser loads one figure lazily in engine/element.ts).
import type { FigureSpec } from './engine/spec';

const mods = import.meta.glob<{ default: FigureSpec }>('./*.ts', { eager: true });
export const FIGURES: Record<string, FigureSpec> = Object.fromEntries(
  Object.entries(mods).filter(([p]) => p !== './registry.ts').map(([p, m]) => [p.slice(2, -3), m.default]),
);
