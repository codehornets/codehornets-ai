import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { VersionService } from './version.service';
import { ContentVersion } from '../entities/content-version.entity';
import { Content } from '../entities/content.entity';

describe('VersionService', () => {
  let service: VersionService;
  let versionRepository: Repository<ContentVersion>;
  let contentRepository: Repository<Content>;

  const mockVersionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockContentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        {
          provide: getRepositoryToken(ContentVersion),
          useValue: mockVersionRepository,
        },
        {
          provide: getRepositoryToken(Content),
          useValue: mockContentRepository,
        },
      ],
    }).compile();

    service = module.get<VersionService>(VersionService);
    versionRepository = module.get<Repository<ContentVersion>>(
      getRepositoryToken(ContentVersion),
    );
    contentRepository = module.get<Repository<Content>>(
      getRepositoryToken(Content),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVersion', () => {
    it('should create a new version', async () => {
      const contentId = 'content-1';
      const content = {
        id: contentId,
        title: 'Test Content',
        body: 'Test body',
      } as Content;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockContentRepository.findOne.mockResolvedValue(content);
      mockVersionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockVersionRepository.create.mockReturnValue({
        id: 'version-1',
        content_id: contentId,
        version_number: 1,
      });
      mockVersionRepository.save.mockResolvedValue({
        id: 'version-1',
        content_id: contentId,
        version_number: 1,
      });

      const result = await service.createVersion(
        contentId,
        'Initial version',
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.version_number).toBe(1);
      expect(mockContentRepository.findOne).toHaveBeenCalledWith({
        where: { id: contentId },
      });
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createVersion('invalid-id', 'Test', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for content', async () => {
      const contentId = 'content-1';
      const versions = [
        { id: 'v1', version_number: 2 },
        { id: 'v2', version_number: 1 },
      ];

      mockVersionRepository.find.mockResolvedValue(versions);

      const result = await service.getVersionHistory(contentId);

      expect(result).toEqual(versions);
      expect(mockVersionRepository.find).toHaveBeenCalledWith({
        where: { content_id: contentId },
        order: { version_number: 'DESC' },
      });
    });
  });

  describe('rollbackToVersion', () => {
    it('should rollback content to specified version', async () => {
      const contentId = 'content-1';
      const versionId = 'version-1';

      const content = {
        id: contentId,
        title: 'Current Title',
        body: 'Current body',
      } as Content;

      const version = {
        id: versionId,
        content_id: contentId,
        version_number: 1,
        title: 'Old Title',
        body: 'Old body',
      } as ContentVersion;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ version_number: 2 }),
      };

      mockContentRepository.findOne.mockResolvedValue(content);
      mockVersionRepository.findOne.mockResolvedValue(version);
      mockVersionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockVersionRepository.create.mockReturnValue({});
      mockVersionRepository.save.mockResolvedValue({});
      mockContentRepository.save.mockResolvedValue({
        ...content,
        title: version.title,
        body: version.body,
      });

      const result = await service.rollbackToVersion(
        contentId,
        versionId,
        'Rollback test',
        'user-1',
      );

      expect(result.title).toBe('Old Title');
      expect(result.body).toBe('Old body');
    });
  });
});
