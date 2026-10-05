import { expect, test } from '@playwright/test';

// Drawing on the figure's grid: tools, snapping shapes, move, erase, undo, persistence.
test('draw, move, erase and undo sketches on the grid; they survive a reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/geometry/rhombus/');
  const fig = page.locator('geo-figure:not([data-alt])'), ink = fig.locator('.sketch .sk-ink');
  await fig.getByRole('button', { name: 'ხატვა ბადეზე' }).click();
  await expect(fig).toHaveClass(/drawing/);
  await expect(fig.getByRole('button', { name: 'ფანქარი' })).toHaveAttribute('aria-pressed', 'true');

  const box = (await fig.locator('svg.fig').boundingBox())!;
  const at = (fx: number, fy: number) => [box.x + box.width * fx, box.y + box.height * fy] as const;
  const drag = async (a: readonly [number, number], b: readonly [number, number]) => {
    await page.mouse.move(...a); await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 8, a[1] + ((b[1] - a[1]) * i) / 8);
    await page.mouse.up();
  };

  await drag(at(0.1, 0.2), at(0.3, 0.35)); // pencil
  await expect(fig.locator('.sketch polyline.sk-ink')).toHaveCount(1);

  await fig.getByRole('button', { name: 'წრეწირი' }).click();
  await drag(at(0.75, 0.75), at(0.85, 0.75));
  await expect(fig.locator('.sketch circle.sk-ink')).toHaveCount(1);

  await fig.getByRole('button', { name: /სამკუთხედი/ }).click();
  for (const p of [at(0.1, 0.9), at(0.25, 0.9), at(0.17, 0.7)]) await page.mouse.click(...p);
  await expect(fig.locator('.sketch polygon.sk-ink')).toHaveCount(1);
  await expect(ink).toHaveCount(3);
  await page.screenshot({ path: 'test-results/sketch-drawn.png' });

  await fig.getByRole('button', { name: /გაუქმება/ }).click(); // undo the triangle
  await expect(ink).toHaveCount(2);

  await fig.getByRole('button', { name: 'გადატანა' }).click(); // drag the circle by its edge
  const c = await fig.locator('.sketch circle.sk-ink').evaluate(el => [el.getAttribute('cx'), el.getAttribute('r')].map(Number));
  await drag([box.x + c[0]! + c[1]!, at(0.75, 0.75)[1]], [box.x + c[0]! + c[1]! - 120, at(0.75, 0.75)[1] - 60]);
  const cx = await fig.locator('.sketch circle.sk-ink').getAttribute('cx');
  expect(Number(cx)).toBeLessThan(c[0]! - 60);

  await page.reload();
  await expect(fig.locator('.sketch .sk-ink')).toHaveCount(2); // kept per figure

  await fig.getByRole('button', { name: 'ხატვა ბადეზე' }).click();
  await fig.getByRole('button', { name: 'საშლელი' }).click();
  const c2 = await fig.locator('.sketch circle.sk-ink').evaluate(el => [el.getAttribute('cx'), el.getAttribute('cy'), el.getAttribute('r')].map(Number));
  await page.mouse.click(box.x + c2[0]! + c2[2]!, box.y + c2[1]!);
  await expect(ink).toHaveCount(1);

  await fig.getByRole('button', { name: 'ხატვა ბადეზე' }).click(); // off: the figure is draggable again
  await expect(fig).not.toHaveClass(/drawing/);
  await expect(fig.getByRole('toolbar')).toBeHidden();
});
