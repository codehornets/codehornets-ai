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
export class ContentProxyController {
  private readonly logger = new Logger(ContentProxyController.name);

  constructor(
    @Inject('CONTENT_SERVICE') private readonly contentClient: ClientProxy,
  ) {}

  @All('content/*')
  async proxyContent(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'content');
  }

  @All('files/*')
  async proxyFiles(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'files');
  }

  private async proxyRequest(
    req: Request,
    res: Response,
    resource: string,
  ): Promise<Response> {
    try {
      const pathParts = req.path.split('/').filter(Boolean);
      const subPath = pathParts.slice(1).join('/');
      const pattern = `content.${req.method.toLowerCase()}.${resource}.${subPath || 'root'}`;

      const payload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: (req as any).user,
      };

      this.logger.debug(`Proxying request: ${pattern}`);

      const result = await firstValueFrom(
        this.contentClient.send(pattern, payload).pipe(timeout(30000)),
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Content service error: ${err.message}`,
        err.stack,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Content service unavailable',
        error: err.message,
      });
    }
  }
}
