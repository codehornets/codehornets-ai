import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
export declare class AuthProxyController {
    private readonly configService;
    private readonly logger;
    private readonly authServiceUrl;
    constructor(configService: ConfigService);
    proxyRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
