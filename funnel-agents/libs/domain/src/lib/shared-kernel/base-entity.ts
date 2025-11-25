import { UniqueId } from './value-objects';

/**
 * Base entity class that all domain entities should extend
 */
export abstract class BaseEntity<T> {
  protected readonly _id: UniqueId;
  protected props: T;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(props: T, id?: UniqueId) {
    this._id = id ?? UniqueId.create();
    this.props = props;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): UniqueId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  public equals(entity?: BaseEntity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id.equals(entity._id);
  }
}

/**
 * Aggregate root base class
 */
export abstract class AggregateRoot<T> extends BaseEntity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
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
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date;
  public abstract readonly eventType: string;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
  }
}
