import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      onboarding_completed: false,
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
        onboarding_completed: false,
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
        onboarding_completed: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const req = { user: mockUser };

      const result = await controller.logout(req);

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'user' as const,
        onboarding_completed: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'user' as const,
        onboarding_completed: false,
        company_name: 'New Company',
        created_at: mockUser.created_at,
        updated_at: new Date(),
      };

      const updateDto: UpdateProfileDto = {
        name: 'Updated Name',
        company_name: 'New Company',
      };

      mockAuthService.updateProfile.mockResolvedValue(updatedUser);

      const req = { user: mockUser };
      const result = await controller.updateProfile(req, updateDto);

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('Updated Name');
      expect(result.company_name).toBe('New Company');
      expect(authService.updateProfile).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should update onboarding status', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'user' as const,
        onboarding_completed: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        onboarding_completed: true,
        created_at: mockUser.created_at,
        updated_at: new Date(),
      };

      const updateDto: UpdateProfileDto = {
        onboarding_completed: true,
      };

      mockAuthService.updateProfile.mockResolvedValue(updatedUser);

      const req = { user: mockUser };
      const result = await controller.updateProfile(req, updateDto);

      expect(result.onboarding_completed).toBe(true);
    });
  });
});
