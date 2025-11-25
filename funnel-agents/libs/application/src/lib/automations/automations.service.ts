import { Injectable } from '@nestjs/common';
import {
  Automation,
  IAutomationRepository,
  AutomationFilters,
  AutomationStatus,
  AutomationTrigger,
  AutomationAction,
  UniqueId,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class AutomationsService {
  constructor(private readonly automationRepository: IAutomationRepository) {}

  async findById(id: string): Promise<Automation | null> {
    return this.automationRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Automation>> {
    return this.automationRepository.findAll(params);
  }

  async findActive(): Promise<Automation[]> {
    return this.automationRepository.findActiveAutomations();
  }

  async findWithFilters(
    filters: AutomationFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Automation>> {
    return this.automationRepository.findWithFilters(filters, params);
  }

  async create(data: {
    name: string;
    description?: string;
    clientId?: string;
    trigger: AutomationTrigger;
    actions: AutomationAction[];
  }): Promise<Automation> {
    const automation = Automation.create({
      name: data.name,
      description: data.description,
      clientId: data.clientId ? UniqueId.fromString(data.clientId) : undefined,
      trigger: data.trigger,
      actions: data.actions,
    });

    return this.automationRepository.save(automation);
  }

  async activate(id: string): Promise<Automation> {
    const automation = await this.automationRepository.findById(id);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }

    automation.activate();
    return this.automationRepository.save(automation);
  }

  async pause(id: string): Promise<Automation> {
    const automation = await this.automationRepository.findById(id);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }

    automation.pause();
    return this.automationRepository.save(automation);
  }

  async archive(id: string): Promise<Automation> {
    const automation = await this.automationRepository.findById(id);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }

    automation.archive();
    return this.automationRepository.save(automation);
  }

  async addAction(id: string, action: AutomationAction): Promise<Automation> {
    const automation = await this.automationRepository.findById(id);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }

    automation.addAction(action);
    return this.automationRepository.save(automation);
  }

  async removeAction(id: string, actionId: string): Promise<Automation> {
    const automation = await this.automationRepository.findById(id);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }

    automation.removeAction(actionId);
    return this.automationRepository.save(automation);
  }

  async recordExecution(id: string): Promise<Automation> {
    const automation = await this.automationRepository.findById(id);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }

    automation.recordExecution();
    return this.automationRepository.save(automation);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.automationRepository.exists(id);
    if (!exists) {
      throw new Error(`Automation with id ${id} not found`);
    }

    return this.automationRepository.delete(id);
  }
}
