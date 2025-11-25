/**
 * @fileoverview API Client Test Suite
 *
 * Unit tests for the NestJS API client infrastructure.
 * Tests authentication, entity operations, and backend switching.
 *
 * @author FunnelAgents Development Team
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
global.localStorage = localStorageMock;

// Mock environment
process.env.VITE_BACKEND_MODE = 'nestjs';
process.env.VITE_API_URL = 'http://localhost:3000';

describe('NestJS Client', () => {
  let nestjsClient;

  beforeEach(async () => {
    // Clear mocks and localStorage
    jest.clearAllMocks();
    localStorage.clear();

    // Import client (dynamic to reset between tests)
    const module = await import('../nestjsClient.js');
    nestjsClient = module.default;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await nestjsClient.auth.login('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('nestjs_access_token')).toBe('test-access-token');
      expect(localStorage.getItem('nestjs_refresh_token')).toBe('test-refresh-token');
    });

    it('should get current user', async () => {
      localStorage.setItem('nestjs_access_token', 'test-token');

      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockUser
      });

      const user = await nestjsClient.auth.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );

      expect(user).toEqual(mockUser);
    });

    it('should logout and clear tokens', async () => {
      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_refresh_token', 'test-refresh-token');

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await nestjsClient.auth.logout();

      expect(localStorage.getItem('nestjs_access_token')).toBeNull();
      expect(localStorage.getItem('nestjs_refresh_token')).toBeNull();
    });

    it('should check authentication status', () => {
      expect(nestjsClient.auth.isAuthenticated()).toBe(false);

      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() + 3600000).toString());

      expect(nestjsClient.auth.isAuthenticated()).toBe(true);
    });
  });

  describe('Entity Operations', () => {
    beforeEach(() => {
      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() + 3600000).toString());
    });

    it('should list entities', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Lead 1' },
          { id: '2', name: 'Lead 2' }
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await nestjsClient.entities.leads.list({ page: 1, limit: 20 });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/crm/leads?page=1&limit=20',
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse);
    });

    it('should get single entity', async () => {
      const mockLead = { id: '123', name: 'Test Lead', email: 'test@example.com' };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockLead
      });

      const result = await nestjsClient.entities.leads.get('123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/crm/leads/123',
        expect.any(Object)
      );

      expect(result).toEqual(mockLead);
    });

    it('should create entity', async () => {
      const createData = { name: 'New Lead', email: 'new@example.com' };
      const mockResponse = { id: '123', ...createData };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await nestjsClient.entities.leads.create(createData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/crm/leads',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should update entity', async () => {
      const updateData = { status: 'contacted' };
      const mockResponse = { id: '123', name: 'Test Lead', ...updateData };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await nestjsClient.entities.leads.update('123', updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/crm/leads/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should delete entity', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await nestjsClient.entities.leads.delete('123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/crm/leads/123',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Advanced Queries', () => {
    beforeEach(() => {
      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() + 3600000).toString());
    });

    it('should query with filters', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Lead 1', status: 'new', score: 85 }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      await nestjsClient.entities.leads.query({
        where: { status: 'new', score: { $gte: 70 } },
        sort: '-score'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/crm/leads?'),
        expect.any(Object)
      );

      const url = new URL(fetch.mock.calls[0][0]);
      expect(url.searchParams.get('sort')).toBe('-score');
      expect(url.searchParams.get('status')).toBe('new');
    });

    it('should populate relations', async () => {
      const mockResponse = {
        id: '1',
        name: 'Lead 1',
        company: { id: '10', name: 'Company A' },
        assignedTo: { id: '20', name: 'Agent A' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      await nestjsClient.entities.leads.get('1', {
        populate: ['company', 'assignedTo']
      });

      const url = new URL(fetch.mock.calls[0][0]);
      expect(url.searchParams.get('populate')).toBe('company,assignedTo');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired token', async () => {
      localStorage.setItem('nestjs_access_token', 'old-token');
      localStorage.setItem('nestjs_refresh_token', 'refresh-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() - 1000).toString()); // Expired

      // Mock refresh response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600
        })
      });

      // Mock actual request response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] })
      });

      await nestjsClient.entities.leads.list();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3000/auth/refresh',
        expect.any(Object)
      );
      expect(localStorage.getItem('nestjs_access_token')).toBe('new-token');
    });

    it('should handle 401 with token refresh', async () => {
      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_refresh_token', 'refresh-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() + 3600000).toString());

      // Mock 401 response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' })
      });

      // Mock refresh response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600
        })
      });

      // Mock retry response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] })
      });

      await nestjsClient.entities.leads.list();

      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() + 3600000).toString());
    });

    it('should handle 404 error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Lead not found' })
      });

      await expect(
        nestjsClient.entities.leads.get('invalid-id')
      ).rejects.toThrow();
    });

    it('should handle network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(
        nestjsClient.entities.leads.list()
      ).rejects.toThrow('Failed to fetch');
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      localStorage.setItem('nestjs_access_token', 'test-token');
      localStorage.setItem('nestjs_token_expiry', (Date.now() + 3600000).toString());
    });

    it('should bulk create entities', async () => {
      const items = [
        { name: 'Lead 1', email: 'lead1@example.com' },
        { name: 'Lead 2', email: 'lead2@example.com' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => items.map((item, i) => ({ id: `${i + 1}`, ...item }))
      });

      await nestjsClient.entities.leads.bulkCreate(items);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/crm/leads/bulk',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ items })
        })
      );
    });
  });
});

describe('Backend Switching', () => {
  it('should use NestJS by default', async () => {
    process.env.VITE_BACKEND_MODE = 'nestjs';
    const { default: client, isNestJS } = await import('../client.js');

    expect(isNestJS()).toBe(true);
    expect(client.entities).toBeDefined();
  });

  it('should detect backend mode from env', async () => {
    process.env.VITE_BACKEND_MODE = 'nestjs';
    const { backendMode } = await import('../client.js');

    expect(backendMode).toBe('nestjs');
  });
});

console.log('API Client tests defined. Run with: npm test');
