/**
 * @fileoverview Auth API Tests
 * Integration tests for authentication API methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authAPI from '../auth';

// Mock the axios client
vi.mock('@base44/sdk/dist/utils/axios-client', () => ({
  createAxiosClient: vi.fn(() => ({
    post: vi.fn(),
    get: vi.fn(),
  })),
}));

// Mock app params
vi.mock('@/lib/app-params', () => ({
  appParams: {
    serverUrl: 'http://localhost:3000',
    appId: 'test-app-id',
  },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com' },
        expires_in: 3600,
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const result = await authAPI.login('test@example.com', 'password123');

      expect(mockPost).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password123',
        remember_me: false,
      });

      expect(result.token).toBe('test-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should trim and lowercase email', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({});

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authAPI.login('  TEST@EXAMPLE.COM  ', 'password');

      expect(mockPost).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password',
        remember_me: false,
      });
    });

    it('should support remember me option', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({});

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authAPI.login('test@example.com', 'password', true);

      expect(mockPost).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password',
        remember_me: true,
      });
    });

    it('should handle login errors', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await expect(authAPI.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signup', () => {
    it('should register new user', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        token: 'new-token',
        user: { id: '2', email: 'new@example.com' },
        expires_in: 3600,
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const result = await authAPI.signup(userData);

      expect(mockPost).toHaveBeenCalledWith('/signup', {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        company_name: undefined,
      });

      expect(result.user.email).toBe('new@example.com');
    });

    it('should include company name if provided', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({});

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const userData = {
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        company_name: 'Acme Corp',
      };

      await authAPI.signup(userData);

      expect(mockPost).toHaveBeenCalledWith('/signup', {
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        company_name: 'Acme Corp',
      });
    });

    it('should trim name and email', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({});

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authAPI.signup({
        name: '  User Name  ',
        email: '  USER@EXAMPLE.COM  ',
        password: 'password',
      });

      expect(mockPost).toHaveBeenCalledWith('/signup', {
        name: 'User Name',
        email: 'user@example.com',
        password: 'password',
        company_name: undefined,
      });
    });

    it('should handle signup errors', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockRejectedValue(new Error('Email already exists'));

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await expect(
        authAPI.signup({ name: 'User', email: 'existing@example.com', password: 'pass' })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockGet = vi.fn().mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });

      createAxiosClient.mockReturnValue({
        post: vi.fn(),
        get: mockGet,
      });

      const result = await authAPI.getCurrentUser('test-token');

      expect(mockGet).toHaveBeenCalledWith('/me');
      expect(result.email).toBe('test@example.com');
    });

    it('should handle unauthorized error', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockGet = vi.fn().mockRejectedValue(new Error('Unauthorized'));

      createAxiosClient.mockReturnValue({
        post: vi.fn(),
        get: mockGet,
      });

      await expect(authAPI.getCurrentUser('invalid-token')).rejects.toThrow('Unauthorized');
    });
  });

  describe('refreshToken', () => {
    it('should refresh authentication token', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        token: 'new-token',
        user: { id: '1', email: 'test@example.com' },
        expires_in: 3600,
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const result = await authAPI.refreshToken('old-token');

      expect(mockPost).toHaveBeenCalledWith('/refresh');
      expect(result.token).toBe('new-token');
    });

    it('should handle refresh errors', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockRejectedValue(new Error('Token expired'));

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await expect(authAPI.refreshToken('expired-token')).rejects.toThrow('Token expired');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({});

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authAPI.logout('test-token');

      expect(mockPost).toHaveBeenCalledWith('/logout');
    });

    it('should not throw on logout errors', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockRejectedValue(new Error('Server error'));

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      // Should not throw
      await expect(authAPI.logout('test-token')).resolves.toBeUndefined();
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        message: 'Reset email sent',
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const result = await authAPI.forgotPassword('test@example.com');

      expect(mockPost).toHaveBeenCalledWith('/forgot-password', {
        email: 'test@example.com',
      });

      expect(result.message).toBe('Reset email sent');
    });

    it('should trim and lowercase email', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({});

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await authAPI.forgotPassword('  TEST@EXAMPLE.COM  ');

      expect(mockPost).toHaveBeenCalledWith('/forgot-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with token', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        message: 'Password reset successful',
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const result = await authAPI.resetPassword('reset-token', 'newpassword');

      expect(mockPost).toHaveBeenCalledWith('/reset-password', {
        token: 'reset-token',
        password: 'newpassword',
      });

      expect(result.message).toBe('Password reset successful');
    });

    it('should handle invalid token error', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockRejectedValue(new Error('Invalid token'));

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      await expect(authAPI.resetPassword('invalid-token', 'newpass')).rejects.toThrow('Invalid token');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with token', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        message: 'Email verified',
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const result = await authAPI.verifyEmail('verify-token');

      expect(mockPost).toHaveBeenCalledWith('/verify-email', {
        token: 'verify-token',
      });

      expect(result.message).toBe('Email verified');
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const mockPost = vi.fn().mockResolvedValue({
        message: 'Verification email sent',
      });

      createAxiosClient.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
      });

      const result = await authAPI.resendVerification('test@example.com');

      expect(mockPost).toHaveBeenCalledWith('/resend-verification', {
        email: 'test@example.com',
      });

      expect(result.message).toBe('Verification email sent');
    });
  });
});
