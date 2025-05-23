/**
 * Configuration Manager
 * Singleton class for managing framework configuration
 */
import fs from 'fs';
import path from 'path';
import { TestConfig, EnvironmentConfig } from './types';
import { DEFAULT_TIMEOUT, DEFAULT_LOG_LEVEL } from './constants';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any>;
  private testConfig: TestConfig;
  private environments: Map<string, EnvironmentConfig>;
  private currentEnv: string;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.config = {};
    this.environments = new Map();
    this.currentEnv = process.env.TEST_ENV || 'dev';

    // Default test configuration
    this.testConfig = {
      timeout: DEFAULT_TIMEOUT,
      retries: 0,
      browserName: 'chromium',
      headless: true,
      screenshot: true,
      video: false,
      logLevel: DEFAULT_LOG_LEVEL as any,
      viewport: { width: 1280, height: 720 }
    };

    // Load configuration
    this.loadConfig();
  }

  /**
   * Get the ConfigManager instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from files and environment variables
   */
  private loadConfig(): void {
    try {
      // Load base config
      const baseConfigPath = path.resolve(process.cwd(), 'config', 'base.json');
      if (fs.existsSync(baseConfigPath)) {
        const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
        this.config = { ...this.config, ...baseConfig };
      }

      // Load environment-specific config
      const envConfigPath = path.resolve(process.cwd(), 'config', `${this.currentEnv}.json`);
      if (fs.existsSync(envConfigPath)) {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
        this.config = { ...this.config, ...envConfig };
      }

      // Load environment variables
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('TEST_')) {
          const configKey = key.substring(5).toLowerCase();
          this.config[configKey] = process.env[key];
        }
      });

      // Load environments
      this.loadEnvironments();

      // Update test config
      if (this.config.test) {
        this.testConfig = { ...this.testConfig, ...this.config.test };
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  /**
   * Load environment configurations
   */
  private loadEnvironments(): void {
    const envsPath = path.resolve(process.cwd(), 'config', 'environments.json');
    if (fs.existsSync(envsPath)) {
      try {
        const environments = JSON.parse(fs.readFileSync(envsPath, 'utf8'));
        if (Array.isArray(environments)) {
          environments.forEach(env => {
            if (env.name) {
              this.environments.set(env.name, env as EnvironmentConfig);
            }
          });
        }
      } catch (error) {
        console.error('Error loading environments:', error);
      }
    }
  }

  /**
   * Get config value with type safety
   * @param key Config key
   * @param defaultValue Default value if key not found
   */
  getConfig<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current: any = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return defaultValue as T;
      }
    }

    return (current !== undefined ? current : defaultValue) as T;
  }

  /**
   * Get the current test configuration
   */
  getTestConfig(): TestConfig {
    return this.testConfig;
  }

  /**
   * Set test configuration
   * @param config Test configuration to set
   */
  setTestConfig(config: Partial<TestConfig>): void {
    this.testConfig = { ...this.testConfig, ...config };
  }

  /**
   * Get the current environment configuration
   */
  getCurrentEnvironment(): EnvironmentConfig | undefined {
    return this.environments.get(this.currentEnv);
  }

  /**
   * Set the current environment
   * @param env Environment name
   */
  setEnvironment(env: string): boolean {
    if (this.environments.has(env)) {
      this.currentEnv = env;
      return true;
    }
    return false;
  }

  /**
   * Get all available environments
   */
  getEnvironments(): EnvironmentConfig[] {
    return Array.from(this.environments.values());
  }

  /**
   * Reload configuration (useful for dynamic config changes)
   */
  reload(): void {
    this.config = {};
    this.loadConfig();
  }
}
