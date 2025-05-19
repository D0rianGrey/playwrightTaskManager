# Playwright Test Framework

Современный, гибкий и расширяемый фреймворк для автоматизированного тестирования, построенный на TypeScript и Playwright.

## Возможности

- **UI тестирование** - автоматизация тестирования веб-интерфейсов с использованием Playwright
- **API тестирование** - тестирование REST и GraphQL API
- **Мобильное тестирование** - тестирование мобильных приложений
- **Тестирование производительности** - измерение и анализ производительности
- **Расширяемая архитектура** - легко добавлять новые функции и адаптировать под свои нужды
- **Типизация** - полная поддержка TypeScript для безопасной разработки тестов
- **Отчеты** - подробные отчеты о выполнении тестов

## Установка

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/playwright-test-framework.git
cd playwright-test-framework

# Установка зависимостей
npm install

# Установка браузеров для Playwright
npx playwright install
```

## Структура проекта

```
playwright-test-framework/
├── src/                  # Исходный код фреймворка
│   ├── core/             # Основные компоненты
│   ├── ui/               # Компоненты для UI тестирования
│   ├── api/              # Компоненты для API тестирования
│   ├── mobile/           # Компоненты для мобильного тестирования
│   ├── performance/      # Компоненты для тестирования производительности
│   ├── utils/            # Утилиты и вспомогательные функции
│   ├── config/           # Конфигурация
│   └── index.ts          # Основная точка входа
├── tests/                # Тесты
│   ├── ui/               # UI тесты
│   ├── api/              # API тесты
│   ├── mobile/           # Мобильные тесты
│   └── performance/      # Тесты производительности
├── dist/                 # Скомпилированный код
├── docs/                 # Документация
├── playwright.config.ts  # Конфигурация Playwright
├── tsconfig.json         # Конфигурация TypeScript
├── .eslintrc.js          # Конфигурация ESLint
├── .prettierrc           # Конфигурация Prettier
└── package.json          # Зависимости и скрипты
```

## Использование

### Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск тестов с UI интерфейсом
npm run test:ui

# Запуск тестов в видимом режиме (не headless)
npm run test:headed
```

### Создание UI теста

```typescript
import { test, expect } from '@playwright/test';
import { UITest, PageObject } from 'playwright-test-framework';

// Определение объекта страницы
class LoginPage extends PageObject {
  async login(username: string, password: string): Promise<void> {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#login-button');
    await this.waitForPageLoad();
  }
}

// Тест с использованием фреймворка
test('пользователь может войти в систему', async ({ page }) => {
  const uiTest = new UITest(page);
  const loginPage = new LoginPage(page);
  
  await uiTest.navigateTo('https://example.com/login');
  await loginPage.login('testuser', 'password123');
  
  // Проверка успешного входа
  await expect(page.locator('.welcome-message')).toContainText('Welcome, testuser');
});
```

### Создание API теста

```typescript
import { test, expect } from '@playwright/test';
import { ApiTest, HttpMethod, ApiAssertions } from 'playwright-test-framework';

test('API возвращает правильные данные пользователя', async () => {
  const apiTest = new ApiTest('https://api.example.com');
  
  const response = await apiTest.request({
    url: '/users/1',
    method: HttpMethod.GET,
    headers: {
      'Authorization': 'Bearer token123'
    }
  });
  
  expect(ApiAssertions.isSuccess(response)).toBeTruthy();
  expect(response.body).toHaveProperty('id', 1);
  expect(response.body).toHaveProperty('name', 'Test User');
});
```

### Тестирование производительности

```typescript
import { test, expect } from '@playwright/test';
import { PerformanceTest, PerformanceUtils } from 'playwright-test-framework';

test('страница загружается быстро', async ({ page }) => {
  const perfTest = new PerformanceTest({
    iterations: 5,
    warmupIterations: 2
  });
  
  const metrics = await perfTest.runPerformanceTest(async () => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Получение метрик производительности
    const performanceMetrics = await page.evaluate(() => {
      const { loadEventEnd, navigationStart } = performance.timing;
      return {
        loadTime: loadEventEnd - navigationStart,
        // Другие метрики...
      };
    });
    
    return performanceMetrics;
  });
  
  console.log(PerformanceUtils.formatMetrics(metrics));
  
  // Проверка метрик
  expect(metrics.loadTime).toBeLessThan(3000); // Загрузка должна быть менее 3 секунд
});
```

## Конфигурация

Фреймворк можно настроить через переменные окружения или файл конфигурации:

```typescript
// Пример настройки через код
import { config } from 'playwright-test-framework';

config.update({
  baseUrl: 'https://example.com',
  timeout: 60000,
  retries: 3,
  headless: false,
  viewport: { width: 1920, height: 1080 },
  logLevel: 'debug'
});
```

## Лицензия

MIT
