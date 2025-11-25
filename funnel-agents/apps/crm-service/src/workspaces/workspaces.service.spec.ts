import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let repository: Repository<Workspace>;

  const mockWorkspace: Workspace = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Workspace',
    description: 'A test workspace',
    color: '#FF5733',
    status: 'active',
    team_members: ['user1', 'user2'],
    settings: { notifications: true },
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    repository = module.get<Repository<Workspace>>(
      getRepositoryToken(Workspace),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of workspaces', async () => {
      mockRepository.find.mockResolvedValue([mockWorkspace]);

      const result = await service.findAll();

      expect(result).toEqual([mockWorkspace]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a workspace by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockWorkspace);

      const result = await service.findOne(mockWorkspace.id);

      expect(result).toEqual(mockWorkspace);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockWorkspace.id },
      });
    });

    it('should throw NotFoundException if workspace not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new workspace', async () => {
      const createDto: CreateWorkspaceDto = {
        name: 'New Workspace',
        status: 'active',
      };

      mockRepository.create.mockReturnValue(mockWorkspace);
      mockRepository.save.mockResolvedValue(mockWorkspace);

      const result = await service.create(createDto);

      expect(result).toEqual(mockWorkspace);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockWorkspace);
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      const updateDto: UpdateWorkspaceDto = {
        name: 'Updated Workspace',
      };

      mockRepository.findOne.mockResolvedValue(mockWorkspace);
      mockRepository.save.mockResolvedValue({
        ...mockWorkspace,
        ...updateDto,
      });

      const result = await service.update(mockWorkspace.id, updateDto);

      expect(result.name).toEqual(updateDto.name);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if workspace not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a workspace', async () => {
      mockRepository.findOne.mockResolvedValue(mockWorkspace);
      mockRepository.remove.mockResolvedValue(mockWorkspace);

      await service.remove(mockWorkspace.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockWorkspace);
    });

    it('should throw NotFoundException if workspace not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('onboard', () => {
    it('should update workspace with onboarding data', async () => {
      const onboardDto = {
        onboardingData: { step1: 'complete', step2: 'complete' },
      };

      mockRepository.findOne.mockResolvedValue(mockWorkspace);
      mockRepository.save.mockResolvedValue({
        ...mockWorkspace,
        settings: {
          ...mockWorkspace.settings,
          onboarding: {
            completed: true,
            data: onboardDto.onboardingData,
            completedAt: expect.any(Date),
          },
        },
      });

      const result = await service.onboard(mockWorkspace.id, onboardDto);

      expect(result.settings?.onboarding).toBeDefined();
      expect(result.settings?.onboarding?.completed).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
