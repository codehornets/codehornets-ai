/**
 * Factory functions for creating test User entities
 */
export interface UserFactoryOptions {
    id?: string;
    email?: string;
    password?: string;
    name?: string;
    avatar?: string;
    role?: 'user' | 'admin';
    onboarding_completed?: boolean;
    company_name?: string;
    team_size?: string;
    industry?: string;
}
export declare function createMockUser(options?: UserFactoryOptions): {
    id: string;
    email: string;
    password: string;
    name: string;
    avatar: string | null;
    role: "admin" | "user";
    onboarding_completed: boolean;
    company_name: string | null;
    team_size: string | null;
    industry: string | null;
    created_at: Date;
    updated_at: Date;
};
export declare function createMockUsers(count: number, baseOptions?: UserFactoryOptions): {
    id: string;
    email: string;
    password: string;
    name: string;
    avatar: string | null;
    role: "admin" | "user";
    onboarding_completed: boolean;
    company_name: string | null;
    team_size: string | null;
    industry: string | null;
    created_at: Date;
    updated_at: Date;
}[];
export declare function createMockAdminUser(options?: UserFactoryOptions): {
    id: string;
    email: string;
    password: string;
    name: string;
    avatar: string | null;
    role: "admin" | "user";
    onboarding_completed: boolean;
    company_name: string | null;
    team_size: string | null;
    industry: string | null;
    created_at: Date;
    updated_at: Date;
};
