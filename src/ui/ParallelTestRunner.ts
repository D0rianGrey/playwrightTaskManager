/**
 * Parallel Test Execution Utilities
 * Provides support for running tests in parallel with worker management
 */
import os from 'os';
import { EventEmitter } from 'events';
import { Logger } from '@utils/Logger';
import { TestResult } from '@core/types';
import { TestStatus } from '@core/constants';

export interface ParallelTestOptions {
  // Maximum number of parallel workers (default: CPU cores - 1)
  maxWorkers?: number;
  // Timeout for each test in milliseconds
  timeout?: number;
  // Whether to fail fast on first test failure
  failFast?: boolean;
  // Whether to retry failed tests
  retryFailedTests?: boolean;
  // Maximum number of retries for failed tests
  maxRetries?: number;
}

export interface TestTask {
  id: string;
  name: string;
  testFn: () => Promise<TestResult>;
  retryCount?: number;
  result?: TestResult;
}

export class ParallelTestRunner extends EventEmitter {
  private options: Required<ParallelTestOptions>;
  private logger: Logger;
  private tasks: TestTask[] = [];
  private runningTasks: Map<string, TestTask> = new Map();
  private completedTasks: TestTask[] = [];
  private failedTasks: TestTask[] = [];
  private isRunning = false;

  /**
   * Create a new ParallelTestRunner
   * @param options Parallel test options
   */
  constructor(options: ParallelTestOptions = {}) {
    super();

    // Set default options
    this.options = {
      maxWorkers: Math.max(1, os.cpus().length - 1), // Default to CPU cores - 1
      timeout: 30000, // 30 seconds default timeout
      failFast: false,
      retryFailedTests: true,
      maxRetries: 1,
      ...options
    };

    this.logger = new Logger('ParallelTestRunner');
  }

  /**
   * Add a test task to the queue
   * @param task Test task to add
   */
  addTask(task: Omit<TestTask, 'retryCount'>): void {
    this.tasks.push({
      ...task,
      retryCount: 0
    });
  }

  /**
   * Add multiple test tasks to the queue
   * @param tasks Test tasks to add
   */
  addTasks(tasks: Array<Omit<TestTask, 'retryCount'>>): void {
    tasks.forEach(task => this.addTask(task));
  }

  /**
   * Run all queued tasks in parallel
   */
  async run(): Promise<TestResult[]> {
    if (this.isRunning) {
      throw new Error('Test runner is already running');
    }

    this.isRunning = true;
    this.runningTasks.clear();
    this.completedTasks = [];
    this.failedTasks = [];

    this.logger.info(`Starting parallel test execution with ${this.options.maxWorkers} workers`);
    this.emit('run:start', { totalTasks: this.tasks.length });

    // Start processing tasks
    await this.processTasks();

    this.isRunning = false;

    // Combine results
    const results = [...this.completedTasks].map(task => task.result!);

    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === TestStatus.PASSED).length,
      failed: results.filter(r => r.status === TestStatus.FAILED).length,
      skipped: results.filter(r => r.status === TestStatus.SKIPPED).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0)
    };

    this.logger.info(`Test execution completed: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped`);
    this.emit('run:end', { results, summary });

    return results;
  }

  /**
   * Process tasks in the queue
   */
  private async processTasks(): Promise<void> {
    return new Promise(resolve => {
      const processNextBatch = (): void => {
        // Check if we should stop processing
        if (this.options.failFast && this.failedTasks.length > 0) {
          this.logger.info('Stopping execution due to failFast option');
          return resolve();
        }

        // Check if all tasks are completed
        if (
          this.tasks.length === 0 &&
          this.runningTasks.size === 0
        ) {
          return resolve();
        }

        // Start new tasks up to maxWorkers
        const availableSlots = this.options.maxWorkers - this.runningTasks.size;
        for (let i = 0; i < availableSlots && this.tasks.length > 0; i++) {
          const task = this.tasks.shift()!;
          this.runningTasks.set(task.id, task);

          // Using void to explicitly mark the promise as intentionally not awaited
          // We're handling it with .then() and .catch() instead
          void this.executeTask(task)
            .then(result => {
              // Process completed task
              this.runningTasks.delete(task.id);

              if (result.status === TestStatus.FAILED &&
                  this.options.retryFailedTests &&
                  (task.retryCount || 0) < this.options.maxRetries) {
                // Retry failed task
                const retryTask = {
                  ...task,
                  retryCount: (task.retryCount || 0) + 1
                };
                this.logger.info(`Retrying failed task: ${task.name} (retry ${retryTask.retryCount})`);
                this.tasks.unshift(retryTask);
              } else {
                // Mark task as completed
                task.result = result;
                this.completedTasks.push(task);

                if (result.status === TestStatus.FAILED) {
                  this.failedTasks.push(task);
                }
              }

              // Process next batch
              processNextBatch();
            })
            .catch(error => {
              // Handle any unexpected errors during task execution
              this.logger.error(`Unexpected error executing task ${task.id}: ${task.name}`, error);
              this.runningTasks.delete(task.id);

              // Create a failure result for the task
              const failureResult: TestResult = {
                name: task.name,
                status: TestStatus.FAILED,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                error: error instanceof Error ? error : new Error(String(error))
              };

              // Check if we should retry
              if (this.options.retryFailedTests &&
                  (task.retryCount || 0) < this.options.maxRetries) {
                // Retry failed task
                const retryTask = {
                  ...task,
                  retryCount: (task.retryCount || 0) + 1
                };
                this.logger.info(`Retrying failed task after error: ${task.name} (retry ${retryTask.retryCount})`);
                this.tasks.unshift(retryTask);
              } else {
                // Mark task as failed
                task.result = failureResult;
                this.completedTasks.push(task);
                this.failedTasks.push(task);
              }

              // Continue processing
              processNextBatch();
            });
        }
      };

      // Start processing
      processNextBatch();
    });
  }

  /**
   * Execute a single test task with timeout
   * @param task Test task to execute
   */
  private async executeTask(task: TestTask): Promise<TestResult> {
    this.logger.info(`Starting test: ${task.name}${task.retryCount ? ` (retry ${task.retryCount})` : ''}`);
    this.emit('task:start', { task });

    try {
      // Create a promise with timeout
      const timeoutPromise = new Promise<TestResult>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error(`Test timed out after ${this.options.timeout}ms`));
        }, this.options.timeout);
      });

      // Race between test execution and timeout
      const result = await Promise.race([
        task.testFn(),
        timeoutPromise
      ]);

      this.logger.info(`Completed test: ${task.name} (${result.status})`);
      this.emit('task:end', { task, result });

      return result;
    } catch (error) {
      this.logger.error(`Test failed: ${task.name}`, error);

      // Create failure result
      const result: TestResult = {
        name: task.name,
        status: TestStatus.FAILED,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        error: error as Error
      };

      this.emit('task:end', { task, result });

      return result;
    }
  }

  /**
   * Clear all tasks
   */
  clearTasks(): void {
    if (this.isRunning) {
      throw new Error('Cannot clear tasks while test runner is running');
    }

    this.tasks = [];
    this.completedTasks = [];
    this.failedTasks = [];
  }

  /**
   * Get the current runner status
   */
  getStatus(): {
    isRunning: boolean;
    pendingTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    return {
      isRunning: this.isRunning,
      pendingTasks: this.tasks.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.length,
      failedTasks: this.failedTasks.length
    };
  }
}
