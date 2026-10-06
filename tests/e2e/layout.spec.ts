import { expect, test } from '@playwright/test';

// The brief's hard layout rules, at every target size and in both themes:
// the page itself never scrolls (vertically or sideways) and the tools are on screen.
const VIEWPORTS = [
  { name: 'phone-se', width: 375, height: 667 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const PAGES = [['topic', '/geometry/parallelogram/'], ['home', '/'], ['relationships', '/geometry/relationships/'], ['cheatsheet', '/cheatsheet/'], ['text-topic', '/algebra/abs-equations/'], ['sheet', '/sheet/']] as const;

for (const vp of VIEWPORTS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${vp.name} ${theme}: no page scroll, tools in reach`, async ({ page }) => {
      test.setTimeout(90_000); // six pages per test; slower when the whole suite runs in parallel
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript(t => localStorage.setItem('mb:theme', JSON.stringify(t)), theme);
      const errors: string[] = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(e.message));
      for (const [name, url] of PAGES) {
        await page.goto(url);
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => ({
          sh: document.scrollingElement!.scrollHeight, sw: document.scrollingElement!.scrollWidth,
          h: innerHeight, w: innerWidth,
        }));
        expect(m.sh, `${name}: vertical page scroll`).toBeLessThanOrEqual(m.h);
        expect(m.sw, `${name}: horizontal page scroll`).toBeLessThanOrEqual(m.w);
        if (name === 'topic') {
          await expect(page.getByRole('tab', { name: 'ხელსაწყოები' })).toBeInViewport();
          await expect(page.locator('.figure')).toBeInViewport();
        }
        await page.screenshot({ path: `screenshots/${name}-${vp.name}-${theme}.png` });
      }
      expect(errors, 'console errors').toEqual([]);
    });
  }
}

test('theme toggle cycles system → day → night and is remembered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/geometry/parallelogram/');
  const toggle = page.locator('[data-theme-toggle]');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('phone: nav opens as a drawer and closes with Esc', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/geometry/parallelogram/');
  await expect(page.locator('#nav')).toBeHidden();
  await page.getByRole('button', { name: 'თემების სია' }).click();
  await expect(page.locator('#nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#nav')).toBeHidden();
});

test('tabs: click and arrow keys switch panels', async ({ page }) => {
  await page.goto('/geometry/parallelogram/');
  await page.getByRole('tab', { name: 'თვისებები' }).click();
  await expect(page.locator('#tp-props')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tp-formulas')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'ფორმულები' })).toBeFocused();
});

for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`touch targets are at least 44px tall at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize(vp);
    for (const url of ['/', '/geometry/parallelogram/']) {
      await page.goto(url);
      // the grip draws 28px but takes taps over 44px through its ::before
      const small = await page.$$eval('button:not(.grip), summary, .nav a, .toc a, [role=tab]', els => els
        .filter(el => (el as HTMLElement).offsetParent !== null)
        .map(el => ({ el: el.outerHTML.slice(0, 60), h: el.getBoundingClientRect().height }))
        .filter(x => x.h < 44));
      expect(small, url).toEqual([]);
    }
  });
}
