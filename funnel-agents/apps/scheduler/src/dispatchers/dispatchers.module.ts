import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WorkflowDispatcherService } from './workflow-dispatcher.service';
import { ReportDispatcherService } from './report-dispatcher.service';
import { AgentDispatcherService } from './agent-dispatcher.service';
import { CustomDispatcherService } from './custom-dispatcher.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TASKS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.TASKS_SERVICE_PORT || '', 10) || 3006,
        },
      },
      {
        name: 'AUTOMATIONS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTOMATIONS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.AUTOMATIONS_SERVICE_PORT || '', 10) || 3007,
        },
      },
      {
        name: 'REPORTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.REPORTS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.REPORTS_SERVICE_PORT || '', 10) || 3008,
        },
      },
    ]),
  ],
  providers: [
    WorkflowDispatcherService,
    ReportDispatcherService,
    AgentDispatcherService,
    CustomDispatcherService,
  ],
  exports: [
    WorkflowDispatcherService,
    ReportDispatcherService,
    AgentDispatcherService,
    CustomDispatcherService,
  ],
})
export class DispatchersModule {}
