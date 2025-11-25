export declare class Workspace {
    id: string;
    name: string;
    description?: string;
    color?: string;
    status: 'active' | 'inactive' | 'archived';
    team_members?: string[];
    settings?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
