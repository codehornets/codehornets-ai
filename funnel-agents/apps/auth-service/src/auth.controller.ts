import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { IpAddress } from './decorators/ip-address.decorator';
import { UserAgent } from './decorators/user-agent.decorator';
import { User } from './entities/user.entity';
import { AuditLogService } from './services/audit-log.service';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '@funnelagents/shared';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: RATE_LIMITS.AUTH_REGISTER })
  async register(
    @Body() registerDto: RegisterDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Register endpoint called for email: ${registerDto.email}`);
    return this.authService.register(registerDto, ip_address, user_agent);
  }

  // Alias for /register to support frontend calling /signup
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: RATE_LIMITS.AUTH_REGISTER })
  async signup(
    @Body() registerDto: RegisterDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Signup endpoint called for email: ${registerDto.email}`);
    return this.authService.register(registerDto, ip_address, user_agent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMITS.AUTH_LOGIN })
  async login(
    @Body() loginDto: LoginDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Login endpoint called for email: ${loginDto.email}`);
    return this.authService.login(loginDto, ip_address, user_agent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<AuthResponseDto> {
    this.logger.log('Refresh token endpoint called');
    return this.authService.refreshToken(
      refreshTokenDto.refresh_token,
      ip_address,
      user_agent,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: User }): Promise<Omit<User, 'password'>> {
    this.logger.log(`Get profile endpoint called for user: ${req.user.id}`);
    const { password: _password, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: { user: User },
    @Body() updateProfileDto: UpdateProfileDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<Omit<User, 'password'>> {
    this.logger.log(`Update profile endpoint called for user: ${req.user.id}`);
    return this.authService.updateProfile(
      req.user.id,
      updateProfileDto,
      ip_address,
      user_agent,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: { user: User; token: string },
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Logout endpoint called for user: ${req.user.id}`);
    await this.authService.logout(
      req.user.id,
      req.token,
      ip_address,
      user_agent,
    );
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMITS.PASSWORD_RESET })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Password reset requested for email: ${forgotPasswordDto.email}`,
    );
    await this.authService.forgotPassword(
      forgotPasswordDto.email,
      ip_address,
      user_agent,
    );
    return {
      message:
        'If your email exists in our system, you will receive a password reset link shortly',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<{ message: string }> {
    this.logger.log('Password reset endpoint called');
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
      ip_address,
      user_agent,
    );
    return { message: 'Password reset successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: { user: User },
    @Body() changePasswordDto: ChangePasswordDto,
    @IpAddress() ip_address: string,
    @UserAgent() user_agent: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Password change requested for user: ${req.user.id}`);
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.current_password,
      changePasswordDto.new_password,
      ip_address,
      user_agent,
    );
    return { message: 'Password changed successfully' };
  }

  @Post('unlock-account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async unlockAccount(
    @Body() unlockAccountDto: UnlockAccountDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Account unlock requested for: ${unlockAccountDto.email}`);
    await this.authService.unlockAccount(unlockAccountDto.email);
    return { message: 'Account unlocked successfully' };
  }

  @Get('audit-log')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAuditLog(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    this.logger.log('Audit log requested');
    return this.auditLogService.getAllAuditLogs(
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('audit-log/me')
  @UseGuards(JwtAuthGuard)
  async getMyAuditLog(@Request() req: { user: User }) {
    this.logger.log(`User audit log requested for: ${req.user.id}`);
    return this.auditLogService.getUserAuditLogs(req.user.id);
  }
}
