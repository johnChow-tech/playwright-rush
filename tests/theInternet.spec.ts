import test, { Dialog, expect } from '@playwright/test';
import path from 'node:path';

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
  await page.goto(`${DOMAIN}/status_codes/200`);
  await expect(page.getByRole('heading', { name: 'Status Codes' })).toBeVisible();

  const reg = new RegExp('200');
  await expect(page.getByRole('paragraph')).toHaveText(reg);

  // const response = responsePromise;
});

test('Checkboxes', async ({ page }) => {
  await page.goto(`${DOMAIN}/checkboxes`);
  const checkboxesList = await page.getByRole('checkbox').all();
  for (const checkbox of checkboxesList) {
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();

    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }
});

test('Hovers', async ({ page }) => {
  const hoversUrl = `${DOMAIN}/hovers`;
  await page.goto(hoversUrl);
  await expect(page.getByRole('heading', { name: 'Hovers' })).toBeVisible();

  const avatarCount = await page.locator('.figure').count();
  for (let i = 0; i < avatarCount; i++) {
    const avatar = page.locator('.figure').nth(i);
    await avatar.hover();

    const userName = avatar.getByRole('heading', { name: /name: user/i });

    const userNameText = await userName.textContent();
    // console.log(userNameText);
    const userId = userNameText?.split('user')[1];
    // console.log(userId);

    const profileLink = avatar.getByRole('link', { name: 'View profile' });

    await expect(userName).toBeVisible();
    await expect(profileLink).toBeVisible();

    await profileLink.click();

    const reg = new RegExp(`users/${userId}`);
    await expect(page).toHaveURL(reg);

    await expect(page.getByRole('heading', { name: 'Not Found' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(hoversUrl);
  }
});

test('Disappearing Elements', async ({ page }) => {
  await page.goto(`${DOMAIN}/disappearing_elements`);

  const MAX_RETRIES = 10;
  let retryCount = 0;
  while (true) {
    if (retryCount >= MAX_RETRIES) {
      break;
    }
    if ((await page.getByRole('link', { name: 'Gallery' }).count()) !== 0) {
      console.log('Link:Gallery found!');
      break;
    }
    await page.reload();
    retryCount++;
  }
});

// 弹窗拦截！
async function handleContextMenuDialog(dialog: Dialog) {
  console.log(`[Dialog] Message: ${dialog.message()}, Type: ${dialog.type()}`);
  await dialog.accept();
}
test('Context Menu', async ({ page }) => {
  await page.goto(`${DOMAIN}/context_menu`);
  const menu = page.locator('#hot-spot');
  page.on('dialog', async (dialog) => {
    handleContextMenuDialog(dialog);
  });
  await menu.click({ button: 'right' });
});

/**
 * 文件上传
 */
test.describe('File Upload', () => {
  const TEST_FILE_NAME = 'random_data.txt';
  const TEST_FILE_PATH = path.join(__dirname, `test-data/${TEST_FILE_NAME}`);

  test.beforeEach(async ({ page }) => {
    console.log(`[[INFO]] goto: ${DOMAIN}/upload`);
    await page.goto(`${DOMAIN}/upload`);
  });

  /**
   * 原生<input type="file">标签
   */
  test('Filechooser via vanilla html tag', async ({ page }) => {
    // 动态拼接出 test.pdf 的完整路径 (相对于当前测试脚本所在的目录)
    await page.locator('#file-upload').setInputFiles(TEST_FILE_PATH);

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.getByRole('heading', { name: 'File Uploaded!' });
    await expect(page.locator('#uploaded-files')).toHaveText('random_data.txt');
  });

  /**
   * 测试js唤起的文件选择器：waitForEvent('filechooser')
   */
  test('Filechooser via js (triggered by click)', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    const uploadZone = page.locator('#drag-drop-upload');
    await uploadZone.click();

    const filechooser = await fileChooserPromise;
    await filechooser.setFiles(TEST_FILE_PATH);
    const reg = new RegExp(TEST_FILE_NAME);
    await expect(uploadZone).toHaveText(reg);
  });

  /**
   * 测试拖拽：直接模拟拖拽的底层原理，即向拖拽区域的隐藏<input type="file">塞文件进去
   */
  test('Filechooser via js (triggered by drag)', async ({ page }) => {
    const dropZone = page.locator('#drag-drop-upload');
    const hiddenInput = page.locator('.dz-hidden-input');

    await hiddenInput.setInputFiles(TEST_FILE_PATH);
    const reg = new RegExp(TEST_FILE_NAME);
    await expect(dropZone).toHaveText(reg);
  });
});
