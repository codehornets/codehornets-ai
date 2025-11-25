import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  ContentAnalytics,
  AnalyticsEventType,
} from '../entities/content-analytics.entity';
import { Content, ContentChannel } from '../entities/content.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let analyticsRepository: Repository<ContentAnalytics>;
  let contentRepository: Repository<Content>;

  const mockAnalyticsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockContentRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(ContentAnalytics),
          useValue: mockAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(Content),
          useValue: mockContentRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    analyticsRepository = module.get<Repository<ContentAnalytics>>(
      getRepositoryToken(ContentAnalytics),
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

  describe('trackEvent', () => {
    it('should track an analytics event', async () => {
      const dto = {
        content_id: 'content-1',
        event_type: AnalyticsEventType.VIEW,
        channel: ContentChannel.BLOG,
        count: 1,
      };

      const content = { id: 'content-1' } as Content;
      const analytics = { id: 'analytics-1', ...dto } as ContentAnalytics;

      mockContentRepository.findOne.mockResolvedValue(content);
      mockAnalyticsRepository.create.mockReturnValue(analytics);
      mockAnalyticsRepository.save.mockResolvedValue(analytics);

      const result = await service.trackEvent(dto);

      expect(result).toEqual(analytics);
      expect(mockAnalyticsRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if content not found', async () => {
      const dto = {
        content_id: 'invalid-id',
        event_type: AnalyticsEventType.VIEW,
      };

      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.trackEvent(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getContentMetrics', () => {
    it('should return content metrics', async () => {
      const contentId = 'content-1';
      const analytics = [
        {
          event_type: AnalyticsEventType.VIEW,
          count: 100,
        } as ContentAnalytics,
        {
          event_type: AnalyticsEventType.CLICK,
          count: 10,
        } as ContentAnalytics,
        {
          event_type: AnalyticsEventType.SHARE,
          count: 5,
        } as ContentAnalytics,
      ];

      mockAnalyticsRepository.find.mockResolvedValue(analytics);

      const result = await service.getContentMetrics(contentId);

      expect(result).toEqual({
        views: 100,
        clicks: 10,
        shares: 5,
        likes: 0,
        comments: 0,
        conversions: 0,
        total_engagement: 15,
        engagement_rate: 15,
      });
    });

    it('should handle zero views correctly', async () => {
      mockAnalyticsRepository.find.mockResolvedValue([]);

      const result = await service.getContentMetrics('content-1');

      expect(result.engagement_rate).toBe(0);
    });
  });

  describe('getPerformanceByChannel', () => {
    it('should return performance metrics by channel', async () => {
      const analytics = [
        {
          channel: ContentChannel.BLOG,
          event_type: AnalyticsEventType.VIEW,
          count: 100,
        } as ContentAnalytics,
        {
          channel: ContentChannel.BLOG,
          event_type: AnalyticsEventType.CLICK,
          count: 10,
        } as ContentAnalytics,
        {
          channel: ContentChannel.TWITTER,
          event_type: AnalyticsEventType.VIEW,
          count: 50,
        } as ContentAnalytics,
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(analytics),
      };

      mockAnalyticsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getPerformanceByChannel({});

      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe(ContentChannel.BLOG);
      expect(result[0].views).toBe(100);
    });
  });
});
