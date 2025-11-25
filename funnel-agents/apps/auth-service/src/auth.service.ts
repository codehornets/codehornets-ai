import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering new user: ${registerDto.email}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
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

    // Generate tokens
    return this.generateTokens(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in successfully: ${user.id}`);

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

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'your-refresh-secret-key',
      });

      const user = await this.validateUser(payload.sub);

      this.logger.log(`Token refreshed for user: ${user.id}`);

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: User): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'your-refresh-secret-key',
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

    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }
}
