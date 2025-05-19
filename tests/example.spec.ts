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
    
    // Ждем результатов поиска
    const searchResults = page.getByRole('listitem').filter({ hasText: 'Assertions' });
    await expect(searchResults).toBeVisible();
    
    // Проверяем, что в результатах есть нужный элемент
    await expect(page.getByRole('link', { name: /assertions/i })).toBeVisible();
  });
});
