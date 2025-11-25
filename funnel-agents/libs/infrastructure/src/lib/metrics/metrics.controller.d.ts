import { Response } from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
export declare class MetricsController extends PrometheusController {
    getMetrics(response: Response): Promise<void>;
}
