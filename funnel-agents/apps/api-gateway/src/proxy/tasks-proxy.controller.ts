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

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksProxyController {
  private readonly logger = new Logger(TasksProxyController.name);

  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientProxy,
  ) {}

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const pathParts = req.path.split('/').filter(Boolean);
      const subPath = pathParts.slice(1).join('/');
      const pattern = `tasks.${req.method.toLowerCase()}.${subPath || 'root'}`;

      const payload = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        user: (req as any).user,
      };

      this.logger.debug(`Proxying request: ${pattern}`);

      const result = await firstValueFrom(
        this.tasksClient.send(pattern, payload).pipe(timeout(30000)),
      );

      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Tasks service error: ${err.message}`, err.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Tasks service unavailable',
        error: err.message,
      });
    }
  }
}
