import { BaseDomainEvent } from '../shared-kernel';
import { ContentType } from './content.types';
export declare class ContentCreatedEvent extends BaseDomainEvent {
    readonly eventType = "content.created";
    readonly title: string;
    readonly type: ContentType;
    constructor(contentId: string, title: string, type: ContentType);
}
export declare class ContentPublishedEvent extends BaseDomainEvent {
    readonly eventType = "content.published";
    readonly title: string;
    constructor(contentId: string, title: string);
}
export declare class ContentArchivedEvent extends BaseDomainEvent {
    readonly eventType = "content.archived";
    constructor(contentId: string);
}
