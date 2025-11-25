import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DistributedLockService } from './distributed-lock.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      eval: jest.fn(),
      exists: jest.fn(),
      pttl: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
    } as any;

    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributedLockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('acquire', () => {
    it('should successfully acquire a lock', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      const result = await service.acquire('test-lock', { ttl: 30000 });

      expect(result.acquired).toBe(true);
      expect(result.lockId).toBeTruthy();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'funnel-agents:lock:test-lock',
        expect.any(String),
        'PX',
        30000,
        'NX'
      );
    });

    it('should fail to acquire lock if already held', async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await service.acquire('test-lock', {
        ttl: 30000,
        retryCount: 0,
      });

      expect(result.acquired).toBe(false);
      expect(result.lockId).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should retry lock acquisition', async () => {
      mockRedis.set
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('OK' as any);

      const result = await service.acquire('test-lock', {
        ttl: 30000,
        retryCount: 3,
        retryDelay: 10,
      });

      expect(result.acquired).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledTimes(3);
    });

    it('should handle Redis unavailable', async () => {
      const serviceWithoutRedis = new DistributedLockService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const result = await serviceWithoutRedis.acquire('test-lock');

      expect(result.acquired).toBe(false);
      expect(result.error).toBe('Redis not available');
    });

    it('should update metrics on acquisition', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      await service.acquire('test-lock');
      const metrics = service.getMetrics();

      expect(metrics.totalAcquisitions).toBe(1);
      expect(metrics.successfulAcquisitions).toBe(1);
      expect(metrics.activeLocksCount).toBe(1);
    });
  });

  describe('release', () => {
    it('should successfully release a lock', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);
      mockRedis.eval.mockResolvedValue(1);

      const { lockId } = await service.acquire('test-lock');
      const released = await service.release('test-lock', lockId!);

      expect(released).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it('should fail to release lock not owned', async () => {
      mockRedis.eval.mockResolvedValue(0);

      const released = await service.release('test-lock', 'wrong-lock-id');

      expect(released).toBe(false);
    });

    it('should handle Redis unavailable on release', async () => {
      const serviceWithoutRedis = new DistributedLockService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const released = await serviceWithoutRedis.release(
        'test-lock',
        'some-id'
      );

      expect(released).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockRedis.eval.mockRejectedValue(new Error('Redis error'));

      const released = await service.release('test-lock', 'some-id');

      expect(released).toBe(false);
    });
  });

  describe('extend', () => {
    it('should successfully extend a lock', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);
      mockRedis.eval.mockResolvedValue(1);

      const { lockId } = await service.acquire('test-lock');
      const extended = await service.extend('test-lock', lockId!, 30000);

      expect(extended).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'funnel-agents:lock:test-lock',
        lockId,
        30000
      );
    });

    it('should fail to extend lock not owned', async () => {
      mockRedis.eval.mockResolvedValue(0);

      const extended = await service.extend('test-lock', 'wrong-id', 30000);

      expect(extended).toBe(false);
    });

    it('should handle Redis unavailable on extend', async () => {
      const serviceWithoutRedis = new DistributedLockService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const extended = await serviceWithoutRedis.extend(
        'test-lock',
        'some-id',
        30000
      );

      expect(extended).toBe(false);
    });
  });

  describe('executeWithLock', () => {
    it('should execute function with lock', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);
      mockRedis.eval.mockResolvedValue(1);

      const mockFn = jest.fn().mockResolvedValue('result');

      const result = await service.executeWithLock('test-lock', mockFn);

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled(); // acquire
      expect(mockRedis.eval).toHaveBeenCalled(); // release
    });

    it('should return null if lock cannot be acquired', async () => {
      mockRedis.set.mockResolvedValue(null);

      const mockFn = jest.fn().mockResolvedValue('result');

      const result = await service.executeWithLock('test-lock', mockFn, {
        retryCount: 0,
      });

      expect(result).toBeNull();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should release lock even if function throws', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);
      mockRedis.eval.mockResolvedValue(1);

      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        service.executeWithLock('test-lock', mockFn)
      ).rejects.toThrow('Test error');

      expect(mockRedis.eval).toHaveBeenCalled(); // release was called
    });
  });

  describe('isLocked', () => {
    it('should return true if lock exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const isLocked = await service.isLocked('test-lock');

      expect(isLocked).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        'funnel-agents:lock:test-lock'
      );
    });

    it('should return false if lock does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const isLocked = await service.isLocked('test-lock');

      expect(isLocked).toBe(false);
    });

    it('should return false if Redis unavailable', async () => {
      const serviceWithoutRedis = new DistributedLockService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const isLocked = await serviceWithoutRedis.isLocked('test-lock');

      expect(isLocked).toBe(false);
    });
  });

  describe('getLockTTL', () => {
    it('should return TTL in milliseconds', async () => {
      mockRedis.pttl.mockResolvedValue(5000);

      const ttl = await service.getLockTTL('test-lock');

      expect(ttl).toBe(5000);
      expect(mockRedis.pttl).toHaveBeenCalledWith(
        'funnel-agents:lock:test-lock'
      );
    });

    it('should return -2 if Redis unavailable', async () => {
      const serviceWithoutRedis = new DistributedLockService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const ttl = await serviceWithoutRedis.getLockTTL('test-lock');

      expect(ttl).toBe(-2);
    });
  });

  describe('metrics', () => {
    it('should track metrics correctly', async () => {
      mockRedis.set
        .mockResolvedValueOnce('OK' as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('OK' as any);

      await service.acquire('lock-1');
      await service.acquire('lock-2', { retryCount: 0 });
      await service.acquire('lock-3');

      const metrics = service.getMetrics();

      expect(metrics.totalAcquisitions).toBe(3);
      expect(metrics.successfulAcquisitions).toBe(2);
      expect(metrics.failedAcquisitions).toBe(1);
      expect(metrics.activeLocksCount).toBe(2);
    });

    it('should reset metrics', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      await service.acquire('lock-1');
      service.resetMetrics();

      const metrics = service.getMetrics();

      expect(metrics.totalAcquisitions).toBe(0);
      expect(metrics.successfulAcquisitions).toBe(0);
      expect(metrics.failedAcquisitions).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true if Redis is healthy', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const healthy = await service.healthCheck();

      expect(healthy).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false if Redis unavailable', async () => {
      const serviceWithoutRedis = new DistributedLockService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const healthy = await serviceWithoutRedis.healthCheck();

      expect(healthy).toBe(false);
    });

    it('should return false if ping fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection error'));

      const healthy = await service.healthCheck();

      expect(healthy).toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('should release all active locks on destroy', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);
      mockRedis.eval.mockResolvedValue(1);

      await service.acquire('lock-1');
      await service.acquire('lock-2');

      await service.onModuleDestroy();

      // Should have called release for both locks
      expect(mockRedis.eval).toHaveBeenCalledTimes(2);
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('contention handling', () => {
    it('should track contention metrics', async () => {
      mockRedis.set
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('OK' as any);

      await service.acquire('test-lock', {
        ttl: 30000,
        retryCount: 2,
        retryDelay: 10,
      });

      const metrics = service.getMetrics();

      expect(metrics.contentions).toBeGreaterThan(0);
    });
  });
});
