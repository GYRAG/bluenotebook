import { expect, test } from '@playwright/test';

// Proof stepper on the figure, deep links, pinned formulas.
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1440, height: 900 }); });

test('a deep link opens the property with its proof; arrows step and drive the figure', async ({ page }) => {
  await page.goto('/geometry/parallelogram/#diagonals-bisect');
  const prop = page.locator('#diagonals-bisect');
  await expect(prop.locator('.proof')).toBeVisible();
  await expect(prop.locator('.count')).toHaveText('1 / 5');
  await expect(page.locator('geo-figure')).toHaveClass(/proving/);
  await expect(page.locator('geo-figure .layer .hl')).toHaveCount(2); // step 1 highlights both diagonals
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(prop.locator('.count')).toHaveText('4 / 5');
  await expect(page.locator('geo-figure .layer .hl-fill')).toHaveCount(2); // the two congruent triangles
  await expect(prop.locator('.step').nth(4)).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(prop.locator('.proof')).toBeHidden();
  await expect(page.locator('geo-figure')).not.toHaveClass(/proving/);
  expect(new URL(page.url()).hash).toBe('');
});

test('a proof can set the figure and the figure comes back afterwards', async ({ page }) => {
  await page.goto('/geometry/parallelogram/');
  await page.getByRole('tab', { name: 'თვისებები' }).click();
  await page.locator('#area-base-height .prop-row').click();
  await expect(page.locator('[data-param="alpha"] .num')).toHaveValue('65'); // the proof shows α = 65°
  await page.locator('#area-base-height [data-proof-close]').click();
  await expect(page.locator('[data-param="alpha"] .num')).toHaveValue('60');
});

test('a formula links to its proof, and pins survive a reload', async ({ page }) => {
  await page.goto('/geometry/parallelogram/');
  await page.getByRole('tab', { name: 'ფორმულები' }).click();
  await expect(page.locator('#area-height .fx-val')).toHaveText('= 12.99');
  const pin = page.locator('#perimeter .pin');
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('tab', { name: 'ფორმულები' }).click();
  await expect(page.locator('#perimeter .pin')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#area-height .fx-proof').click();
  await expect(page.locator('#area-base-height .proof')).toBeVisible();

  // two taps from any page: open search, pick the pin
  await page.goto('/geometry/rhombus/');
  await page.keyboard.press('/');
  const res = page.locator('#palette .pal-res');
  await expect(res.locator('.pal-h').first()).toHaveText('ჩამაგრებული ფორმულები');
  await expect(res.locator('.pal-fx .katex')).toHaveCount(1);
  await expect(res.getByText('ბოლოს ნანახი')).toBeVisible();
  await res.locator('a', { hasText: 'პერიმეტრი' }).click();
  await expect(page).toHaveURL(/\/geometry\/parallelogram\/#perimeter$/);
  await expect(page.locator('#perimeter')).toBeInViewport();
});
