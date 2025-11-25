export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    avatar?: string;
    role?: 'admin' | 'user' | 'viewer';
}
