import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshTokenDto = { refresh_token: 'old-refresh-token' };

      mockAuthService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refresh_token,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'user' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const req = { user: mockUser };

      const result = await controller.getProfile(req);

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'user' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const req = { user: mockUser };

      const result = await controller.logout(req);

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
