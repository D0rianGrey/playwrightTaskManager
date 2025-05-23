/**
 * Logger utility
 * Provides logging functionality with different log levels
 */
import { LogLevel } from '@core/constants';

export class Logger {
  private readonly context: string;
  private logLevel: LogLevel;

  /**
   * Creates a new Logger instance
   * @param context The context identifier for this logger (usually class name)
   * @param logLevel The minimum log level to output
   */
  constructor(context: string, logLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.logLevel = logLevel;
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param data Optional data to include
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param data Optional data to include
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param data Optional data to include
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Optional error to include
   */
  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Set the minimum log level
   * @param level Log level to set
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const shouldLog = this.shouldLogLevel(level);
    if (!shouldLog) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        if (data) console.debug(data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        if (data) console.info(data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        if (data) console.warn(data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (data) console.error(data);
        break;
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLogLevel(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }
}
