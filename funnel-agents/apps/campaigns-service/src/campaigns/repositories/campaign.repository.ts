import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignEntity, CampaignStatus, CampaignPriority } from '../entities/campaign.entity';

export interface CampaignFilters {
  workspace_id?: string;
  status?: CampaignStatus;
  priority?: CampaignPriority;
  search?: string;
}

@Injectable()
export class CampaignRepository extends BaseRepository<CampaignEntity> {
  constructor(
    @InjectRepository(CampaignEntity)
    private readonly campaignRepository: Repository<CampaignEntity>
  ) {
    super(campaignRepository);
  }

  async findWithFilters(
    filters: CampaignFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignEntity>> {
    const queryBuilder = this.campaignRepository
      .createQueryBuilder('campaign');

    // Apply filters
    if (filters.workspace_id) {
      queryBuilder.andWhere('campaign.workspace_id = :workspace_id', {
        workspace_id: filters.workspace_id,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('campaign.status = :status', {
        status: filters.status,
      });
    }

    if (filters.priority) {
      queryBuilder.andWhere('campaign.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(campaign.name ILIKE :search OR campaign.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return this.paginate(queryBuilder, params);
  }

  async findByWorkspaceId(
    workspaceId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignEntity>> {
    return this.findWithFilters({ workspace_id: workspaceId }, params);
  }

  async findByStatus(
    status: CampaignStatus,
    params?: PaginationParams
  ): Promise<PaginatedResult<CampaignEntity>> {
    return this.findWithFilters({ status }, params);
  }
}
