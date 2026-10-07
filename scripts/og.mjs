// pnpm og — the link-preview images: photographs every card page (src/pages/card/) of the
// production build into public/og/<lang>/…png. Run after `pnpm build`; commit the images, then
// build again so they ship. A topic without an image falls back to the site's card.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const PORT = 4324, base = `http://localhost:${PORT}`;
const pages = readdirSync('dist/card', { recursive: true }).map(f => f.replaceAll('\\', '/'))
  .filter(f => f.endsWith('/index.html')).map(f => f.slice(0, -'/index.html'.length));
if (!pages.length) throw new Error('no card pages in dist/card: run pnpm build first');

const server = spawn('pnpm', ['preview', '--port', String(PORT)], { shell: true, stdio: 'ignore' });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (let i = 0; ; i++) { // wait for the preview server
    try { await page.goto(base); break; } catch { if (i > 60) throw new Error('preview server did not start'); await page.waitForTimeout(500); }
  }
  for (const p of pages) {
    await page.goto(`${base}/card/${p}/`);
    await page.evaluate(() => document.fonts.ready);
    if (await page.locator('geo-figure').count()) await page.locator('geo-figure .layer :is(polygon, line, path, circle)').first().waitFor({ state: 'attached' });
    await page.waitForTimeout(150);
    const out = join('public/og', `${p}.png`);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out });
    console.log('wrote', out);
  }
} finally {
  await browser.close();
  // the server runs under a shell: end the whole process tree, or it keeps this script alive
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill();
}
process.exit(0);
