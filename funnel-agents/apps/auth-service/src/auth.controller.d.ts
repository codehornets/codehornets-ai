import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UnlockAccountDto } from './dto/unlock-account.dto';
import { User } from './entities/user.entity';
import { AuditLogService } from './services/audit-log.service';
export declare class AuthController {
    private readonly authService;
    private readonly auditLogService;
    private readonly logger;
    constructor(authService: AuthService, auditLogService: AuditLogService);
    register(registerDto: RegisterDto, ip_address: string, user_agent: string): Promise<AuthResponseDto>;
    login(loginDto: LoginDto, ip_address: string, user_agent: string): Promise<AuthResponseDto>;
    refresh(refreshTokenDto: RefreshTokenDto, ip_address: string, user_agent: string): Promise<AuthResponseDto>;
    getProfile(req: {
        user: User;
    }): Promise<Omit<User, 'password'>>;
    updateProfile(req: {
        user: User;
    }, updateProfileDto: UpdateProfileDto, ip_address: string, user_agent: string): Promise<Omit<User, 'password'>>;
    logout(req: {
        user: User;
        token: string;
    }, ip_address: string, user_agent: string): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto, ip_address: string, user_agent: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto, ip_address: string, user_agent: string): Promise<{
        message: string;
    }>;
    changePassword(req: {
        user: User;
    }, changePasswordDto: ChangePasswordDto, ip_address: string, user_agent: string): Promise<{
        message: string;
    }>;
    unlockAccount(unlockAccountDto: UnlockAccountDto): Promise<{
        message: string;
    }>;
    getAuditLog(limit?: number, offset?: number): Promise<{
        logs: import("./entities/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getMyAuditLog(req: {
        user: User;
    }): Promise<import("./entities/audit-log.entity").AuditLog[]>;
}
