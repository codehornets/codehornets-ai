import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadActivity } from './lead-activity.entity';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { FilterLeadActivityDto } from './dto/filter-lead-activity.dto';

@Injectable()
export class LeadActivitiesService {
  constructor(
    @InjectRepository(LeadActivity)
    private leadActivitiesRepository: Repository<LeadActivity>,
  ) {}

  async findAll(filters?: FilterLeadActivityDto): Promise<{
    data: LeadActivity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.leadActivitiesRepository.createQueryBuilder('activity');

    if (filters?.lead_id) {
      queryBuilder.andWhere('activity.lead_id = :lead_id', {
        lead_id: filters.lead_id,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('activity.type = :type', { type: filters.type });
    }

    const [data, total] = await queryBuilder
      .orderBy('activity.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<LeadActivity> {
    const activity = await this.leadActivitiesRepository.findOne({
      where: { id },
      relations: ['lead'],
    });

    if (!activity) {
      throw new NotFoundException(`Lead activity with ID ${id} not found`);
    }

    return activity;
  }

  async create(
    createLeadActivityDto: CreateLeadActivityDto,
  ): Promise<LeadActivity> {
    const activity = this.leadActivitiesRepository.create(
      createLeadActivityDto,
    );
    return this.leadActivitiesRepository.save(activity);
  }

  async findByLeadId(leadId: string): Promise<LeadActivity[]> {
    return this.leadActivitiesRepository.find({
      where: { lead_id: leadId },
      order: { created_at: 'DESC' },
    });
  }
}
