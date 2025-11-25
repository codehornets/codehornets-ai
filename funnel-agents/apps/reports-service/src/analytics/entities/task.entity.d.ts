export declare class TaskEntity {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    agentId: string;
    workspaceId: string;
    input: any;
    output: any;
    scheduledAt: Date;
    startedAt: Date;
    completedAt: Date;
    timeout: number;
    createdAt: Date;
    updatedAt: Date;
}
