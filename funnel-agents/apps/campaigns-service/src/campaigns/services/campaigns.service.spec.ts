import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignTemplateRepository } from '../repositories/campaign-template.repository';
import { createMockCampaign, createMockActiveCampaign } from '@funnelagents/shared/testing';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignRepository: jest.Mocked<CampaignRepository>;
  let templateRepository: jest.Mocked<CampaignTemplateRepository>;

  const mockCampaign = createMockCampaign({
    id: 'campaign-1',
    name: 'Test Campaign',
    status: 'draft',
  });

  const mockTemplate = {
    id: 'template-1',
    name: 'Email Drip Template',
    description: 'Standard email drip campaign',
    default_settings: {
      send_interval: '24h',
      max_emails: 5,
    },
    default_agents: ['agent-1'],
    default_tasks: [
      { type: 'send_email', config: {} },
    ],
  };

  beforeEach(async () => {
    const mockCampaignRepo = {
      findAll: jest.fn(),
      findWithFilters: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockTemplateRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: CampaignRepository,
          useValue: mockCampaignRepo,
        },
        {
          provide: CampaignTemplateRepository,
          useValue: mockTemplateRepo,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    campaignRepository = module.get(CampaignRepository);
    templateRepository = module.get(CampaignTemplateRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all campaigns without filters', async () => {
      const campaigns = [mockCampaign];
      const paginatedResult = {
        data: campaigns,
        total: 1,
        page: 1,
        limit: 10,
      };

      campaignRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll();

      expect(result).toEqual(paginatedResult);
      expect(campaignRepository.findAll).toHaveBeenCalled();
      expect(campaignRepository.findWithFilters).not.toHaveBeenCalled();
    });

    it('should use filters when provided', async () => {
      const filters = { status: 'active' };
      const paginatedResult = {
        data: [mockCampaign],
        total: 1,
        page: 1,
        limit: 10,
      };

      campaignRepository.findWithFilters.mockResolvedValue(paginatedResult);

      const result = await service.findAll(filters);

      expect(result).toEqual(paginatedResult);
      expect(campaignRepository.findWithFilters).toHaveBeenCalledWith(filters, undefined);
      expect(campaignRepository.findAll).not.toHaveBeenCalled();
    });

    it('should pass pagination params', async () => {
      const params = { page: 2, limit: 20 };
      const paginatedResult = {
        data: [],
        total: 0,
        page: 2,
        limit: 20,
      };

      campaignRepository.findAll.mockResolvedValue(paginatedResult);

      await service.findAll(undefined, params);

      expect(campaignRepository.findAll).toHaveBeenCalledWith(params);
    });
  });

  describe('findById', () => {
    it('should return a campaign by id', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign);

      const result = await service.findById('campaign-1');

      expect(result).toEqual(mockCampaign);
      expect(campaignRepository.findById).toHaveBeenCalledWith('campaign-1');
    });

    it('should throw NotFoundException if campaign not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Campaign with ID nonexistent not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new campaign', async () => {
      const createDto = {
        name: 'New Campaign',
        description: 'Test description',
        workspace_id: 'workspace-1',
        status: 'draft',
        priority: 'high',
        goal: 'Generate leads',
      };

      campaignRepository.save.mockResolvedValue(mockCampaign);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCampaign);
      expect(campaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          description: createDto.description,
          workspace_id: createDto.workspace_id,
        })
      );
    });

    it('should handle date conversion', async () => {
      const createDto = {
        name: 'New Campaign',
        workspace_id: 'workspace-1',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      };

      campaignRepository.save.mockResolvedValue(mockCampaign);

      await service.create(createDto);

      expect(campaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: new Date('2025-01-01'),
          end_date: new Date('2025-12-31'),
        })
      );
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const updateDto = {
        name: 'Updated Campaign',
        status: 'active',
      };

      const updatedCampaign = { ...mockCampaign, ...updateDto };

      campaignRepository.findById.mockResolvedValue(mockCampaign);
      campaignRepository.save.mockResolvedValue(updatedCampaign);

      const result = await service.update('campaign-1', updateDto);

      expect(result.name).toBe('Updated Campaign');
      expect(result.status).toBe('active');
      expect(campaignRepository.save).toHaveBeenCalled();
    });

    it('should merge settings properly', async () => {
      const campaignWithSettings = {
        ...mockCampaign,
        settings: { existing: 'value' },
      };

      const updateDto = {
        settings: { new: 'setting' },
      };

      campaignRepository.findById.mockResolvedValue(campaignWithSettings);
      campaignRepository.save.mockResolvedValue(campaignWithSettings);

      const result = await service.update('campaign-1', updateDto);

      expect(campaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            existing: 'value',
            new: 'setting',
          },
        })
      );
    });

    it('should throw NotFoundException if campaign not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('delete', () => {
    it('should delete a campaign', async () => {
      campaignRepository.findById.mockResolvedValue(mockCampaign);
      campaignRepository.delete.mockResolvedValue(undefined);

      await service.delete('campaign-1');

      expect(campaignRepository.delete).toHaveBeenCalledWith('campaign-1');
    });

    it('should throw NotFoundException if campaign not found', async () => {
      campaignRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFromTemplate', () => {
    it('should create campaign from template', async () => {
      const createDto = {
        template_id: 'template-1',
        name: 'Campaign from Template',
        workspace_id: 'workspace-1',
        create_default_tasks: false,
      };

      templateRepository.findById.mockResolvedValue(mockTemplate);
      campaignRepository.save.mockResolvedValue(mockCampaign);

      const result = await service.createFromTemplate(createDto);

      expect(result).toEqual(mockCampaign);
      expect(templateRepository.findById).toHaveBeenCalledWith('template-1');
      expect(campaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          settings: mockTemplate.default_settings,
          agent_ids: mockTemplate.default_agents,
        })
      );
    });

    it('should merge template settings with provided settings', async () => {
      const createDto = {
        template_id: 'template-1',
        name: 'Campaign from Template',
        workspace_id: 'workspace-1',
        settings: { custom: 'value' },
        create_default_tasks: false,
      };

      templateRepository.findById.mockResolvedValue(mockTemplate);
      campaignRepository.save.mockResolvedValue(mockCampaign);

      await service.createFromTemplate(createDto);

      expect(campaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            ...mockTemplate.default_settings,
            custom: 'value',
          },
        })
      );
    });

    it('should handle creating default tasks', async () => {
      const createDto = {
        template_id: 'template-1',
        name: 'Campaign from Template',
        workspace_id: 'workspace-1',
        create_default_tasks: true,
      };

      templateRepository.findById.mockResolvedValue(mockTemplate);
      campaignRepository.save.mockResolvedValue(mockCampaign);

      await service.createFromTemplate(createDto);

      // Should be called twice: once for initial creation, once for updating with tasks
      expect(campaignRepository.save).toHaveBeenCalledTimes(2);
      expect(campaignRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            template_id: 'template-1',
            pending_tasks: mockTemplate.default_tasks,
          }),
        })
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      const createDto = {
        template_id: 'nonexistent',
        name: 'Campaign',
        workspace_id: 'workspace-1',
      };

      templateRepository.findById.mockResolvedValue(null);

      await expect(service.createFromTemplate(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.createFromTemplate(createDto)).rejects.toThrow(
        'Template with ID nonexistent not found'
      );
    });
  });
});
