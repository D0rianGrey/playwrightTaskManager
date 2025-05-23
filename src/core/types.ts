/**
 * Framework Type Definitions
 */
import { TestStatus, LogLevel } from './constants';
import { Page, BrowserContext, Browser } from 'playwright';

/**
 * Base configuration interface for all tests
 */
export interface TestConfig {
  timeout?: number;
  retries?: number;
  tags?: string[];
  screenshot?: boolean;
  video?: boolean;
  baseUrl?: string;
  headless?: boolean;
  browserName?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  logLevel?: LogLevel;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  name: string;
  baseUrl: string;
  apiUrl: string;
  credentials?: Record<string, string>;
}

/**
 * Test result interface
 */
export interface TestResult {
  name: string;
  status: TestStatus;
  duration: number;
  startTime: Date;
  endTime: Date;
  error?: Error;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

/**
 * Attachment interface for test artifacts
 */
export interface Attachment {
  name: string;
  path: string;
  contentType: string;
  description?: string;
}

/**
 * Browser context configuration
 */
export interface BrowserContextConfig {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  config: TestConfig;
}

/**
 * Hook function types
 */
export type BeforeAllHook = () => Promise<void>;
export type AfterAllHook = () => Promise<void>;
export type BeforeEachHook = (config: TestConfig) => Promise<void>;
export type AfterEachHook = (result: TestResult) => Promise<void>;

/**
 * Reporter options
 */
export interface ReporterOptions {
  outputDir?: string;
  attachments?: boolean;
  screenshots?: boolean;
  videos?: boolean;
  logs?: boolean;
}
