import test, { Dialog, expect, request } from '@playwright/test';
import path from 'node:path';
import fs from 'fs';

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
test.describe('File Uploader', () => {
  const TEST_FILE_NAME = 'random_data.txt';
  const TEST_FILE_PATH = path.join(__dirname, `test-data/upload/${TEST_FILE_NAME}`);

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

test.describe('File Download', () => {
  const downloadDir = path.join(__dirname, 'test-data', 'download');

  // test.beforeEach(() => {
  //   if (fs.existsSync(downloadDir)) {
  //     fs.rmSync(downloadDir, { recursive: true, force: true });
  //   }
  // });

  // test.afterEach(() => {
  //   if (fs.existsSync(downloadDir)) {
  //     fs.rmSync(downloadDir, { recursive: true, force: true });
  //     console.log('[INFO] 已清除测试数据');
  //   }
  // });

  test('Downloader', async ({ page }) => {
    await page.goto(`${DOMAIN}/download`);
    const body = page.locator('.example');
    const downloadLinksCount = await body.getByRole('link').count();

    const failedLinks: string[] = [];

    for (let i = 0; i < downloadLinksCount; i++) {
      const link = body.getByRole('link').nth(i);
      const fileName = await link.textContent();

      try {
        // 其实只要拦截到download就可以证明下载成功了，不需要真的保存
        const [download] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), link.click()]);

        // const savePath = path.join(__dirname, 'test-data', 'download', download.suggestedFilename());
        // await download.saveAs(savePath);

        console.log(`[INFO] 下载成功: ${fileName}`);
      } catch (error) {
        console.log(`[ERROR] 下载失败: ${fileName}`);
        failedLinks.push(fileName || `链接：第${i + 1}`);

        // 关键恢复动作：如果刚才的点击导致页面跳到了 404 错误页，我们需要退回来，才能继续点下一个！
        if (!page.url().endsWith('download')) {
          await page.goBack();
        }
      }
    }

    // 秋后算账，最后统一报错。这样的好处是可以一次检查所有链接。
    await expect(failedLinks, `以下文件下载失败: ${failedLinks.join(', ')}`).toHaveLength(0);
  });
});

test('Exit Intent', async ({ page }) => {
  await page.goto(`${DOMAIN}/exit_intent`);

  await page.mouse.move(0, 0);
  // 监听鼠标离开事件
  await page.dispatchEvent('html', 'mouseleave', { clientY: -10 });

  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();

  const closeBtn = modal.getByText('Close');
  await closeBtn.click();
  await expect(modal).toBeHidden();

  await page.dispatchEvent('html', 'mouseleave', { clientY: -10 });
  await expect(modal).toBeHidden();
});

test('Broken Images', async ({ page, request }) => {
  await page.goto(`${DOMAIN}/broken_images`);
  const imagesCount = await page.locator('.example').getByRole('img').count();

  const brokenImagesList: string[] = [];
  for (let i = 0; i < imagesCount; i++) {
    const img = page.locator('.example').getByRole('img').nth(i);
    const src = await img.getAttribute('src');

    // 从UI层面找图裂的开销，要比直接从查状态码的开销要小。
    // 如果裂图，那么naturalWidth必定为0。
    // 所以只需要在裂图的时候去查状态码就行了。
    const isImgOk = await img.evaluate((node: HTMLImageElement) => node.naturalWidth > 0);
    if (!isImgOk) {
      const imgUrl = new URL(src!, page.url()).toString();
      const statusCode = (await request.get(imgUrl)).status();
      if (statusCode !== 200) {
        brokenImagesList.push(src || `图片${i}`);
      }
      console.log(`[WARN] 发现裂图(url:${src},位置:第${i}张)`);
    }
  }

  await expect(brokenImagesList, `[ERROR] 存在裂图：${brokenImagesList.join(',')}`).toHaveLength(0);
});
