import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignTemplateEntity } from '../entities/campaign-template.entity';

export interface CampaignTemplateFilters {
  category?: string;
  is_public?: boolean;
  search?: string;
}

@Injectable()
export class CampaignTemplateRepository extends BaseRepository<CampaignTemplateEntity> {
  constructor(
    @InjectRepository(CampaignTemplateEntity)
    private readonly templateRepository: Repository<CampaignTemplateEntity>
  ) {
    super(templateRepository);
  }

  async findWithFilters(
    filters: CampaignTemplateFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignTemplateEntity>> {
    const queryBuilder = this.templateRepository
      .createQueryBuilder('template');

    // Apply filters
    if (filters.category) {
      queryBuilder.andWhere('template.category = :category', {
        category: filters.category,
      });
    }

    if (filters.is_public !== undefined) {
      queryBuilder.andWhere('template.is_public = :is_public', {
        is_public: filters.is_public,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return this.paginate(queryBuilder, params);
  }

  async findByCategory(
    category: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignTemplateEntity>> {
    return this.findWithFilters({ category }, params);
  }

  async findPublicTemplates(
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignTemplateEntity>> {
    return this.findWithFilters({ is_public: true }, params);
  }
}
