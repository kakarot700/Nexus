import { test, expect } from '@playwright/test';

test('manual problem-to-decision flow survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What problem are you trying to solve?').fill('Reduce wasted food at neighborhood markets');
  await page.getByLabel('Who is affected?').fill('Market vendors and residents');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByLabel('Evidence you have').fill('Vendors report surplus at closing time');
  await page.getByLabel('What remains unknown?').fill('Actual quantities');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByLabel('Strategy').nth(0).fill('Pickup coordination');
  await page.getByLabel('How would it work?').nth(0).fill('Match surplus to volunteers');
  await page.getByLabel('Strategy').nth(1).fill('Discount shelf');
  await page.getByLabel('How would it work?').nth(1).fill('Mark down surplus food');
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByText(/all criteria are unknown/).first()).toBeVisible();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByLabel('Selected direction').selectOption('a');
  await page.getByRole('button', { name: 'Try this direction' }).click();
  await expect(page.getByText('This illustrates a decision path; it does not validate feasibility or impact.')).toBeVisible();
  await page.getByLabel('Why choose this direction?').fill('It can use volunteers already present');
  await page.reload();
  await page.getByRole('navigation', { name: 'Problem-solving stages' }).getByRole('button', { name: /Prototype & decision/ }).click({ force: true });
  await expect(page.getByLabel('Why choose this direction?')).toHaveValue('It can use volunteers already present');
  await expect(page.getByText('Pickup coordination').first()).toBeVisible();
});

for (const width of [360, 375, 390, 412]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('AI failure preserves manual flow without provider configuration', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What problem are you trying to solve?').fill('Improve access to public services');
  await page.getByRole('navigation', { name: 'Problem-solving stages' }).getByRole('button', { name: /Solutions/ }).click();
  await page.getByRole('button', { name: 'Generate approaches' }).click();
  await expect(page.getByRole('alert')).toContainText('AI is not configured');
  await expect(page.getByLabel('Strategy')).toHaveCount(2);
});
