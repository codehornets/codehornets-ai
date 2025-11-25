/**
 * CRM Service Integration Examples for API Gateway
 *
 * This file demonstrates how to integrate the CRM Service
 * with the API Gateway using NestJS microservices.
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Example DTOs (these would be in your API Gateway)
class CreateWorkspaceDto {
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
}

class CreateLeadDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
}

/**
 * Example Workspaces Controller in API Gateway
 */
@Controller('api/workspaces')
export class WorkspacesController {
  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  @Get()
  async getAllWorkspaces() {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'workspace.findAll' }, {})
    );
  }

  @Get(':id')
  async getWorkspace(@Param('id') id: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'workspace.findOne' }, id)
    );
  }

  @Post()
  async createWorkspace(@Body() createDto: CreateWorkspaceDto) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'workspace.create' }, createDto)
    );
  }

  @Put(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateWorkspaceDto>,
  ) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'workspace.update' }, { id, data: updateDto })
    );
  }

  @Delete(':id')
  async deleteWorkspace(@Param('id') id: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'workspace.remove' }, id)
    );
  }

  @Post(':id/onboard')
  async onboardWorkspace(
    @Param('id') id: string,
    @Body() onboardData: any,
  ) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'workspace.onboard' }, { id, data: onboardData })
    );
  }
}

/**
 * Example Leads Controller in API Gateway
 */
@Controller('api/leads')
export class LeadsController {
  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  @Get()
  async getAllLeads(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('minScore') minScore?: number,
    @Query('maxScore') maxScore?: number,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const filters = {
      status,
      source,
      minScore: minScore ? Number(minScore) : undefined,
      maxScore: maxScore ? Number(maxScore) : undefined,
      search,
      page: Number(page),
      limit: Number(limit),
    };

    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.findAll' }, filters)
    );
  }

  @Get(':id')
  async getLead(@Param('id') id: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.findOne' }, id)
    );
  }

  @Post()
  async createLead(@Body() createDto: CreateLeadDto) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.create' }, createDto)
    );
  }

  @Put(':id')
  async updateLead(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateLeadDto>,
  ) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.update' }, { id, data: updateDto })
    );
  }

  @Delete(':id')
  async deleteLead(@Param('id') id: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.remove' }, id)
    );
  }

  @Post(':id/qualify')
  async qualifyLead(@Param('id') id: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.qualify' }, id)
    );
  }

  @Post(':id/convert')
  async convertLead(@Param('id') id: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'lead.convert' }, id)
    );
  }
}

/**
 * Example Lead Activities Controller in API Gateway
 */
@Controller('api/lead-activities')
export class LeadActivitiesController {
  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  @Get()
  async getAllActivities(
    @Query('lead_id') lead_id?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const filters = {
      lead_id,
      type,
      page: Number(page),
      limit: Number(limit),
    };

    return firstValueFrom(
      this.crmClient.send({ cmd: 'leadActivity.findAll' }, filters)
    );
  }

  @Get('by-lead/:leadId')
  async getActivitiesByLead(@Param('leadId') leadId: string) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'leadActivity.findByLeadId' }, leadId)
    );
  }

  @Post()
  async createActivity(@Body() createDto: any) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'leadActivity.create' }, createDto)
    );
  }
}

/**
 * Example Deals Controller in API Gateway
 */
@Controller('api/deals')
export class DealsController {
  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  @Get()
  async getAllDeals(
    @Query('stage') stage?: string,
    @Query('workspace_id') workspace_id?: string,
    @Query('contact_id') contact_id?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const filters = {
      stage,
      workspace_id,
      contact_id,
      page: Number(page),
      limit: Number(limit),
    };

    return firstValueFrom(
      this.crmClient.send({ cmd: 'deal.findAll' }, filters)
    );
  }

  @Post()
  async createDeal(@Body() createDto: any) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'deal.create' }, createDto)
    );
  }

  @Put(':id/stage')
  async updateDealStage(
    @Param('id') id: string,
    @Body('stage') stage: string,
  ) {
    return firstValueFrom(
      this.crmClient.send({ cmd: 'deal.updateStage' }, { id, data: { stage } })
    );
  }
}

/**
 * CRM Service Module Configuration in API Gateway
 */
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'CRM_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('CRM_SERVICE_HOST') || 'localhost',
            port: configService.get('CRM_SERVICE_PORT') || 3002,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    WorkspacesController,
    LeadsController,
    LeadActivitiesController,
    DealsController,
  ],
  exports: [ClientsModule],
})
export class CrmGatewayModule {}

/**
 * Usage Examples in Services
 */
export class ExampleUsageService {
  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  /**
   * Example: Create a lead and track the activity
   */
  async createLeadWithActivity(leadData: CreateLeadDto) {
    // 1. Create the lead
    const lead = await firstValueFrom(
      this.crmClient.send({ cmd: 'lead.create' }, leadData)
    );

    // 2. Log the creation activity
    await firstValueFrom(
      this.crmClient.send({ cmd: 'leadActivity.create' }, {
        lead_id: lead.id,
        type: 'note',
        description: `Lead created from ${leadData.source || 'unknown source'}`,
        metadata: { created_by: 'system' },
      })
    );

    return lead;
  }

  /**
   * Example: Qualify a lead and create a deal if qualified
   */
  async qualifyAndCreateDeal(leadId: string, workspaceId: string) {
    // 1. Qualify the lead
    const qualifiedLead = await firstValueFrom(
      this.crmClient.send({ cmd: 'lead.qualify' }, leadId)
    );

    // 2. If score is high enough, create a deal
    if (qualifiedLead.score && qualifiedLead.score > 70) {
      const deal = await firstValueFrom(
        this.crmClient.send({ cmd: 'deal.create' }, {
          name: `Deal with ${qualifiedLead.name}`,
          workspace_id: workspaceId,
          value: 10000, // Default value
          stage: 'discovery',
        })
      );

      // 3. Log the qualification activity
      await firstValueFrom(
        this.crmClient.send({ cmd: 'leadActivity.create' }, {
          lead_id: leadId,
          type: 'ai_action',
          description: `Lead qualified with score ${qualifiedLead.score}. Deal created.`,
          metadata: { deal_id: deal.id, qualification_score: qualifiedLead.score },
        })
      );

      return { lead: qualifiedLead, deal };
    }

    return { lead: qualifiedLead, deal: null };
  }

  /**
   * Example: Get lead pipeline statistics
   */
  async getLeadPipelineStats() {
    const statuses = ['new', 'qualified', 'contacted', 'in_conversation', 'proposal_sent'];

    const stats = await Promise.all(
      statuses.map(async (status) => {
        const result = await firstValueFrom(
          this.crmClient.send({ cmd: 'lead.findAll' }, { status, page: 1, limit: 1 })
        );
        return { status, count: result.total };
      })
    );

    return stats;
  }
}

/**
 * Example: Error Handling
 */
export class ErrorHandlingExample {
  constructor(
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
  ) {}

  async getLeadSafely(id: string) {
    try {
      return await firstValueFrom(
        this.crmClient.send({ cmd: 'lead.findOne' }, id)
      );
    } catch (error) {
      // Handle microservice errors
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not found')) {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }
      throw error;
    }
  }
}
