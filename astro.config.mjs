import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeGlue from './src/lib/rehype-glue.ts';

// KaTeX is rendered at build time; Astro 7's default markdown processor (satteri) parses
// math but does not render it, so markdown + MDX go through unified with remark-math.
export default defineConfig({
  site: 'https://matematikis-baza.vercel.app',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: {
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, { strict: 'ignore' }], rehypeGlue] }),
  },
  integrations: [mdx()],
});
