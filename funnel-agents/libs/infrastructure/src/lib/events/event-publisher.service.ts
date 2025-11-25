import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventPublisher, DomainEvent } from '@funnelagents/domain';

@Injectable()
export class EventPublisherService implements IEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      this.eventEmitter.emit(event.eventType, event);
      console.log(`Event published: ${event.eventType}`, {
        aggregateId: event.aggregateId,
        occurredOn: event.occurredOn,
      });
    } catch (error) {
      console.error(`Failed to publish event ${event.eventType}:`, error);
      throw error;
    }
  }

  async publishAll<T extends DomainEvent>(events: T[]): Promise<void> {
    try {
      await Promise.all(events.map((event) => this.publish(event)));
    } catch (error) {
      console.error('Failed to publish events batch:', error);
      throw error;
    }
  }
}
