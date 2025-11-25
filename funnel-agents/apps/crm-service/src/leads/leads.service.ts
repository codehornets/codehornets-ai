import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Lead } from '@funnelagents/domain';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  async findAll(filters?: FilterLeadDto): Promise<{ data: Lead[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.leadsRepository.createQueryBuilder('lead');

    if (filters?.status) {
      queryBuilder.andWhere('lead.status = :status', { status: filters.status });
    }

    if (filters?.source) {
      queryBuilder.andWhere('lead.source = :source', { source: filters.source });
    }

    if (filters?.minScore !== undefined) {
      queryBuilder.andWhere('lead.score >= :minScore', { minScore: filters.minScore });
    }

    if (filters?.maxScore !== undefined) {
      queryBuilder.andWhere('lead.score <= :maxScore', { maxScore: filters.maxScore });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(lead.name ILIKE :search OR lead.email ILIKE :search OR lead.company ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('lead.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepository.create(createLeadDto);
    return this.leadsRepository.save(lead);
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, updateLeadDto);
    return this.leadsRepository.save(lead);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);
    await this.leadsRepository.remove(lead);
  }

  async qualify(id: string): Promise<Lead> {
    const lead = await this.findOne(id);

    // AI qualification logic would go here
    // For now, we'll simulate a qualification process
    const qualificationScore = Math.random() * 100;

    lead.status = qualificationScore > 50 ? 'qualified' : 'contacted';
    lead.score = qualificationScore;
    lead.score_breakdown = {
      icp_fit: Math.random() * 100,
      engagement: Math.random() * 100,
      recency: Math.random() * 100,
      confidence: Math.random() * 100,
    };

    return this.leadsRepository.save(lead);
  }

  async convert(id: string): Promise<Lead> {
    const lead = await this.findOne(id);

    // Conversion logic would go here
    // This would typically create a Contact and/or Deal
    lead.status = 'won';

    return this.leadsRepository.save(lead);
  }
}
