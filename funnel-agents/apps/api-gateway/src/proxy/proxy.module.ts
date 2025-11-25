import { Module } from '@nestjs/common';
import { AuthProxyController } from './auth-proxy.controller';
import { CrmProxyController } from './crm-proxy.controller';
import { CampaignsProxyController } from './campaigns-proxy.controller';
import { ContentProxyController } from './content-proxy.controller';
import { AgentsProxyController } from './agents-proxy.controller';
import { TasksProxyController } from './tasks-proxy.controller';
import { AutomationsProxyController } from './automations-proxy.controller';
import { ReportsProxyController } from './reports-proxy.controller';

@Module({
  controllers: [
    AuthProxyController,
    CrmProxyController,
    CampaignsProxyController,
    ContentProxyController,
    AgentsProxyController,
    TasksProxyController,
    AutomationsProxyController,
    ReportsProxyController,
  ],
})
export class ProxyModule {}
