import { AgentFeedback, IAgentFeedbackRepository, AgentFeedbackFilters, FeedbackType } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class AgentFeedbackService {
    private readonly feedbackRepository;
    constructor(feedbackRepository: IAgentFeedbackRepository);
    findById(id: string): Promise<AgentFeedback | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
    findByAgentId(agentId: string, params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
    findWithFilters(filters: AgentFeedbackFilters, params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
    create(data: {
        agentId: string;
        taskId?: string;
        rating: number;
        comment?: string;
        feedbackType: FeedbackType;
        createdBy?: string;
    }): Promise<AgentFeedback>;
    update(id: string, updates: {
        rating?: number;
        comment?: string;
    }): Promise<AgentFeedback>;
    delete(id: string): Promise<void>;
}
