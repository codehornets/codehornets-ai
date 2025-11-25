import { Repository } from 'typeorm';
import { ContentTemplate } from '../entities/content-template.entity';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto, QueryTemplateDto } from '../dto/template.dto';
export declare class TemplateService {
    private readonly templateRepository;
    constructor(templateRepository: Repository<ContentTemplate>);
    create(dto: CreateTemplateDto): Promise<ContentTemplate>;
    findAll(query: QueryTemplateDto): Promise<ContentTemplate[]>;
    findOne(id: string): Promise<ContentTemplate>;
    update(id: string, dto: UpdateTemplateDto): Promise<ContentTemplate>;
    delete(id: string): Promise<void>;
    renderTemplate(dto: RenderTemplateDto): Promise<string>;
    getCategories(): Promise<string[]>;
    private validateTemplate;
}
