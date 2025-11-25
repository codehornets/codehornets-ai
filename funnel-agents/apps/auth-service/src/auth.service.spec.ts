import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user' as const,
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens if refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        company_name: 'New Company',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', {
        name: 'Updated Name',
        company_name: 'New Company',
      });

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('Updated Name');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should update onboarding_completed flag', async () => {
      const updatedUser = {
        ...mockUser,
        onboarding_completed: true,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', {
        onboarding_completed: true,
      });

      expect(result.onboarding_completed).toBe(true);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update multiple profile fields at once', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'New Name',
        avatar: 'https://example.com/new-avatar.jpg',
        company_name: 'Tech Corp',
        team_size: '10-50',
        industry: 'Technology',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', {
        name: 'New Name',
        avatar: 'https://example.com/new-avatar.jpg',
        company_name: 'Tech Corp',
        team_size: '10-50',
        industry: 'Technology',
      });

      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('https://example.com/new-avatar.jpg');
      expect(result.company_name).toBe('Tech Corp');
    });
  });
});
