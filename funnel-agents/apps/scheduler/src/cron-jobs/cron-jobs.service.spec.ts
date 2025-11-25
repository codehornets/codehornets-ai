import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJobsService } from './cron-jobs.service';
import { ScheduledTasksService } from '../scheduled-tasks/scheduled-tasks.service';
import { WorkflowDispatcherService } from '../dispatchers/workflow-dispatcher.service';
import { ReportDispatcherService } from '../dispatchers/report-dispatcher.service';
import { AgentDispatcherService } from '../dispatchers/agent-dispatcher.service';
import { CustomDispatcherService } from '../dispatchers/custom-dispatcher.service';
import { DistributedLockService } from '@funnelagents/infrastructure';
import { TaskType, TaskStatus } from '../scheduled-tasks/entities/scheduled-task.entity';

describe('CronJobsService', () => {
  let service: CronJobsService;
  let scheduledTasksService: ScheduledTasksService;
  let workflowDispatcher: WorkflowDispatcherService;

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
    getCronJobs: jest.fn(() => new Map()),
  };

  const mockScheduledTasksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getDueTasks: jest.fn(),
    createExecution: jest.fn(),
    updateExecution: jest.fn(),
    updateAfterExecution: jest.fn(),
  };

  const mockWorkflowDispatcher = {
    dispatch: jest.fn(),
  };

  const mockReportDispatcher = {
    dispatch: jest.fn(),
  };

  const mockAgentDispatcher = {
    dispatch: jest.fn(),
  };

  const mockCustomDispatcher = {
    dispatch: jest.fn(),
  };

  const mockLockService = {
    acquire: jest.fn(),
    release: jest.fn(),
    extend: jest.fn(),
    getMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobsService,
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: ScheduledTasksService,
          useValue: mockScheduledTasksService,
        },
        {
          provide: WorkflowDispatcherService,
          useValue: mockWorkflowDispatcher,
        },
        {
          provide: ReportDispatcherService,
          useValue: mockReportDispatcher,
        },
        {
          provide: AgentDispatcherService,
          useValue: mockAgentDispatcher,
        },
        {
          provide: CustomDispatcherService,
          useValue: mockCustomDispatcher,
        },
        {
          provide: DistributedLockService,
          useValue: mockLockService,
        },
      ],
    }).compile();

    service = module.get<CronJobsService>(CronJobsService);
    scheduledTasksService = module.get<ScheduledTasksService>(
      ScheduledTasksService,
    );
    workflowDispatcher = module.get<WorkflowDispatcherService>(
      WorkflowDispatcherService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeTask with distributed locking', () => {
    it('should execute a workflow task successfully with lock', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Workflow',
        task_type: TaskType.WORKFLOW,
        target_id: 'workflow-123',
        timeout_seconds: 300,
      };

      const mockExecution = {
        id: 'execution-123',
        task_id: 'task-123',
        status: 'running',
      };

      mockLockService.acquire.mockResolvedValue({
        acquired: true,
        lockId: 'lock-123',
      });
      mockScheduledTasksService.createExecution.mockResolvedValue(
        mockExecution,
      );
      mockWorkflowDispatcher.dispatch.mockResolvedValue({
        execution_id: 'exec-123',
      });
      mockScheduledTasksService.updateExecution.mockResolvedValue({});
      mockScheduledTasksService.updateAfterExecution.mockResolvedValue({});

      await service.executeTask(mockTask as any);

      expect(mockLockService.acquire).toHaveBeenCalledWith(
        'scheduler:task:task-123',
        expect.any(Object),
      );
      expect(mockScheduledTasksService.createExecution).toHaveBeenCalled();
      expect(mockWorkflowDispatcher.dispatch).toHaveBeenCalledWith(mockTask);
      expect(mockScheduledTasksService.updateExecution).toHaveBeenCalled();
      expect(mockScheduledTasksService.updateAfterExecution).toHaveBeenCalledWith(
        mockTask.id,
        true,
      );
      expect(mockLockService.release).toHaveBeenCalledWith(
        'scheduler:task:task-123',
        'lock-123',
      );
    });

    it('should handle task execution failure', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
        task_type: TaskType.WORKFLOW,
        target_id: 'workflow-123',
        timeout_seconds: 300,
      };

      const mockExecution = {
        id: 'execution-123',
        task_id: 'task-123',
      };

      mockLockService.acquire.mockResolvedValue({
        acquired: true,
        lockId: 'lock-123',
      });
      mockScheduledTasksService.createExecution.mockResolvedValue(
        mockExecution,
      );
      mockWorkflowDispatcher.dispatch.mockRejectedValue(
        new Error('Execution failed'),
      );
      mockScheduledTasksService.updateExecution.mockResolvedValue({});
      mockScheduledTasksService.updateAfterExecution.mockResolvedValue({});

      await service.executeTask(mockTask as any);

      expect(mockScheduledTasksService.updateExecution).toHaveBeenCalledWith(
        mockExecution.id,
        expect.objectContaining({
          status: 'failed',
          error_message: 'Execution failed',
        }),
      );
      expect(mockScheduledTasksService.updateAfterExecution).toHaveBeenCalledWith(
        mockTask.id,
        false,
        'Execution failed',
      );
      expect(mockLockService.release).toHaveBeenCalledWith(
        'scheduler:task:task-123',
        'lock-123',
      );
    });

    it('should skip task if lock cannot be acquired', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
        task_type: TaskType.WORKFLOW,
        target_id: 'workflow-123',
        timeout_seconds: 300,
      };

      mockLockService.acquire.mockResolvedValue({
        acquired: false,
        lockId: null,
      });

      await service.executeTask(mockTask as any);

      expect(mockScheduledTasksService.createExecution).not.toHaveBeenCalled();
      expect(mockWorkflowDispatcher.dispatch).not.toHaveBeenCalled();
      expect(mockLockService.release).not.toHaveBeenCalled();
    });
  });

  describe('registerDynamicCron', () => {
    it('should register a new cron job', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
        cron_expression: '0 9 * * *',
        enabled: true,
      };

      await service.registerDynamicCron(mockTask as any);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should not register disabled tasks', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
        cron_expression: '0 9 * * *',
        enabled: false,
      };

      await service.registerDynamicCron(mockTask as any);

      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });
  });
});
