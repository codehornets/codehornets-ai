import { BaseDbEntity } from './base.entity';
export declare class AgentDbEntity extends BaseDbEntity {
    name: string;
    description?: string;
    type: string;
    domain: string;
    status: string;
    skills: string[];
    tools: string[];
    success_rate?: number;
    tasks_completed: number;
    avg_completion_time?: number;
    settings?: Record<string, any>;
    prompt_template?: string;
    model?: string;
}
