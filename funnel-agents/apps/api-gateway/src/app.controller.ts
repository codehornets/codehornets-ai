import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return {
      name: 'FunnelAgents API Gateway',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/*',
        crm: {
          workspaces: '/api/workspaces/*',
          leads: '/api/leads/*',
          contacts: '/api/contacts/*',
          deals: '/api/deals/*',
        },
        campaigns: '/api/campaigns/*',
        content: '/api/content/*',
        agents: '/api/agents/*',
        tasks: '/api/tasks/*',
        workflows: '/api/workflows/*',
        analytics: '/api/analytics/*',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
