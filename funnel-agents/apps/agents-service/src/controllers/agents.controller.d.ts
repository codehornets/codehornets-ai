import { AgentsService } from '@funnelagents/application';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentFilterDto, PaginationDto, ApiResponseDto, ExecuteAgentDto, AgentExecutionResultDto, ExecutionStatus } from '@funnelagents/interfaces';
export declare class AgentsController {
    private readonly agentsService;
    constructor(agentsService: AgentsService);
    findAll(filters: AgentFilterDto, pagination: PaginationDto): Promise<ApiResponseDto<AgentResponseDto[]>>;
    findOne(id: string): Promise<ApiResponseDto<AgentResponseDto>>;
    create(createDto: CreateAgentDto): Promise<ApiResponseDto<AgentResponseDto>>;
    update(id: string, updateDto: UpdateAgentDto): Promise<ApiResponseDto<AgentResponseDto>>;
    delete(id: string): Promise<ApiResponseDto<null>>;
    executeAgent(id: string, executeDto: ExecuteAgentDto): Promise<ApiResponseDto<AgentExecutionResultDto>>;
    executeAgentSync(id: string, executeDto: ExecuteAgentDto): Promise<ApiResponseDto<AgentExecutionResultDto>>;
    executeAgentAsync(id: string, body: {
        input: Record<string, any>;
        callback_url?: string;
        timeout?: number;
    }): Promise<ApiResponseDto<{
        execution_id: string;
        status: ExecutionStatus;
    }>>;
    private toResponseDto;
}
