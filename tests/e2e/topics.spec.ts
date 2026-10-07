import { expect, test } from '@playwright/test';

// Every topic page in both languages: its figure draws, every proof opens, and nothing logs an error.
for (const home of ['/', '/en/']) test(`all topic pages under ${home} render their figure and proofs without errors`, async ({ page }) => {
  test.setTimeout(420_000); // every proof and every problem of every topic, help stages included
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`${page.url()}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${page.url()}: ${e.message}`));
  await page.goto(home);
  const urls = await page.$$eval('#nav .topics a', as => as.map(a => (a as HTMLAnchorElement).pathname));
  expect(urls.length).toBeGreaterThan(5);
  for (const url of urls) {
    await page.goto(url);
    const fig = page.locator('geo-figure:not([data-alt])');
    if (await fig.count()) await expect(fig.locator('.layer polygon, .layer line').first(), url).toBeAttached();
    const props = await page.$$eval('.prop', ps => ps.map(p => p.id));
    for (const id of props) {
      await page.evaluate(i => { location.hash = i; }, id);
      await expect(page.locator(`#${id} .proof`), `${url}#${id}`).toBeVisible();
      if (await page.locator(`#${id}[data-problem]`).count()) { // a problem's solution comes in stages: hint, first step, all of it
        const help = page.locator(`#${id} [data-help]`);
        while (await help.isVisible()) await help.click();
      }
      const next = page.locator(`#${id} [data-step=next]`);
      while (await next.isEnabled()) await next.click();
      const visible = page.locator('geo-figure:not([hidden])');
      await expect(visible.locator('.layer polygon, .layer line').first(), `${url}#${id}`).toBeAttached();
      await page.keyboard.press('Escape');
    }
  }
  expect(errors).toEqual([]);
});

test('relationships: picking facts names the shape; cheat sheet lists every topic', async ({ page }) => {
  await page.goto('/geometry/relationships/');
  for (const f of ['diagBisect', 'diagPerp']) await page.locator(`[data-fact=${f}]`).click();
  await expect(page.locator('.answer-v')).toHaveText('რომბი');
  await page.locator('[data-shape=square]').first().click();
  await expect(page.locator('[data-for=square]')).toBeVisible();
  await page.goto('/cheatsheet/');
  expect(await page.locator('.cheat-topic').count()).toBeGreaterThanOrEqual(15);
});

test('proof and solution formulas fit a phone screen (shrunk to 80% at most)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const urls = await page.$$eval('#nav .topics a', as => as.map(a => (a as HTMLAnchorElement).pathname));
  const wide: string[] = [];
  for (const url of urls) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    wide.push(...await page.$$eval('.prop', lis => lis.flatMap(li => {
      li.closest<HTMLElement>('[role=tabpanel]')!.hidden = false; // measure every tab's proofs as laid out when open
      li.querySelector<HTMLElement>('.proof')!.hidden = false;
      const sol = li.querySelector<HTMLElement>('.sol');
      if (sol) sol.hidden = false;
      return [...li.querySelectorAll<HTMLElement>('.step-tex')].filter(t => 0.8 * t.scrollWidth > t.clientWidth + 1).map(t => `${location.pathname}#${li.id}: ${t.scrollWidth} > ${t.clientWidth}`);
    })));
  }
  expect(wide).toEqual([]);
});
