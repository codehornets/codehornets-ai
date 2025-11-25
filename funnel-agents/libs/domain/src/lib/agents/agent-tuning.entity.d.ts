import { AggregateRoot, UniqueId } from '../shared-kernel';
export declare enum TuningType {
    PROMPT = "prompt",
    PARAMETERS = "parameters",
    SKILLS = "skills",
    MODEL = "model"
}
export interface AgentPerformanceTuningProps {
    agentId: string;
    tuningType: TuningType;
    beforeValue?: Record<string, any>;
    afterValue?: Record<string, any>;
    performanceDelta?: number;
    notes?: string;
    appliedAt?: Date;
}
export declare class AgentPerformanceTuning extends AggregateRoot<AgentPerformanceTuningProps> {
    private constructor();
    get agentId(): string;
    get tuningType(): TuningType;
    get beforeValue(): Record<string, any> | undefined;
    get afterValue(): Record<string, any> | undefined;
    get performanceDelta(): number | undefined;
    get notes(): string | undefined;
    get appliedAt(): Date | undefined;
    static create(props: AgentPerformanceTuningProps, id?: UniqueId): AgentPerformanceTuning;
    static reconstitute(props: AgentPerformanceTuningProps, id: UniqueId): AgentPerformanceTuning;
    apply(performanceDelta?: number): void;
    updatePerformanceDelta(delta: number): void;
    updateNotes(notes: string): void;
}
