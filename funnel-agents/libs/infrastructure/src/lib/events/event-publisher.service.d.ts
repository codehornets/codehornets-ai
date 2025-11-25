import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventPublisher, DomainEvent } from '@funnelagents/domain';
export declare class EventPublisherService implements IEventPublisher {
    private readonly eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    publish<T extends DomainEvent>(event: T): Promise<void>;
    publishAll<T extends DomainEvent>(events: T[]): Promise<void>;
}
