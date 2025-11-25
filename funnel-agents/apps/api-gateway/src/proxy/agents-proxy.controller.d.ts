import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class AgentsProxyController {
    private readonly agentsClient;
    private readonly logger;
    constructor(agentsClient: ClientProxy);
    proxyAgents(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyAi(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyIntegrations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private proxyRequest;
}
