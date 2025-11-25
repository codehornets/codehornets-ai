import { Repository } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
export declare class PasswordResetService {
    private passwordResetTokenRepository;
    private readonly logger;
    private readonly TOKEN_EXPIRY_HOURS;
    constructor(passwordResetTokenRepository: Repository<PasswordResetToken>);
    createResetToken(user_id: string): Promise<string>;
    validateResetToken(token: string): Promise<string>;
    markTokenAsUsed(token: string): Promise<void>;
    cleanupExpiredTokens(): Promise<void>;
}
