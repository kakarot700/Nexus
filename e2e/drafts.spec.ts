import { test, expect } from '@playwright/test';

test('draft can be exported, cleared and restored', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What problem are you trying to solve?').fill('Coordinate local volunteer transport');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('nexus-draft.json');
  const content = await (await download.createReadStream()).toArray();
  const data = Buffer.concat(content).toString('utf8');
  expect(JSON.parse(data).problem).toBe('Coordinate local volunteer transport');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear browser draft' }).click();
  await expect(page.getByLabel('What problem are you trying to solve?')).toHaveValue('');
  page.once('dialog', dialog => dialog.accept());
  await page.getByLabel('Choose NEXUS draft JSON').setInputFiles({ name: 'draft.json', mimeType: 'application/json', buffer: Buffer.from(data) });
  await expect(page.getByLabel('What problem are you trying to solve?')).toHaveValue('Coordinate local volunteer transport');
});

test('invalid import does not replace saved draft', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What problem are you trying to solve?').fill('Keep this draft');
  await page.getByLabel('Choose NEXUS draft JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"problem":"not enough fields"}') });
  await expect(page.getByRole('status').filter({ hasText: 'Not a valid NEXUS draft' })).toBeVisible();
  await expect(page.getByLabel('What problem are you trying to solve?')).toHaveValue('Keep this draft');
});
