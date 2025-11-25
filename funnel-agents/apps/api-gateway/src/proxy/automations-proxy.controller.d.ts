import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class AutomationsProxyController {
    private readonly automationsClient;
    private readonly logger;
    constructor(automationsClient: ClientProxy);
    proxyWorkflows(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyWorkflowRuns(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private proxyRequest;
}
