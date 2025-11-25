import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { ScheduledTask, TaskType, TaskStatus } from './entities/scheduled-task.entity';
import { TaskExecution, ExecutionStatus } from './entities/task-execution.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ScheduledTasksService', () => {
  let service: ScheduledTasksService;
  let scheduledTaskRepository: Repository<ScheduledTask>;
  let taskExecutionRepository: Repository<TaskExecution>;

  const mockScheduledTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTaskExecutionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledTasksService,
        {
          provide: getRepositoryToken(ScheduledTask),
          useValue: mockScheduledTaskRepository,
        },
        {
          provide: getRepositoryToken(TaskExecution),
          useValue: mockTaskExecutionRepository,
        },
      ],
    }).compile();

    service = module.get<ScheduledTasksService>(ScheduledTasksService);
    scheduledTaskRepository = module.get(getRepositoryToken(ScheduledTask));
    taskExecutionRepository = module.get(getRepositoryToken(TaskExecution));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new scheduled task', async () => {
      const createDto = {
        name: 'Test Task',
        cron_expression: '0 9 * * *',
        task_type: TaskType.WORKFLOW,
        target_id: 'workflow-123',
      };

      const mockTask = {
        id: 'task-123',
        ...createDto,
        enabled: true,
        status: TaskStatus.ACTIVE,
        run_count: 0,
        failure_count: 0,
      };

      mockScheduledTaskRepository.create.mockReturnValue(mockTask);
      mockScheduledTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTask);
      expect(mockScheduledTaskRepository.create).toHaveBeenCalled();
      expect(mockScheduledTaskRepository.save).toHaveBeenCalled();
    });

    it('should throw error for invalid cron expression', async () => {
      const createDto = {
        name: 'Test Task',
        cron_expression: 'invalid-cron',
        task_type: TaskType.WORKFLOW,
        target_id: 'workflow-123',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
      };

      mockScheduledTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-123');

      expect(result).toEqual(mockTask);
      expect(mockScheduledTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-123' },
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockScheduledTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('enable', () => {
    it('should enable a disabled task', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
        enabled: false,
        cron_expression: '0 9 * * *',
      };

      mockScheduledTaskRepository.findOne.mockResolvedValue(mockTask);
      mockScheduledTaskRepository.save.mockResolvedValue({
        ...mockTask,
        enabled: true,
      });

      const result = await service.enable('task-123');

      expect(result.enabled).toBe(true);
      expect(result.status).toBe(TaskStatus.ACTIVE);
    });
  });

  describe('disable', () => {
    it('should disable an enabled task', async () => {
      const mockTask = {
        id: 'task-123',
        name: 'Test Task',
        enabled: true,
      };

      mockScheduledTaskRepository.findOne.mockResolvedValue(mockTask);
      mockScheduledTaskRepository.save.mockResolvedValue({
        ...mockTask,
        enabled: false,
      });

      const result = await service.disable('task-123');

      expect(result.enabled).toBe(false);
      expect(result.status).toBe(TaskStatus.PAUSED);
    });
  });

  describe('createExecution', () => {
    it('should create a task execution record', async () => {
      const createDto = {
        task_id: 'task-123',
        status: ExecutionStatus.PENDING,
      };

      const mockExecution = {
        id: 'execution-123',
        ...createDto,
        started_at: new Date(),
      };

      mockTaskExecutionRepository.create.mockReturnValue(mockExecution);
      mockTaskExecutionRepository.save.mockResolvedValue(mockExecution);

      const result = await service.createExecution(createDto);

      expect(result).toEqual(mockExecution);
      expect(mockTaskExecutionRepository.create).toHaveBeenCalled();
    });
  });
});
