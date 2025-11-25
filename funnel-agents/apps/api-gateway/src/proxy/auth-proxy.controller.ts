import {
  All,
  Controller,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger(AuthProxyController.name);
  private readonly authServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('AUTH_SERVICE_HOST', 'localhost');
    const port = this.configService.get('AUTH_SERVICE_PORT', '3001');
    this.authServiceUrl = `http://${host}:${port}`;
  }

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the path after /api/auth
      const targetPath = req.path.replace(/^\/api\/auth/, '/auth');
      const targetUrl = `${this.authServiceUrl}${targetPath}`;

      this.logger.debug(
        `Proxying ${req.method} request to: ${targetUrl}`,
      );

      // Forward the request to auth-service
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && {
            Authorization: req.headers.authorization as string,
          }),
        },
      };

      // Add body for non-GET requests
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.json();

      return res.status(response.status).json(data);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Auth service error: ${err.message}`, err.stack);
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Auth service unavailable',
        error: err.message,
      });
    }
  }
}
