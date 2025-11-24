import { Injectable } from '@nestjs/common';
import {
  Campaign,
  ICampaignRepository,
  CampaignFilters,
  CampaignStatus,
  CampaignType,
  Money,
  DateRange,
  UniqueId,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class CampaignsService {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  async findById(id: string): Promise<Campaign | null> {
    return this.campaignRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Campaign>> {
    return this.campaignRepository.findAll(params);
  }

  async findByClientId(
    clientId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Campaign>> {
    return this.campaignRepository.findByClientId(clientId, params);
  }

  async findWithFilters(
    filters: CampaignFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Campaign>> {
    return this.campaignRepository.findWithFilters(filters, params);
  }

  async create(data: {
    name: string;
    description?: string;
    type: CampaignType;
    clientId: string;
    budget?: { amount: number; currency: string };
    dateRange?: { start: Date; end: Date };
  }): Promise<Campaign> {
    const campaign = Campaign.create({
      name: data.name,
      description: data.description,
      type: data.type,
      clientId: UniqueId.fromString(data.clientId),
      budget: data.budget ? Money.create(data.budget.amount, data.budget.currency) : undefined,
      dateRange: data.dateRange
        ? DateRange.create(data.dateRange.start, data.dateRange.end)
        : undefined,
    });

    return this.campaignRepository.save(campaign);
  }

  async start(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    campaign.start();
    return this.campaignRepository.save(campaign);
  }

  async pause(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    campaign.pause();
    return this.campaignRepository.save(campaign);
  }

  async resume(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    campaign.resume();
    return this.campaignRepository.save(campaign);
  }

  async complete(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    campaign.complete();
    return this.campaignRepository.save(campaign);
  }

  async cancel(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    campaign.cancel();
    return this.campaignRepository.save(campaign);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.campaignRepository.exists(id);
    if (!exists) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    return this.campaignRepository.delete(id);
  }
}
