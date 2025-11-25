import { BaseDbEntity } from './base.entity';
export declare class AgentTemplateDbEntity extends BaseDbEntity {
    name: string;
    description?: string;
    type?: string;
    domain: string;
    skills: string[];
    tools?: string[];
    prompt_template?: string;
    default_settings?: Record<string, any>;
    category?: string;
    is_public: boolean;
    persona?: {
        firstName: string;
        lastName: string;
        title: string;
        initials: string;
    };
    use_cases?: string[];
    typical_tasks?: string[];
    example_tasks?: string[];
    overview?: string[];
    commonly_used_with?: string[];
    popularity_label?: string;
}
