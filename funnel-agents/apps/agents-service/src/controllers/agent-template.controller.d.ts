import { AgentTemplateService } from '@funnelagents/application';
import { CreateAgentTemplateDto, UpdateAgentTemplateDto, AgentTemplateResponseDto, AgentTemplateFilterDto, PaginationDto, ApiResponseDto } from '@funnelagents/interfaces';
export declare class AgentTemplateController {
    private readonly templateService;
    constructor(templateService: AgentTemplateService);
    findAll(filters: AgentTemplateFilterDto, pagination: PaginationDto): Promise<ApiResponseDto<AgentTemplateResponseDto[]>>;
    findOne(id: string): Promise<ApiResponseDto<AgentTemplateResponseDto>>;
    create(createDto: CreateAgentTemplateDto): Promise<ApiResponseDto<AgentTemplateResponseDto>>;
    update(id: string, updateDto: UpdateAgentTemplateDto): Promise<ApiResponseDto<AgentTemplateResponseDto>>;
    delete(id: string): Promise<ApiResponseDto<null>>;
    private toResponseDto;
}
