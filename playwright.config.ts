import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для тестового фреймворка.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Базовый URL для всех относительных URLs в тестах
  // baseURL: 'http://localhost:3000',

  // Директория с тестами
  testDir: './tests',

  // Паттерн для поиска тестовых файлов
  testMatch: '**/*.spec.ts',

  // Максимальное время выполнения одного теста
  timeout: 30000,

  // Количество повторных попыток для упавших тестов
  retries: process.env.CI ? 2 : 0,

  // Параллельное выполнение тестов
  fullyParallel: true,

  // Не запускать тесты, если есть ошибки компиляции
  forbidOnly: !!process.env.CI,

  // Количество воркеров для параллельного выполнения
  workers: process.env.CI ? 1 : undefined,

  // Репортеры для вывода результатов тестирования
  reporter: [
    ['html', { open: 'never' }],
    ['list', { printSteps: true }],
  ],

  // Использовать глобальную настройку для всех тестов
  use: {
    // Базовый URL для всех относительных URLs в тестах
    // baseURL: 'http://localhost:3000',

    // Делать скриншоты при падении тестов
    screenshot: 'only-on-failure',

    // Записывать видео при падении тестов
    video: 'on-first-retry',

    // Собирать трассировку при падении тестов
    trace: 'on-first-retry',

    // Максимальное время ожидания для локаторов
    actionTimeout: 10000,
  },

  // Конфигурация для различных проектов (браузеров)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Настройка веб-сервера для тестов
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
