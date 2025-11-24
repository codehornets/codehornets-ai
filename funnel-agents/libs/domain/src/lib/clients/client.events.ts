import { BaseDomainEvent } from '../shared-kernel';

export class ClientCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'client.created';
  public readonly name: string;
  public readonly email: string;

  constructor(clientId: string, name: string, email: string) {
    super(clientId);
    this.name = name;
    this.email = email;
  }
}

export class ClientUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'client.updated';

  constructor(clientId: string) {
    super(clientId);
  }
}

export class ClientArchivedEvent extends BaseDomainEvent {
  public readonly eventType = 'client.archived';

  constructor(clientId: string) {
    super(clientId);
  }
}
