/**
 * Example: How to add logging to HTTP client requests
 *
 * This shows how to log outgoing HTTP requests made with @nestjs/axios
 * Copy and adapt these examples to your services.
 */

/*
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnhancedLoggingModule } from '@funnelagents/infrastructure';

@Module({
  imports: [
    EnhancedLoggingModule.forRoot({
      serviceName: 'my-service',
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
})
export class SomeModule {}
*/

/**
 * Service making HTTP requests with automatic logging
 */

/*
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { EnhancedLoggerService, getCorrelationId } from '@funnelagents/infrastructure';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: EnhancedLoggerService
  ) {
    this.logger.setContext('ExternalApiService');
  }

  async callExternalApi(endpoint: string, data: any) {
    const startTime = Date.now();
    const correlationId = getCorrelationId();

    try {
      this.logger.log(`Calling external API: ${endpoint}`, {
        endpoint,
        correlationId,
      });

      const response = await firstValueFrom(
        this.httpService.post(endpoint, data, {
          headers: {
            'X-Correlation-Id': correlationId,
            'Content-Type': 'application/json',
          },
        })
      );

      const duration = Date.now() - startTime;

      this.logger.logHttpRequest(
        'POST',
        endpoint,
        response.status,
        duration,
        {
          success: true,
          responseSize: JSON.stringify(response.data).length,
        }
      );

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `External API call failed: ${endpoint}`,
        error,
        {
          endpoint,
          duration,
          statusCode: error?.response?.status,
          errorMessage: error?.message || 'Unknown error',
        }
      );

      throw error;
    }
  }

  async callThirdPartyIntegration(service: string, operation: string) {
    const startTime = Date.now();

    try {
      // Integration logic here
      const result = await this.performIntegration(service, operation);

      const duration = Date.now() - startTime;
      this.logger.logIntegration(service, operation, true, duration);

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.logIntegration(service, operation, false, duration, {
        error: error?.message || 'Unknown error',
      });

      throw error;
    }
  }

  private async performIntegration(service: string, operation: string) {
    // Mock implementation
    return { success: true };
  }
}
*/
