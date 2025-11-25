export declare enum TuningType {
    PROMPT = "prompt",
    PARAMETERS = "parameters",
    SKILLS = "skills",
    MODEL = "model"
}
export declare class CreateAgentTuningDto {
    agent_id: string;
    tuning_type: TuningType;
    before_value?: Record<string, any>;
    after_value?: Record<string, any>;
    performance_delta?: number;
    notes?: string;
}
export declare class UpdateAgentTuningDto {
    performance_delta?: number;
    notes?: string;
    apply?: boolean;
}
export declare class AgentTuningResponseDto {
    id: string;
    agent_id: string;
    tuning_type: TuningType;
    before_value?: Record<string, any>;
    after_value?: Record<string, any>;
    performance_delta?: number;
    notes?: string;
    applied_at?: Date;
    created_at: Date;
}
export declare class AgentTuningFilterDto {
    agent_id?: string;
    tuning_type?: TuningType;
    applied_only?: boolean;
}
