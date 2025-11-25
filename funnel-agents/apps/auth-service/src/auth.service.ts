import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from './services/audit-log.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from './services/email.service';
import { PasswordResetService } from './services/password-reset.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLogService: AuditLogService,
    private tokenBlacklistService: TokenBlacklistService,
    private emailService: EmailService,
    private passwordResetService: PasswordResetService,
    private accountLockoutService: AccountLockoutService,
  ) {}

  async register(
    registerDto: RegisterDto,
    ip_address?: string,
    user_agent?: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Registering new user: ${registerDto.email}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      await this.auditLogService.log({
        email: registerDto.email,
        action: AuditAction.REGISTER,
        ip_address,
        user_agent,
        success: false,
        error_message: 'User with this email already exists',
      });
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.SALT_ROUNDS,
    );

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      avatar: registerDto.avatar,
      role: registerDto.role || 'user',
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User registered successfully: ${savedUser.id}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: savedUser.id,
      email: savedUser.email,
      action: AuditAction.REGISTER,
      ip_address,
      user_agent,
      success: true,
    });

    // Generate tokens
    return this.generateTokens(savedUser);
  }

  async login(
    loginDto: LoginDto,
    ip_address?: string,
    user_agent?: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);

    // Check if account is locked
    const isLocked = await this.accountLockoutService.isAccountLocked(
      loginDto.email,
    );

    if (isLocked) {
      await this.auditLogService.log({
        email: loginDto.email,
        action: AuditAction.FAILED_LOGIN,
        ip_address,
        user_agent,
        success: false,
        error_message: 'Account is locked',
      });
      throw new UnauthorizedException(
        'Account is locked due to multiple failed login attempts. Please try again later.',
      );
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      // Record failed attempt
      await this.accountLockoutService.recordLoginAttempt(
        loginDto.email,
        ip_address || 'unknown',
        false,
      );

      await this.auditLogService.log({
        email: loginDto.email,
        action: AuditAction.FAILED_LOGIN,
        ip_address,
        user_agent,
        success: false,
        error_message: 'Invalid credentials',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      // Record failed attempt
      await this.accountLockoutService.recordLoginAttempt(
        loginDto.email,
        ip_address || 'unknown',
        false,
      );

      // Check if account should be locked
      const shouldLock = await this.accountLockoutService.checkAndLockAccount(
        loginDto.email,
      );

      if (shouldLock) {
        await this.auditLogService.log({
          user_id: user.id,
          email: user.email,
          action: AuditAction.ACCOUNT_LOCKED,
          ip_address,
          user_agent,
          success: true,
        });

        // Send email notification
        await this.emailService.sendAccountLockedEmail(user.email);
      }

      await this.auditLogService.log({
        user_id: user.id,
        email: user.email,
        action: AuditAction.FAILED_LOGIN,
        ip_address,
        user_agent,
        success: false,
        error_message: 'Invalid credentials',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Record successful login attempt
    await this.accountLockoutService.recordLoginAttempt(
      loginDto.email,
      ip_address || 'unknown',
      true,
    );

    // Reset failed attempts on successful login
    await this.accountLockoutService.resetFailedAttempts(loginDto.email);

    // Update last login timestamp
    await this.userRepository.update({ id: user.id }, { last_login: new Date() });

    this.logger.log(`User logged in successfully: ${user.id}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: user.id,
      email: user.email,
      action: AuditAction.LOGIN,
      ip_address,
      user_agent,
      success: true,
    });

    // Generate tokens
    return this.generateTokens(user);
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshToken(
    refreshToken: string,
    ip_address?: string,
    user_agent?: string,
  ): Promise<AuthResponseDto> {
    try {
      const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!jwtRefreshSecret) {
        this.logger.error('JWT_REFRESH_SECRET is not configured');
        throw new Error('JWT configuration error');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtRefreshSecret,
      });

      const user = await this.validateUser(payload.sub);

      this.logger.log(`Token refreshed for user: ${user.id}`);

      // Log audit event
      await this.auditLogService.log({
        user_id: user.id,
        email: user.email,
        action: AuditAction.TOKEN_REFRESH,
        ip_address,
        user_agent,
        success: true,
      });

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: User): AuthResponseDto {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !jwtRefreshSecret) {
      this.logger.error('JWT_SECRET or JWT_REFRESH_SECRET is not configured');
      throw new Error('JWT configuration error');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        onboarding_completed: user.onboarding_completed,
        company_name: user.company_name,
        team_size: user.team_size,
        industry: user.industry,
      },
    };
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'avatar' | 'onboarding_completed' | 'company_name' | 'team_size' | 'industry'>>,
    ip_address?: string,
    user_agent?: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.validateUser(userId);

    // Update allowed fields
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.onboarding_completed !== undefined) user.onboarding_completed = updates.onboarding_completed;
    if (updates.company_name !== undefined) user.company_name = updates.company_name;
    if (updates.team_size !== undefined) user.team_size = updates.team_size;
    if (updates.industry !== undefined) user.industry = updates.industry;

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User profile updated: ${savedUser.id}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: savedUser.id,
      email: savedUser.email,
      action: AuditAction.PROFILE_UPDATE,
      ip_address,
      user_agent,
      metadata: { updates },
      success: true,
    });

    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async logout(
    userId: string,
    token: string,
    ip_address?: string,
    user_agent?: string,
  ): Promise<void> {
    const user = await this.validateUser(userId);

    // Extract token expiry from JWT
    const decoded = this.jwtService.decode(token) as any;
    const expires_at = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await this.tokenBlacklistService.addToBlacklist(token, userId, expires_at);

    this.logger.log(`User logged out: ${userId}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: userId,
      email: user.email,
      action: AuditAction.LOGOUT,
      ip_address,
      user_agent,
      success: true,
    });
  }

  async forgotPassword(
    email: string,
    ip_address?: string,
    user_agent?: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal that user doesn't exist
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Create reset token
    const resetToken = await this.passwordResetService.createResetToken(user.id);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    this.logger.log(`Password reset email sent to: ${email}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: user.id,
      email: user.email,
      action: AuditAction.PASSWORD_RESET_REQUEST,
      ip_address,
      user_agent,
      success: true,
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ip_address?: string,
    user_agent?: string,
  ): Promise<void> {
    // Validate reset token
    const userId = await this.passwordResetService.validateResetToken(token);

    const user = await this.validateUser(userId);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );

    // Mark token as used
    await this.passwordResetService.markTokenAsUsed(token);

    this.logger.log(`Password reset completed for user: ${userId}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: userId,
      email: user.email,
      action: AuditAction.PASSWORD_RESET_COMPLETE,
      ip_address,
      user_agent,
      success: true,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ip_address?: string,
    user_agent?: string,
  ): Promise<void> {
    const user = await this.validateUser(userId);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      await this.auditLogService.log({
        user_id: userId,
        email: user.email,
        action: AuditAction.PASSWORD_CHANGE,
        ip_address,
        user_agent,
        success: false,
        error_message: 'Current password is incorrect',
      });
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );

    this.logger.log(`Password changed for user: ${userId}`);

    // Log audit event
    await this.auditLogService.log({
      user_id: userId,
      email: user.email,
      action: AuditAction.PASSWORD_CHANGE,
      ip_address,
      user_agent,
      success: true,
    });
  }

  async unlockAccount(email: string): Promise<void> {
    await this.accountLockoutService.unlockAccount(email);

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      // Log audit event
      await this.auditLogService.log({
        user_id: user.id,
        email: user.email,
        action: AuditAction.ACCOUNT_UNLOCKED,
        success: true,
      });
    }
  }
}
