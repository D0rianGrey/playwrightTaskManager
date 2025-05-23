/**
 * Base Reporter abstract class
 * Provides core functionality for all reporter implementations
 */
import { TestResult, ReporterOptions } from './types';

export abstract class BaseReporter {
  protected options: ReporterOptions;
  protected results: TestResult[] = [];

  /**
   * Creates a new BaseReporter instance
   * @param options Reporter configuration options
   */
  constructor(options: ReporterOptions = {}) {
    this.options = {
      outputDir: './reports',
      attachments: true,
      screenshots: true,
      videos: true,
      logs: true,
      ...options
    };
  }

  /**
   * Called when the test suite starts
   */
  onSuiteStart(suiteName: string, totalTests: number): void {
    // To be implemented by subclasses
  }

  /**
   * Called when the test suite ends
   */
  onSuiteEnd(suiteName: string, totalPassed: number, totalFailed: number, totalSkipped: number): void {
    // To be implemented by subclasses
  }

  /**
   * Called when a test starts
   */
  onTestStart(testName: string): void {
    // To be implemented by subclasses
  }

  /**
   * Called when a test ends
   */
  onTestEnd(result: TestResult): void {
    this.results.push(result);
    // To be implemented by subclasses
  }

  /**
   * Generate final report
   */
  abstract generateReport(): Promise<void>;

  /**
   * Get all test results
   */
  getResults(): TestResult[] {
    return this.results;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Get summary statistics
   */
  getSummary(): { total: number; passed: number; failed: number; skipped: number; duration: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return { total, passed, failed, skipped, duration };
  }
}
