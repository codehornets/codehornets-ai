import { BaseDomainEvent } from '../shared-kernel';
export declare class AutomationCreatedEvent extends BaseDomainEvent {
    readonly eventType = "automation.created";
    readonly name: string;
    constructor(automationId: string, name: string);
}
export declare class AutomationActivatedEvent extends BaseDomainEvent {
    readonly eventType = "automation.activated";
    constructor(automationId: string);
}
export declare class AutomationPausedEvent extends BaseDomainEvent {
    readonly eventType = "automation.paused";
    constructor(automationId: string);
}
export declare class AutomationExecutedEvent extends BaseDomainEvent {
    readonly eventType = "automation.executed";
    readonly executionId: string;
    readonly success: boolean;
    constructor(automationId: string, executionId: string, success: boolean);
}
