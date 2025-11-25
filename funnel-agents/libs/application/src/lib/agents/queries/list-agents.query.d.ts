import { PaginationParams, AgentType, AgentStatus } from '@funnelagents/domain';
export declare class ListAgentsQuery {
    readonly filters?: {
        type?: AgentType;
        status?: AgentStatus;
        search?: string;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        type?: AgentType;
        status?: AgentStatus;
        search?: string;
    } | undefined, pagination?: PaginationParams | undefined);
}
export interface AgentListDto {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tasksCompleted: number;
    successRate: number;
    createdAt: Date;
}
