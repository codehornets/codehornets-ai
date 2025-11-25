import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class ContentProxyController {
    private readonly contentClient;
    private readonly logger;
    constructor(contentClient: ClientProxy);
    proxyContent(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    proxyFiles(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private proxyRequest;
}
