/**
 * API Mocker
 * Provides functionality for mocking API responses for testing
 */
import { Page, Route } from 'playwright';
import { Logger } from '../utils/Logger';

export interface MockResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  contentType?: string;
  body?: unknown;
  delay?: number;
}

export interface MockedEndpoint {
  url: string | RegExp;
  method?: string;
  response: MockResponseOptions;
  times?: number;
  active: boolean;
}

/**
 * ApiMocker class for mocking API responses
 */
export class ApiMocker {
  private page: Page;
  private mockedEndpoints: Map<string, MockedEndpoint>;
  private logger: Logger;
  private routeHandlers: Map<string, RegExp | string | ((route: Route) => void)>;

  /**
   * Create a new ApiMocker
   * @param page Playwright Page to use for request interception
   */
  constructor(page: Page) {
    this.page = page;
    this.mockedEndpoints = new Map();
    this.routeHandlers = new Map();
    this.logger = new Logger('ApiMocker');
  }

  /**
   * Mock a specific API endpoint
   * @param url URL or URL pattern to mock
   * @param options Response options
   * @param method HTTP method to mock (defaults to all methods)
   */
  async mockEndpoint(
    url: string | RegExp,
    options: MockResponseOptions,
    method?: string
  ): Promise<string> {
    // Generate a unique ID for this mock
    const id = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set default response options
    const response: MockResponseOptions = {
      status: 200,
      contentType: 'application/json',
      headers: {},
      ...options
    };

    // Set content type header if not provided
    if (response.contentType && !response.headers?.['content-type']) {
      response.headers = {
        ...response.headers,
        'content-type': response.contentType
      };
    }

    // Store the mocked endpoint
    this.mockedEndpoints.set(id, {
      url,
      method,
      response,
      active: true,
      times: undefined // unlimited
    });

    this.logger.info(`Mocked ${method || 'ALL'} ${url instanceof RegExp ? url.toString() : url}`);

    // Set up the route
    await this.setupRoute(id);

    return id;
  }

  /**
   * Mock a GET request
   * @param url URL or URL pattern to mock
   * @param options Response options
   */
  async mockGet(url: string | RegExp, options: MockResponseOptions): Promise<string> {
    return this.mockEndpoint(url, options, 'GET');
  }

  /**
   * Mock a POST request
   * @param url URL or URL pattern to mock
   * @param options Response options
   */
  async mockPost(url: string | RegExp, options: MockResponseOptions): Promise<string> {
    return this.mockEndpoint(url, options, 'POST');
  }

  /**
   * Mock a PUT request
   * @param url URL or URL pattern to mock
   * @param options Response options
   */
  async mockPut(url: string | RegExp, options: MockResponseOptions): Promise<string> {
    return this.mockEndpoint(url, options, 'PUT');
  }

  /**
   * Mock a DELETE request
   * @param url URL or URL pattern to mock
   * @param options Response options
   */
  async mockDelete(url: string | RegExp, options: MockResponseOptions): Promise<string> {
    return this.mockEndpoint(url, options, 'DELETE');
  }

  /**
   * Mock a PATCH request
   * @param url URL or URL pattern to mock
   * @param options Response options
   */
  async mockPatch(url: string | RegExp, options: MockResponseOptions): Promise<string> {
    return this.mockEndpoint(url, options, 'PATCH');
  }

  /**
   * Set up a route handler for a mocked endpoint
   * @param id Mocked endpoint ID
   */
  private async setupRoute(id: string): Promise<void> {
    const endpoint = this.mockedEndpoints.get(id);
    if (!endpoint) {
      throw new Error(`Mock endpoint with ID ${id} not found`);
    }

    // Remove any existing route handler
    await this.removeRouteHandler(id);

    // Create a new route handler
    const routeHandler = await this.page.route(endpoint.url, async (route, request) => {
      // Check if the mock is still active
      const mock = this.mockedEndpoints.get(id);
      if (!mock || !mock.active) {
        await route.continue();
        return;
      }

      // Check if the method matches (if specified)
      if (mock.method && request.method() !== mock.method) {
        await route.continue();
        return;
      }

      this.logger.debug(`Intercepted request to ${request.url()}`);

      // Add delay if specified
      if (mock.response.delay) {
        await new Promise(resolve => setTimeout(resolve, mock.response.delay));
      }

      // Prepare the response body
      let body: string | Buffer = '';
      if (mock.response.body !== undefined) {
        if (typeof mock.response.body === 'object' || mock.response.body === null) {
          // Use JSON.stringify for all object types including null
          body = JSON.stringify(mock.response.body);
        } else if (typeof mock.response.body === 'string') {
          // String values can be used directly
          body = mock.response.body;
        } else {
          // For primitive types (number, boolean, etc.)
          // Use explicit type checking to avoid unsafe String conversion of objects
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          body = String(mock.response.body);
        }
      }

      // Fulfill the request with the mock response
      await route.fulfill({
        status: mock.response.status,
        headers: mock.response.headers,
        body
      });

      this.logger.debug(`Returned mocked response for ${request.url()} with status ${mock.response.status}`);

      // Decrement the times counter if set
      if (mock.times !== undefined) {
        mock.times--;
        if (mock.times <= 0) {
          mock.active = false;
          this.logger.debug(`Mock for ${request.url()} has been used up and is now inactive`);
        }
      }
    });

    // Store the route handler
    this.routeHandlers.set(id, routeHandler);
  }

  /**
   * Remove a route handler
   * @param id Mocked endpoint ID
   */
  private async removeRouteHandler(id: string): Promise<void> {
    const routeHandler = this.routeHandlers.get(id);
    if (routeHandler) {
      await this.page.unroute(routeHandler);
      this.routeHandlers.delete(id);
    }
  }

  /**
   * Disable a mock (stop intercepting requests)
   * @param id Mock ID
   */
  async disableMock(id: string): Promise<void> {
    const endpoint = this.mockedEndpoints.get(id);
    if (endpoint) {
      endpoint.active = false;
      this.logger.info(`Disabled mock for ${endpoint.url instanceof RegExp ? endpoint.url.toString() : endpoint.url}`);
    }
  }

  /**
   * Enable a mock (start intercepting requests)
   * @param id Mock ID
   */
  async enableMock(id: string): Promise<void> {
    const endpoint = this.mockedEndpoints.get(id);
    if (endpoint) {
      endpoint.active = true;
      this.logger.info(`Enabled mock for ${endpoint.url instanceof RegExp ? endpoint.url.toString() : endpoint.url}`);
    }
  }

  /**
   * Remove a mock completely
   * @param id Mock ID
   */
  async removeMock(id: string): Promise<void> {
    await this.removeRouteHandler(id);
    this.mockedEndpoints.delete(id);
  }

  /**
   * Clear all mocks
   */
  async clearAllMocks(): Promise<void> {
    for (const id of this.routeHandlers.keys()) {
      await this.removeRouteHandler(id);
    }
    this.mockedEndpoints.clear();
    this.logger.info('Cleared all API mocks');
  }

  /**
   * Get a list of all mocked endpoints
   */
  getMocks(): MockedEndpoint[] {
    return Array.from(this.mockedEndpoints.values());
  }
}
