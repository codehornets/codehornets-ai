import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsRepository } from './workflows.repository';
import { WorkflowRunsService } from '../workflow-runs/workflow-runs.service';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let repository: WorkflowsRepository;
  let workflowRunsService: WorkflowRunsService;

  const mockWorkflow = {
    id: '123',
    name: 'Test Workflow',
    description: 'Test Description',
    status: 'active' as const,
    trigger_type: 'manual' as const,
    nodes: [],
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
    exists: jest.fn(),
  };

  const mockWorkflowRunsService = {
    create: jest.fn(),
    markAsCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: WorkflowsRepository,
          useValue: mockRepository,
        },
        {
          provide: WorkflowRunsService,
          useValue: mockWorkflowRunsService,
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    repository = module.get<WorkflowsRepository>(WorkflowsRepository);
    workflowRunsService = module.get<WorkflowRunsService>(WorkflowRunsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all workflows', async () => {
      mockRepository.findAll.mockResolvedValue([mockWorkflow]);

      const result = await service.findAll();

      expect(result).toEqual([mockWorkflow]);
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should filter workflows by status', async () => {
      const filters = { status: 'active' as const };
      mockRepository.findAll.mockResolvedValue([mockWorkflow]);

      const result = await service.findAll(filters);

      expect(result).toEqual([mockWorkflow]);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should return a workflow by id', async () => {
      mockRepository.findById.mockResolvedValue(mockWorkflow);

      const result = await service.findById('123');

      expect(result).toEqual(mockWorkflow);
      expect(repository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if workflow not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      const createDto = {
        name: 'Test Workflow',
        trigger_type: 'manual' as const,
      };
      mockRepository.create.mockResolvedValue(mockWorkflow);

      const result = await service.create(createDto);

      expect(result).toEqual(mockWorkflow);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        status: 'draft',
        nodes: [],
        edges: [],
      });
    });
  });

  describe('update', () => {
    it('should update a workflow', async () => {
      const updateDto = { name: 'Updated Name' };
      mockRepository.exists.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue({ ...mockWorkflow, ...updateDto });

      const result = await service.update('123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(repository.exists).toHaveBeenCalledWith('123');
      expect(repository.update).toHaveBeenCalledWith('123', updateDto);
    });

    it('should throw NotFoundException if workflow not found', async () => {
      mockRepository.exists.mockResolvedValue(false);

      await expect(service.update('123', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
      mockRepository.exists.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('123');

      expect(repository.exists).toHaveBeenCalledWith('123');
      expect(repository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if workflow not found', async () => {
      mockRepository.exists.mockResolvedValue(false);

      await expect(service.delete('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute', () => {
    it('should execute an active workflow', async () => {
      const mockRun = { id: 'run-123', status: 'running' };
      const mockCompletedRun = { ...mockRun, status: 'completed' };

      mockRepository.findById.mockResolvedValue(mockWorkflow);
      mockWorkflowRunsService.create.mockResolvedValue(mockRun);
      mockWorkflowRunsService.markAsCompleted.mockResolvedValue(mockCompletedRun);

      const result = await service.execute('123', {});

      expect(result).toEqual(mockCompletedRun);
      expect(workflowRunsService.create).toHaveBeenCalledWith({
        workflow_id: '123',
        trigger_type: 'manual',
        trigger_data: undefined,
        status: 'running',
      });
      expect(workflowRunsService.markAsCompleted).toHaveBeenCalledWith('run-123');
    });

    it('should throw BadRequestException if workflow is not active', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockWorkflow, status: 'draft' });

      await expect(service.execute('123', {})).rejects.toThrow(BadRequestException);
    });
  });
});
