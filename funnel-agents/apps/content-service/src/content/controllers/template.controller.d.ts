import { TemplateService } from '../services/template.service';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto, QueryTemplateDto } from '../dto/template.dto';
export declare class TemplateController {
    private readonly templateService;
    constructor(templateService: TemplateService);
    create(dto: CreateTemplateDto): Promise<import("../entities/content-template.entity").ContentTemplate>;
    findAll(query: QueryTemplateDto): Promise<import("../entities/content-template.entity").ContentTemplate[]>;
    getCategories(): Promise<string[]>;
    findOne(id: string): Promise<import("../entities/content-template.entity").ContentTemplate>;
    update(id: string, dto: UpdateTemplateDto): Promise<import("../entities/content-template.entity").ContentTemplate>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    renderTemplate(dto: RenderTemplateDto): Promise<{
        rendered_content: string;
    }>;
}
