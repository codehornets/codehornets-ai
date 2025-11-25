import { BaseDomainEvent } from '../shared-kernel';
import { TuningType } from './agent-tuning.entity';
export declare class AgentTuningAppliedEvent extends BaseDomainEvent {
    readonly eventType = "agent.tuning.applied";
    readonly agentId: string;
    readonly tuningType: TuningType;
    readonly performanceDelta?: number;
    constructor(tuningId: string, agentId: string, tuningType: TuningType, performanceDelta?: number);
}
export declare class AgentTuningCreatedEvent extends BaseDomainEvent {
    readonly eventType = "agent.tuning.created";
    readonly agentId: string;
    readonly tuningType: TuningType;
    constructor(tuningId: string, agentId: string, tuningType: TuningType);
}
