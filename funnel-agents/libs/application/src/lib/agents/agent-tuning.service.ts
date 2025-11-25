import { Injectable } from '@nestjs/common';
import {
  AgentPerformanceTuning,
  IAgentTuningRepository,
  AgentTuningFilters,
  TuningType,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class AgentTuningService {
  constructor(private readonly tuningRepository: IAgentTuningRepository) {}

  async findById(id: string): Promise<AgentPerformanceTuning | null> {
    return this.tuningRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>> {
    return this.tuningRepository.findAll(params);
  }

  async findByAgentId(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>> {
    return this.tuningRepository.findByAgentId(agentId, params);
  }

  async findWithFilters(
    filters: AgentTuningFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>> {
    return this.tuningRepository.findWithFilters(filters, params);
  }

  async create(data: {
    agentId: string;
    tuningType: TuningType;
    beforeValue?: Record<string, any>;
    afterValue?: Record<string, any>;
    performanceDelta?: number;
    notes?: string;
    appliedAt?: Date;
  }): Promise<AgentPerformanceTuning> {
    const tuning = AgentPerformanceTuning.create({
      agentId: data.agentId,
      tuningType: data.tuningType,
      beforeValue: data.beforeValue,
      afterValue: data.afterValue,
      performanceDelta: data.performanceDelta,
      notes: data.notes,
      appliedAt: data.appliedAt,
    });

    return this.tuningRepository.save(tuning);
  }

  async update(
    id: string,
    updates: {
      performanceDelta?: number;
      notes?: string;
      apply?: boolean;
    }
  ): Promise<AgentPerformanceTuning> {
    const tuning = await this.tuningRepository.findById(id);
    if (!tuning) {
      throw new Error(`Tuning record with id ${id} not found`);
    }

    if (updates.performanceDelta !== undefined) {
      tuning.updatePerformanceDelta(updates.performanceDelta);
    }

    if (updates.notes !== undefined) {
      tuning.updateNotes(updates.notes);
    }

    if (updates.apply) {
      tuning.apply(updates.performanceDelta);
    }

    return this.tuningRepository.save(tuning);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.tuningRepository.exists(id);
    if (!exists) {
      throw new Error(`Tuning record with id ${id} not found`);
    }

    return this.tuningRepository.delete(id);
  }
}
