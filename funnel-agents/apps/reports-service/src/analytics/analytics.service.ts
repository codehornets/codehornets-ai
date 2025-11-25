import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity, AgentEntity, FeedbackEntity } from './entities';
import {
  AnalyticsQueryDto,
  TaskAnalyticsDto,
  AgentAnalyticsDto,
  DomainAnalyticsDto,
  TasksByDay,
  AgentMetrics,
  DomainMetrics,
} from './dto';
import { CacheService } from './services/cache.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async getTaskAnalytics(query: AnalyticsQueryDto): Promise<TaskAnalyticsDto> {
    this.logger.log('Generating task analytics');

    // Check cache first
    const cacheKey = this.cacheService.generateKey(
      'task-analytics',
      query.workspace_id || 'global',
      query,
    );

    const cached = await this.cacheService.get<TaskAnalyticsDto>(cacheKey);
    if (cached) {
      this.logger.log('Returning cached task analytics');
      return cached;
    }

    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    // Apply filters
    if (query.start_date) {
      queryBuilder.andWhere('task.created_at >= :startDate', {
        startDate: new Date(query.start_date),
      });
    }

    if (query.end_date) {
      queryBuilder.andWhere('task.created_at <= :endDate', {
        endDate: new Date(query.end_date),
      });
    }

    if (query.workspace_id) {
      queryBuilder.andWhere('task.workspace_id = :workspaceId', {
        workspaceId: query.workspace_id,
      });
    }

    if (query.agent_id) {
      queryBuilder.andWhere('task.agent_id = :agentId', {
        agentId: query.agent_id,
      });
    }

    const tasks = await queryBuilder.getMany();

    // Calculate statistics
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const failed = tasks.filter((t) => t.status === 'FAILED').length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const running = tasks.filter((t) => t.status === 'RUNNING').length;

    const successRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average completion time
    const completedTasks = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.startedAt && t.completedAt,
    );
    const totalTime = completedTasks.reduce((sum, task) => {
      const time =
        new Date(task.completedAt).getTime() -
        new Date(task.startedAt).getTime();
      return sum + time;
    }, 0);
    const avgCompletionTime =
      completedTasks.length > 0 ? totalTime / completedTasks.length : 0;

    // Tasks by status
    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Tasks by day
    const tasksByDay = this.aggregateTasksByDay(tasks);

    const result = new TaskAnalyticsDto({
      total,
      completed,
      failed,
      pending,
      running,
      success_rate: Number(successRate.toFixed(2)),
      avg_completion_time: Number((avgCompletionTime / 1000).toFixed(2)), // Convert to seconds
      tasks_by_status: tasksByStatus,
      tasks_by_day: tasksByDay,
    });

    // Cache result
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  async getAgentAnalytics(query: AnalyticsQueryDto): Promise<AgentAnalyticsDto> {
    this.logger.log('Generating agent analytics');

    const agentQueryBuilder = this.agentRepository.createQueryBuilder('agent');

    // Apply filters
    if (query.workspace_id) {
      agentQueryBuilder.andWhere('agent.workspace_id = :workspaceId', {
        workspaceId: query.workspace_id,
      });
    }

    if (query.domain) {
      agentQueryBuilder.andWhere('agent.domain = :domain', {
        domain: query.domain,
      });
    }

    const agents = await agentQueryBuilder.getMany();

    const totalAgents = agents.length;
    const activeAgents = agents.filter(
      (a) => a.status === 'IDLE' || a.status === 'BUSY',
    ).length;

    // Get metrics for each agent
    const agentMetrics = await Promise.all(
      agents.map((agent) => this.getAgentMetrics(agent, query)),
    );

    return new AgentAnalyticsDto({
      total_agents: totalAgents,
      active_agents: activeAgents,
      agents: agentMetrics,
    });
  }

  async getDomainAnalytics(query: AnalyticsQueryDto): Promise<DomainAnalyticsDto> {
    this.logger.log('Generating domain analytics');

    const agentQueryBuilder = this.agentRepository.createQueryBuilder('agent');

    if (query.workspace_id) {
      agentQueryBuilder.andWhere('agent.workspace_id = :workspaceId', {
        workspaceId: query.workspace_id,
      });
    }

    const agents = await agentQueryBuilder.getMany();

    // Group agents by domain
    const domainGroups = agents.reduce(
      (acc, agent) => {
        const domain = agent.domain || 'undefined';
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(agent);
        return acc;
      },
      {} as Record<string, AgentEntity[]>,
    );

    // Calculate metrics for each domain
    const domainMetrics = await Promise.all(
      Object.entries(domainGroups).map(([domain, domainAgents]) =>
        this.getDomainMetrics(domain, domainAgents, query),
      ),
    );

    return new DomainAnalyticsDto({
      domains: domainMetrics,
    });
  }

  private aggregateTasksByDay(tasks: TaskEntity[]): TasksByDay[] {
    const dayMap = new Map<string, TasksByDay>();

    tasks.forEach((task) => {
      const date = new Date(task.createdAt).toISOString().split('T')[0];
      const existing = dayMap.get(date) || {
        date,
        count: 0,
        completed: 0,
        failed: 0,
      };

      existing.count++;
      if (task.status === 'COMPLETED') existing.completed++;
      if (task.status === 'FAILED') existing.failed++;

      dayMap.set(date, existing);
    });

    return Array.from(dayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private async getAgentMetrics(
    agent: AgentEntity,
    query: AnalyticsQueryDto,
  ): Promise<AgentMetrics> {
    const taskQueryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.agent_id = :agentId', { agentId: agent.id });

    if (query.start_date) {
      taskQueryBuilder.andWhere('task.created_at >= :startDate', {
        startDate: new Date(query.start_date),
      });
    }

    if (query.end_date) {
      taskQueryBuilder.andWhere('task.created_at <= :endDate', {
        endDate: new Date(query.end_date),
      });
    }

    const tasks = await taskQueryBuilder.getMany();

    const tasksCompleted = tasks.filter((t) => t.status === 'COMPLETED').length;
    const tasksFailed = tasks.filter((t) => t.status === 'FAILED').length;
    const successRate =
      tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;

    // Calculate average completion time
    const completedTasks = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.startedAt && t.completedAt,
    );
    const totalTime = completedTasks.reduce((sum, task) => {
      const time =
        new Date(task.completedAt).getTime() -
        new Date(task.startedAt).getTime();
      return sum + time;
    }, 0);
    const avgCompletionTime =
      completedTasks.length > 0 ? totalTime / completedTasks.length / 1000 : 0;

    return {
      id: agent.id,
      name: agent.name,
      domain: agent.domain || 'undefined',
      status: agent.status,
      tasks_completed: tasksCompleted,
      tasks_failed: tasksFailed,
      success_rate: Number(successRate.toFixed(2)),
      avg_completion_time: Number(avgCompletionTime.toFixed(2)),
      avg_feedback_rating: await this.getAverageFeedbackRating(agent.id, query),
    };
  }

  /**
   * Calculate average feedback rating for an agent
   */
  private async getAverageFeedbackRating(
    agentId: string,
    query: AnalyticsQueryDto,
  ): Promise<number> {
    const feedbackQuery = this.feedbackRepository
      .createQueryBuilder('feedback')
      .where('feedback.agent_id = :agentId', { agentId });

    if (query.start_date) {
      feedbackQuery.andWhere('feedback.created_at >= :startDate', {
        startDate: new Date(query.start_date),
      });
    }

    if (query.end_date) {
      feedbackQuery.andWhere('feedback.created_at <= :endDate', {
        endDate: new Date(query.end_date),
      });
    }

    if (query.workspace_id) {
      feedbackQuery.andWhere('feedback.workspace_id = :workspaceId', {
        workspaceId: query.workspace_id,
      });
    }

    const feedbacks = await feedbackQuery.getMany();

    if (feedbacks.length === 0) return 0;

    const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    return Number((totalRating / feedbacks.length).toFixed(2));
  }

  private async getDomainMetrics(
    domain: string,
    agents: AgentEntity[],
    query: AnalyticsQueryDto,
  ): Promise<DomainMetrics> {
    const agentIds = agents.map((a) => a.id);
    const agentCount = agents.length;
    const activeCount = agents.filter(
      (a) => a.status === 'IDLE' || a.status === 'BUSY',
    ).length;

    const taskQueryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.agent_id IN (:...agentIds)', { agentIds });

    if (query.start_date) {
      taskQueryBuilder.andWhere('task.created_at >= :startDate', {
        startDate: new Date(query.start_date),
      });
    }

    if (query.end_date) {
      taskQueryBuilder.andWhere('task.created_at <= :endDate', {
        endDate: new Date(query.end_date),
      });
    }

    const tasks = agentIds.length > 0 ? await taskQueryBuilder.getMany() : [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const successRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average completion time
    const completedTasksList = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.startedAt && t.completedAt,
    );
    const totalTime = completedTasksList.reduce((sum, task) => {
      const time =
        new Date(task.completedAt).getTime() -
        new Date(task.startedAt).getTime();
      return sum + time;
    }, 0);
    const avgCompletionTime =
      completedTasksList.length > 0
        ? totalTime / completedTasksList.length / 1000
        : 0;

    return {
      domain,
      agent_count: agentCount,
      active_count: activeCount,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      success_rate: Number(successRate.toFixed(2)),
      avg_completion_time: Number(avgCompletionTime.toFixed(2)),
    };
  }
}
