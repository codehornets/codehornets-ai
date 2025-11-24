import { BaseDomainEvent } from '../shared-kernel';

export class AutomationCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'automation.created';
  public readonly name: string;

  constructor(automationId: string, name: string) {
    super(automationId);
    this.name = name;
  }
}

export class AutomationActivatedEvent extends BaseDomainEvent {
  public readonly eventType = 'automation.activated';

  constructor(automationId: string) {
    super(automationId);
  }
}

export class AutomationPausedEvent extends BaseDomainEvent {
  public readonly eventType = 'automation.paused';

  constructor(automationId: string) {
    super(automationId);
  }
}

export class AutomationExecutedEvent extends BaseDomainEvent {
  public readonly eventType = 'automation.executed';
  public readonly executionId: string;
  public readonly success: boolean;

  constructor(automationId: string, executionId: string, success: boolean) {
    super(automationId);
    this.executionId = executionId;
    this.success = success;
  }
}
