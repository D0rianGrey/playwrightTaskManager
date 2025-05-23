/**
 * Base Component class for Component Object Model pattern
 * Represents a reusable UI component with methods for interaction
 */
import { Page, Locator } from 'playwright';
import { Logger } from '@utils/Logger';

export class BaseComponent {
  protected logger: Logger;
  protected root: Locator;
  protected selectors: Record<string, string>;

  /**
   * Creates a new BaseComponent instance
   * @param page Playwright Page object
   * @param rootSelector CSS selector for the component's root element
   */
  constructor(protected page: Page, protected rootSelector: string) {
    this.root = page.locator(rootSelector);
    this.logger = new Logger(this.constructor.name);
    this.selectors = this.defineSelectors();
  }

  /**
   * Define selectors for the component
   * Should be implemented by subclasses to define component-specific selectors
   */
  protected defineSelectors(): Record<string, string> {
    return {};
  }

  /**
   * Check if component is visible
   */
  async isVisible(): Promise<boolean> {
    this.logger.debug('Checking if component is visible');
    return await this.root.isVisible();
  }

  /**
   * Wait for component to be visible
   * @param timeout Timeout in milliseconds
   */
  async waitForVisible(timeout: number = 5000): Promise<void> {
    this.logger.debug(`Waiting for component to be visible (timeout: ${timeout}ms)`);
    await this.root.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get locator for a named element using defined selectors
   * @param name Name of the element in the selectors map
   */
  protected getLocator(name: string): Locator {
    const selector = this.selectors[name];
    if (!selector) {
      throw new Error(`Selector '${name}' not defined for component ${this.constructor.name}`);
    }
    return this.root.locator(selector);
  }

  /**
   * Get the root element of the component
   */
  getRoot(): Locator {
    return this.root;
  }

  /**
   * Take a screenshot of the component
   * @param name Name for the screenshot file
   */
  async takeScreenshot(name: string = 'component'): Promise<string> {
    const path = `./screenshots/${this.constructor.name}_${name}_${Date.now()}.png`;
    this.logger.debug(`Taking component screenshot: ${path}`);
    await this.root.screenshot({ path });
    return path;
  }

  /**
   * Click on a named element in the component
   * @param name Name of the element in the selectors map
   * @param options Click options
   */
  async clickElement(name: string, options?: Parameters<Locator['click']>[0]): Promise<void> {
    this.logger.debug(`Clicking element: ${name}`);
    await this.getLocator(name).click(options);
  }

  /**
   * Fill a form field in the component
   * @param name Name of the element in the selectors map
   * @param value Value to fill
   */
  async fillField(name: string, value: string): Promise<void> {
    this.logger.debug(`Filling field ${name} with value: ${value}`);
    await this.getLocator(name).fill(value);
  }

  /**
   * Get text content of a named element
   * @param name Name of the element in the selectors map
   */
  async getText(name: string): Promise<string | null> {
    return await this.getLocator(name).textContent();
  }

  /**
   * Check if a named element exists in the component
   * @param name Name of the element in the selectors map
   */
  async hasElement(name: string): Promise<boolean> {
    try {
      const locator = this.getLocator(name);
      return await locator.count() > 0;
    } catch {
      // Selector might not exist or there could be other errors
      // but we just want to return false in any error case
      return false;
    }
  }
}
