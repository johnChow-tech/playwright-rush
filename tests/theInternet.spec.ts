import test, { expect } from '@playwright/test';
import { describe } from 'node:test';

const DOMAIN = 'https://the-internet.herokuapp.com';

test('A/B Testing', async ({ page }) => {
  await page.goto(`${DOMAIN}/abtest`);
  const heading = page.getByRole('heading');
  await expect(heading).toHaveCount(1);
  const reg = new RegExp('A/B');
  await expect(heading).toHaveText(reg);
});

test('Add/Remove Elements', async ({ page }) => {
  await page.goto(`${DOMAIN}/add_remove_elements/`);
  await expect(page.getByRole('heading', { name: 'Add/Remove Elements' })).toBeVisible();

  const addBtn = page.getByRole('button', { name: 'Add Element' });
  await expect(addBtn).toHaveCount(1);
  const deleteBtn = page.getByRole('button', { name: 'Delete' });
  await expect(deleteBtn).toHaveCount(0);

  const addTimes = 10;
  for (let i = 1; i <= addTimes; i++) {
    await addBtn.click();
  }
  await expect(deleteBtn).toHaveCount(addTimes);

  for (let i = addTimes - 1; i >= 0; i--) {
    await deleteBtn.first().click();
  }
  await expect(deleteBtn).toHaveCount(0);
});

test('Status Code (200)', async ({ page }) => {
  const responsePromise = page.waitForResponse((response) => response.url().includes('200'));
  page.goto(`${DOMAIN}/status_codes/200`);
  await expect(page.getByRole('heading', { name: 'Status Codes' })).toBeVisible();

  const reg = new RegExp('200');
  await expect(page.getByRole('paragraph')).toHaveText(reg);

  // const response = responsePromise;
});
