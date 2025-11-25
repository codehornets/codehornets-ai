import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { Deal } from './deal.entity';
import { createMockRepository } from '@funnelagents/shared/testing';

describe('DealsService', () => {
  let service: DealsService;
  let repository: jest.Mocked<Repository<Deal>>;

  const mockDeal = {
    id: 'deal-1',
    workspace_id: 'workspace-1',
    title: 'Enterprise Deal',
    value: 50000,
    currency: 'USD',
    stage: 'proposal',
    probability: 60,
    contact_id: 'contact-1',
    expected_close_date: new Date('2025-12-31'),
    custom_fields: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = createMockRepository<Deal>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: getRepositoryToken(Deal),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    repository = module.get(getRepositoryToken(Deal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all deals', async () => {
      const deals = [mockDeal];
      repository.find.mockResolvedValue(deals);

      const result = await service.findAll();

      expect(result).toEqual(deals);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should filter deals by workspace_id', async () => {
      const deals = [mockDeal];
      repository.find.mockResolvedValue(deals);

      const result = await service.findAll('workspace-1');

      expect(result).toEqual(deals);
      expect(repository.find).toHaveBeenCalledWith({
        where: { workspace_id: 'workspace-1' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a deal by id', async () => {
      repository.findOne.mockResolvedValue(mockDeal);

      const result = await service.findOne('deal-1');

      expect(result).toEqual(mockDeal);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'deal-1' },
      });
    });

    it('should throw NotFoundException if deal not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new deal', async () => {
      const createDto = {
        workspace_id: 'workspace-1',
        title: 'New Deal',
        value: 25000,
        currency: 'USD',
        stage: 'prospecting',
      };

      repository.create.mockReturnValue(mockDeal);
      repository.save.mockResolvedValue(mockDeal);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDeal);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockDeal);
    });
  });

  describe('update', () => {
    it('should update a deal', async () => {
      const updateDto = { stage: 'negotiation', probability: 80 };
      const updatedDeal = { ...mockDeal, ...updateDto };

      repository.findOne.mockResolvedValue(mockDeal);
      repository.save.mockResolvedValue(updatedDeal);

      const result = await service.update('deal-1', updateDto);

      expect(result).toEqual(updatedDeal);
      expect(repository.save).toHaveBeenCalledWith(updatedDeal);
    });

    it('should throw NotFoundException if deal not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { stage: 'won' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove a deal', async () => {
      repository.findOne.mockResolvedValue(mockDeal);
      repository.remove.mockResolvedValue(mockDeal);

      await service.remove('deal-1');

      expect(repository.remove).toHaveBeenCalledWith(mockDeal);
    });

    it('should throw NotFoundException if deal not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStage', () => {
    it('should update deal stage', async () => {
      const updatedDeal = { ...mockDeal, stage: 'won' };

      repository.findOne.mockResolvedValue(mockDeal);
      repository.save.mockResolvedValue(updatedDeal);

      const result = await service.updateStage('deal-1', 'won');

      expect(result.stage).toBe('won');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deal not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateStage('nonexistent', 'won')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
