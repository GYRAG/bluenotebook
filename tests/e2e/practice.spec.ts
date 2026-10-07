import { expect, test, type Page } from '@playwright/test';

// The problem the practice session is on: the one the topic page has open.
const current = (page: Page) => page.locator('.prob.open');
async function answer(page: Page) {
  const li = current(page), shown = (await li.locator('.ans').getAttribute('data-shown'))!.split(';');
  const inputs = li.locator('.ans-in');
  for (let i = 0; i < shown.length; i++) await inputs.nth(i).fill(shown[i]!);
  await li.locator('.ans-go').click();
  await expect(li.locator('.ans-msg')).toContainText('სწორია');
}

test('practice: a session of problems across their pages, then the score; home counts what was solved', async ({ page }) => {
  await page.goto('/practice/');
  await page.locator('[data-all]').click(); // none
  await page.locator('.crow', { hasText: 'ოთხკუთხედები' }).click();
  await page.locator('.ov', { hasText: /^5$/ }).click();
  await expect(page.locator('[data-pool]')).toContainText('33');
  await page.getByRole('button', { name: 'დაწყება' }).click();

  const drill = page.locator('[data-drill]'), go = drill.locator('[data-drill-next]');
  await expect(drill.locator('[data-drill-here]')).toHaveText('ვარჯიში 1 / 5');
  await expect(go).toHaveText('გამოტოვება');
  await answer(page);
  await expect(go).toHaveText('შემდეგი');
  await go.click();
  await expect(drill.locator('[data-drill-here]')).toHaveText('ვარჯიში 2 / 5');
  await expect(current(page)).toBeVisible();
  await current(page).locator('[data-help]').click(); // the hint, then solved: counts as solved with help
  await answer(page);
  for (let n = 3; n <= 5; n++) { // skip the rest (each may be on another page)
    await go.click();
    await expect(drill.locator('[data-drill-here]')).toHaveText(`ვარჯიში ${n} / 5`);
  }
  await expect(go).toHaveText('დასრულება');
  await go.click();
  await expect(page).toHaveURL(/\/practice\/$/);
  await expect(page.locator('[data-score]')).toContainText('1 / 5');
  await expect(page.locator('[data-sum]')).toContainText('1 მინიშნებით');
  await expect(page.locator('[data-list] li')).toHaveCount(5);
  await expect(page.locator('[data-log] li')).toHaveCount(1); // the session is in the log
  await expect(page.locator('[data-ct=quadrilaterals]')).toHaveText('2 / 33');
  await expect(page.locator('[data-solved]')).toHaveText('2');

  await page.goto('/');
  await expect(page.locator('[data-solved-all]')).toHaveText('2');
  await expect(page.locator('.chap', { hasText: 'ოთხკუთხედები' }).locator('[data-pcount]')).toHaveText('2 / 33');
});

test('a topic ends with what to read first and the neighbouring topics', async ({ page }) => {
  await page.goto('/geometry/trapezoid/');
  const foot = page.locator('.tfoot');
  await expect(foot.locator('.tf-prev')).toHaveAttribute('href', '/geometry/square/');
  await expect(foot.locator('.tf-next')).toHaveAttribute('href', '/geometry/circle/');
  await expect(foot.locator('.tf-before a').first()).toHaveAttribute('href', '/geometry/quadrilateral/');
  await expect(foot.locator('.tf-map')).toHaveAttribute('href', '/map/#trapezoid');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/ka\/geometry\/trapezoid\.png$/);
  expect((await page.request.get('/og/ka/geometry/trapezoid.png')).ok()).toBe(true);
});

test('the topic map lights up what a topic builds on; the glossary leads to the definition', async ({ page }) => {
  await page.goto('/map/#trapezoid');
  await expect(page.locator('[data-title]')).toHaveText('ტრაპეცია');
  await expect(page.locator('[data-pre] .card')).toHaveCount(3); // quadrilateral, triangle centres, similarity
  await expect(page.locator('.lines path')).toHaveCount(3);
  await page.locator('[data-pre] .card', { hasText: 'ოთხკუთხედი' }).click(); // re-centre on it
  await expect(page.locator('[data-title]')).toHaveText('ოთხკუთხედი');
  await expect(page.locator('[data-post] .card', { hasText: 'ტრაპეცია' })).toBeVisible();
  await expect(page).toHaveURL(/#quadrilateral$/);
  await page.locator('.item[data-id=angles]').click(); // from the list of all topics
  await expect(page.locator('[data-pre]')).toContainText('აქედან შეიძლება დაწყება');

  await page.goto('/glossary/');
  await page.locator('[data-filter]').fill('ქორდ');
  const rows = page.locator('.terms li:not([hidden])');
  await expect(rows).toHaveCount(1);
  await rows.locator('a').click();
  await expect(page).toHaveURL(/\/geometry\/circle\/#definition$/);
  await expect(page.locator('#definition')).toBeInViewport();
});
