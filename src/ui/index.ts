/**
 * UI Testing Components
 */

// Export all UI testing components
export * from './BasePage';
export * from './BaseComponent';
export * from './PageFactory';
export * from './BrowserManager';
export * from './ParallelTestRunner';
export * from './VisualTesting';

// Base classes for backward compatibility
import { Page } from 'playwright';
import { BaseTest } from '../core';
import { BasePage } from './BasePage';

// Legacy PageObject class (for backward compatibility)
export class PageObject extends BasePage {
  constructor(protected page: Page, baseUrl: string = '', path: string = '') {
    super(page, baseUrl, path);
  }
}

// Legacy UITest class (for backward compatibility)
export class UITest extends BaseTest {
  constructor(protected page: Page) {
    super();
  }

  /**
   * Implementation of the abstract executeTest method required by BaseTest
   * This method should be overridden by subclasses with specific test logic
   */
  // We need to keep this method as async to match the abstract class signature
  // even though it doesn't use await in this placeholder implementation
  /* eslint-disable-next-line @typescript-eslint/require-await */
  async executeTest(): Promise<void> {
    throw new Error('executeTest() method must be implemented by subclasses of UITest');
  }
}
