import { expect, test, type Page } from '@playwright/test';

// The figure end to end: drag, keyboard, sliders, live classifier, side lengths, memory.
const URL = '/geometry/parallelogram/';
const fig = (page: Page) => page.locator('geo-figure');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL);
  await expect(fig(page).locator('.layer polygon.shape')).toHaveCount(1);
});

test('dragging D straight above A makes a rectangle and the stamp says so', async ({ page }) => {
  const stamp = page.locator('.stamp');
  await expect(stamp).toBeHidden(); // a plain parallelogram on the parallelogram page: no stamp
  const A = await page.locator('.layer .vtx').first().boundingBox();
  const D = await page.locator('.handle[data-p="D"]').boundingBox();
  await page.mouse.move(D!.x + D!.width / 2, D!.y + D!.height / 2);
  await page.mouse.down();
  await page.mouse.move(A!.x + A!.width / 2 + 40, D!.y + D!.height / 2 - 30, { steps: 8 });
  await page.mouse.up();
  // α follows the drag; set it exactly with the number box and the classifier must react
  await page.locator('[data-param="alpha"] .num').fill('90');
  await page.locator('[data-param="alpha"] .num').press('Enter');
  await expect(stamp).toBeVisible();
  await expect(stamp.locator('.stamp-v')).toHaveText('მართკუთხედი');
  for (const k of ['a', 'b']) { // b tops out at 4, so make both 4
    await page.locator(`[data-param="${k}"] .num`).fill('4');
    await page.locator(`[data-param="${k}"] .num`).press('Enter');
  }
  await expect(stamp.locator('.stamp-v')).toHaveText('კვადრატი');
});

test('arrow keys nudge a focused vertex', async ({ page }) => {
  await page.locator('.handle[data-p="B"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-param="a"] .num')).toHaveValue('5.4');
});

test('slider moves the figure; values are remembered across reloads', async ({ page }) => {
  const before = await fig(page).locator('.layer polygon.shape').getAttribute('points');
  await page.locator('#r-alpha').fill('120');
  await expect(fig(page).locator('.layer polygon.shape')).not.toHaveAttribute('points', before!);
  await expect(page.locator('[data-param="alpha"] .reset')).toBeVisible();
  await page.waitForTimeout(400); // persistence is debounced
  await page.reload();
  await expect(page.locator('[data-param="alpha"] .num')).toHaveValue('120');
});

test('hovering a side shows its length; switches add overlays', async ({ page }) => {
  const dims = () => fig(page).locator('.layer .dim').count();
  const base = await dims();
  const B = await page.locator('.handle[data-p="B"]').boundingBox();
  const C = await page.locator('.layer .vtx').nth(1).boundingBox();
  await page.mouse.move((B!.x + B!.width / 2 + C!.x + C!.width / 2) / 2, (B!.y + B!.height / 2 + C!.y + C!.height / 2) / 2);
  await expect.poll(dims).toBe(base + 1);
  await page.getByRole('switch', { name: 'დიაგონალები' }).click();
  await expect(fig(page).locator('.layer .extra')).toHaveCount(2);
  await page.getByRole('switch', { name: 'ზომები' }).click();
  await page.mouse.move(5, 5);
  await expect.poll(dims).toBe(0);
});
