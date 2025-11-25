import { BaseDbEntity } from './base.entity';
export declare class AgentFeedbackDbEntity extends BaseDbEntity {
    agent_id: string;
    task_id?: string;
    rating: number;
    comment?: string;
    feedback_type: string;
    created_by?: string;
}
