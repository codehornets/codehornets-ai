import { Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { CreateFeedbackDto, FeedbackStatsDto } from '../dto/feedback.dto';
export declare class FeedbackController {
    private readonly feedbackRepository;
    constructor(feedbackRepository: Repository<FeedbackEntity>);
    create(dto: CreateFeedbackDto): Promise<FeedbackEntity>;
    getAgentFeedback(agentId: string): Promise<FeedbackEntity[]>;
    getAgentFeedbackStats(agentId: string, startDate?: string, endDate?: string): Promise<FeedbackStatsDto>;
    getWorkspaceFeedbackStats(workspaceId: string): Promise<{
        averageRating: number;
        totalFeedback: number;
    }>;
}
