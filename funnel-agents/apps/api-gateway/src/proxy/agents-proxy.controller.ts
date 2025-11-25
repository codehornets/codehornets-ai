import {
  All,
  Controller,
  Inject,
  Req,
  Res,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthGuard } from '../bootstrap/guards/auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class AgentsProxyController {
  private readonly logger = new Logger(AgentsProxyController.name);

  constructor(
    @Inject('AGENTS_SERVICE') private readonly agentsClient: ClientProxy,
  ) {}

  @All('agents/*')
  async proxyAgents(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'agents');
  }

  @All('ai/*')
  async proxyAi(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'ai');
  }

  @All('integrations/*')
  async proxyIntegrations(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'integrations');
  }

  private async proxyRequest(
    req: Request,
    res: Response,
    resource: string,
  ): Promise<Response> {
    try {
      const pathParts = req.path.split('/').filter(Boolean);
      const subPath = pathParts.slice(1).join('/');
      const pattern = `agents.${req.method.toLowerCase()}.${resource}.${subPath || 'root'}`;

      const payload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: (req as any).user,
      };

      this.logger.debug(`Proxying request: ${pattern}`);

      const result = await firstValueFrom(
        this.agentsClient.send(pattern, payload).pipe(timeout(30000)),
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Agents service error: ${err.message}`,
        err.stack,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Agents service unavailable',
        error: err.message,
      });
    }
  }
}
