/**
 * Конфигурация тестового фреймворка
 */

// Интерфейс для глобальной конфигурации
export interface GlobalConfig {
  baseUrl?: string;
  apiBaseUrl?: string;
  timeout?: number;
  retries?: number;
  headless?: boolean;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  slowMo?: number;
  screenshotsPath?: string;
  videosPath?: string;
  tracesPath?: string;
  reportPath?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  env?: 'development' | 'staging' | 'production' | 'test';
}

// Класс для управления конфигурацией
export class ConfigManager {
  private static instance: ConfigManager;
  private config: GlobalConfig = {};

  private constructor() {
    // Приватный конструктор для синглтона
    this.loadDefaultConfig();
  }

  // Получение экземпляра синглтона
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Загрузка конфигурации по умолчанию
  private loadDefaultConfig(): void {
    this.config = {
      timeout: 30000,
      retries: 2,
      headless: process.env.CI === 'true',
      browserType: 'chromium',
      viewport: { width: 1280, height: 720 },
      logLevel: 'info',
      env: (process.env.TEST_ENV as GlobalConfig['env']) || 'development',
    };

    // Загрузка из переменных окружения
    if (process.env.BASE_URL) {
      this.config.baseUrl = process.env.BASE_URL;
    }

    if (process.env.API_BASE_URL) {
      this.config.apiBaseUrl = process.env.API_BASE_URL;
    }

    if (process.env.TIMEOUT) {
      this.config.timeout = parseInt(process.env.TIMEOUT, 10);
    }

    if (process.env.RETRIES) {
      this.config.retries = parseInt(process.env.RETRIES, 10);
    }

    if (process.env.HEADLESS) {
      this.config.headless = process.env.HEADLESS === 'true';
    }

    if (process.env.BROWSER_TYPE) {
      this.config.browserType = process.env.BROWSER_TYPE as GlobalConfig['browserType'];
    }

    if (process.env.LOG_LEVEL) {
      this.config.logLevel = process.env.LOG_LEVEL as GlobalConfig['logLevel'];
    }
  }

  // Получение всей конфигурации
  public getConfig(): GlobalConfig {
    return { ...this.config };
  }

  // Получение конкретного параметра конфигурации
  public get<K extends keyof GlobalConfig>(key: K): GlobalConfig[K] | undefined {
    return this.config[key];
  }

  // Установка конкретного параметра конфигурации
  public set<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
    this.config[key] = value;
  }

  // Обновление нескольких параметров конфигурации
  public update(partialConfig: Partial<GlobalConfig>): void {
    this.config = {
      ...this.config,
      ...partialConfig,
    };
  }

  // Сброс конфигурации к значениям по умолчанию
  public reset(): void {
    this.loadDefaultConfig();
  }
}

// Экспорт экземпляра конфигурации для использования в других модулях
export const config = ConfigManager.getInstance();

// Функция для загрузки конфигурации из файла
export async function loadConfigFromFile(filePath: string): Promise<void> {
  try {
    // В реальном коде здесь будет загрузка из файла
    // Например, с использованием fs.promises.readFile и JSON.parse
    
    // Заглушка для примера
    console.info(`Loading config from file: ${filePath}`);
    
    // Обновление конфигурации
    // config.update(loadedConfig);
  } catch (error) {
    console.error(`Failed to load config from file: ${filePath}`, error);
  }
}
