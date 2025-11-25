import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

/**
 * WebhookNodeHandler - Calls external HTTP endpoints
 * Supports GET, POST, PUT, PATCH, DELETE with custom headers and body
 */
@Injectable()
export class WebhookNodeHandler extends BaseNodeHandler {
  private readonly logger = new Logger(WebhookNodeHandler.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const resolvedData = this.resolveNodeData(node.data, context);
      const { url, method, headers, body, params, timeout, auth } = resolvedData;

      if (!url) {
        return this.failure('Webhook URL is required');
      }

      const httpMethod = (method || 'POST').toUpperCase();
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      if (!validMethods.includes(httpMethod)) {
        return this.failure(`Invalid HTTP method: ${httpMethod}`);
      }

      this.logger.log(`Calling webhook: ${httpMethod} ${url}`, {
        nodeId: node.id,
      });

      const requestConfig: any = {
        timeout: timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        params,
      };

      // Add authentication if provided
      if (auth) {
        if (auth.type === 'bearer') {
          requestConfig.headers['Authorization'] = `Bearer ${auth.token}`;
        } else if (auth.type === 'basic') {
          requestConfig.auth = {
            username: auth.username,
            password: auth.password,
          };
        } else if (auth.type === 'apiKey') {
          if (auth.location === 'header') {
            requestConfig.headers[auth.key] = auth.value;
          } else if (auth.location === 'query') {
            requestConfig.params = {
              ...requestConfig.params,
              [auth.key]: auth.value,
            };
          }
        }
      }

      const startTime = Date.now();
      let response: any;

      // Make the HTTP request
      switch (httpMethod) {
        case 'GET':
          response = await firstValueFrom(this.httpService.get(url, requestConfig));
          break;
        case 'POST':
          response = await firstValueFrom(this.httpService.post(url, body, requestConfig));
          break;
        case 'PUT':
          response = await firstValueFrom(this.httpService.put(url, body, requestConfig));
          break;
        case 'PATCH':
          response = await firstValueFrom(this.httpService.patch(url, body, requestConfig));
          break;
        case 'DELETE':
          response = await firstValueFrom(this.httpService.delete(url, requestConfig));
          break;
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const output = {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime,
        url,
        method: httpMethod,
        requestedAt: new Date(startTime).toISOString(),
        completedAt: new Date(endTime).toISOString(),
      };

      this.logger.log(`Webhook call successful`, {
        nodeId: node.id,
        statusCode: response.status,
        responseTime,
      });

      return this.success(output);
    } catch (error: any) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText || error.message}`
        : (error instanceof Error ? error.message : String(error));

      const errorDetails = {
        message: errorMessage,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack,
      };

      this.logger.error(`Webhook call failed: ${errorMessage}`, errorDetails);

      return this.failure(`Webhook call failed: ${errorMessage}`);
    }
  }

  validate(node: WorkflowNode): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!node.data.url) {
      errors.push('Webhook URL is required');
    }

    // Validate URL format
    if (node.data.url) {
      try {
        new URL(node.data.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }

    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (node.data.method && !validMethods.includes(node.data.method.toUpperCase())) {
      errors.push(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`);
    }

    if (node.data.timeout && typeof node.data.timeout !== 'number') {
      errors.push('Timeout must be a number (milliseconds)');
    }

    if (node.data.timeout && node.data.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms (1 second)');
    }

    if (node.data.timeout && node.data.timeout > 120000) {
      errors.push('Timeout must not exceed 120000ms (2 minutes)');
    }

    if (node.data.auth) {
      const validAuthTypes = ['bearer', 'basic', 'apiKey'];
      if (!validAuthTypes.includes(node.data.auth.type)) {
        errors.push(`Invalid auth type. Must be one of: ${validAuthTypes.join(', ')}`);
      }

      if (node.data.auth.type === 'bearer' && !node.data.auth.token) {
        errors.push('Bearer token is required for bearer auth');
      }

      if (node.data.auth.type === 'basic' && (!node.data.auth.username || !node.data.auth.password)) {
        errors.push('Username and password are required for basic auth');
      }

      if (node.data.auth.type === 'apiKey' && (!node.data.auth.key || !node.data.auth.value)) {
        errors.push('Key and value are required for API key auth');
      }

      if (node.data.auth.type === 'apiKey' && node.data.auth.location && !['header', 'query'].includes(node.data.auth.location)) {
        errors.push('API key location must be either header or query');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
