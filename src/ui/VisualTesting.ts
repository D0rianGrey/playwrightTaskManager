/**
 * Visual Testing utility
 * Provides screenshot comparison and visual regression testing
 */
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Logger } from '@utils/Logger';
import { Page, Locator } from 'playwright';

export interface ScreenshotComparisonOptions {
  // Maximum allowed pixel difference percentage (0-1)
  threshold?: number;
  // Directory for baseline screenshots
  baselineDir?: string;
  // Directory for actual screenshots
  actualDir?: string;
  // Directory for diff screenshots
  diffDir?: string;
  // Whether to create directories if they don't exist
  createDirs?: boolean;
}

export class VisualTesting {
  private logger: Logger;
  private options: Required<ScreenshotComparisonOptions>;

  /**
   * Create a new VisualTesting instance
   * @param options Screenshot comparison options
   */
  constructor(options: ScreenshotComparisonOptions = {}) {
    this.logger = new Logger('VisualTesting');

    // Set default options
    this.options = {
      threshold: 0.1, // 10% difference allowed by default
      baselineDir: './screenshots/baseline',
      actualDir: './screenshots/actual',
      diffDir: './screenshots/diff',
      createDirs: true,
      ...options
    };

    // Create directories if needed
    if (this.options.createDirs) {
      this.createDirectories();
    }
  }

  /**
   * Create necessary directories
   */
  private createDirectories(): void {
    const createDir = (dirPath: string): void => {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    };

    createDir(this.options.baselineDir);
    createDir(this.options.actualDir);
    createDir(this.options.diffDir);
  }

  /**
   * Take a screenshot of a page or element and compare it with the baseline
   * @param page Playwright Page object
   * @param name Screenshot name
   * @param element Optional element locator to screenshot instead of the whole page
   */
  async compareScreenshot(
    page: Page,
    name: string,
    element?: Locator
  ): Promise<{
    match: boolean;
    diffPercentage: number;
    diffPath?: string;
  }> {
    const screenshotName = `${name}.png`;
    const baselinePath = path.join(this.options.baselineDir, screenshotName);
    const actualPath = path.join(this.options.actualDir, screenshotName);
    const diffPath = path.join(this.options.diffDir, screenshotName);

    // Take the screenshot
    this.logger.info(`Taking screenshot: ${name}`);
    if (element) {
      await element.screenshot({ path: actualPath });
    } else {
      await page.screenshot({ path: actualPath });
    }

    // If baseline doesn't exist, create it
    if (!fs.existsSync(baselinePath)) {
      this.logger.info(`Creating baseline screenshot: ${baselinePath}`);
      fs.copyFileSync(actualPath, baselinePath);
      return { match: true, diffPercentage: 0 };
    }

    // Compare screenshots
    this.logger.info(`Comparing with baseline: ${baselinePath}`);
    const result = this.compareImages(baselinePath, actualPath, diffPath);

    if (result.match) {
      this.logger.info('Screenshots match');
    } else {
      this.logger.warn(`Screenshots differ by ${result.diffPercentage.toFixed(2)}%`);
    }

    return result;
  }

  /**
   * Compare two PNG images
   * @param baselinePath Path to baseline image
   * @param actualPath Path to actual image
   * @param diffPath Path to save diff image
   */
  private compareImages(
    baselinePath: string,
    actualPath: string,
    diffPath: string
  ): {
    match: boolean;
    diffPercentage: number;
    diffPath?: string;
  } {
    // Read images
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const actual = PNG.sync.read(fs.readFileSync(actualPath));

    // Create output image
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    // Compare images
    const numDiffPixels = pixelmatch(
      baseline.data,
      actual.data,
      diff.data,
      width,
      height,
      { threshold: this.options.threshold }
    );

    // Calculate difference percentage
    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    // Determine if images match based on threshold
    const match = diffPercentage <= this.options.threshold * 100;

    // Save diff image if they don't match
    if (!match) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      return { match, diffPercentage, diffPath };
    }

    return { match, diffPercentage };
  }

  /**
   * Update baseline with the current screenshot
   * @param name Screenshot name
   */
  updateBaseline(name: string): boolean {
    const screenshotName = `${name}.png`;
    const baselinePath = path.join(this.options.baselineDir, screenshotName);
    const actualPath = path.join(this.options.actualDir, screenshotName);

    if (!fs.existsSync(actualPath)) {
      this.logger.error(`Cannot update baseline: Actual screenshot not found at ${actualPath}`);
      return false;
    }

    try {
      fs.copyFileSync(actualPath, baselinePath);
      this.logger.info(`Updated baseline: ${baselinePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update baseline:`, error);
      return false;
    }
  }

  /**
   * Set comparison threshold
   * @param threshold New threshold value (0-1)
   */
  setThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.options.threshold = threshold;
  }
}
