import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../../../apps/crm-service/src/leads/lead.entity';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

export interface LeadFilters {
  status?: string;
  source?: string;
  minScore?: number;
  maxScore?: number;
  campaignId?: string;
  search?: string;
}

export interface LeadActivitiesFilters {
  type?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface LeadScoreHistory {
  timestamp: Date;
  score: number;
  reason?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>
  ) {}

  async findById(id: string): Promise<Lead | null> {
    return this.leadsRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return this.leadsRepository.findOne({ where: { email } });
  }

  async findAll(
    filters?: LeadFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Lead>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
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

    if (filters?.campaignId) {
      queryBuilder.andWhere('lead.campaign_id = :campaignId', {
        campaignId: filters.campaignId,
      });
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

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source: string;
    status?: string;
    score?: number;
    metadata?: Record<string, any>;
    tags?: string[];
    campaignId?: string;
  }): Promise<Lead> {
    // Check for existing lead with same email
    const existingLead = await this.findByEmail(data.email);
    if (existingLead) {
      throw new ConflictException(`Lead with email ${data.email} already exists`);
    }

    const lead = this.leadsRepository.create({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      company: data.company,
      job_title: data.jobTitle,
      source: data.source,
      status: data.status || 'new',
      score: data.score || 0,
      metadata: data.metadata || {},
      tags: data.tags || [],
      campaign_id: data.campaignId,
    });

    return this.leadsRepository.save(lead);
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      company?: string;
      jobTitle?: string;
      status?: string;
      score?: number;
      metadata?: Record<string, any>;
      tags?: string[];
      isQualified?: boolean;
    }
  ): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Update name if first or last name changed
    if (data.firstName || data.lastName) {
      const firstName = data.firstName || lead.name.split(' ')[0];
      const lastName = data.lastName || lead.name.split(' ').slice(1).join(' ');
      lead.name = `${firstName} ${lastName}`;
    }

    if (data.email) lead.email = data.email;
    if (data.phone) lead.phone = data.phone;
    if (data.company) lead.company = data.company;
    if (data.jobTitle) lead.job_title = data.jobTitle;
    if (data.status) lead.status = data.status;
    if (data.score !== undefined) lead.score = data.score;
    if (data.metadata) lead.metadata = { ...lead.metadata, ...data.metadata };
    if (data.tags) lead.tags = data.tags;
    if (data.isQualified !== undefined && data.isQualified) {
      lead.status = 'qualified';
    }

    return this.leadsRepository.save(lead);
  }

  async delete(id: string): Promise<void> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    await this.leadsRepository.remove(lead);
  }

  async qualify(
    id: string,
    data: {
      score: number;
      notes?: string;
      qualifiedBy?: string;
    }
  ): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    lead.status = data.score >= 50 ? 'qualified' : 'contacted';
    lead.score = data.score;

    // Update score breakdown
    const scoreBreakdown = lead.score_breakdown || {};
    scoreBreakdown.manual_qualification = data.score;
    scoreBreakdown.qualified_at = new Date().toISOString();
    if (data.qualifiedBy) {
      scoreBreakdown.qualified_by = data.qualifiedBy;
    }
    lead.score_breakdown = scoreBreakdown;

    // Add qualification notes to metadata
    if (data.notes) {
      const metadata = lead.metadata || {};
      metadata.qualification_notes = data.notes;
      lead.metadata = metadata;
    }

    return this.leadsRepository.save(lead);
  }

  async convert(id: string): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    lead.status = 'converted';

    const metadata = lead.metadata || {};
    metadata.converted_at = new Date().toISOString();
    lead.metadata = metadata;

    return this.leadsRepository.save(lead);
  }

  async getActivities(
    id: string,
    filters?: LeadActivitiesFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<any>> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Get activities from metadata or interactions
    const activities = (lead.metadata?.activities || []) as any[];

    let filteredActivities = activities;

    if (filters?.type) {
      filteredActivities = filteredActivities.filter((a) => a.type === filters.type);
    }

    if (filters?.fromDate) {
      filteredActivities = filteredActivities.filter(
        (a) => new Date(a.timestamp) >= filters.fromDate
      );
    }

    if (filters?.toDate) {
      filteredActivities = filteredActivities.filter(
        (a) => new Date(a.timestamp) <= filters.toDate
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const data = filteredActivities.slice(skip, skip + limit);
    const total = filteredActivities.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getScoreHistory(id: string): Promise<LeadScoreHistory[]> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Get score history from metadata
    const scoreHistory = (lead.metadata?.score_history || []) as LeadScoreHistory[];

    // If no history, return current score
    if (scoreHistory.length === 0) {
      return [
        {
          timestamp: lead.created_at,
          score: lead.score,
          reason: 'Initial score',
        },
      ];
    }

    return scoreHistory;
  }

  async bulkImport(leads: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }>): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const leadData of leads) {
      try {
        await this.create(leadData);
        imported++;
      } catch (error) {
        skipped++;
        errors.push(`${leadData.email}: ${error.message}`);
      }
    }

    return { imported, skipped, errors };
  }

  async export(filters?: LeadFilters): Promise<Lead[]> {
    const result = await this.findAll(filters, { page: 1, limit: 10000 });
    return result.data;
  }
}
