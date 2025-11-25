import { HttpService } from '@nestjs/axios';
import { HttpClientOptions, HttpRequestConfig, HttpResponse, RetryConfig } from './http.types';
export declare class HttpClientService {
    private readonly httpService;
    private options?;
    private readonly logger;
    private readonly defaultRetryConfig;
    constructor(httpService: HttpService, options?: HttpClientOptions | undefined);
    get<T>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
    post<T>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
    put<T>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
    patch<T>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
    delete<T>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
    request<T>(config: HttpRequestConfig, retryConfig?: RetryConfig): Promise<HttpResponse<T>>;
    private transformError;
    private delay;
}
