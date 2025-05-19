/**
 * Компоненты для API тестирования
 */

import { TestBase } from '../core';

// Типы HTTP методов
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

// Интерфейс для HTTP запроса
export interface ApiRequest {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  timeout?: number;
}

// Интерфейс для HTTP ответа
export interface ApiResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T;
  duration: number;
}

// Базовый класс для API тестов
export class ApiTest extends TestBase {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }

  // Метод для выполнения HTTP запроса
  async request<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    
    // Здесь будет реализация HTTP запроса
    // В реальном коде будет использоваться fetch или другая библиотека
    
    const endTime = Date.now();
    
    // Заглушка для примера
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: {} as T,
      duration: endTime - startTime,
    };
  }
}

// Утилиты для проверки ответов API
export const ApiAssertions = {
  isSuccess: (response: ApiResponse): boolean => {
    return response.status >= 200 && response.status < 300;
  },
  
  isClientError: (response: ApiResponse): boolean => {
    return response.status >= 400 && response.status < 500;
  },
  
  isServerError: (response: ApiResponse): boolean => {
    return response.status >= 500;
  },
};
