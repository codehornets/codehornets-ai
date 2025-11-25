import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TemplateService } from './template.service';
import { ContentTemplate } from '../entities/content-template.entity';
import { ContentType } from '../entities/content.entity';

describe('TemplateService', () => {
  let service: TemplateService;
  let repository: Repository<ContentTemplate>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: getRepositoryToken(ContentTemplate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    repository = module.get<Repository<ContentTemplate>>(
      getRepositoryToken(ContentTemplate),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const dto = {
        name: 'Blog Post Template',
        content_type: ContentType.BLOG_POST,
        template_body: 'Hello {{name}}, welcome to {{company}}!',
        variables: {
          name: { type: 'string', required: true },
          company: { type: 'string', required: true },
        },
      };

      const template = { id: 'template-1', ...dto } as ContentTemplate;

      mockRepository.create.mockReturnValue(template);
      mockRepository.save.mockResolvedValue(template);

      const result = await service.create(dto as any);

      expect(result).toEqual(template);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException for invalid template', async () => {
      const dto = {
        name: 'Invalid Template',
        content_type: ContentType.BLOG_POST,
        template_body: 'Hello {{name}}!',
        variables: {
          company: { type: 'string', required: true },
        },
      };

      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('renderTemplate', () => {
    it('should render template with provided variables', async () => {
      const template = {
        id: 'template-1',
        name: 'Test Template',
        template_body: 'Hello {{name}}, you have {{count}} messages.',
        variables: {
          name: { type: 'string', required: true },
          count: { type: 'number', required: true },
        },
        is_active: true,
      } as ContentTemplate;

      mockRepository.findOne.mockResolvedValue(template);

      const dto = {
        template_id: 'template-1',
        variable_values: {
          name: 'John',
          count: 5,
        },
      };

      const result = await service.renderTemplate(dto);

      expect(result).toBe('Hello John, you have 5 messages.');
    });

    it('should throw BadRequestException if required variables missing', async () => {
      const template = {
        id: 'template-1',
        template_body: 'Hello {{name}}!',
        variables: {
          name: { type: 'string', required: true },
        },
        is_active: true,
      } as ContentTemplate;

      mockRepository.findOne.mockResolvedValue(template);

      const dto = {
        template_id: 'template-1',
        variable_values: {},
      };

      await expect(service.renderTemplate(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if template is not active', async () => {
      const template = {
        id: 'template-1',
        is_active: false,
      } as ContentTemplate;

      mockRepository.findOne.mockResolvedValue(template);

      const dto = {
        template_id: 'template-1',
        variable_values: {},
      };

      await expect(service.renderTemplate(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return filtered templates', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const query = {
        content_type: ContentType.BLOG_POST,
        is_active: true,
      };

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });
});
