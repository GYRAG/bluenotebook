import { expect, test, type Page } from '@playwright/test';

// Georgian left on an English page: text nodes (hidden tabs and proofs included) and the
// attributes people hear or see, skipping anything marked lang="ka" (the language switch).
const georgian = (page: Page) => page.evaluate(() => {
  const ka = /[Ⴀ-ჿ]/, out: string[] = [];
  const skip = (el: Element | null) => !!el?.closest('body [lang="ka"], script, style');
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) if (ka.test(n.nodeValue!) && !skip(n.parentElement)) out.push(n.nodeValue!.trim());
  for (const el of document.body.querySelectorAll('[aria-label], [title], [placeholder], [aria-valuetext]')) {
    for (const a of ['aria-label', 'title', 'placeholder', 'aria-valuetext']) {
      const v = el.getAttribute(a);
      if (v && ka.test(v) && !skip(el)) out.push(`${a}=${v}`);
    }
  }
  return [...new Set(out)].map(s => `${location.pathname}: ${s}`);
});

test('English pages have no Georgian text', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  expect((await georgian(page)).length, 'the check finds Georgian at all').toBeGreaterThan(10);
  await page.goto('/en/');
  const urls = await page.$$eval('#nav .topics a', as => as.map(a => (a as HTMLAnchorElement).pathname));
  expect(urls.every(u => u.startsWith('/en/'))).toBe(true);
  const found: string[] = [];
  for (const url of ['/en/', '/en/cheatsheet/', '/en/geometry/relationships/', '/en/sheet/', ...urls]) {
    await page.goto(url);
    const fig = page.locator('geo-figure:not([data-alt])');
    if (await fig.count()) await expect(fig.locator('.layer polygon, .layer line').first(), url).toBeAttached();
    found.push(...await georgian(page));
  }
  expect(found).toEqual([]);
});

test('the language switch opens the same page in the other language', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/geometry/parallelogram/');
  await page.locator('[data-lang-switch]').click();
  await expect(page).toHaveURL(/\/en\/geometry\/parallelogram\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Parallelogram');
  await page.locator('[data-lang-switch]').click();
  await expect(page).toHaveURL(/\/geometry\/parallelogram\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ka');
});
