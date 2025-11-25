import { Entity } from '../shared-kernel';
export interface AgentMetricsProps {
    agentId: string;
    executionId: string;
    taskType: string;
    executionTime: number;
    success: boolean;
    tokensUsed?: number;
    modelCalls?: number;
    errorCode?: string;
    errorMessage?: string;
    inputSize?: number;
    outputSize?: number;
    timestamp: Date;
}
export declare class AgentMetrics extends Entity<AgentMetricsProps> {
    private constructor();
    get agentId(): string;
    get executionId(): string;
    get taskType(): string;
    get executionTime(): number;
    get success(): boolean;
    get tokensUsed(): number | undefined;
    get modelCalls(): number | undefined;
    get errorCode(): string | undefined;
    get errorMessage(): string | undefined;
    get timestamp(): Date;
    static create(props: AgentMetricsProps): AgentMetrics;
    static reconstitute(props: AgentMetricsProps, id: string): AgentMetrics;
}
