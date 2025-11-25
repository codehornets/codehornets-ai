import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { TaskProcessor } from './task.processor';
import { Job } from 'bullmq';
import { of, throwError } from 'rxjs';

describe('TaskProcessor', () => {
  let processor: TaskProcessor;
  let tasksClient: ClientProxy;
  let agentsClient: ClientProxy;
  let httpService: HttpService;

  const mockTasksClient = {
    send: jest.fn(),
  };

  const mockAgentsClient = {
    send: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskProcessor,
        {
          provide: 'TASKS_SERVICE',
          useValue: mockTasksClient,
        },
        {
          provide: 'AGENTS_SERVICE',
          useValue: mockAgentsClient,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    processor = module.get<TaskProcessor>(TaskProcessor);
    tasksClient = module.get<ClientProxy>('TASKS_SERVICE');
    agentsClient = module.get<ClientProxy>('AGENTS_SERVICE');
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  describe('process', () => {
    const mockJob = {
      id: 'job-123',
      data: {
        type: 'execute_task',
        payload: {
          taskId: 'task-123',
          workspaceId: 'workspace-123',
        },
        metadata: {
          correlationId: 'corr-123',
        },
      },
      updateProgress: jest.fn().mockResolvedValue(undefined),
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as Job<any>;

    const mockTask = {
      id: 'task-123',
      name: 'Test Task',
      description: 'Test task description',
      status: 'pending',
      priority: 'high',
      agentId: 'agent-123',
      workspaceId: 'workspace-123',
      input: { data: 'test' },
      timeout: 60000,
    };

    const mockAgent = {
      id: 'agent-123',
      name: 'Test Agent',
      type: 'custom',
      domain: 'testing',
      status: 'active',
      skills: ['test-skill'],
      tools: ['test-tool'],
      model: 'gpt-4',
    };

    const mockAgentResponse = {
      success: true,
      task_id: 'task-123',
      agent_id: 'agent-123',
      output: { result: 'success' },
      execution_log: ['Step 1', 'Step 2'],
      execution_time: 1000,
      tokens_used: 100,
    };

    it('should successfully process a task', async () => {
      mockTasksClient.send
        .mockReturnValueOnce(of(mockTask))
        .mockReturnValueOnce(of({ status: 'running' }))
        .mockReturnValueOnce(of({ status: 'completed' }));

      mockAgentsClient.send.mockReturnValueOnce(of(mockAgent));

      mockHttpService.post.mockReturnValueOnce(
        of({ data: mockAgentResponse }),
      );

      const result = await processor.process(mockJob);

      expect(result.success).toBe(true);
      expect(result.data?.taskId).toBe('task-123');
      expect(result.data?.status).toBe('completed');
      expect(mockJob.updateProgress).toHaveBeenCalled();
      expect(mockJob.log).toHaveBeenCalled();
    });

    it('should handle task not found', async () => {
      mockTasksClient.send.mockReturnValueOnce(of(null));

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle agent not found', async () => {
      mockTasksClient.send
        .mockReturnValueOnce(of(mockTask))
        .mockReturnValueOnce(of({ status: 'running' }))
        .mockReturnValueOnce(of({ status: 'failed' }));

      mockAgentsClient.send.mockReturnValueOnce(of(null));

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent');
    });

    it('should handle inactive agent', async () => {
      mockTasksClient.send
        .mockReturnValueOnce(of(mockTask))
        .mockReturnValueOnce(of({ status: 'running' }))
        .mockReturnValueOnce(of({ status: 'failed' }));

      mockAgentsClient.send.mockReturnValueOnce(
        of({ ...mockAgent, status: 'inactive' }),
      );

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should handle agent execution failure', async () => {
      mockTasksClient.send
        .mockReturnValueOnce(of(mockTask))
        .mockReturnValueOnce(of({ status: 'running' }))
        .mockReturnValueOnce(of({ status: 'failed' }));

      mockAgentsClient.send.mockReturnValueOnce(of(mockAgent));

      mockHttpService.post.mockReturnValueOnce(
        of({
          data: {
            ...mockAgentResponse,
            success: false,
            error: 'Agent execution error',
          },
        }),
      );

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent execution error');
    });

    it('should handle HTTP errors', async () => {
      mockTasksClient.send
        .mockReturnValueOnce(of(mockTask))
        .mockReturnValueOnce(of({ status: 'running' }))
        .mockReturnValueOnce(of({ status: 'failed' }));

      mockAgentsClient.send.mockReturnValueOnce(of(mockAgent));

      mockHttpService.post.mockReturnValueOnce(
        throwError(() => new Error('Network error')),
      );

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
