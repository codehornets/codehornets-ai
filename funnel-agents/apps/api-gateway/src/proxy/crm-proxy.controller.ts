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
export class CrmProxyController {
  private readonly logger = new Logger(CrmProxyController.name);

  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  @All('workspaces/*')
  async proxyWorkspaces(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'workspaces');
  }

  @All('leads/*')
  async proxyLeads(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'leads');
  }

  @All('contacts/*')
  async proxyContacts(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'contacts');
  }

  @All('deals/*')
  async proxyDeals(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'deals');
  }

  @All('lead-activities/*')
  async proxyLeadActivities(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'lead-activities');
  }

  @All('client-feedback/*')
  async proxyClientFeedback(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'client-feedback');
  }

  private async proxyRequest(
    req: Request,
    res: Response,
    resource: string,
  ): Promise<Response> {
    try {
      const pathParts = req.path.split('/').filter(Boolean);
      const subPath = pathParts.slice(1).join('/');
      const pattern = `crm.${req.method.toLowerCase()}.${resource}.${subPath || 'root'}`;

      const payload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: (req as any).user,
      };

      this.logger.debug(`Proxying request: ${pattern}`);

      const result = await firstValueFrom(
        this.crmClient.send(pattern, payload).pipe(timeout(30000)),
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`CRM service error: ${err.message}`, err.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'CRM service unavailable',
        error: err.message,
      });
    }
  }
}
