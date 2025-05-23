/**
 * Base Page class for Page Object Model pattern
 * Represents a web page with methods for interaction and state management
 */
import { Page, Locator } from 'playwright';
import { Logger } from '@utils/Logger';

export class BasePage {
  protected logger: Logger;
  protected url: string;
  protected selectors: Record<string, string>;

  /**
   * Creates a new BasePage instance
   * @param page Playwright Page object
   * @param baseUrl Base URL for the application
   * @param path Path for this specific page
   */
  constructor(protected page: Page, protected baseUrl: string, protected path: string = '') {
    this.url = `${baseUrl}${path}`;
    this.logger = new Logger(this.constructor.name);
    this.selectors = this.defineSelectors();
  }

  /**
   * Define selectors for the page
   * Should be implemented by subclasses to define page-specific selectors
   */
  protected defineSelectors(): Record<string, string> {
    return {};
  }

  /**
   * Navigate to the page
   */
  async navigate(): Promise<void> {
    this.logger.info(`Navigating to ${this.url}`);
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load
   * Can be overridden by subclasses to implement page-specific wait logic
   */
  async waitForPageLoad(): Promise<void> {
    this.logger.info('Waiting for page to load');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if current page is displayed
   * Can be overridden by subclasses for page-specific validation
   */
  isDisplayed(): Promise<boolean> {
    this.logger.info('Checking if page is displayed');
    return Promise.resolve(this.page.url().includes(this.path));
  }

  /**
   * Get locator for a named element using defined selectors
   * @param name Name of the element in the selectors map
   */
  protected getLocator(name: string): Locator {
    const selector = this.selectors[name];
    if (!selector) {
      throw new Error(`Selector '${name}' not defined for page ${this.constructor.name}`);
    }
    return this.page.locator(selector);
  }

  /**
   * Get current page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current page URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Take a screenshot of the page
   * @param name Name for the screenshot file
   */
  async takeScreenshot(name: string = 'page'): Promise<string> {
    const path = `./screenshots/${this.constructor.name}_${name}_${Date.now()}.png`;
    this.logger.info(`Taking screenshot: ${path}`);
    await this.page.screenshot({ path });
    return path;
  }

  /**
   * Execute JavaScript in the browser context
   * @param script JavaScript code to execute in the browser context
   * @param arg Optional argument to pass to the script (if script is a function)
   * @returns Promise resolving to the result of the executed script
   */
  async evaluate<T, Arg = unknown>(
    script: string | ((arg: Arg) => T | Promise<T>),
    arg?: Arg
  ): Promise<T> {
    // We need to use a more specific approach to handle both string and function types
    if (typeof script === 'string') {
      return await this.page.evaluate(script);
    } else {
      // For function scripts, we need to use a different approach to satisfy the type checker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      return await this.page.evaluate(script as any, arg);
    }
  }

  /**
   * Wait for a condition to be true
   * @param condition Function that returns a promise resolving to a boolean
   * @param timeout Timeout in milliseconds
   * @param message Message for timeout error
   */
  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 30000,
    message: string = 'Condition not met'
  ): Promise<void> {
    this.logger.info(`Waiting for condition: ${message}`);
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for condition: ${message}`);
  }
}
