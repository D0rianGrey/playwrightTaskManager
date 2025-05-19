import { test, expect } from '@playwright/test';

test.describe('Пример тестового набора', () => {
  test('должен успешно загрузить страницу', async ({ page }) => {
    // Переходим на тестовую страницу
    await page.goto('https://playwright.dev/');

    // Проверяем заголовок страницы
    const title = await page.title();
    expect(title).toContain('Playwright');

    // Проверяем наличие элемента на странице
    const getStartedLink = page.getByRole('link', { name: 'Get started' });
    await expect(getStartedLink).toBeVisible();
  });

  test('должен выполнять поиск', async ({ page }) => {
    // Переходим на тестовую страницу
    await page.goto('https://playwright.dev/');

    // Нажимаем на кнопку поиска
    await page.getByLabel('Search').click();

    // Вводим текст в поле поиска
    await page.getByPlaceholder('Search docs').fill('assertions');

    // Нажимаем на assertions в результатах поиска
    await page.getByRole('link', { name: 'Assertions', exact: true }).click();

    // Проверяем, что мы находимся на странице "Assertions"
    await expect(page.getByRole('heading', { name: 'Assertions', exact: true })).toBeVisible();

    // Проверяем, что заголовок страницы содержит "Assertions"
    await expect(page.locator('h1')).toContainText('Assertions');
  });
});
