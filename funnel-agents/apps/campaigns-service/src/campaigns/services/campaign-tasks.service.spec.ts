import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { CampaignTasksService } from './campaign-tasks.service';

describe('CampaignTasksService', () => {
  let service: CampaignTasksService;
  let tasksClient: jest.Mocked<ClientProxy>;

  const mockTasksClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignTasksService,
        {
          provide: 'TASKS_SERVICE',
          useValue: mockTasksClient,
        },
      ],
    }).compile();

    service = module.get<CampaignTasksService>(CampaignTasksService);
    tasksClient = module.get('TASKS_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTasksFromTemplate', () => {
    it('should create multiple tasks from template', async () => {
      const options = {
        campaign_id: 'campaign-1',
        workspace_id: 'workspace-1',
        tasks: [
          {
            title: 'Task 1',
            description: 'Description 1',
            agent_domain: 'sales',
            priority: 'high',
          },
          {
            title: 'Task 2',
            description: 'Description 2',
            agent_domain: 'marketing',
          },
        ],
      };

      mockTasksClient.send
        .mockReturnValueOnce(of({ id: 'task-1', status: 'pending' }))
        .mockReturnValueOnce(of({ id: 'task-2', status: 'pending' }));

      const result = await service.createTasksFromTemplate(options);

      expect(result.campaign_id).toBe('campaign-1');
      expect(result.total_tasks).toBe(2);
      expect(result.created_tasks).toHaveLength(2);
      expect(result.failed_tasks).toHaveLength(0);
      expect(result.created_tasks[0]).toMatchObject({
        task_id: 'task-1',
        title: 'Task 1',
        status: 'pending',
      });
      expect(mockTasksClient.send).toHaveBeenCalledTimes(2);
    });

    it('should handle task creation failures gracefully', async () => {
      const options = {
        campaign_id: 'campaign-1',
        workspace_id: 'workspace-1',
        tasks: [
          { title: 'Task 1' },
          { title: 'Task 2' },
          { title: 'Task 3' },
        ],
      };

      mockTasksClient.send
        .mockReturnValueOnce(of({ id: 'task-1', status: 'pending' }))
        .mockReturnValueOnce(throwError(() => new Error('Creation failed')))
        .mockReturnValueOnce(of({ id: 'task-3', status: 'pending' }));

      const result = await service.createTasksFromTemplate(options);

      expect(result.created_tasks).toHaveLength(2);
      expect(result.failed_tasks).toHaveLength(1);
      expect(result.failed_tasks[0]).toMatchObject({
        title: 'Task 2',
        error: 'Creation failed',
      });
    });

    it('should respect delay between tasks', async () => {
      const options = {
        campaign_id: 'campaign-1',
        workspace_id: 'workspace-1',
        tasks: [{ title: 'Task 1' }, { title: 'Task 2' }],
        delay_between_tasks: 50,
      };

      mockTasksClient.send.mockReturnValue(
        of({ id: 'task-1', status: 'pending' }),
      );

      const startTime = Date.now();
      await service.createTasksFromTemplate(options);
      const endTime = Date.now();

      // Should take at least 50ms (one delay between two tasks)
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });

    it('should include template metadata in created tasks', async () => {
      const options = {
        campaign_id: 'campaign-1',
        workspace_id: 'workspace-1',
        tasks: [{ title: 'Task 1', description: 'Test' }],
      };

      mockTasksClient.send.mockReturnValue(
        of({ id: 'task-1', status: 'pending' }),
      );

      await service.createTasksFromTemplate(options);

      expect(mockTasksClient.send).toHaveBeenCalledWith(
        'tasks.create',
        expect.objectContaining({
          title: 'Task 1',
          description: 'Test',
          campaign_id: 'campaign-1',
          workspace_id: 'workspace-1',
          status: 'pending',
          metadata: {
            created_from_template: true,
            template_task: true,
          },
        }),
      );
    });
  });

  describe('createTask', () => {
    it('should create a single task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        workspace_id: 'workspace-1',
        campaign_id: 'campaign-1',
        agent_domain: 'sales',
        priority: 'high',
      };

      const mockResponse = { id: 'task-1', ...taskData };
      mockTasksClient.send.mockReturnValue(of(mockResponse));

      const result = await service.createTask(taskData);

      expect(result).toEqual(mockResponse);
      expect(mockTasksClient.send).toHaveBeenCalledWith(
        'tasks.create',
        expect.objectContaining({
          ...taskData,
          status: 'pending',
          metadata: {
            created_from_campaign: true,
          },
        }),
      );
    });

    it('should throw error if task creation fails', async () => {
      const taskData = {
        title: 'New Task',
        campaign_id: 'campaign-1',
      };

      mockTasksClient.send.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      await expect(service.createTask(taskData)).rejects.toThrow(
        'Service unavailable',
      );
    });
  });

  describe('getCampaignTasks', () => {
    it('should fetch tasks for a campaign', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ];

      mockTasksClient.send.mockReturnValue(
        of({ data: mockTasks, total: 2 }),
      );

      const result = await service.getCampaignTasks('campaign-1');

      expect(result).toEqual(mockTasks);
      expect(mockTasksClient.send).toHaveBeenCalledWith('tasks.findAll', {
        filters: { campaign_id: 'campaign-1' },
      });
    });

    it('should return empty array on error', async () => {
      mockTasksClient.send.mockReturnValue(
        throwError(() => new Error('Service error')),
      );

      const result = await service.getCampaignTasks('campaign-1');

      expect(result).toEqual([]);
    });

    it('should handle response without data field', async () => {
      mockTasksClient.send.mockReturnValue(of({}));

      const result = await service.getCampaignTasks('campaign-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      mockTasksClient.send.mockReturnValue(of({ success: true }));

      await service.updateTaskStatus('task-1', 'completed');

      expect(mockTasksClient.send).toHaveBeenCalledWith('tasks.update', {
        id: 'task-1',
        status: 'completed',
      });
    });

    it('should throw error if update fails', async () => {
      mockTasksClient.send.mockReturnValue(
        throwError(() => new Error('Update failed')),
      );

      await expect(
        service.updateTaskStatus('task-1', 'completed'),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteCampaignTasks', () => {
    it('should delete all tasks for a campaign', async () => {
      const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }, { id: 'task-3' }];

      mockTasksClient.send
        .mockReturnValueOnce(of({ data: mockTasks })) // getCampaignTasks
        .mockReturnValueOnce(of({ success: true })) // delete task-1
        .mockReturnValueOnce(of({ success: true })) // delete task-2
        .mockReturnValueOnce(of({ success: true })); // delete task-3

      const result = await service.deleteCampaignTasks('campaign-1');

      expect(result).toBe(3);
      expect(mockTasksClient.send).toHaveBeenCalledTimes(4);
    });

    it('should continue deleting even if some deletions fail', async () => {
      const mockTasks = [{ id: 'task-1' }, { id: 'task-2' }];

      mockTasksClient.send
        .mockReturnValueOnce(of({ data: mockTasks }))
        .mockReturnValueOnce(of({ success: true }))
        .mockReturnValueOnce(throwError(() => new Error('Delete failed')));

      const result = await service.deleteCampaignTasks('campaign-1');

      expect(result).toBe(1); // Only one succeeded
    });

    it('should return 0 if fetching tasks fails', async () => {
      mockTasksClient.send.mockReturnValue(
        throwError(() => new Error('Fetch failed')),
      );

      const result = await service.deleteCampaignTasks('campaign-1');

      expect(result).toBe(0);
    });
  });

  describe('isTasksServiceAvailable', () => {
    it('should return true if service is available', async () => {
      mockTasksClient.send.mockReturnValue(of({ status: 'healthy' }));

      const result = await service.isTasksServiceAvailable();

      expect(result).toBe(true);
      expect(mockTasksClient.send).toHaveBeenCalledWith('health.check', {});
    });

    it('should return false if service is unavailable', async () => {
      mockTasksClient.send.mockReturnValue(
        throwError(() => new Error('Service down')),
      );

      const result = await service.isTasksServiceAvailable();

      expect(result).toBe(false);
    });
  });
});
