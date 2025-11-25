import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class ReportsProxyController {
    private readonly reportsClient;
    private readonly logger;
    constructor(reportsClient: ClientProxy);
    proxyRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
