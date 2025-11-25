import { AgentPerformanceTuning, IAgentTuningRepository, AgentTuningFilters, TuningType } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class AgentTuningService {
    private readonly tuningRepository;
    constructor(tuningRepository: IAgentTuningRepository);
    findById(id: string): Promise<AgentPerformanceTuning | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>>;
    findByAgentId(agentId: string, params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>>;
    findWithFilters(filters: AgentTuningFilters, params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>>;
    create(data: {
        agentId: string;
        tuningType: TuningType;
        beforeValue?: Record<string, any>;
        afterValue?: Record<string, any>;
        performanceDelta?: number;
        notes?: string;
        appliedAt?: Date;
    }): Promise<AgentPerformanceTuning>;
    update(id: string, updates: {
        performanceDelta?: number;
        notes?: string;
        apply?: boolean;
    }): Promise<AgentPerformanceTuning>;
    delete(id: string): Promise<void>;
}
