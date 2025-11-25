import { BaseDomainEvent } from '../shared-kernel';
import { ContentType } from './content.types';

export class ContentCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'content.created';
  public readonly title: string;
  public readonly type: ContentType;

  constructor(contentId: string, title: string, type: ContentType) {
    super(contentId);
    this.title = title;
    this.type = type;
  }
}

export class ContentPublishedEvent extends BaseDomainEvent {
  public readonly eventType = 'content.published';
  public readonly title: string;

  constructor(contentId: string, title: string) {
    super(contentId);
    this.title = title;
  }
}

export class ContentArchivedEvent extends BaseDomainEvent {
  public readonly eventType = 'content.archived';

  constructor(contentId: string) {
    super(contentId);
  }
}
