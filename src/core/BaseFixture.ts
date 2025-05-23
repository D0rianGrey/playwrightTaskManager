/**
 * Base Fixture class
 * Provides test data management and fixture functionality
 */
import { TestConfig } from './types';

export class BaseFixture {
  protected config: TestConfig;
  protected data: Record<string, any> = {};

  /**
   * Creates a new BaseFixture instance
   * @param config Test configuration
   */
  constructor(config: TestConfig = {}) {
    this.config = config;
  }

  /**
   * Set fixture data
   * @param key Data key
   * @param value Data value
   */
  setData<T>(key: string, value: T): void {
    this.data[key] = value;
  }

  /**
   * Get fixture data
   * @param key Data key
   * @param defaultValue Default value if key not found
   */
  getData<T>(key: string, defaultValue?: T): T | undefined {
    return (key in this.data) ? this.data[key] as T : defaultValue;
  }

  /**
   * Load data from a file
   * @param filePath Path to data file
   */
  async loadFromFile(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      const content = await fs.readFile(filePath, 'utf8');

      if (filePath.endsWith('.json')) {
        this.data = JSON.parse(content);
        return true;
      } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        // For .js or .ts files, we expect them to export an object
        const module = require(filePath);
        this.data = module.default || module;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error loading fixture data from ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get all fixture data
   */
  getAllData(): Record<string, any> {
    return { ...this.data };
  }

  /**
   * Clear all fixture data
   */
  clearData(): void {
    this.data = {};
  }

  /**
   * Setup method to initialize fixture
   */
  async setup(): Promise<void> {
    // To be implemented by subclasses
  }

  /**
   * Teardown method to clean up fixture
   */
  async teardown(): Promise<void> {
    // To be implemented by subclasses
  }
}
