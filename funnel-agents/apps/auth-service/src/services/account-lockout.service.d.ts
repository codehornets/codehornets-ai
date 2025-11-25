import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';
export declare class AccountLockoutService {
    private userRepository;
    private loginAttemptRepository;
    private readonly logger;
    private readonly MAX_FAILED_ATTEMPTS;
    private readonly LOCKOUT_DURATION_MINUTES;
    private readonly ATTEMPT_WINDOW_MINUTES;
    constructor(userRepository: Repository<User>, loginAttemptRepository: Repository<LoginAttempt>);
    recordLoginAttempt(email: string, ip_address: string, success: boolean): Promise<void>;
    checkAndLockAccount(email: string): Promise<boolean>;
    isAccountLocked(email: string): Promise<boolean>;
    unlockAccount(email: string): Promise<void>;
    resetFailedAttempts(email: string): Promise<void>;
    cleanupOldLoginAttempts(): Promise<void>;
}
