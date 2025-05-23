/**
 * Browser Manager utility
 * Handles browser creation, context management, and device emulation
 */
import { Browser, BrowserContext, BrowserType, Page, chromium, firefox, webkit } from 'playwright';
import { TestConfig } from '@core/types';
import { Logger } from '@utils/Logger';

// Predefined device configurations
export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export class BrowserManager {
  private static instance: BrowserManager;
  private browsers: Map<string, Browser> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();
  private logger: Logger;

  // Common device configurations
  private devices: Map<string, DeviceConfig> = new Map([
    ['iPhone13', {
      name: 'iPhone 13',
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    }],
    ['Pixel5', {
      name: 'Google Pixel 5',
      viewport: { width: 393, height: 851 },
      userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
      deviceScaleFactor: 2.75,
      isMobile: true,
      hasTouch: true
    }],
    ['iPad', {
      name: 'iPad',
      viewport: { width: 810, height: 1080 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    }]
  ]);

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.logger = new Logger('BrowserManager');
  }

  /**
   * Get the BrowserManager instance
   */
  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * Get a browser instance by name, creating it if needed
   * @param browserName Name of the browser (chromium, firefox, webkit)
   * @param options Browser launch options
   */
  async getBrowser(
    browserName: 'chromium' | 'firefox' | 'webkit' = 'chromium',
    options: Parameters<BrowserType['launch']>[0] = {}
  ): Promise<Browser> {
    const browserId = `${browserName}-${JSON.stringify(options)}`;

    if (!this.browsers.has(browserId)) {
      this.logger.info(`Creating new browser instance: ${browserName}`);

      // Select browser type
      let browserInstance: Browser;
      switch (browserName) {
        case 'firefox':
          browserInstance = await firefox.launch(options);
          break;
        case 'webkit':
          browserInstance = await webkit.launch(options);
          break;
        case 'chromium':
        default:
          browserInstance = await chromium.launch(options);
          break;
      }

      // Store browser instance
      this.browsers.set(browserId, browserInstance);
    }

    return this.browsers.get(browserId)!;
  }

  /**
   * Create a new browser context
   * @param browser Browser instance
   * @param options Context options
   */
  async createContext(
    browser: Browser,
    options: Parameters<Browser['newContext']>[0] = {}
  ): Promise<BrowserContext> {
    this.logger.info('Creating new browser context');
    const context = await browser.newContext(options);

    // Generate a unique ID for the context
    const contextId = `context-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.contexts.set(contextId, context);

    return context;
  }

  /**
   * Create a new page in a browser context
   * @param context Browser context
   * @param url Initial URL to navigate to (optional)
   */
  async createPage(context: BrowserContext, url?: string): Promise<Page> {
    this.logger.info(`Creating new page${url ? ` and navigating to ${url}` : ''}`);
    const page = await context.newPage();

    if (url) {
      await page.goto(url);
    }

    return page;
  }

  /**
   * Create a browser, context, and page in one operation
   * @param config Test configuration
   */
  async createBrowserContextPage(config: TestConfig = {}): Promise<{
    browser: Browser;
    context: BrowserContext;
    page: Page;
  }> {
    // Get browser options from config
    const browserOptions = {
      headless: config.headless ?? true
    };

    // Create browser
    const browser = await this.getBrowser(config.browserName, browserOptions);

    // Context options
    const contextOptions: Parameters<Browser['newContext']>[0] = {
      viewport: config.viewport
    };

    // Create context
    const context = await this.createContext(browser, contextOptions);

    // Create page
    const page = await this.createPage(context, config.baseUrl);

    return { browser, context, page };
  }

  /**
   * Create a mobile device emulation
   * @param deviceName Name of the predefined device or a custom device config
   * @param browserName Browser to use
   * @param orientation Screen orientation ('portrait' or 'landscape')
   */
  async createMobileDevice(
    deviceName: string | DeviceConfig,
    browserName: 'chromium' | 'firefox' | 'webkit' = 'chromium',
    orientation: 'portrait' | 'landscape' = 'portrait'
  ): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    this.logger.info(`Creating mobile device emulation: ${typeof deviceName === 'string' ? deviceName : deviceName.name}`);

    // Get device config
    let deviceConfig: DeviceConfig;
    if (typeof deviceName === 'string') {
      if (!this.devices.has(deviceName)) {
        throw new Error(`Unknown device: ${deviceName}`);
      }
      deviceConfig = this.devices.get(deviceName)!;
    } else {
      deviceConfig = deviceName;
    }

    // Adjust viewport for landscape orientation
    let viewport = { ...deviceConfig.viewport };
    if (orientation === 'landscape') {
      viewport = {
        width: deviceConfig.viewport.width,
        height: deviceConfig.viewport.height
      };
    }

    // Create browser
    const browser = await this.getBrowser(browserName, { headless: true });

    // Create context with device emulation
    const context = await this.createContext(browser, {
      viewport,
      userAgent: deviceConfig.userAgent,
      deviceScaleFactor: deviceConfig.deviceScaleFactor,
      isMobile: deviceConfig.isMobile,
      hasTouch: deviceConfig.hasTouch
    });

    // Create page
    const page = await this.createPage(context);

    return { browser, context, page };
  }

  /**
   * Close all browser instances and contexts
   */
  async closeAll(): Promise<void> {
    this.logger.info('Closing all browsers and contexts');

    // Close all contexts
    for (const [id, context] of this.contexts.entries()) {
      try {
        await context.close();
        this.contexts.delete(id);
      } catch (error) {
        this.logger.error(`Error closing context ${id}:`, error);
      }
    }

    // Close all browsers
    for (const [id, browser] of this.browsers.entries()) {
      try {
        await browser.close();
        this.browsers.delete(id);
      } catch (error) {
        this.logger.error(`Error closing browser ${id}:`, error);
      }
    }
  }

  /**
   * Get a list of all available devices
   */
  getAvailableDevices(): string[] {
    return Array.from(this.devices.keys());
  }

  /**
   * Register a custom device
   * @param name Device name
   * @param config Device configuration
   */
  registerDevice(name: string, config: DeviceConfig): void {
    this.devices.set(name, config);
  }
}
