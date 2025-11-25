import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { Lead } from './lead.entity';
import { createMockRepository } from '@funnelagents/shared/testing';
import { createMockLead, createMockQualifiedLead } from '@funnelagents/shared/testing';

describe('LeadsService', () => {
  let service: LeadsService;
  let repository: jest.Mocked<Repository<Lead>>;

  const mockLead = createMockLead({
    id: 'lead-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'new',
  });

  beforeEach(async () => {
    const mockRepo = createMockRepository<Lead>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getRepositoryToken(Lead),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repository = module.get(getRepositoryToken(Lead));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated leads', async () => {
      const leads = [mockLead];
      const queryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([leads, 1]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: leads,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('lead');
    });

    it('should filter by status', async () => {
      const queryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ status: 'qualified' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('lead.status = :status', {
        status: 'qualified',
      });
    });

    it('should filter by source', async () => {
      const queryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ source: 'website' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('lead.source = :source', {
        source: 'website',
      });
    });

    it('should filter by score range', async () => {
      const queryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ minScore: 50, maxScore: 90 });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('lead.score >= :minScore', {
        minScore: 50,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('lead.score <= :maxScore', {
        maxScore: 90,
      });
    });

    it('should search by name, email, or company', async () => {
      const queryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ search: 'john' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(lead.name ILIKE :search OR lead.email ILIKE :search OR lead.company ILIKE :search)',
        { search: '%john%' }
      );
    });

    it('should handle pagination correctly', async () => {
      const queryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ page: 3, limit: 20 });

      expect(queryBuilder.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findOne', () => {
    it('should return a lead by id', async () => {
      repository.findOne.mockResolvedValue(mockLead);

      const result = await service.findOne('lead-1');

      expect(result).toEqual(mockLead);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
      });
    });

    it('should throw NotFoundException if lead not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Lead with ID nonexistent not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new lead', async () => {
      const createDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        company: 'Tech Corp',
        source: 'referral',
      };

      repository.create.mockReturnValue(mockLead);
      repository.save.mockResolvedValue(mockLead);

      const result = await service.create(createDto);

      expect(result).toEqual(mockLead);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockLead);
    });
  });

  describe('update', () => {
    it('should update a lead', async () => {
      const updateDto = { name: 'John Updated' };
      const updatedLead = { ...mockLead, ...updateDto };

      repository.findOne.mockResolvedValue(mockLead);
      repository.save.mockResolvedValue(updatedLead);

      const result = await service.update('lead-1', updateDto);

      expect(result).toEqual(updatedLead);
      expect(repository.save).toHaveBeenCalledWith(updatedLead);
    });

    it('should throw NotFoundException if lead not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove a lead', async () => {
      repository.findOne.mockResolvedValue(mockLead);
      repository.remove.mockResolvedValue(mockLead);

      await service.remove('lead-1');

      expect(repository.remove).toHaveBeenCalledWith(mockLead);
    });

    it('should throw NotFoundException if lead not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('qualify', () => {
    it('should qualify a lead with high score', async () => {
      const qualifiedLead = createMockQualifiedLead({ id: 'lead-1' });

      repository.findOne.mockResolvedValue(mockLead);

      // Mock Math.random to return high score
      jest.spyOn(Math, 'random').mockReturnValue(0.8);

      repository.save.mockImplementation((lead) => Promise.resolve(lead));

      const result = await service.qualify('lead-1');

      expect(result.status).toBe('qualified');
      expect(result.score).toBeGreaterThan(50);
      expect(result.score_breakdown).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should mark lead as contacted if score is low', async () => {
      repository.findOne.mockResolvedValue(mockLead);

      // Mock Math.random to return low score
      jest.spyOn(Math, 'random').mockReturnValue(0.3);

      repository.save.mockImplementation((lead) => Promise.resolve(lead));

      const result = await service.qualify('lead-1');

      expect(result.status).toBe('contacted');
      expect(result.score).toBeLessThanOrEqual(50);
    });

    it('should include score breakdown', async () => {
      repository.findOne.mockResolvedValue(mockLead);
      jest.spyOn(Math, 'random').mockReturnValue(0.8);
      repository.save.mockImplementation((lead) => Promise.resolve(lead));

      const result = await service.qualify('lead-1');

      expect(result.score_breakdown).toHaveProperty('icp_fit');
      expect(result.score_breakdown).toHaveProperty('engagement');
      expect(result.score_breakdown).toHaveProperty('recency');
      expect(result.score_breakdown).toHaveProperty('confidence');
    });

    it('should throw NotFoundException if lead not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.qualify('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('convert', () => {
    it('should convert a lead to won status', async () => {
      repository.findOne.mockResolvedValue(mockLead);
      repository.save.mockImplementation((lead) => Promise.resolve(lead));

      const result = await service.convert('lead-1');

      expect(result.status).toBe('won');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.convert('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
