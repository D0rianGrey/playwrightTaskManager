/**
 * Hooks System
 * Provides a way to extend the framework with custom behavior
 */
import { BeforeAllHook, AfterAllHook, BeforeEachHook, AfterEachHook, TestConfig, TestResult } from './types';

/**
 * Hook Manager class to register and execute hooks
 */
export class HookManager {
  private static instance: HookManager;

  private beforeAllHooks: BeforeAllHook[] = [];
  private afterAllHooks: AfterAllHook[] = [];
  private beforeEachHooks: BeforeEachHook[] = [];
  private afterEachHooks: AfterEachHook[] = [];

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get HookManager instance
   */
  static getInstance(): HookManager {
    if (!HookManager.instance) {
      HookManager.instance = new HookManager();
    }
    return HookManager.instance;
  }

  /**
   * Register a hook to run before all tests
   */
  registerBeforeAll(hook: BeforeAllHook): void {
    this.beforeAllHooks.push(hook);
  }

  /**
   * Register a hook to run after all tests
   */
  registerAfterAll(hook: AfterAllHook): void {
    this.afterAllHooks.push(hook);
  }

  /**
   * Register a hook to run before each test
   */
  registerBeforeEach(hook: BeforeEachHook): void {
    this.beforeEachHooks.push(hook);
  }

  /**
   * Register a hook to run after each test
   */
  registerAfterEach(hook: AfterEachHook): void {
    this.afterEachHooks.push(hook);
  }

  /**
   * Execute all before all hooks
   */
  async runBeforeAll(): Promise<void> {
    for (const hook of this.beforeAllHooks) {
      await hook();
    }
  }

  /**
   * Execute all after all hooks
   */
  async runAfterAll(): Promise<void> {
    for (const hook of this.afterAllHooks) {
      await hook();
    }
  }

  /**
   * Execute all before each hooks
   */
  async runBeforeEach(config: TestConfig): Promise<void> {
    for (const hook of this.beforeEachHooks) {
      await hook(config);
    }
  }

  /**
   * Execute all after each hooks
   */
  async runAfterEach(result: TestResult): Promise<void> {
    for (const hook of this.afterEachHooks) {
      await hook(result);
    }
  }

  /**
   * Clear all registered hooks
   */
  clearHooks(): void {
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }
}

/**
 * Helper functions to register hooks
 */

/**
 * Register a hook to run before all tests
 */
export function beforeAll(hook: BeforeAllHook): void {
  HookManager.getInstance().registerBeforeAll(hook);
}

/**
 * Register a hook to run after all tests
 */
export function afterAll(hook: AfterAllHook): void {
  HookManager.getInstance().registerAfterAll(hook);
}

/**
 * Register a hook to run before each test
 */
export function beforeEach(hook: BeforeEachHook): void {
  HookManager.getInstance().registerBeforeEach(hook);
}

/**
 * Register a hook to run after each test
 */
export function afterEach(hook: AfterEachHook): void {
  HookManager.getInstance().registerAfterEach(hook);
}
