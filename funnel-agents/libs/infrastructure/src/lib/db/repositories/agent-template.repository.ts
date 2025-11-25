import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAgentTemplateRepository,
  AgentTemplate,
  AgentTemplateFilters,
  PaginationParams,
  PaginatedResult,
  UniqueId,
} from '@funnelagents/domain';
import { AgentTemplateDbEntity } from '../entities/agent-template.entity';
import { BaseRepository } from '../base.repository';

@Injectable()
export class AgentTemplateRepository
  extends BaseRepository<AgentTemplateDbEntity, AgentTemplate>
  implements IAgentTemplateRepository
{
  constructor(
    @InjectRepository(AgentTemplateDbEntity)
    repository: Repository<AgentTemplateDbEntity>
  ) {
    super(repository);
  }

  // findById and findAll now use base class implementations with toDomain mapping

  async findPublic(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>> {
    const queryBuilder = this.repository
      .createQueryBuilder('template')
      .where('template.is_public = :isPublic', { isPublic: true });

    return this.paginate(queryBuilder, params);
  }

  async findWithFilters(
    filters: AgentTemplateFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentTemplate>> {
    const queryBuilder = this.repository.createQueryBuilder('template');

    if (filters.domain) {
      queryBuilder.andWhere('template.domain = :domain', { domain: filters.domain });
    }

    if (filters.category) {
      queryBuilder.andWhere('template.category = :category', { category: filters.category });
    }

    if (filters.isPublic !== undefined) {
      queryBuilder.andWhere('template.is_public = :isPublic', { isPublic: filters.isPublic });
    }

    if (filters.skills && filters.skills.length > 0) {
      // PostgreSQL array contains query
      queryBuilder.andWhere('template.skills && ARRAY[:...skills]', { skills: filters.skills });
    }

    return this.paginate(queryBuilder, params);
  }

  // save now uses base class implementation with toDatabase/toDomain mapping

  protected override toDomain(entity: AgentTemplateDbEntity): AgentTemplate {
    return AgentTemplate.reconstitute(
      {
        name: entity.name,
        description: entity.description,
        domain: entity.domain,
        skills: entity.skills,
        promptTemplate: entity.prompt_template,
        defaultSettings: entity.default_settings,
        category: entity.category,
        isPublic: entity.is_public,
      },
      UniqueId.fromString(entity.id)
    );
  }

  protected override toDatabase(template: AgentTemplate): Partial<AgentTemplateDbEntity> {
    return {
      id: template.id.value,
      name: template.name,
      description: template.description,
      domain: template.domain,
      skills: template.skills,
      prompt_template: template.promptTemplate,
      default_settings: template.defaultSettings,
      category: template.category,
      is_public: template.isPublic,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
