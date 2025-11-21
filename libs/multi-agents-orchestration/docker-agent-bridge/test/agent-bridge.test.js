/**
 * Tests for Docker Agent Bridge
 *
 * Note: These are integration tests that require Docker to be running
 * and test containers to be available.
 */

const AgentBridge = require('../src/index');

// Mock container for testing
const TEST_CONTAINER = 'test-worker';

describe('AgentBridge', () => {
  let bridge;

  beforeEach(() => {
    bridge = new AgentBridge({
      strategy: 'auto',
      debug: false
    });
  });

  afterEach(async () => {
    if (bridge) {
      await bridge.stop();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const bridge = new AgentBridge();
      expect(bridge).toBeDefined();
      expect(bridge.strategy).toBe('auto');
      expect(bridge.retryAttempts).toBe(3);
      expect(bridge.retryDelay).toBe(1000);
    });

    test('should initialize with custom options', () => {
      const bridge = new AgentBridge({
        strategy: 'exec',
        retryAttempts: 5,
        retryDelay: 2000,
        debug: true
      });

      expect(bridge.strategy).toBe('exec');
      expect(bridge.retryAttempts).toBe(5);
      expect(bridge.retryDelay).toBe(2000);
      expect(bridge.debug).toBe(true);
    });

    test('should have all strategies initialized', () => {
      const bridge = new AgentBridge();
      expect(bridge.strategies['named-pipe']).toBeDefined();
      expect(bridge.strategies['tty']).toBeDefined();
      expect(bridge.strategies['shared-volume']).toBeDefined();
      expect(bridge.strategies['signal']).toBeDefined();
      expect(bridge.strategies['exec']).toBeDefined();
    });
  });

  describe('Message Generation', () => {
    test('should generate unique message IDs', () => {
      const id1 = bridge._generateId();
      const id2 = bridge._generateId();

      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Container Status', () => {
    test('should check if container is running', async () => {
      // This test requires actual Docker containers
      // Skip if Docker is not available
      try {
        const isRunning = await bridge.isContainerRunning('non-existent-container');
        expect(typeof isRunning).toBe('boolean');
      } catch (error) {
        // Docker not available, skip test
        console.log('Skipping container test - Docker not available');
      }
    });
  });

  describe('Message Formatting', () => {
    test('should format message correctly', () => {
      const message = {
        from: 'orchestrator',
        to: 'worker',
        payload: 'Test message',
        timestamp: Date.now(),
        id: 'test-001'
      };

      const formatted = bridge.formatMessage(message);
      expect(formatted).toContain('orchestrator');
      expect(formatted).toContain('worker');
      expect(formatted).toContain('Test message');
    });

    test('should format message with custom options', () => {
      const message = {
        from: 'orchestrator',
        to: 'worker',
        payload: 'Test message',
        timestamp: Date.now(),
        id: 'test-001'
      };

      const formatted = bridge.formatMessage(message, {
        prefix: '🎯',
        color: 'green'
      });

      expect(formatted).toContain('🎯');
    });
  });

  describe('Strategy Selection', () => {
    test('should have correct strategy order for auto mode', () => {
      const bridge = new AgentBridge({ strategy: 'auto' });
      expect(bridge.strategyOrder).toEqual([
        'named-pipe',
        'tty',
        'signal',
        'exec',
        'shared-volume'
      ]);
    });

    test('should use specific strategy when specified', () => {
      const bridge = new AgentBridge({ strategy: 'exec' });
      expect(bridge.strategy).toBe('exec');
    });
  });

  describe('Send Method', () => {
    test('should create proper message structure', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        strategy: 'test',
        success: true
      });

      bridge.strategies['exec'].send = mockSend;
      bridge.strategy = 'exec';

      await bridge.send('test-container', 'Test payload');

      expect(mockSend).toHaveBeenCalled();
      const call = mockSend.mock.calls[0];
      const message = call[1];

      expect(message.from).toBe('orchestrator');
      expect(message.to).toBe('test-container');
      expect(message.payload).toBe('Test payload');
      expect(message.id).toMatch(/^msg_/);
      expect(message.timestamp).toBeDefined();
    });

    test('should handle custom send options', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        strategy: 'test',
        success: true
      });

      bridge.strategies['exec'].send = mockSend;
      bridge.strategy = 'exec';

      await bridge.send('test-container', 'Test', {
        from: 'custom-sender',
        id: 'custom-id'
      });

      const message = mockSend.mock.calls[0][1];
      expect(message.from).toBe('custom-sender');
      expect(message.id).toBe('custom-id');
    });
  });

  describe('Broadcast Method', () => {
    test('should broadcast to multiple targets', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        strategy: 'test',
        success: true
      });

      bridge.strategies['exec'].send = mockSend;
      bridge.strategy = 'exec';

      const targets = ['worker-1', 'worker-2', 'worker-3'];
      const results = await bridge.broadcast(targets, 'Broadcast message');

      expect(results).toHaveLength(3);
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test('should handle broadcast failures gracefully', async () => {
      // Create a bridge with no retries for this test
      const noRetryBridge = new AgentBridge({
        strategy: 'exec',
        retryAttempts: 1,
        debug: false
      });

      let callCount = 0;
      const mockSend = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve({ strategy: 'test', success: true });
      });

      noRetryBridge.strategies['exec'].send = mockSend;

      const targets = ['worker-1', 'worker-2', 'worker-3'];
      const results = await noRetryBridge.broadcast(targets, 'Test');

      const fulfilled = results.filter(r => r.status === 'fulfilled').length;
      const rejected = results.filter(r => r.status === 'rejected').length;

      expect(fulfilled).toBe(2);
      expect(rejected).toBe(1);
    });
  });

  describe('Event Handling', () => {
    test('should emit message events', (done) => {
      const testMessage = {
        from: 'test-sender',
        to: 'test-receiver',
        payload: 'test payload',
        timestamp: Date.now(),
        id: 'test-001'
      };

      bridge.on('message', (message) => {
        expect(message).toEqual(testMessage);
        done();
      });

      bridge.emit('message', testMessage);
    });
  });

  describe('Utility Methods', () => {
    test('should sleep for specified duration', async () => {
      const start = Date.now();
      await bridge._sleep(100);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(90);
      expect(duration).toBeLessThan(150);
    });
  });
});

describe('Individual Strategies', () => {
  describe('ExecStrategy', () => {
    test('should format messages correctly', () => {
      const ExecStrategy = require('../src/strategies/exec');
      const strategy = new ExecStrategy();

      const message = {
        from: 'orchestrator',
        to: 'worker',
        payload: 'Test message',
        timestamp: Date.now(),
        id: 'test-001'
      };

      const formatted = strategy._formatMessage(message);

      expect(formatted).toContain('MESSAGE FROM');
      expect(formatted).toContain('orchestrator');
      expect(formatted).toContain('Test message');
    });
  });
});
