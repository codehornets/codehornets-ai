import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
export declare class TasksProxyController {
    private readonly tasksClient;
    private readonly logger;
    constructor(tasksClient: ClientProxy);
    proxyRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
