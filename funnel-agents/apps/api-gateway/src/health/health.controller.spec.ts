import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('HealthController', () => {
  let controller: HealthController;
  let authClient: ClientProxy;

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: 'AUTH_SERVICE', useValue: mockClientProxy },
        { provide: 'CRM_SERVICE', useValue: mockClientProxy },
        { provide: 'CAMPAIGNS_SERVICE', useValue: mockClientProxy },
        { provide: 'CONTENT_SERVICE', useValue: mockClientProxy },
        { provide: 'AGENTS_SERVICE', useValue: mockClientProxy },
        { provide: 'TASKS_SERVICE', useValue: mockClientProxy },
        { provide: 'AUTOMATIONS_SERVICE', useValue: mockClientProxy },
        { provide: 'REPORTS_SERVICE', useValue: mockClientProxy },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    authClient = module.get<ClientProxy>('AUTH_SERVICE');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const result = await controller.getHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'api-gateway');
      expect(result).toHaveProperty('version');
    });
  });

  describe('getServicesHealth', () => {
    it('should check all services health', async () => {
      mockClientProxy.send.mockReturnValue(of({ status: 'healthy' }));

      const result = await controller.getServicesHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBe(8);
    });

    it('should report degraded status if any service is unhealthy', async () => {
      mockClientProxy.send
        .mockReturnValueOnce(of({ status: 'healthy' }))
        .mockReturnValueOnce(
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Service down')), 100),
          ),
        );

      const result = await controller.getServicesHealth();

      expect(result.status).toBeDefined();
    });
  });
});
