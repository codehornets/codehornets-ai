import { Repository } from 'typeorm';
import { TaskEntity, AgentEntity, FeedbackEntity } from './entities';
import { AnalyticsQueryDto, TaskAnalyticsDto, AgentAnalyticsDto, DomainAnalyticsDto } from './dto';
import { CacheService } from './services/cache.service';
export declare class AnalyticsService {
    private readonly taskRepository;
    private readonly agentRepository;
    private readonly feedbackRepository;
    private readonly cacheService;
    private readonly logger;
    constructor(taskRepository: Repository<TaskEntity>, agentRepository: Repository<AgentEntity>, feedbackRepository: Repository<FeedbackEntity>, cacheService: CacheService);
    getTaskAnalytics(query: AnalyticsQueryDto): Promise<TaskAnalyticsDto>;
    getAgentAnalytics(query: AnalyticsQueryDto): Promise<AgentAnalyticsDto>;
    getDomainAnalytics(query: AnalyticsQueryDto): Promise<DomainAnalyticsDto>;
    private aggregateTasksByDay;
    private getAgentMetrics;
    /**
     * Calculate average feedback rating for an agent
     */
    private getAverageFeedbackRating;
    private getDomainMetrics;
}
