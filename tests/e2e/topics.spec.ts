import { expect, test } from '@playwright/test';

// Every topic page: its figure draws, every proof opens, and nothing logs an error.
test('all topic pages render their figure and proofs without errors', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`${page.url()}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${page.url()}: ${e.message}`));
  await page.goto('/');
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
      const n = await page.locator(`#${id} .step`).count();
      for (let i = 1; i < n; i++) await page.locator(`#${id} [data-step=next]`).click();
      const visible = page.locator('geo-figure:not([hidden])');
      await expect(visible.locator('.layer polygon, .layer line').first(), `${url}#${id}`).toBeAttached();
      await page.keyboard.press('Escape');
    }
  }
  expect(errors).toEqual([]);
});
