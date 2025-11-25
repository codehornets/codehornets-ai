import { Test, TestingModule } from '@nestjs/testing';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { CampaignAnalyticsRepository } from '../repositories/campaign-analytics.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { AnalyticEventType } from '../entities/campaign-analytics.entity';

describe('CampaignAnalyticsService', () => {
  let service: CampaignAnalyticsService;
  let analyticsRepository: jest.Mocked<CampaignAnalyticsRepository>;
  let campaignRepository: jest.Mocked<CampaignRepository>;

  const mockCampaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    status: 'active',
  };

  beforeEach(async () => {
    const mockAnalyticsRepo = {
      save: jest.fn(),
      countByEventType: jest.fn(),
      getEventsByDay: jest.fn(),
      findWithFilters: jest.fn(),
    };

    const mockCampaignRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignAnalyticsService,
        {
          provide: CampaignAnalyticsRepository,
          useValue: mockAnalyticsRepo,
        },
        {
          provide: CampaignRepository,
          useValue: mockCampaignRepo,
        },
      ],
    }).compile();

    service = module.get<CampaignAnalyticsService>(CampaignAnalyticsService);
    analyticsRepository = module.get(CampaignAnalyticsRepository);
    campaignRepository = module.get(CampaignRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track an analytics event', async () => {
      const eventDto = {
        campaign_id: 'campaign-1',
        event_type: AnalyticEventType.EMAIL_SENT,
        metadata: { recipient: 'test@example.com' },
        entity_id: 'email-1',
        entity_type: 'email',
        workspace_id: 'workspace-1',
      };

      const savedEvent = { id: 'event-1', ...eventDto };
      analyticsRepository.save.mockResolvedValue(savedEvent as any);

      const result = await service.trackEvent(eventDto);

      expect(result).toEqual(savedEvent);
      expect(analyticsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_id: eventDto.campaign_id,
          event_type: eventDto.event_type,
        }),
      );
    });

    it('should use current timestamp if not provided', async () => {
      const eventDto = {
        campaign_id: 'campaign-1',
        event_type: AnalyticEventType.LEAD_CREATED,
      };

      analyticsRepository.save.mockResolvedValue({ id: 'event-1' } as any);

      await service.trackEvent(eventDto);

      expect(analyticsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          event_timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('getCampaignPerformance', () => {
    it('should generate comprehensive performance report', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);

      // Mock event counts
      analyticsRepository.countByEventType
        .mockResolvedValueOnce(100) // total leads
        .mockResolvedValueOnce(25) // converted leads
        .mockResolvedValueOnce(500) // emails sent
        .mockResolvedValueOnce(200) // emails opened
        .mockResolvedValueOnce(50) // emails clicked
        .mockResolvedValueOnce(75) // tasks completed
        .mockResolvedValueOnce(30); // agent executions

      analyticsRepository.getEventsByDay.mockResolvedValue([
        {
          date: '2025-01-01',
          event_type: AnalyticEventType.LEAD_CREATED,
          count: 50,
        },
        {
          date: '2025-01-01',
          event_type: AnalyticEventType.EMAIL_SENT,
          count: 200,
        },
      ]);

      analyticsRepository.findWithFilters.mockResolvedValue({
        data: [
          {
            entity_id: 'agent-1',
            metadata: { success: true },
          },
          {
            entity_id: 'agent-1',
            metadata: { success: true },
          },
          {
            entity_id: 'agent-2',
            metadata: { success: false },
          },
        ],
      } as any);

      const result = await service.getCampaignPerformance('campaign-1');

      expect(result).toMatchObject({
        campaign_id: 'campaign-1',
        campaign_name: 'Test Campaign',
        total_leads: 100,
        converted_leads: 25,
        conversion_rate: 25,
        emails_sent: 500,
        emails_opened: 200,
        open_rate: 40,
        emails_clicked: 50,
        click_rate: 10,
        tasks_completed: 75,
        agent_executions: 30,
      });

      expect(result.daily_metrics).toBeDefined();
      expect(result.agent_performance).toBeDefined();
    });

    it('should handle zero values correctly', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);

      analyticsRepository.countByEventType.mockResolvedValue(0);
      analyticsRepository.getEventsByDay.mockResolvedValue([]);
      analyticsRepository.findWithFilters.mockResolvedValue({ data: [] } as any);

      const result = await service.getCampaignPerformance('campaign-1');

      expect(result.conversion_rate).toBe(0);
      expect(result.open_rate).toBe(0);
      expect(result.click_rate).toBe(0);
    });

    it('should throw error if campaign not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(
        service.getCampaignPerformance('nonexistent'),
      ).rejects.toThrow('Campaign nonexistent not found');
    });

    it('should filter by date range', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);
      analyticsRepository.countByEventType.mockResolvedValue(0);
      analyticsRepository.getEventsByDay.mockResolvedValue([]);
      analyticsRepository.findWithFilters.mockResolvedValue({ data: [] } as any);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await service.getCampaignPerformance('campaign-1', startDate, endDate);

      expect(analyticsRepository.countByEventType).toHaveBeenCalledWith(
        'campaign-1',
        expect.any(String),
        startDate,
        endDate,
      );
    });
  });

  describe('aggregateDailyMetrics', () => {
    it('should aggregate events by day correctly', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);
      analyticsRepository.countByEventType.mockResolvedValue(0);

      const eventsByDay = [
        {
          date: '2025-01-01',
          event_type: AnalyticEventType.LEAD_CREATED,
          count: 10,
        },
        {
          date: '2025-01-01',
          event_type: AnalyticEventType.EMAIL_SENT,
          count: 50,
        },
        {
          date: '2025-01-01',
          event_type: AnalyticEventType.EMAIL_OPENED,
          count: 20,
        },
        {
          date: '2025-01-02',
          event_type: AnalyticEventType.LEAD_CREATED,
          count: 15,
        },
      ];

      analyticsRepository.getEventsByDay.mockResolvedValue(eventsByDay);
      analyticsRepository.findWithFilters.mockResolvedValue({ data: [] } as any);

      const result = await service.getCampaignPerformance('campaign-1');

      expect(result.daily_metrics).toHaveLength(2);
      expect(result.daily_metrics[0]).toMatchObject({
        date: '2025-01-01',
        leads: 10,
        emails_sent: 50,
        emails_opened: 20,
      });
      expect(result.daily_metrics[1]).toMatchObject({
        date: '2025-01-02',
        leads: 15,
      });
    });
  });

  describe('getAgentPerformance', () => {
    it('should calculate agent performance metrics', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);
      analyticsRepository.countByEventType.mockResolvedValue(0);
      analyticsRepository.getEventsByDay.mockResolvedValue([]);

      const agentEvents = [
        { entity_id: 'agent-1', metadata: { success: true } },
        { entity_id: 'agent-1', metadata: { success: true } },
        { entity_id: 'agent-1', metadata: { success: false } },
        { entity_id: 'agent-2', metadata: { success: true } },
      ];

      analyticsRepository.findWithFilters.mockResolvedValue({
        data: agentEvents,
      } as any);

      const result = await service.getCampaignPerformance('campaign-1');

      expect(result.agent_performance).toEqual({
        'agent-1': {
          executions: 3,
          success: 2,
          success_rate: 66.67,
        },
        'agent-2': {
          executions: 1,
          success: 1,
          success_rate: 100,
        },
      });
    });

    it('should handle agents with no success metadata', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);
      analyticsRepository.countByEventType.mockResolvedValue(0);
      analyticsRepository.getEventsByDay.mockResolvedValue([]);

      const agentEvents = [
        { entity_id: 'agent-1', metadata: {} },
        { entity_id: 'agent-1', metadata: null },
      ];

      analyticsRepository.findWithFilters.mockResolvedValue({
        data: agentEvents,
      } as any);

      const result = await service.getCampaignPerformance('campaign-1');

      expect(result.agent_performance['agent-1']).toEqual({
        executions: 2,
        success: 0,
        success_rate: 0,
      });
    });
  });
});
