import { AggregateRoot, UniqueId } from '../shared-kernel';
export interface AgentPersona {
    firstName: string;
    lastName: string;
    title: string;
    initials: string;
}
export interface AgentTemplateProps {
    name: string;
    description?: string;
    type?: string;
    domain: string;
    skills: string[];
    tools?: string[];
    promptTemplate?: string;
    defaultSettings?: Record<string, any>;
    category?: string;
    isPublic: boolean;
    persona?: AgentPersona;
    useCases?: string[];
    typicalTasks?: string[];
    exampleTasks?: string[];
    overview?: string[];
    commonlyUsedWith?: string[];
    popularityLabel?: string;
}
export declare class AgentTemplate extends AggregateRoot<AgentTemplateProps> {
    private constructor();
    get name(): string;
    get description(): string | undefined;
    get type(): string | undefined;
    get domain(): string;
    get skills(): string[];
    get tools(): string[];
    get promptTemplate(): string | undefined;
    get defaultSettings(): Record<string, any> | undefined;
    get category(): string | undefined;
    get isPublic(): boolean;
    get persona(): AgentPersona | undefined;
    get useCases(): string[];
    get typicalTasks(): string[];
    get exampleTasks(): string[];
    get overview(): string[];
    get commonlyUsedWith(): string[];
    get popularityLabel(): string | undefined;
    static create(props: AgentTemplateProps, id?: UniqueId): AgentTemplate;
    static reconstitute(props: AgentTemplateProps, id: UniqueId): AgentTemplate;
    publish(): void;
    unpublish(): void;
    updateDetails(updates: {
        name?: string;
        description?: string;
        domain?: string;
        category?: string;
    }): void;
    updateSkills(skills: string[]): void;
    addSkill(skill: string): void;
    removeSkill(skill: string): void;
    updatePromptTemplate(template: string): void;
    updateDefaultSettings(settings: Record<string, any>): void;
}
