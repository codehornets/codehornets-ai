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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Register endpoint called for email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login endpoint called for email: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    this.logger.log('Refresh token endpoint called');
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
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
  ): Promise<Omit<User, 'password'>> {
    this.logger.log(`Update profile endpoint called for user: ${req.user.id}`);
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { user: User }): Promise<{ message: string }> {
    this.logger.log(`Logout endpoint called for user: ${req.user.id}`);
    // In a real-world scenario, you might want to blacklist the token
    // For now, we'll just return a success message
    // The client should remove the token from storage
    return { message: 'Logged out successfully' };
  }
}
