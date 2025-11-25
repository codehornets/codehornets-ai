import { UniqueId } from './value-objects';
/**
 * Base entity class that all domain entities should extend
 */
export declare abstract class BaseEntity<T> {
    protected readonly _id: UniqueId;
    protected props: T;
    protected _createdAt: Date;
    protected _updatedAt: Date;
    constructor(props: T, id?: UniqueId);
    get id(): UniqueId;
    get createdAt(): Date;
    get updatedAt(): Date;
    protected touch(): void;
    equals(entity?: BaseEntity<T>): boolean;
}
/**
 * Aggregate root base class
 */
export declare abstract class AggregateRoot<T> extends BaseEntity<T> {
    private _domainEvents;
    get domainEvents(): DomainEvent[];
    protected addDomainEvent(event: DomainEvent): void;
    clearEvents(): void;
}
/**
 * Domain event interface
 */
export interface DomainEvent {
    readonly occurredOn: Date;
    readonly eventType: string;
    readonly aggregateId: string;
}
/**
 * Base domain event implementation
 */
export declare abstract class BaseDomainEvent implements DomainEvent {
    readonly occurredOn: Date;
    abstract readonly eventType: string;
    readonly aggregateId: string;
    constructor(aggregateId: string);
}
