import { expect, test } from '@playwright/test';

// Georgian search: Pagefind has no Georgian stemmer, so these prove the query stemming
// (src/lib/ka-search.ts) finds inflected forms in the index.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/geometry/parallelogram/');
});

test('"/" opens search; Esc closes it', async ({ page }) => {
  await page.keyboard.press('/');
  await expect(page.locator('#palette')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#palette')).toBeHidden();
});

for (const [typed, expected] of [
  ['სამკუთხედი', 'სამკუთხედი'], // nominative typed, index has სამკუთხედის / სამკუთხედში
  ['დიაგონალი', 'პარალელოგრამი'], // index only has დიაგონალები
  ['პარალელოგრამის', 'პარალელოგრამი'],
] as const) {
  test(`"${typed}" finds ${expected}`, async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.locator('#palette input').fill(typed);
    await expect(page.locator('.pal-res')).toContainText(expected); // found, not necessarily ranked first
  });
}

test('no match shows the empty state', async ({ page }) => {
  await page.keyboard.press('/');
  await page.locator('#palette input').fill('ჰიპერბოლოიდი');
  await expect(page.locator('.pal-status')).toContainText('ვერაფერი ვიპოვე');
});
