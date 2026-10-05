import katex from 'katex';

// Build-time KaTeX for strings that live in component props (titles, given/prove, formula
// cards). Bad TeX fails the build instead of shipping a red error.
export const tex = (src: string, display = false) =>
  katex.renderToString(src, { displayMode: display, throwOnError: true, strict: 'ignore' });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain text with $inline math$. A Georgian case suffix after math ($O$-ს) stays on its line. */
export function md(s = ''): string {
  return s.split(/(\$[^$]+\$(?:-[\u10D0-\u10FF]+)?)/).map((part, i) => {
    if (i % 2 === 0) return esc(part);
    const [, math, suffix] = part.match(/^\$([^$]+)\$(-[\u10D0-\u10FF]+)?$/)!;
    return suffix ? `<span class="nw">${tex(math!)}${suffix}</span>` : tex(math!);
  }).join('');
}
