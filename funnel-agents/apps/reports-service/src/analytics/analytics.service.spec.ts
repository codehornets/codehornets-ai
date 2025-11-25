import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { TaskEntity, AgentEntity } from './entities';
import { AnalyticsQueryDto } from './dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let taskRepository: Repository<TaskEntity>;
  let agentRepository: Repository<AgentEntity>;

  const mockTaskRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockAgentRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: mockAgentRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    taskRepository = module.get<Repository<TaskEntity>>(
      getRepositoryToken(TaskEntity),
    );
    agentRepository = module.get<Repository<AgentEntity>>(
      getRepositoryToken(AgentEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTaskAnalytics', () => {
    it('should return task analytics with correct calculations', async () => {
      const mockTasks: Partial<TaskEntity>[] = [
        {
          id: '1',
          status: 'COMPLETED',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          completedAt: new Date('2024-01-01T10:05:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          status: 'FAILED',
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
        {
          id: '3',
          status: 'PENDING',
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const query: AnalyticsQueryDto = {};
      const result = await service.getTaskAnalytics(query);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.success_rate).toBeCloseTo(33.33, 1);
      expect(result.avg_completion_time).toBeCloseTo(300, 0); // 5 minutes = 300 seconds
    });
  });

  describe('getAgentAnalytics', () => {
    it('should return agent analytics', async () => {
      const mockAgents: Partial<AgentEntity>[] = [
        {
          id: '1',
          name: 'Agent 1',
          status: 'IDLE',
          domain: 'sales',
        },
        {
          id: '2',
          name: 'Agent 2',
          status: 'BUSY',
          domain: 'support',
        },
        {
          id: '3',
          name: 'Agent 3',
          status: 'OFFLINE',
          domain: 'sales',
        },
      ];

      const mockAgentQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAgents),
      };

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(
        mockAgentQueryBuilder,
      );
      mockTaskRepository.createQueryBuilder.mockReturnValue(
        mockTaskQueryBuilder,
      );

      const query: AnalyticsQueryDto = {};
      const result = await service.getAgentAnalytics(query);

      expect(result.total_agents).toBe(3);
      expect(result.active_agents).toBe(2);
      expect(result.agents).toHaveLength(3);
    });
  });

  describe('getDomainAnalytics', () => {
    it('should return domain analytics grouped by domain', async () => {
      const mockAgents: Partial<AgentEntity>[] = [
        {
          id: '1',
          name: 'Agent 1',
          status: 'IDLE',
          domain: 'sales',
        },
        {
          id: '2',
          name: 'Agent 2',
          status: 'BUSY',
          domain: 'sales',
        },
        {
          id: '3',
          name: 'Agent 3',
          status: 'OFFLINE',
          domain: 'support',
        },
      ];

      const mockAgentQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAgents),
      };

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(
        mockAgentQueryBuilder,
      );
      mockTaskRepository.createQueryBuilder.mockReturnValue(
        mockTaskQueryBuilder,
      );

      const query: AnalyticsQueryDto = {};
      const result = await service.getDomainAnalytics(query);

      expect(result.domains).toHaveLength(2);
      expect(result.domains.find((d) => d.domain === 'sales')).toBeDefined();
      expect(result.domains.find((d) => d.domain === 'support')).toBeDefined();
    });
  });
});
