import { Injectable } from '@nestjs/common';
import {
  AgentTemplate,
  IAgentTemplateRepository,
  AgentTemplateFilters,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class AgentTemplateService {
  constructor(private readonly templateRepository: IAgentTemplateRepository) {}

  async findById(id: string): Promise<AgentTemplate | null> {
    return this.templateRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>> {
    return this.templateRepository.findAll(params);
  }

  async findPublic(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>> {
    return this.templateRepository.findPublic(params);
  }

  async findWithFilters(
    filters: AgentTemplateFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentTemplate>> {
    return this.templateRepository.findWithFilters(filters, params);
  }

  async create(data: {
    name: string;
    description?: string;
    domain: string;
    skills: string[];
    promptTemplate?: string;
    defaultSettings?: Record<string, any>;
    category?: string;
    isPublic?: boolean;
  }): Promise<AgentTemplate> {
    const template = AgentTemplate.create({
      name: data.name,
      description: data.description,
      domain: data.domain,
      skills: data.skills,
      promptTemplate: data.promptTemplate,
      defaultSettings: data.defaultSettings,
      category: data.category,
      isPublic: data.isPublic ?? false,
    });

    return this.templateRepository.save(template);
  }

  async update(
    id: string,
    updates: {
      name?: string;
      description?: string;
      domain?: string;
      category?: string;
      skills?: string[];
      promptTemplate?: string;
      defaultSettings?: Record<string, any>;
    }
  ): Promise<AgentTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    template.updateDetails({
      name: updates.name,
      description: updates.description,
      domain: updates.domain,
      category: updates.category,
    });

    if (updates.skills !== undefined) {
      template.updateSkills(updates.skills);
    }

    if (updates.promptTemplate !== undefined) {
      template.updatePromptTemplate(updates.promptTemplate);
    }

    if (updates.defaultSettings !== undefined) {
      template.updateDefaultSettings(updates.defaultSettings);
    }

    return this.templateRepository.save(template);
  }

  async publish(id: string): Promise<AgentTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    template.publish();
    return this.templateRepository.save(template);
  }

  async unpublish(id: string): Promise<AgentTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    template.unpublish();
    return this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.templateRepository.exists(id);
    if (!exists) {
      throw new Error(`Template with id ${id} not found`);
    }

    return this.templateRepository.delete(id);
  }
}
