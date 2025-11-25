import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignRepository, CampaignFilters } from '../repositories/campaign.repository';
import { CampaignTemplateRepository } from '../repositories/campaign-template.repository';
import { CampaignEntity } from '../entities/campaign.entity';
import { CreateCampaignDto, UpdateCampaignDto, CreateFromTemplateDto } from '../dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly templateRepository: CampaignTemplateRepository
  ) {}

  async findAll(
    filters?: CampaignFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignEntity>> {
    if (filters && Object.keys(filters).length > 0) {
      return this.campaignRepository.findWithFilters(filters, params);
    }
    return this.campaignRepository.findAll(params);
  }

  async findById(id: string): Promise<CampaignEntity> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async create(data: CreateCampaignDto): Promise<CampaignEntity> {
    const campaign: any = {
      name: data.name,
      description: data.description,
      workspace_id: data.workspace_id,
      status: data.status,
      priority: data.priority,
      goal: data.goal,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
      team_members: data.team_members,
      agent_ids: data.agent_ids,
      settings: data.settings,
      progress: data.progress,
    };

    return this.campaignRepository.save(campaign);
  }

  async update(id: string, data: UpdateCampaignDto): Promise<CampaignEntity> {
    const campaign = await this.findById(id);

    // Update fields
    if (data.name !== undefined) campaign.name = data.name;
    if (data.description !== undefined) campaign.description = data.description;
    if (data.workspace_id !== undefined) campaign.workspace_id = data.workspace_id;
    if (data.status !== undefined) campaign.status = data.status;
    if (data.priority !== undefined) campaign.priority = data.priority;
    if (data.goal !== undefined) campaign.goal = data.goal;
    if (data.start_date !== undefined) campaign.start_date = new Date(data.start_date);
    if (data.end_date !== undefined) campaign.end_date = new Date(data.end_date);
    if (data.team_members !== undefined) campaign.team_members = data.team_members;
    if (data.agent_ids !== undefined) campaign.agent_ids = data.agent_ids;
    if (data.settings !== undefined) {
      campaign.settings = { ...campaign.settings, ...data.settings };
    }
    if (data.progress !== undefined) campaign.progress = data.progress;

    return this.campaignRepository.save(campaign);
  }

  async delete(id: string): Promise<void> {
    const campaign = await this.findById(id);
    await this.campaignRepository.delete(campaign.id);
  }

  async createFromTemplate(data: CreateFromTemplateDto): Promise<CampaignEntity> {
    // Get the template
    const template = await this.templateRepository.findById(data.template_id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${data.template_id} not found`);
    }

    // Merge template settings with provided settings
    const settings = {
      ...template.default_settings,
      ...data.settings,
    };

    // Create campaign from template
    const campaign: any = {
      name: data.name,
      description: data.description || template.description,
      workspace_id: data.workspace_id,
      settings,
      agent_ids: template.default_agents || [],
    };

    const savedCampaign = await this.campaignRepository.save(campaign);

    // TODO: If create_default_tasks is true, create tasks from template.default_tasks
    // This would require integration with the tasks-service
    if (data.create_default_tasks && template.default_tasks?.length) {
      // Emit event or call tasks service to create default tasks
      // For now, we'll just add a note in the settings
      savedCampaign.settings = {
        ...savedCampaign.settings,
        template_id: template.id,
        pending_tasks: template.default_tasks,
      };
      await this.campaignRepository.save(savedCampaign);
    }

    return savedCampaign;
  }
}
