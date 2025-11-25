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
export class CampaignsProxyController {
  private readonly logger = new Logger(CampaignsProxyController.name);

  constructor(
    @Inject('CAMPAIGNS_SERVICE') private readonly campaignsClient: ClientProxy,
  ) {}

  @All('campaigns/*')
  async proxyCampaigns(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'campaigns');
  }

  @All('campaign-templates/*')
  async proxyCampaignTemplates(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'campaign-templates');
  }

  private async proxyRequest(
    req: Request,
    res: Response,
    resource: string,
  ): Promise<Response> {
    try {
      const pathParts = req.path.split('/').filter(Boolean);
      const subPath = pathParts.slice(1).join('/');
      const pattern = `campaigns.${req.method.toLowerCase()}.${resource}.${subPath || 'root'}`;

      const payload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: (req as any).user,
      };

      this.logger.debug(`Proxying request: ${pattern}`);

      const result = await firstValueFrom(
        this.campaignsClient.send(pattern, payload).pipe(timeout(30000)),
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Campaigns service error: ${err.message}`,
        err.stack,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Campaigns service unavailable',
        error: err.message,
      });
    }
  }
}
