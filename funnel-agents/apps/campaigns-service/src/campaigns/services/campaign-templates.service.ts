import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import {
  CampaignTemplateRepository,
  CampaignTemplateFilters,
} from '../repositories/campaign-template.repository';
import { CampaignTemplateEntity } from '../entities/campaign-template.entity';
import {
  CreateCampaignTemplateDto,
  UpdateCampaignTemplateDto,
} from '../dto/campaign-template.dto';

@Injectable()
export class CampaignTemplatesService {
  constructor(
    private readonly templateRepository: CampaignTemplateRepository
  ) {}

  async findAll(
    filters?: CampaignTemplateFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignTemplateEntity>> {
    if (filters && Object.keys(filters).length > 0) {
      return this.templateRepository.findWithFilters(filters, params);
    }
    return this.templateRepository.findAll(params);
  }

  async findById(id: string): Promise<CampaignTemplateEntity> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Campaign template with ID ${id} not found`);
    }
    return template;
  }

  async create(data: CreateCampaignTemplateDto): Promise<CampaignTemplateEntity> {
    const template: any = {
      name: data.name,
      description: data.description,
      category: data.category,
      default_settings: data.default_settings,
      default_agents: data.default_agents,
      default_tasks: data.default_tasks,
      is_public: data.is_public ?? false,
    };

    return this.templateRepository.save(template);
  }

  async update(
    id: string,
    data: UpdateCampaignTemplateDto
  ): Promise<CampaignTemplateEntity> {
    const template = await this.findById(id);

    // Update fields
    if (data.name !== undefined) template.name = data.name;
    if (data.description !== undefined) template.description = data.description;
    if (data.category !== undefined) template.category = data.category;
    if (data.default_settings !== undefined) {
      template.default_settings = { ...template.default_settings, ...data.default_settings };
    }
    if (data.default_agents !== undefined) template.default_agents = data.default_agents;
    if (data.default_tasks !== undefined) template.default_tasks = data.default_tasks;
    if (data.is_public !== undefined) template.is_public = data.is_public;

    return this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findById(id);
    await this.templateRepository.delete(template.id);
  }
}
