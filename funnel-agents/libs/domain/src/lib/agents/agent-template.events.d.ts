import { BaseDomainEvent } from '../shared-kernel';
export declare class AgentTemplateCreatedEvent extends BaseDomainEvent {
    readonly eventType = "agent.template.created";
    readonly name: string;
    readonly domain: string;
    constructor(templateId: string, name: string, domain: string);
}
export declare class AgentTemplatePublishedEvent extends BaseDomainEvent {
    readonly eventType = "agent.template.published";
    readonly name: string;
    constructor(templateId: string, name: string);
}
export declare class AgentTemplateUpdatedEvent extends BaseDomainEvent {
    readonly eventType = "agent.template.updated";
    readonly name: string;
    constructor(templateId: string, name: string);
}
