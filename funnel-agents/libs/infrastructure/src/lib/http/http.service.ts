import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosError } from 'axios';
import {
  HttpClientOptions,
  HttpRequestConfig,
  HttpResponse,
  HttpError,
  RetryConfig,
} from './http.types';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly defaultRetryConfig: RetryConfig;

  constructor(
    private readonly httpService: HttpService,
    @Optional() @Inject('HTTP_CLIENT_OPTIONS') private options?: HttpClientOptions
  ) {
    this.defaultRetryConfig = {
      attempts: options?.retryAttempts ?? 3,
      delay: options?.retryDelay ?? 1000,
      shouldRetry: (error) => {
        const status = error.status;
        return !status || status >= 500 || status === 429;
      },
    };
  }

  async get<T>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  async delete<T>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async request<T>(config: HttpRequestConfig, retryConfig?: RetryConfig): Promise<HttpResponse<T>> {
    const retry = retryConfig ?? this.defaultRetryConfig;
    let lastError: HttpError | null = null;

    for (let attempt = 1; attempt <= retry.attempts; attempt++) {
      try {
        const axiosConfig: AxiosRequestConfig = {
          url: config.url,
          method: config.method,
          headers: { ...this.options?.headers, ...config.headers },
          params: config.params,
          data: config.data,
          timeout: config.timeout ?? this.options?.timeout ?? 30000,
        };

        const response = await firstValueFrom(
          this.httpService.request<T>(axiosConfig)
        );

        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
        };
      } catch (error) {
        lastError = this.transformError(error as AxiosError);

        if (attempt < retry.attempts && retry.shouldRetry?.(lastError)) {
          this.logger.warn(
            `Request to ${config.url} failed (attempt ${attempt}/${retry.attempts}). Retrying in ${retry.delay}ms...`
          );
          await this.delay(retry.delay * attempt); // Exponential backoff
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  private transformError(error: AxiosError): HttpError {
    return {
      message: error.message,
      status: error.response?.status,
      code: error.code,
      response: error.response
        ? {
            data: error.response.data,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers as Record<string, string>,
          }
        : undefined,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
