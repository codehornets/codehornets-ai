import { AgentFeedbackService } from '@funnelagents/application';
import { CreateAgentFeedbackDto, UpdateAgentFeedbackDto, AgentFeedbackResponseDto, AgentFeedbackFilterDto, PaginationDto, ApiResponseDto } from '@funnelagents/interfaces';
export declare class AgentFeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: AgentFeedbackService);
    findAll(filters: AgentFeedbackFilterDto, pagination: PaginationDto): Promise<ApiResponseDto<AgentFeedbackResponseDto[]>>;
    findOne(id: string): Promise<ApiResponseDto<AgentFeedbackResponseDto>>;
    create(createDto: CreateAgentFeedbackDto): Promise<ApiResponseDto<AgentFeedbackResponseDto>>;
    update(id: string, updateDto: UpdateAgentFeedbackDto): Promise<ApiResponseDto<AgentFeedbackResponseDto>>;
    private toResponseDto;
}
