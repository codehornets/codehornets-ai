import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ContentTemplate } from '../entities/content-template.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  RenderTemplateDto,
  QueryTemplateDto,
} from '../dto/template.dto';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(ContentTemplate)
    private readonly templateRepository: Repository<ContentTemplate>,
  ) {}

  async create(dto: CreateTemplateDto): Promise<ContentTemplate> {
    // Validate template body has matching variables
    this.validateTemplate(dto.template_body, dto.variables);

    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  async findAll(query: QueryTemplateDto): Promise<ContentTemplate[]> {
    const queryBuilder =
      this.templateRepository.createQueryBuilder('template');

    if (query.content_type) {
      queryBuilder.andWhere('template.content_type = :content_type', {
        content_type: query.content_type,
      });
    }

    if (query.category) {
      queryBuilder.andWhere('template.category = :category', {
        category: query.category,
      });
    }

    if (query.is_active !== undefined) {
      queryBuilder.andWhere('template.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder.orderBy('template.created_at', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<ContentTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<ContentTemplate> {
    const template = await this.findOne(id);

    // Validate template body if being updated
    if (dto.template_body || dto.variables) {
      const body = dto.template_body || template.template_body;
      const variables = dto.variables || template.variables;
      this.validateTemplate(body, variables);
    }

    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  async renderTemplate(dto: RenderTemplateDto): Promise<string> {
    const template = await this.findOne(dto.template_id);

    if (!template.is_active) {
      throw new BadRequestException('Template is not active');
    }

    // Validate all required variables are provided
    const requiredVars = Object.entries(template.variables)
      .filter(([_, config]: any) => config.required)
      .map(([name]) => name);

    const missingVars = requiredVars.filter(
      (varName) => !dto.variable_values[varName],
    );

    if (missingVars.length > 0) {
      throw new BadRequestException(
        `Missing required variables: ${missingVars.join(', ')}`,
      );
    }

    // Render template
    let rendered = template.template_body;

    // Replace variables with values
    for (const [varName, value] of Object.entries(dto.variable_values)) {
      const regex = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Replace any remaining variables with defaults
    for (const [varName, config] of Object.entries(template.variables)) {
      if (config.default !== undefined) {
        const regex = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
        rendered = rendered.replace(regex, String(config.default));
      }
    }

    return rendered;
  }

  async getCategories(): Promise<string[]> {
    const templates = await this.templateRepository.find({
      select: ['category'],
    });

    const categories = [
      ...new Set(
        templates
          .map((t) => t.category)
          .filter((c) => c !== null && c !== undefined),
      ),
    ];

    return categories;
  }

  private validateTemplate(
    templateBody: string,
    variables: Record<string, any>,
  ): void {
    // Extract variables from template
    const varPattern = /{{\\s*([\\w_]+)\\s*}}/g;
    const templateVars = new Set<string>();
    let match;

    while ((match = varPattern.exec(templateBody)) !== null) {
      templateVars.add(match[1]);
    }

    // Check if all template variables are defined
    const undefinedVars = Array.from(templateVars).filter(
      (varName) => !variables[varName],
    );

    if (undefinedVars.length > 0) {
      throw new BadRequestException(
        `Template contains undefined variables: ${undefinedVars.join(', ')}`,
      );
    }

    // Warn about unused variable definitions (optional)
    const unusedVars = Object.keys(variables).filter(
      (varName) => !templateVars.has(varName),
    );

    if (unusedVars.length > 0) {
      // You might want to log this or handle it differently
      console.warn(`Unused variable definitions: ${unusedVars.join(', ')}`);
    }
  }
}
