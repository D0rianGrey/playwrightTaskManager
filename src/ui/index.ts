/**
 * Компоненты для UI тестирования
 */

import { TestBase } from '../core';
import { Page } from '@playwright/test';

// Базовый класс для страницы
export class PageObject {
  constructor(protected page: Page) {}

  // Базовый метод для ожидания загрузки страницы
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}

// Базовый класс для UI тестов
export class UITest extends TestBase {
  constructor(protected page: Page) {
    super();
  }

  // Методы для работы с UI элементами
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `./screenshots/${name}.png` });
  }
}

// Типы для UI тестирования
export interface UITestConfig {
  viewport?: { width: number; height: number };
  device?: string;
  headless?: boolean;
}
