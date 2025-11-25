import { BaseDomainEvent } from '../shared-kernel';
import { ContactStatus } from './crm.types';
export declare class ContactCreatedEvent extends BaseDomainEvent {
    readonly eventType = "contact.created";
    readonly fullName: string;
    readonly email: string;
    constructor(contactId: string, fullName: string, email: string);
}
export declare class ContactStatusChangedEvent extends BaseDomainEvent {
    readonly eventType = "contact.status_changed";
    readonly previousStatus: ContactStatus;
    readonly newStatus: ContactStatus;
    constructor(contactId: string, previousStatus: ContactStatus, newStatus: ContactStatus);
}
export declare class ContactScoreUpdatedEvent extends BaseDomainEvent {
    readonly eventType = "contact.score_updated";
    readonly score: number;
    constructor(contactId: string, score: number);
}
