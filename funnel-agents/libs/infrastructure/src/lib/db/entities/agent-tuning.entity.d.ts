import { BaseDbEntity } from './base.entity';
export declare class AgentTuningDbEntity extends BaseDbEntity {
    agent_id: string;
    tuning_type: string;
    before_value?: Record<string, any>;
    after_value?: Record<string, any>;
    performance_delta?: number;
    notes?: string;
    applied_at?: Date;
}
