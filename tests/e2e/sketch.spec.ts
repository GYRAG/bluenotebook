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

test('the paper moves: drag empty space to pan, wheel to zoom, the reset button brings it back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/geometry/rhombus/');
  const fig = page.locator('geo-figure:not([data-alt])'), A = fig.locator('.handle[data-p="B"]');
  const box = (await fig.locator('svg.fig').boundingBox())!;
  const pos = async () => (await A.boundingBox())!;
  const p0 = await pos();
  await page.mouse.move(box.x + 40, box.y + 40); await page.mouse.down(); // empty corner of the paper
  await page.mouse.move(box.x + 140, box.y + 90, { steps: 6 }); await page.mouse.up();
  const p1 = await pos();
  expect(Math.round(p1.x - p0.x)).toBe(100);
  expect(Math.round(p1.y - p0.y)).toBe(50);
  const fit = fig.getByRole('button', { name: 'ხედის დაბრუნება' });
  await expect(fit).toBeVisible();

  const D = fig.locator('.handle[data-p="D"]'), span = async () => (await D.boundingBox())!.x - (await A.boundingBox())!.x;
  const s0 = await span();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400); // zoom in
  await expect.poll(span).not.toBe(s0);
  expect(Math.abs(await span())).toBeGreaterThan(Math.abs(s0));

  await fit.click();
  await expect(fit).toBeHidden();
  expect(Math.round((await pos()).x)).toBe(Math.round(p0.x));
});

test('the blank sheet opens ready to draw', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sheet/');
  const fig = page.locator('geo-figure');
  await expect(fig).toHaveClass(/drawing/);
  const box = (await fig.locator('svg.fig').boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + box.height - 60); await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + box.height - 120, { steps: 8 }); await page.mouse.up();
  await expect(fig.locator('.sketch .sk-ink')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/sheet-phone.png' });
});

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('two fingers pinch to zoom', async ({ page }) => {
    await page.goto('/geometry/rhombus/');
    const fig = page.locator('geo-figure:not([data-alt])');
    const B = fig.locator('.handle[data-p="B"]'), D = fig.locator('.handle[data-p="D"]');
    const span = async () => Math.abs((await D.boundingBox())!.x - (await B.boundingBox())!.x);
    const s0 = await span(), box = (await fig.locator('svg.fig').boundingBox())!;
    const cx = box.x + 40, cy = box.y + 40; // empty paper near the corner
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', d: number) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: type === 'touchEnd' ? [] : [{ x: cx, y: cy, id: 1 }, { x: cx + d, y: cy + d, id: 2 }],
    });
    await touch('touchStart', 30);
    for (let d = 40; d <= 120; d += 10) await touch('touchMove', d);
    await touch('touchEnd', 0);
    await expect.poll(span).toBeGreaterThan(s0 * 1.5);
  });
});

test('shapes from typed sizes, with their measurements', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/sheet/');
  const fig = page.locator('geo-figure'), box = (await fig.locator('svg.fig').boundingBox())!;
  await fig.getByRole('button', { name: 'წრეწირი' }).click();
  await fig.getByText('ზომით').click();
  await fig.getByLabel('რადიუსი').fill('3');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(fig.locator('.sketch circle.sk-ink')).toHaveCount(1);
  await expect(fig.locator('.sketch .sk-val')).toHaveText(['r = 3.0']);

  await fig.getByRole('button', { name: /სამკუთხედი/ }).click();
  for (const [l, v] of [['a', '1'], ['b', '1'], ['c', '5']] as const) await fig.getByLabel(l, { exact: true }).fill(v);
  await page.mouse.click(box.x + 200, box.y + box.height - 150);
  await expect(fig.locator('.sk-note')).toContainText('არ არსებობს');
  await fig.getByLabel('c', { exact: true }).fill('1.5');
  await fig.getByLabel('c', { exact: true }).press('Enter'); // Enter: in the middle of the view
  await expect(fig.locator('.sketch polygon.sk-ink')).toHaveCount(1);
  await expect(fig.locator('.sketch .sk-val')).toHaveText(['r = 3.0', '1.5', '1.0', '1.0']);
  await page.screenshot({ path: 'test-results/sheet-sizes.png' });
});

test('a solid turns when the paper is dragged; the reset button turns it back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/geometry/prism/');
  const fig = page.locator('geo-figure:not([data-alt])'), box = (await fig.locator('svg.fig').boundingBox())!;
  const hidden = () => fig.locator('.layer line.hid').count();
  const svg0 = await fig.locator('.layer').innerHTML();
  await page.mouse.move(box.x + 60, box.y + box.height - 60); await page.mouse.down();
  await page.mouse.move(box.x + 260, box.y + box.height - 20, { steps: 8 }); await page.mouse.up();
  await expect.poll(() => fig.locator('.layer').innerHTML()).not.toBe(svg0);
  expect(await hidden()).toBeGreaterThan(0); // some edges are always behind
  await fig.getByRole('button', { name: 'ხედის დაბრუნება' }).click();
  await expect.poll(() => fig.locator('.layer').innerHTML()).toBe(svg0);
});
