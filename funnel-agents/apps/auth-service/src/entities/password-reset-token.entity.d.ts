import { User } from './user.entity';
export declare class PasswordResetToken {
    id: string;
    token: string;
    user_id: string;
    user: User;
    expires_at: Date;
    used: boolean;
    created_at: Date;
}
