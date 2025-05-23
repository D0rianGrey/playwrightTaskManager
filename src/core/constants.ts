/**
 * Framework Constants
 */

export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_COUNT = 3;
export const DEFAULT_RETRY_INTERVAL = 1000; // 1 second
export const DEFAULT_SCREENSHOT_DIR = './screenshots';
export const DEFAULT_REPORT_DIR = './reports';
export const DEFAULT_LOG_LEVEL = 'info';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  PENDING = 'pending',
  RUNNING = 'running'
}
