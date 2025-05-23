/**
 * Base Test abstract class
 * Provides core functionality for all test implementations
 */
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { TestConfig, BrowserContextConfig, TestResult } from './types';
import { DEFAULT_TIMEOUT, TestStatus } from './constants';
import { ConfigManager } from './ConfigManager';
import { Logger } from '@utils/Logger';

export abstract class BaseTest {
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected browser: Browser | null = null;
  protected config: TestConfig;
  protected logger: Logger;
  protected result: TestResult;

  /**
   * Creates a new BaseTest instance
   * @param config Test configuration options
   */
  constructor(config: TestConfig = {}) {
    this.config = {
      timeout: DEFAULT_TIMEOUT,
      retries: 0,
      tags: [],
      screenshot: true,
      video: false,
      headless: true,
      browserName: 'chromium',
      ...config
    };

    // Initialize logger
    this.logger = new Logger(this.constructor.name);

    // Initialize test result
    this.result = {
      name: this.constructor.name,
      status: TestStatus.PENDING,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      attachments: []
    };
  }

  /**
   * Setup method called before test execution
   * Initializes browser, context and page
   */
  async setup(): Promise<void> {
    try {
      this.logger.info('Setting up test...');

      // Merge with global config
      this.config = {
        ...this.config,
        ...ConfigManager.getInstance().getTestConfig()
      };

      // Initialize browser
      await this.initBrowser();

      // Initialize context and page
      if (this.browser) {
        this.context = await this.browser.newContext({
          viewport: this.config.viewport,
          recordVideo: this.config.video ? { dir: './videos/' } : undefined
        });

        this.page = await this.context.newPage();

        // Set default timeout
        if (this.config.timeout) {
          this.page.setDefaultTimeout(this.config.timeout);
        }
      }

      // Execute custom setup
      await this.beforeTest();

      this.logger.info('Test setup completed');
    } catch (error) {
      this.logger.error('Error during test setup', error);
      throw error;
    }
  }

  /**
   * Teardown method called after test execution
   * Closes browser, context and page
   */
  async teardown(): Promise<void> {
    try {
      this.logger.info('Tearing down test...');

      // Execute custom teardown
      await this.afterTest();

      // Close page
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      // Close context
      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.logger.info('Test teardown completed');
    } catch (error) {
      this.logger.error('Error during test teardown', error);
      throw error;
    }
  }

  /**
   * Initialize browser based on configuration
   */
  private async initBrowser(): Promise<void> {
    switch (this.config.browserName) {
      case 'firefox':
        this.browser = await firefox.launch({ headless: this.config.headless });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ headless: this.config.headless });
        break;
      case 'chromium':
      default:
        this.browser = await chromium.launch({ headless: this.config.headless });
        break;
    }
  }

  /**
   * Get browser context configuration
   */
  protected getBrowserContext(): BrowserContextConfig | null {
    if (!this.browser || !this.context || !this.page) {
      return null;
    }

    return {
      browser: this.browser,
      context: this.context,
      page: this.page,
      config: this.config
    };
  }

  /**
   * Run the test
   */
  async run(): Promise<TestResult> {
    const startTime = new Date();
    this.result.startTime = startTime;
    this.result.status = TestStatus.RUNNING;

    try {
      await this.setup();

      this.logger.info('Executing test...');
      await this.executeTest();

      this.result.status = TestStatus.PASSED;
      this.logger.info('Test executed successfully');
    } catch (error) {
      this.result.status = TestStatus.FAILED;
      this.result.error = error as Error;
      this.logger.error('Test execution failed', error);

      // Take screenshot on failure if enabled
      if (this.config.screenshot && this.page) {
        try {
          const screenshotPath = `./screenshots/${this.constructor.name}_${Date.now()}.png`;
          await this.page.screenshot({ path: screenshotPath });

          if (this.result.attachments) {
            this.result.attachments.push({
              name: 'Failure Screenshot',
              path: screenshotPath,
              contentType: 'image/png',
              description: 'Screenshot taken at the moment of test failure'
            });
          }
        } catch (screenshotError) {
          this.logger.error('Failed to take failure screenshot', screenshotError);
        }
      }
    } finally {
      await this.teardown();

      const endTime = new Date();
      this.result.endTime = endTime;
      this.result.duration = endTime.getTime() - startTime.getTime();
    }

    return this.result;
  }

  /**
   * Custom setup method to be implemented by subclasses
   */
  protected async beforeTest(): Promise<void> {
    // To be implemented by subclasses
  }

  /**
   * Custom teardown method to be implemented by subclasses
   */
  protected async afterTest(): Promise<void> {
    // To be implemented by subclasses
  }

  /**
   * Abstract method that must be implemented by all test classes
   */
  abstract executeTest(): Promise<void>;
}
