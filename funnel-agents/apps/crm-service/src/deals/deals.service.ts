import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from './deal.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { FilterDealDto } from './dto/filter-deal.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private dealsRepository: Repository<Deal>,
  ) {}

  async findAll(filters?: FilterDealDto): Promise<{
    data: Deal[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.dealsRepository.createQueryBuilder('deal');

    if (filters?.stage) {
      queryBuilder.andWhere('deal.stage = :stage', { stage: filters.stage });
    }

    if (filters?.workspace_id) {
      queryBuilder.andWhere('deal.workspaceId = :workspaceId', {
        workspaceId: filters.workspace_id,
      });
    }

    if (filters?.contact_id) {
      queryBuilder.andWhere('deal.contactId = :contactId', {
        contactId: filters.contact_id,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('deal.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealsRepository.findOne({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async create(createDealDto: CreateDealDto): Promise<Deal> {
    const deal = this.dealsRepository.create(createDealDto);
    return this.dealsRepository.save(deal);
  }

  async update(id: string, updateDealDto: UpdateDealDto): Promise<Deal> {
    const deal = await this.findOne(id);
    Object.assign(deal, updateDealDto);
    return this.dealsRepository.save(deal);
  }

  async remove(id: string): Promise<void> {
    const deal = await this.findOne(id);
    await this.dealsRepository.remove(deal);
  }

  async updateStage(
    id: string,
    updateDealStageDto: UpdateDealStageDto,
  ): Promise<Deal> {
    const deal = await this.findOne(id);
    deal.stage = updateDealStageDto.stage;
    return this.dealsRepository.save(deal);
  }
}
