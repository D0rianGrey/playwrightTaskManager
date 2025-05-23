/**
 * Page Factory for creating and managing page objects
 */
import { Page } from 'playwright';
import { BasePage } from './BasePage';
import { ConfigManager } from '@core/ConfigManager';
import { Logger } from '@utils/Logger';

export class PageFactory {
  private static instance: PageFactory;
  private pages: Map<string, BasePage> = new Map();
  private logger: Logger;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.logger = new Logger('PageFactory');
  }

  /**
   * Get the PageFactory instance
   */
  static getInstance(): PageFactory {
    if (!PageFactory.instance) {
      PageFactory.instance = new PageFactory();
    }
    return PageFactory.instance;
  }

  /**
   * Create a new page object instance
   * @param pageClass Class of the page to create
   * @param page Playwright Page object
   * @param baseUrl Base URL for the application
   * @param path Path for the specific page
   */
  create<T extends BasePage>(
    pageClass: new (page: Page, baseUrl: string, path: string) => T,
    page: Page,
    baseUrl?: string,
    path?: string
  ): T {
    const config = ConfigManager.getInstance();
    const environment = config.getCurrentEnvironment();
    const actualBaseUrl = baseUrl || (environment?.baseUrl || '');
    const actualPath = path || '';

    this.logger.debug(`Creating page object: ${pageClass.name}`);
    const pageObject = new pageClass(page, actualBaseUrl, actualPath);

    // Store the page object for later retrieval
    this.pages.set(pageClass.name, pageObject);

    return pageObject;
  }

  /**
   * Get an existing page object by class name
   * @param className Name of the page class
   */
  getByName<T extends BasePage>(className: string): T | undefined {
    return this.pages.get(className) as T | undefined;
  }

  /**
   * Clear all cached page objects
   */
  clear(): void {
    this.pages.clear();
  }
}
