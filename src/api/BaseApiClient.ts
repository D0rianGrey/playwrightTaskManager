/**
 * Base API Client
 * Provides a robust client for making API requests using Playwright's APIRequestContext
 */
import { APIRequestContext, APIResponse } from 'playwright';
import { Logger } from '@utils/Logger';
import { ConfigManager } from '@core/ConfigManager';

// Types for API requests
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | string[]>;
  timeout?: number;
  failOnStatusCode?: boolean;
  ignoreHTTPSErrors?: boolean;
}

// Types for API responses
export interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
  duration: number;
}

// API Error class for standardized error handling
export class ApiError extends Error {
  status?: number;
  statusText?: string;
  body?: unknown;
  headers?: Record<string, string>;

  constructor(message: string, details?: {
    status?: number;
    statusText?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }) {
    super(message);
    this.name = 'ApiError';

    if (details) {
      this.status = details.status;
      this.statusText = details.statusText;
      this.body = details.body;
      this.headers = details.headers;
    }
  }
}

/**
 * Base API Client class
 * Provides methods for making HTTP requests and handling responses
 */
export class BaseApiClient {
  protected request: APIRequestContext;
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;
  protected logger: Logger;

  /**
   * Create a new BaseApiClient
   * @param request Playwright APIRequestContext
   * @param baseUrl Base URL for all requests
   */
  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.logger = new Logger(this.constructor.name);

    // Set default headers
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add any headers from config
    const config = ConfigManager.getInstance();
    const apiHeaders = config.getConfig<Record<string, string>>('api.headers', {});
    this.defaultHeaders = { ...this.defaultHeaders, ...apiHeaders };
  }

  /**
   * Perform a GET request
   * @param path URL path to append to the base URL
   * @param options Request options
   */
  async get<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.sendRequest<T>('GET', path, options);
  }

  /**
   * Perform a POST request
   * @param path URL path to append to the base URL
   * @param data Data to send in the request body
   * @param options Request options
   */
  async post<T = unknown>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.sendRequest<T>('POST', path, { ...options, data });
  }

  /**
   * Perform a PUT request
   * @param path URL path to append to the base URL
   * @param data Data to send in the request body
   * @param options Request options
   */
  async put<T = unknown>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.sendRequest<T>('PUT', path, { ...options, data });
  }

  /**
   * Perform a DELETE request
   * @param path URL path to append to the base URL
   * @param options Request options
   */
  async delete<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.sendRequest<T>('DELETE', path, options);
  }

  /**
   * Perform a PATCH request
   * @param path URL path to append to the base URL
   * @param data Data to send in the request body
   * @param options Request options
   */
  async patch<T = unknown>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.sendRequest<T>('PATCH', path, { ...options, data });
  }

  /**
   * Send an HTTP request
   * @param method HTTP method
   * @param path URL path to append to the base URL
   * @param options Request options
   */
  protected async sendRequest<T>(
    method: string,
    path: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const url = this.resolveUrl(path);
    const headers = { ...this.defaultHeaders, ...options?.headers };

    // Define request options compatible with Playwright's fetch parameters
    const requestOptions = {
      method,
      headers,
      data: options?.data,
      // Convert our params format to the format Playwright expects
      params: options?.params ? new URLSearchParams(
        // Convert string[] values to comma-separated strings
        Object.entries(options.params).reduce((acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value.join(',') : value;
          return acc;
        }, {} as Record<string, string>)
      ) : undefined,
      timeout: options?.timeout ?? 30000,
      failOnStatusCode: options?.failOnStatusCode ?? false,
      ignoreHTTPSErrors: options?.ignoreHTTPSErrors ?? false
    };

    this.logger.info(`Sending ${method} request to ${url}`);
    if (options?.data) {
      this.logger.debug('Request data:', options.data);
    }

    const startTime = Date.now();
    let response: APIResponse;

    try {
      response = await this.request.fetch(url, requestOptions);
    } catch (error) {
      this.logger.error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApiError(`Request to ${url} failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;
    this.logger.info(`Received response from ${url} with status ${response.status()} in ${duration}ms`);

    // Parse response body based on content type
    let body: T;
    const contentType = response.headers()['content-type'] || '';

    try {
      if (contentType.includes('application/json')) {
        body = await response.json() as T;
      } else if (contentType.includes('text/')) {
        // For text types, convert to string
        body = await response.text() as unknown as T;
      } else {
        // For binary data, return as buffer
        body = await response.body() as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Failed to parse response body: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApiError(
        `Failed to parse response body from ${url}: ${error instanceof Error ? error.message : String(error)}`,
        { status: response.status(), statusText: response.statusText() }
      );
    }

    // Check for error status codes if failOnStatusCode is true
    if (options?.failOnStatusCode && response.status() >= 400) {
      this.logger.error(`Request failed with status ${response.status()}: ${response.statusText()}`);
      throw new ApiError(`Request to ${url} failed with status ${response.status()}: ${response.statusText()}`, {
        status: response.status(),
        statusText: response.statusText(),
        body,
        headers: response.headers()
      });
    }

    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body,
      raw: response,
      duration
    };
  }

  /**
   * Resolve a full URL from a path
   * @param path URL path to append to the base URL
   */
  protected resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path; // Absolute URL, return as is
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * Set a default header for all requests
   * @param name Header name
   * @param value Header value
   */
  setDefaultHeader(name: string, value: string): this {
    this.defaultHeaders[name] = value;
    return this;
  }

  /**
   * Set multiple default headers for all requests
   * @param headers Headers object
   */
  setDefaultHeaders(headers: Record<string, string>): this {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    return this;
  }

  /**
   * Get the current default headers
   */
  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }
}
