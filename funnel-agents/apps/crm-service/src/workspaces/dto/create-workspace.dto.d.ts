export declare class CreateWorkspaceDto {
    name: string;
    description?: string;
    color?: string;
    status?: 'active' | 'inactive' | 'archived';
    team_members?: string[];
    settings?: Record<string, any>;
}
