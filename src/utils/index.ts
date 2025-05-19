/**
 * Утилиты для тестового фреймворка
 */

// Функция для генерации случайных данных
export const Random = {
  // Генерация случайного целого числа в диапазоне
  integer: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Генерация случайной строки
  string: (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Генерация случайного email
  email: (): string => {
    const username = Random.string(8).toLowerCase();
    const domains = ['example.com', 'test.org', 'demo.net', 'sample.io'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  },

  // Генерация случайного элемента из массива
  fromArray: <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  },
};

// Функции для работы с датами
export const DateUtils = {
  // Форматирование даты
  format: (date: Date, format = 'YYYY-MM-DD'): string => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  // Добавление дней к дате
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};

// Функции для логирования
export const Logger = {
  info: (message: string): void => {
    console.info(`[INFO] ${new Date().toISOString()}: ${message}`);
  },

  warn: (message: string): void => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  },

  error: (message: string, error?: Error): void => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
      console.error(error);
    }
  },

  debug: (message: string, data?: unknown): void => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
      if (data !== undefined) {
        console.debug(data);
      }
    }
  },
};

// Функции для ожидания
export const Wait = {
  // Ожидание указанное количество миллисекунд
  forMilliseconds: async (ms: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  // Ожидание пока условие не станет истинным
  forCondition: async <T>(
    conditionFn: () => Promise<T> | T,
    options: {
      timeout?: number;
      interval?: number;
      timeoutMessage?: string;
    } = {}
  ): Promise<T> => {
    const { timeout = 10000, interval = 100, timeoutMessage = 'Timeout waiting for condition' } = options;
    const startTime = Date.now();

    while (true) {
      const result = await conditionFn();
      if (result) {
        return result;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(timeoutMessage);
      }

      await Wait.forMilliseconds(interval);
    }
  },
};
