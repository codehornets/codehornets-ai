import { Repository } from 'typeorm';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
export declare class TokenBlacklistService {
    private tokenBlacklistRepository;
    private readonly logger;
    constructor(tokenBlacklistRepository: Repository<TokenBlacklist>);
    addToBlacklist(token: string, user_id: string, expires_at: Date): Promise<void>;
    isBlacklisted(token: string): Promise<boolean>;
    removeFromBlacklist(token: string): Promise<void>;
    cleanupExpiredTokens(): Promise<void>;
    getUserBlacklistedTokens(user_id: string): Promise<TokenBlacklist[]>;
}
