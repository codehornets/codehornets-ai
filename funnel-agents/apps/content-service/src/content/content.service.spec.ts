import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';
import { Content, ContentStatus } from './entities/content.entity';

describe('ContentService', () => {
  let service: ContentService;
  let repository: Repository<Content>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getRepositoryToken(Content),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    repository = module.get<Repository<Content>>(getRepositoryToken(Content));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create content', async () => {
      const createDto = {
        title: 'Test Content',
        type: 'blog_post' as any,
        status: ContentStatus.DRAFT,
      };

      const expectedContent = { id: '1', ...createDto };

      mockRepository.create.mockReturnValue(expectedContent);
      mockRepository.save.mockResolvedValue(expectedContent);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedContent);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedContent);
    });
  });

  describe('findOne', () => {
    it('should return content if found', async () => {
      const content = { id: '1', title: 'Test' } as Content;
      mockRepository.findOne.mockResolvedValue(content);

      const result = await service.findOne('1');

      expect(result).toEqual(content);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status for valid transition', async () => {
      const content = {
        id: '1',
        status: ContentStatus.DRAFT,
      } as Content;

      mockRepository.findOne.mockResolvedValue(content);
      mockRepository.save.mockResolvedValue({
        ...content,
        status: ContentStatus.REVIEW,
      });

      const result = await service.updateStatus('1', {
        status: ContentStatus.REVIEW,
      });

      expect(result.status).toBe(ContentStatus.REVIEW);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const content = {
        id: '1',
        status: ContentStatus.BRIEF,
      } as Content;

      mockRepository.findOne.mockResolvedValue(content);

      await expect(
        service.updateStatus('1', { status: ContentStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set published_at when transitioning to published', async () => {
      const content = {
        id: '1',
        status: ContentStatus.APPROVED,
      } as Content;

      mockRepository.findOne.mockResolvedValue(content);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.updateStatus('1', {
        status: ContentStatus.PUBLISHED,
      });

      expect(result.published_at).toBeDefined();
    });
  });
});
