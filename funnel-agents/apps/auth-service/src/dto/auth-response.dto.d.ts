export declare class AuthResponseDto {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
        role: 'admin' | 'user' | 'viewer';
        onboarding_completed: boolean;
        company_name?: string;
        team_size?: string;
        industry?: string;
    };
}
