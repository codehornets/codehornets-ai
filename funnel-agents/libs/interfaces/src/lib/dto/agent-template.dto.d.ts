export declare class PersonaDto {
    firstName: string;
    lastName: string;
    title: string;
    initials: string;
}
export declare class CreateAgentTemplateDto {
    name: string;
    description?: string;
    type?: string;
    domain: string;
    skills: string[];
    tools?: string[];
    prompt_template?: string;
    default_settings?: Record<string, any>;
    category?: string;
    is_public?: boolean;
    persona?: PersonaDto;
    use_cases?: string[];
    typical_tasks?: string[];
    example_tasks?: string[];
    overview?: string[];
    commonly_used_with?: string[];
    popularity_label?: string;
}
export declare class UpdateAgentTemplateDto {
    name?: string;
    description?: string;
    type?: string;
    domain?: string;
    skills?: string[];
    tools?: string[];
    prompt_template?: string;
    default_settings?: Record<string, any>;
    category?: string;
    persona?: PersonaDto;
    use_cases?: string[];
    typical_tasks?: string[];
    example_tasks?: string[];
    overview?: string[];
    commonly_used_with?: string[];
    popularity_label?: string;
}
export declare class AgentTemplateResponseDto {
    id: string;
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
    persona?: PersonaDto;
    use_cases?: string[];
    typical_tasks?: string[];
    example_tasks?: string[];
    overview?: string[];
    commonly_used_with?: string[];
    popularity_label?: string;
    created_at: Date;
    updated_at: Date;
}
export declare class AgentTemplateFilterDto {
    domain?: string;
    category?: string;
    is_public?: boolean;
    skill?: string;
}
