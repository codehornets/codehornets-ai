import { BaseDomainEvent } from '../shared-kernel';
import { ContactStatus } from './crm.types';

export class ContactCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'contact.created';
  public readonly fullName: string;
  public readonly email: string;

  constructor(contactId: string, fullName: string, email: string) {
    super(contactId);
    this.fullName = fullName;
    this.email = email;
  }
}

export class ContactStatusChangedEvent extends BaseDomainEvent {
  public readonly eventType = 'contact.status_changed';
  public readonly previousStatus: ContactStatus;
  public readonly newStatus: ContactStatus;

  constructor(contactId: string, previousStatus: ContactStatus, newStatus: ContactStatus) {
    super(contactId);
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
  }
}

export class ContactScoreUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'contact.score_updated';
  public readonly score: number;

  constructor(contactId: string, score: number) {
    super(contactId);
    this.score = score;
  }
}
