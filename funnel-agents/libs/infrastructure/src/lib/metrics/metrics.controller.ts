import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

@Controller('metrics')
export class MetricsController extends PrometheusController {
  @Get()
  async getMetrics(@Res() response: Response): Promise<void> {
    // Set appropriate headers for Prometheus scraping
    response.set('Content-Type', this.contentType);
    response.end(await this.metrics());
  }
}
