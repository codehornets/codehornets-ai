import {
  All,
  Controller,
  Inject,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger(AuthProxyController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const pattern = `auth.${req.method.toLowerCase()}.${req.path.replace('/auth/', '')}`;
      const payload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: (req as any).user,
      };

      this.logger.debug(`Proxying request: ${pattern}`);

      const result = await firstValueFrom(
        this.authClient.send(pattern, payload).pipe(timeout(30000)),
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Auth service error: ${err.message}`, err.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Auth service unavailable',
        error: err.message,
      });
    }
  }
}
