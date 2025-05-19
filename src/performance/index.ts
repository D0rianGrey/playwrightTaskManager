/**
 * Компоненты для тестирования производительности
 */

import { TestBase } from '../core';

// Интерфейс для метрик производительности
export interface PerformanceMetrics {
  loadTime?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  cumulativeLayoutShift?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// Интерфейс для конфигурации тестов производительности
export interface PerformanceConfig {
  iterations?: number;
  warmupIterations?: number;
  cooldownMs?: number;
  networkThrottling?: {
    downloadSpeed?: number; // в Kbps
    uploadSpeed?: number; // в Kbps
    latency?: number; // в ms
  };
  cpuThrottling?: number; // множитель замедления
}

// Базовый класс для тестов производительности
export class PerformanceTest extends TestBase {
  protected config: PerformanceConfig;
  protected metrics: PerformanceMetrics[] = [];

  constructor(config: PerformanceConfig = {}) {
    super();
    this.config = {
      iterations: 3,
      warmupIterations: 1,
      cooldownMs: 1000,
      ...config,
    };
  }

  // Метод для запуска теста производительности
  async runPerformanceTest(testFn: () => Promise<PerformanceMetrics>): Promise<PerformanceMetrics> {
    // Прогрев
    for (let i = 0; i < (this.config.warmupIterations || 0); i++) {
      await testFn();
      await this.cooldown();
    }

    // Основные итерации
    for (let i = 0; i < (this.config.iterations || 1); i++) {
      const metrics = await testFn();
      this.metrics.push(metrics);
      await this.cooldown();
    }

    // Вычисление средних значений
    return this.calculateAverageMetrics();
  }

  // Метод для паузы между итерациями
  private async cooldown(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.config.cooldownMs || 0));
  }

  // Метод для вычисления средних значений метрик
  private calculateAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {};
    }

    const result: PerformanceMetrics = {};
    const keys = Object.keys(this.metrics[0]) as Array<keyof PerformanceMetrics>;

    for (const key of keys) {
      let sum = 0;
      let count = 0;

      for (const metric of this.metrics) {
        if (metric[key] !== undefined) {
          sum += Number(metric[key]);
          count++;
        }
      }

      if (count > 0) {
        result[key] = sum / count;
      }
    }

    return result;
  }
}

// Утилиты для анализа производительности
export const PerformanceUtils = {
  // Метод для форматирования метрик в читаемый вид
  formatMetrics: (metrics: PerformanceMetrics): string => {
    return Object.entries(metrics)
      .map(([key, value]) => {
        if (value === undefined) return '';
        
        // Форматирование в зависимости от типа метрики
        if (key.includes('Time') || key.includes('Paint')) {
          return `${key}: ${value.toFixed(2)}ms`;
        } else if (key === 'cumulativeLayoutShift') {
          return `${key}: ${value.toFixed(4)}`;
        } else if (key.includes('Usage')) {
          return `${key}: ${value.toFixed(2)}%`;
        }
        
        return `${key}: ${value}`;
      })
      .filter(Boolean)
      .join('\n');
  },
};
