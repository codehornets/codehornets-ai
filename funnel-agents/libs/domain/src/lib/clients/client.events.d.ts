import { BaseDomainEvent } from '../shared-kernel';
export declare class ClientCreatedEvent extends BaseDomainEvent {
    readonly eventType = "client.created";
    readonly name: string;
    readonly email: string;
    constructor(clientId: string, name: string, email: string);
}
export declare class ClientUpdatedEvent extends BaseDomainEvent {
    readonly eventType = "client.updated";
    constructor(clientId: string);
}
export declare class ClientArchivedEvent extends BaseDomainEvent {
    readonly eventType = "client.archived";
    constructor(clientId: string);
}
