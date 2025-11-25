import { BaseController } from './base.controller';
import { CreateAgentDto, UpdateAgentDto, AgentQueryDto } from '../dto/agent.dto';
import { ExecuteAgentDto } from '../dto/agent-execution.dto';
import { AgentsService } from '@funnelagents/application';
import { TasksService } from '@funnelagents/application';
import { AgentType, AgentDomain, AgentStatus, AgentCapability } from '@funnelagents/domain';
export declare class AgentsController extends BaseController<any, CreateAgentDto, UpdateAgentDto> {
    private readonly agentsService;
    private readonly tasksService;
    protected readonly service: any;
    constructor(agentsService: AgentsService, tasksService: TasksService);
    create(dto: CreateAgentDto): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        type: AgentType;
        domain: AgentDomain;
        description: string | undefined;
        status: AgentStatus;
        capabilities: AgentCapability[];
        config: import("@funnelagents/domain").AgentConfig;
        tools: string[];
        metrics: import("@funnelagents/domain").AgentMetrics | undefined;
    }>>;
    findAll(query: AgentQueryDto): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        type: AgentType;
        domain: AgentDomain;
        description: string | undefined;
        status: AgentStatus;
        capabilities: AgentCapability[];
        config: import("@funnelagents/domain").AgentConfig;
        tools: string[];
        metrics: import("@funnelagents/domain").AgentMetrics | undefined;
    }[]>>;
    findOne(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        type: AgentType;
        domain: AgentDomain;
        description: string | undefined;
        status: AgentStatus;
        capabilities: AgentCapability[];
        config: import("@funnelagents/domain").AgentConfig;
        tools: string[];
        metrics: import("@funnelagents/domain").AgentMetrics | undefined;
    }>>;
    update(id: string, dto: UpdateAgentDto): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        type: AgentType;
        domain: AgentDomain;
        description: string | undefined;
        status: AgentStatus;
        capabilities: AgentCapability[];
        config: import("@funnelagents/domain").AgentConfig;
        tools: string[];
        metrics: import("@funnelagents/domain").AgentMetrics | undefined;
    }>>;
    remove(id: string): Promise<void>;
    activate(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
    }>>;
    deactivate(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
    }>>;
    execute(id: string, dto: ExecuteAgentDto): Promise<import("./base.controller").ApiResponseWrapper<import("../dto/agent-execution.dto").AgentExecutionResultDto>>;
    getTasks(id: string, query: any): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").TaskDto[]>>;
    getMetrics(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        agentId: string;
        agentName: string;
        status: AgentStatus;
        metrics: import("@funnelagents/domain").AgentMetrics;
    }>>;
}
