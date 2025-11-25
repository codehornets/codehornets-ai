import { BaseDomainEvent } from '../shared-kernel';

export class AgentTemplateCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.template.created';
  public readonly name: string;
  public readonly domain: string;

  constructor(
    templateId: string,
    name: string,
    domain: string
  ) {
    super(templateId);
    this.name = name;
    this.domain = domain;
  }
}

export class AgentTemplatePublishedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.template.published';
  public readonly name: string;

  constructor(templateId: string, name: string) {
    super(templateId);
    this.name = name;
  }
}

export class AgentTemplateUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.template.updated';
  public readonly name: string;

  constructor(templateId: string, name: string) {
    super(templateId);
    this.name = name;
  }
}
