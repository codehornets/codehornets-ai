import { Test, TestingModule } from '@nestjs/testing';
import { AuthProxyController } from './auth-proxy.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';

describe('AuthProxyController', () => {
  let controller: AuthProxyController;
  let authClient: ClientProxy;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthProxyController],
      providers: [{ provide: 'AUTH_SERVICE', useValue: mockClientProxy }],
    }).compile();

    controller = module.get<AuthProxyController>(AuthProxyController);
    authClient = module.get<ClientProxy>('AUTH_SERVICE');

    mockRequest = {
      method: 'POST',
      path: '/auth/login',
      body: { email: 'test@example.com', password: 'password123' },
      query: {},
      params: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('proxyRequest', () => {
    it('should successfully proxy a request', async () => {
      const mockResult = { token: 'jwt-token', user: { id: 1 } };
      mockClientProxy.send.mockReturnValue(of(mockResult));

      await controller.proxyRequest(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockClientProxy.send).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle service errors', async () => {
      mockClientProxy.send.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      await controller.proxyRequest(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Auth service unavailable',
        }),
      );
    });

    it('should include user data in payload if available', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (mockRequest as any).user = mockUser;
      mockClientProxy.send.mockReturnValue(of({ success: true }));

      await controller.proxyRequest(
        mockRequest as Request,
        mockResponse as Response,
      );

      const sendCall = mockClientProxy.send.mock.calls[0];
      expect(sendCall[1]).toMatchObject({
        user: mockUser,
      });
    });
  });
});
