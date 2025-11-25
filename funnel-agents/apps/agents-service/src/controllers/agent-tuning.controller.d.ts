import { AgentTuningService } from '@funnelagents/application';
import { CreateAgentTuningDto, UpdateAgentTuningDto, AgentTuningResponseDto, AgentTuningFilterDto, PaginationDto, ApiResponseDto } from '@funnelagents/interfaces';
export declare class AgentTuningController {
    private readonly tuningService;
    constructor(tuningService: AgentTuningService);
    findAll(filters: AgentTuningFilterDto, pagination: PaginationDto): Promise<ApiResponseDto<AgentTuningResponseDto[]>>;
    findOne(id: string): Promise<ApiResponseDto<AgentTuningResponseDto>>;
    create(createDto: CreateAgentTuningDto): Promise<ApiResponseDto<AgentTuningResponseDto>>;
    update(id: string, updateDto: UpdateAgentTuningDto): Promise<ApiResponseDto<AgentTuningResponseDto>>;
    private toResponseDto;
}
