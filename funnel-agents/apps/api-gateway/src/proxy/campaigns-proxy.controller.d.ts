import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class CampaignsProxyController {
    private readonly campaignsClient;
    private readonly logger;
    constructor(campaignsClient: ClientProxy);
    proxyCampaigns(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyCampaignTemplates(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private proxyRequest;
}
