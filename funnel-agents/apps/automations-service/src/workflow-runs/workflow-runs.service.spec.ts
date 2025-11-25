import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';
import { WorkflowRunsRepository } from './workflow-runs.repository';

describe('WorkflowRunsService', () => {
  let service: WorkflowRunsService;
  let repository: WorkflowRunsRepository;

  const mockWorkflowRun = {
    id: 'run-123',
    workflow_id: 'workflow-123',
    status: 'pending' as const,
    trigger_type: 'manual',
    execution_log: [],
    created_at: new Date(),
  };

  const mockWorkflow = {
    id: 'workflow-123',
    name: 'Test Workflow',
    status: 'active' as const,
    trigger_type: 'manual' as const,
    nodes: [
      {
        id: 'node-1',
        type: 'trigger' as const,
        position: { x: 0, y: 0 },
        data: {},
      },
      {
        id: 'node-2',
        type: 'email' as const,
        position: { x: 100, y: 0 },
        data: {},
      },
    ],
    edges: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowRunsService,
        {
          provide: WorkflowRunsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowRunsService>(WorkflowRunsService);
    repository = module.get<WorkflowRunsRepository>(WorkflowRunsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all workflow runs', async () => {
      mockRepository.findAll.mockResolvedValue([mockWorkflowRun]);

      const result = await service.findAll();

      expect(result).toEqual([mockWorkflowRun]);
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should filter workflow runs by workflow_id', async () => {
      const filters = { workflow_id: 'workflow-123' };
      mockRepository.findAll.mockResolvedValue([mockWorkflowRun]);

      const result = await service.findAll(filters);

      expect(result).toEqual([mockWorkflowRun]);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should return a workflow run by id', async () => {
      mockRepository.findById.mockResolvedValue(mockWorkflowRun);

      const result = await service.findById('run-123');

      expect(result).toEqual(mockWorkflowRun);
      expect(repository.findById).toHaveBeenCalledWith('run-123');
    });

    it('should throw NotFoundException if workflow run not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('run-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new workflow run', async () => {
      const createDto = {
        workflow_id: 'workflow-123',
        trigger_type: 'manual',
      };
      mockRepository.create.mockResolvedValue(mockWorkflowRun);

      const result = await service.create(createDto);

      expect(result).toEqual(mockWorkflowRun);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        status: 'pending',
        execution_log: [],
        started_at: undefined,
      });
    });

    it('should set started_at when creating with running status', async () => {
      const createDto = {
        workflow_id: 'workflow-123',
        trigger_type: 'manual',
        status: 'running' as const,
      };
      mockRepository.create.mockResolvedValue({
        ...mockWorkflowRun,
        status: 'running',
      });

      await service.create(createDto);

      const callArgs = mockRepository.create.mock.calls[0][0];
      expect(callArgs.started_at).toBeDefined();
      expect(callArgs.started_at).toBeInstanceOf(Date);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark workflow run as completed with execution log', async () => {
      const runWithWorkflow = {
        ...mockWorkflowRun,
        workflow: mockWorkflow,
      };
      mockRepository.findById.mockResolvedValue(runWithWorkflow);
      mockRepository.update.mockResolvedValue({
        ...runWithWorkflow,
        status: 'completed',
        completed_at: new Date(),
      });

      const result = await service.markAsCompleted('run-123');

      expect(result.status).toBe('completed');
      expect(repository.update).toHaveBeenCalledWith('run-123', {
        status: 'completed',
        completed_at: expect.any(Date),
        execution_log: expect.arrayContaining([
          expect.objectContaining({
            node_id: 'node-1',
            node_type: 'trigger',
            status: 'completed',
          }),
          expect.objectContaining({
            node_id: 'node-2',
            node_type: 'email',
            status: 'completed',
          }),
        ]),
      });
    });

    it('should throw NotFoundException if workflow run not found', async () => {
      mockRepository.findById.mockResolvedValue(mockWorkflowRun);
      mockRepository.update.mockResolvedValue(null);

      await expect(service.markAsCompleted('run-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsFailed', () => {
    it('should mark workflow run as failed with error message', async () => {
      mockRepository.update.mockResolvedValue({
        ...mockWorkflowRun,
        status: 'failed',
        error_message: 'Test error',
        completed_at: new Date(),
      });

      const result = await service.markAsFailed('run-123', 'Test error');

      expect(result.status).toBe('failed');
      expect(result.error_message).toBe('Test error');
      expect(repository.update).toHaveBeenCalledWith('run-123', {
        status: 'failed',
        completed_at: expect.any(Date),
        error_message: 'Test error',
      });
    });

    it('should throw NotFoundException if workflow run not found', async () => {
      mockRepository.update.mockResolvedValue(null);

      await expect(service.markAsFailed('run-123', 'Test error')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
