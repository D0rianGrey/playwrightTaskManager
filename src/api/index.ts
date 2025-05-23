/**
 * API Testing Components
 * Provides functionality for testing APIs using Playwright
 */

import { TestBase } from '../core';
import { APIRequestContext, request } from 'playwright';

// Export all API components
export * from './BaseApiClient';
export * from './SchemaValidator';
export * from './ApiMocker';

// HTTP Method enum
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
  protected requestContext: APIRequestContext | null = null;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize API request context
   */
  async setup(): Promise<void> {
    await super.setup();
    this.requestContext = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Clean up API request context
   */
  async teardown(): Promise<void> {
    if (this.requestContext) {
      await this.requestContext.dispose();
      this.requestContext = null;
    }
    await super.teardown();
  }

  /**
   * Send an HTTP request
   * @param request Request configuration
   * @returns API response
   */
  async request<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>> {
    if (!this.requestContext) {
      throw new Error('API request context not initialized. Call setup() first.');
    }

    const startTime = Date.now();
    
    // Convert params to URL search params if provided
    const url = request.params
      ? `${request.url}?${new URLSearchParams(request.params).toString()}`
      : request.url;

    // Prepare request options
    const options: Record<string, any> = {
      headers: request.headers,
      timeout: request.timeout,
    };

    // Add body if present
    if (request.body) {
      options.data = request.body;
    }

    // Send the request using Playwright's request context
    let response;
    try {
      response = await this.requestContext.fetch(url, {
        method: request.method,
        ...options
      });
    } catch (error) {
      throw new Error(`API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const endTime = Date.now();
    
    // Parse response body based on content type
    let body: T;
    const contentType = response.headers()['content-type'] || '';

    if (contentType.includes('application/json')) {
      body = await response.json() as T;
    } else if (contentType.includes('text/')) {
      body = await response.text() as unknown as T;
    } else {
      body = await response.body() as unknown as T;
    }

    return {
      status: response.status(),
      headers: response.headers(),
      body,
      duration: endTime - startTime,
    };
  }
}

// Utility functions for API testing
export const ApiAssertions = {
  /**
   * Check if the response is successful (2xx status)
   */
  isSuccess: (response: { status: number }): boolean => {
    return response.status >= 200 && response.status < 300;
  },
  
  /**
   * Check if the response is a client error (4xx status)
   */
  isClientError: (response: { status: number }): boolean => {
    return response.status >= 400 && response.status < 500;
  },
  
  /**
   * Check if the response is a server error (5xx status)
   */
  isServerError: (response: { status: number }): boolean => {
    return response.status >= 500;
  },

  /**
   * Check if the response is a specific status code
   */
  hasStatus: (response: { status: number }, status: number): boolean => {
    return response.status === status;
  },

  /**
   * Check if the response has a specific header
   */
  hasHeader: (response: { headers: Record<string, string> }, name: string): boolean => {
    return Object.keys(response.headers).some(
      header => header.toLowerCase() === name.toLowerCase()
    );
  },

  /**
   * Check if the response has a specific header with a specific value
   */
  hasHeaderWithValue: (
    response: { headers: Record<string, string> },
    name: string,
    value: string
  ): boolean => {
    const headerName = Object.keys(response.headers).find(
      header => header.toLowerCase() === name.toLowerCase()
    );

    return headerName !== undefined &&
      response.headers[headerName].toLowerCase() === value.toLowerCase();
  },

  /**
   * Check if the response body contains a specific property
   */
  hasProperty: (response: { body: unknown }, path: string): boolean => {
    if (typeof response.body !== 'object' || response.body === null) {
      return false;
    }

    const parts = path.split('.');
    let current: any = response.body;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return false;
      }

      current = current[part];
    }

    return current !== undefined;
  },

  /**
   * Check if the response body has a specific property with a specific value
   */
  hasPropertyWithValue: (response: { body: unknown }, path: string, value: unknown): boolean => {
    if (typeof response.body !== 'object' || response.body === null) {
      return false;
    }

    const parts = path.split('.');
    let current: any = response.body;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return false;
      }

      current = current[part];
    }

    return current === value;
  }
};
