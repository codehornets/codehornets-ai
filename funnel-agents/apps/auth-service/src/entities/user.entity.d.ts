export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'user' | 'viewer';
    onboarding_completed: boolean;
    company_name?: string;
    team_size?: string;
    industry?: string;
    failed_login_attempts: number;
    locked_until?: Date;
    last_login?: Date;
    created_at: Date;
    updated_at: Date;
}
