import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class CrmProxyController {
    private readonly crmClient;
    private readonly logger;
    constructor(crmClient: ClientProxy);
    proxyWorkspaces(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyLeads(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyContacts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyDeals(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyLeadActivities(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyClientFeedback(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private proxyRequest;
}
