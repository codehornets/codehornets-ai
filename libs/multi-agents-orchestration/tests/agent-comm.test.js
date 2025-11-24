/**
 * Agent Communication Unified API Tests
 *
 * Tests for the unified agent communication API that abstracts
 * over different communication strategies (tmux, pty-wrapper, shared-volume).
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');
const {
  createTestMessage,
  createTestMessages,
  sleep,
  waitFor,
  waitForEvent,
  collectEvents,
  generateSpecialCharsPayload,
  generateLargePayload,
  measureTime,
  benchmark,
  createSpy,
  arraysEqual,
  TEST_CONFIG
} = require('./helpers/test-utils');
const { MockDocker, createOrchestrationMockDocker } = require('./helpers/mock-container');

/**
 * Communication strategy types
 */
const STRATEGY = {
  TMUX: 'tmux',
  PTY_WRAPPER: 'pty-wrapper',
  SHARED_VOLUME: 'shared-volume',
  AUTO: 'auto'
};

/**
 * Mock Strategy Base Class
 */
class MockStrategy extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.options = options;
    this.messages = [];
    this.listening = false;
    this.simulateFailure = false;
    this.failureMessage = '';
    this.latencyMs = options.latencyMs || 5;
  }

  async send(target, message) {
    if (this.simulateFailure) {
      throw new Error(this.failureMessage || `${this.name} strategy failed`);
    }

    await sleep(this.latencyMs);

    this.messages.push({ target, message, timestamp: Date.now() });
    this.emit('sent', { target, message });

    return { success: true, strategy: this.name };
  }

  async listen(containerName) {
    this.listening = true;
    this.containerName = containerName;
    this.emit('listening', containerName);
  }

  async stop() {
    this.listening = false;
  }

  simulateIncoming(message) {
    this.emit('message', message);
  }

  reset() {
    this.messages = [];
    this.simulateFailure = false;
    this.failureMessage = '';
  }
}

/**
 * Unified Agent Communication API
 * Provides a single interface regardless of underlying strategy
 */
class AgentComm extends EventEmitter {
  constructor(options = {}) {
    super();
    this.agentName = options.agentName || 'unknown';
    this.preferredStrategy = options.strategy || STRATEGY.AUTO;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 100;
    this.timeout = options.timeout || 30000;
    this.debug = options.debug || false;

    // Initialize strategies
    this.strategies = new Map();
    this.activeStrategy = null;

    // Message tracking
    this.pendingMessages = new Map();
    this.completedMessages = new Map();
    this.failedMessages = new Map();

    // Statistics
    this.stats = {
      sent: 0,
      received: 0,
      failed: 0,
      retries: 0,
      byStrategy: {}
    };
  }

  /**
   * Register a communication strategy
   */
  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);

    strategy.on('message', (message) => {
      this._handleIncomingMessage(message, name);
    });

    strategy.on('error', (error) => {
      this.emit('strategyError', { strategy: name, error });
    });

    if (!this.stats.byStrategy[name]) {
      this.stats.byStrategy[name] = { sent: 0, failed: 0 };
    }
  }

  /**
   * Initialize communication
   */
  async initialize() {
    if (this.strategies.size === 0) {
      throw new Error('No strategies registered');
    }

    // Select initial strategy
    if (this.preferredStrategy === STRATEGY.AUTO) {
      this.activeStrategy = this._selectBestStrategy();
    } else {
      this.activeStrategy = this.preferredStrategy;
    }

    // Start listening on all strategies
    for (const [name, strategy] of this.strategies) {
      try {
        await strategy.listen(this.agentName);
        if (this.debug) {
          console.log(`[${this.agentName}] Strategy ${name} listening`);
        }
      } catch (error) {
        this.emit('strategyError', { strategy: name, error });
      }
    }

    this.emit('initialized', { activeStrategy: this.activeStrategy });
  }

  /**
   * Send message to another agent
   */
  async send(targetAgent, payload, options = {}) {
    const message = this._createMessage(targetAgent, payload, options);

    this.pendingMessages.set(message.id, {
      message,
      attempts: 0,
      createdAt: Date.now()
    });

    try {
      const result = await this._sendWithRetry(message, options);
      this._recordSuccess(message, result);
      return result;
    } catch (error) {
      this._recordFailure(message, error);
      throw error;
    }
  }

  /**
   * Send message and wait for response
   */
  async request(targetAgent, action, data, timeout = this.timeout) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = this._createMessage(targetAgent, {
      type: 'request',
      action,
      data
    }, { id: messageId, expectResponse: true });

    // Track pending message
    this.pendingMessages.set(messageId, {
      message,
      attempts: 0,
      createdAt: Date.now()
    });

    try {
      const result = await this._sendWithRetry(message, {});
      // Don't call _recordSuccess as we need to keep the pending message for response
      this.stats.sent++;
      return this._waitForResponse(messageId, timeout);
    } catch (error) {
      this._recordFailure(message, error);
      throw error;
    }
  }

  /**
   * Broadcast to multiple agents
   */
  async broadcast(agents, payload, options = {}) {
    const results = await Promise.allSettled(
      agents.map(agent => this.send(agent, payload, options))
    );

    const summary = {
      total: agents.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((r, i) => ({
        agent: agents[i],
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : null,
        error: r.status === 'rejected' ? r.reason.message : null
      }))
    };

    this.emit('broadcast', summary);
    return summary;
  }

  /**
   * Send with retry logic
   */
  async _sendWithRetry(message, options = {}) {
    let currentStrategy = options.strategy || this.activeStrategy;
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      const handler = this.strategies.get(currentStrategy);

      if (!handler) {
        throw new Error(`Strategy not found: ${currentStrategy}`);
      }

      const pending = this.pendingMessages.get(message.id);
      if (pending) pending.attempts = attempt;

      try {
        const result = await handler.send(message.to, message);
        return { ...result, messageId: message.id, attempt, strategy: currentStrategy };
      } catch (error) {
        lastError = error;
        this.stats.retries++;

        if (attempt < this.retryAttempts) {
          await sleep(this.retryDelay * attempt);

          // Try fallback strategy if available
          if (options.fallback !== false) {
            const fallback = this._selectFallbackStrategy(currentStrategy);
            if (fallback && fallback !== currentStrategy) {
              if (this.debug) {
                console.log(`[${this.agentName}] Trying fallback: ${fallback}`);
              }
              currentStrategy = fallback;
            }
          }
        }
      }
    }

    throw lastError;
  }

  /**
   * Create message object
   */
  _createMessage(targetAgent, payload, options = {}) {
    return {
      id: options.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.agentName,
      to: targetAgent,
      payload,
      timestamp: Date.now(),
      type: options.type || 'message',
      expectResponse: options.expectResponse || false
    };
  }

  /**
   * Handle incoming message
   */
  _handleIncomingMessage(message, strategyName) {
    this.stats.received++;

    // Check if this is a response to a pending request
    if (message.type === 'response' && message.replyTo) {
      const pending = this.pendingMessages.get(message.replyTo);
      if (pending && pending.responseHandler) {
        pending.responseHandler.resolve(message);
        this.pendingMessages.delete(message.replyTo);
        return;
      }
    }

    this.emit('message', message);
  }

  /**
   * Wait for response to a message
   */
  _waitForResponse(messageId, timeout) {
    return new Promise((resolve, reject) => {
      const pending = this.pendingMessages.get(messageId);
      if (!pending) {
        reject(new Error(`Message not found: ${messageId}`));
        return;
      }

      const timer = setTimeout(() => {
        pending.responseHandler = null;
        reject(new Error(`Response timeout for ${messageId}`));
      }, timeout);

      pending.responseHandler = {
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      };
    });
  }

  /**
   * Select best available strategy
   */
  _selectBestStrategy() {
    // Priority order: pty-wrapper > tmux > shared-volume
    const priority = [STRATEGY.PTY_WRAPPER, STRATEGY.TMUX, STRATEGY.SHARED_VOLUME];

    for (const name of priority) {
      if (this.strategies.has(name)) {
        return name;
      }
    }

    // Return first available
    return this.strategies.keys().next().value;
  }

  /**
   * Select fallback strategy
   */
  _selectFallbackStrategy(currentStrategy) {
    const available = Array.from(this.strategies.keys())
      .filter(s => s !== currentStrategy);
    return available[0] || null;
  }

  /**
   * Record successful send
   */
  _recordSuccess(message, result) {
    this.stats.sent++;
    if (this.stats.byStrategy[result.strategy]) {
      this.stats.byStrategy[result.strategy].sent++;
    }

    this.completedMessages.set(message.id, {
      message,
      result,
      completedAt: Date.now()
    });

    this.pendingMessages.delete(message.id);
    this.emit('sent', { message, result });
  }

  /**
   * Record failed send
   */
  _recordFailure(message, error) {
    this.stats.failed++;

    this.failedMessages.set(message.id, {
      message,
      error: error.message,
      failedAt: Date.now()
    });

    this.pendingMessages.delete(message.id);
    this.emit('failed', { message, error });
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Switch active strategy
   */
  setActiveStrategy(strategyName) {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Strategy not available: ${strategyName}`);
    }
    this.activeStrategy = strategyName;
    this.emit('strategyChanged', strategyName);
  }

  /**
   * Stop communication
   */
  async stop() {
    for (const strategy of this.strategies.values()) {
      await strategy.stop();
    }

    this.emit('stopped');
  }
}

// =============================================================================
// Test Suites
// =============================================================================

describe('AgentComm', () => {
  let comm;
  let tmuxStrategy;
  let ptyStrategy;
  let volumeStrategy;

  beforeEach(() => {
    comm = new AgentComm({ agentName: 'test-agent' });
    tmuxStrategy = new MockStrategy('tmux', { latencyMs: 5 });
    ptyStrategy = new MockStrategy('pty-wrapper', { latencyMs: 3 });
    volumeStrategy = new MockStrategy('shared-volume', { latencyMs: 10 });

    comm.registerStrategy(STRATEGY.TMUX, tmuxStrategy);
    comm.registerStrategy(STRATEGY.PTY_WRAPPER, ptyStrategy);
    comm.registerStrategy(STRATEGY.SHARED_VOLUME, volumeStrategy);
  });

  afterEach(async () => {
    await comm.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const c = new AgentComm();
      assert.strictEqual(c.preferredStrategy, STRATEGY.AUTO);
      assert.strictEqual(c.retryAttempts, 3);
    });

    it('should require at least one strategy', async () => {
      const c = new AgentComm();
      await assert.rejects(
        () => c.initialize(),
        { message: /No strategies registered/ }
      );
    });

    it('should select best strategy in auto mode', async () => {
      await comm.initialize();
      // PTY wrapper has priority
      assert.strictEqual(comm.activeStrategy, STRATEGY.PTY_WRAPPER);
    });

    it('should use specified strategy if set', async () => {
      comm.preferredStrategy = STRATEGY.TMUX;
      await comm.initialize();
      assert.strictEqual(comm.activeStrategy, STRATEGY.TMUX);
    });

    it('should emit initialized event', async () => {
      const spy = createSpy();
      comm.on('initialized', spy);

      await comm.initialize();

      assert.strictEqual(spy.callCount(), 1);
    });

    it('should start listening on all strategies', async () => {
      await comm.initialize();

      assert.ok(tmuxStrategy.listening);
      assert.ok(ptyStrategy.listening);
      assert.ok(volumeStrategy.listening);
    });
  });

  describe('Sending Messages', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should send simple message', async () => {
      const result = await comm.send('target-agent', 'Hello!');

      assert.ok(result.success);
      assert.ok(result.messageId);
      assert.strictEqual(result.strategy, STRATEGY.PTY_WRAPPER);
    });

    it('should send object payload', async () => {
      const payload = { action: 'test', data: { value: 42 } };
      const result = await comm.send('target-agent', payload);

      assert.ok(result.success);
    });

    it('should track message statistics', async () => {
      await comm.send('agent1', 'msg1');
      await comm.send('agent2', 'msg2');

      const stats = comm.getStats();
      assert.strictEqual(stats.sent, 2);
    });

    it('should emit sent event', async () => {
      const spy = createSpy();
      comm.on('sent', spy);

      await comm.send('target', 'test');

      assert.strictEqual(spy.callCount(), 1);
    });

    it('should handle special characters', async () => {
      const payload = generateSpecialCharsPayload();
      const result = await comm.send('target', payload);

      assert.ok(result.success);
    });

    it('should handle large payloads', async () => {
      const payload = generateLargePayload(5); // 5KB
      const result = await comm.send('target', payload);

      assert.ok(result.success);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const originalSend = ptyStrategy.send.bind(ptyStrategy);
      ptyStrategy.send = async (target, message) => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return originalSend(target, message);
      };

      const result = await comm.send('target', 'test');

      assert.ok(result.success);
      assert.ok(attempts >= 2, `Expected at least 2 attempts, got ${attempts}`);
    });

    it('should track retry count', async () => {
      ptyStrategy.simulateFailure = true;
      tmuxStrategy.simulateFailure = true;
      volumeStrategy.simulateFailure = true;

      try {
        await comm.send('target', 'test');
      } catch {
        // Expected
      }

      const stats = comm.getStats();
      assert.ok(stats.retries > 0);
    });

    it('should use fallback strategy', async () => {
      ptyStrategy.simulateFailure = true;
      ptyStrategy.failureMessage = 'PTY failed';

      const result = await comm.send('target', 'test', { fallback: true });

      // Should succeed with fallback strategy
      assert.ok(result.success);
      assert.notStrictEqual(result.strategy, STRATEGY.PTY_WRAPPER);
    });

    it('should fail after all retries exhausted', async () => {
      ptyStrategy.simulateFailure = true;
      tmuxStrategy.simulateFailure = true;
      volumeStrategy.simulateFailure = true;

      await assert.rejects(
        () => comm.send('target', 'test'),
        Error
      );

      const stats = comm.getStats();
      assert.strictEqual(stats.failed, 1);
    });
  });

  describe('Broadcasting', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should broadcast to multiple agents', async () => {
      const result = await comm.broadcast(['agent1', 'agent2', 'agent3'], 'broadcast msg');

      assert.strictEqual(result.total, 3);
      assert.strictEqual(result.success, 3);
      assert.strictEqual(result.failed, 0);
    });

    it('should report partial failures', async () => {
      // Make ALL strategies fail for specific target to ensure failure
      const makeFailForAgent2 = (strategy) => {
        const originalSend = strategy.send.bind(strategy);
        strategy.send = async (target, msg) => {
          if (target === 'agent2') {
            throw new Error('Agent2 unavailable');
          }
          return originalSend(target, msg);
        };
      };

      makeFailForAgent2(ptyStrategy);
      makeFailForAgent2(tmuxStrategy);
      makeFailForAgent2(volumeStrategy);

      const result = await comm.broadcast(['agent1', 'agent2', 'agent3'], 'test');

      assert.strictEqual(result.total, 3);
      assert.strictEqual(result.success, 2);
      assert.strictEqual(result.failed, 1);
    });

    it('should emit broadcast event', async () => {
      const spy = createSpy();
      comm.on('broadcast', spy);

      await comm.broadcast(['agent1', 'agent2'], 'test');

      assert.strictEqual(spy.callCount(), 1);
      assert.strictEqual(spy.calls[0].args[0].total, 2);
    });

    it('should execute broadcasts in parallel', async () => {
      // Set latency to measure parallelism
      ptyStrategy.latencyMs = 50;

      const { duration } = await measureTime(async () => {
        await comm.broadcast(['a1', 'a2', 'a3', 'a4', 'a5'], 'test');
      });

      // If parallel, should be ~50ms, not ~250ms
      assert.ok(duration < 150, `Broadcast took ${duration}ms, expected parallel execution`);
    });
  });

  describe('Request-Response', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should send request and wait for response', async () => {
      // Simulate response
      const requestPromise = comm.request('target', 'getStatus', {});

      // Get the message ID from pending
      const [messageId] = comm.pendingMessages.keys();

      // Simulate response after short delay
      setImmediate(() => {
        ptyStrategy.simulateIncoming({
          type: 'response',
          replyTo: messageId,
          data: { status: 'ok' }
        });
      });

      const response = await requestPromise;
      assert.strictEqual(response.data.status, 'ok');
    });

    it('should timeout if no response', async () => {
      comm.timeout = 100;

      await assert.rejects(
        () => comm.request('target', 'slowAction', {}, 100),
        { message: /Response timeout/ }
      );
    });
  });

  describe('Incoming Messages', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should emit message event for incoming', async () => {
      const spy = createSpy();
      comm.on('message', spy);

      ptyStrategy.simulateIncoming({
        type: 'task',
        data: 'do something'
      });

      await sleep(10);

      assert.strictEqual(spy.callCount(), 1);
    });

    it('should track received count', async () => {
      ptyStrategy.simulateIncoming({ type: 'test1' });
      ptyStrategy.simulateIncoming({ type: 'test2' });
      tmuxStrategy.simulateIncoming({ type: 'test3' });

      await sleep(10);

      const stats = comm.getStats();
      assert.strictEqual(stats.received, 3);
    });
  });

  describe('Strategy Switching', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should switch active strategy', () => {
      comm.setActiveStrategy(STRATEGY.TMUX);
      assert.strictEqual(comm.activeStrategy, STRATEGY.TMUX);
    });

    it('should emit strategyChanged event', () => {
      const spy = createSpy();
      comm.on('strategyChanged', spy);

      comm.setActiveStrategy(STRATEGY.TMUX);

      assert.strictEqual(spy.callCount(), 1);
      assert.strictEqual(spy.calls[0].args[0], STRATEGY.TMUX);
    });

    it('should throw for unavailable strategy', () => {
      assert.throws(
        () => comm.setActiveStrategy('nonexistent'),
        { message: /Strategy not available/ }
      );
    });

    it('should use new strategy after switch', async () => {
      comm.setActiveStrategy(STRATEGY.TMUX);

      const result = await comm.send('target', 'test');

      assert.strictEqual(result.strategy, STRATEGY.TMUX);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should emit failed event on send failure', async () => {
      ptyStrategy.simulateFailure = true;
      tmuxStrategy.simulateFailure = true;
      volumeStrategy.simulateFailure = true;

      const spy = createSpy();
      comm.on('failed', spy);

      try {
        await comm.send('target', 'test');
      } catch {
        // Expected
      }

      assert.strictEqual(spy.callCount(), 1);
    });

    it('should emit strategyError on strategy issue', async () => {
      const spy = createSpy();
      comm.on('strategyError', spy);

      ptyStrategy.emit('error', new Error('Strategy crashed'));

      assert.strictEqual(spy.callCount(), 1);
    });

    it('should track failed messages', async () => {
      ptyStrategy.simulateFailure = true;
      tmuxStrategy.simulateFailure = true;
      volumeStrategy.simulateFailure = true;

      try {
        await comm.send('target', 'test');
      } catch {
        // Expected
      }

      assert.strictEqual(comm.failedMessages.size, 1);
    });
  });

  describe('Stop', () => {
    beforeEach(async () => {
      await comm.initialize();
    });

    it('should stop all strategies', async () => {
      await comm.stop();

      assert.ok(!tmuxStrategy.listening);
      assert.ok(!ptyStrategy.listening);
      assert.ok(!volumeStrategy.listening);
    });

    it('should emit stopped event', async () => {
      const spy = createSpy();
      comm.on('stopped', spy);

      await comm.stop();

      assert.strictEqual(spy.callCount(), 1);
    });
  });
});

describe('Strategy Priority', () => {
  it('should prefer pty-wrapper over tmux', async () => {
    const comm = new AgentComm({ agentName: 'test' });
    comm.registerStrategy(STRATEGY.TMUX, new MockStrategy('tmux'));
    comm.registerStrategy(STRATEGY.PTY_WRAPPER, new MockStrategy('pty-wrapper'));

    await comm.initialize();

    assert.strictEqual(comm.activeStrategy, STRATEGY.PTY_WRAPPER);
    await comm.stop();
  });

  it('should prefer tmux over shared-volume', async () => {
    const comm = new AgentComm({ agentName: 'test' });
    comm.registerStrategy(STRATEGY.SHARED_VOLUME, new MockStrategy('shared-volume'));
    comm.registerStrategy(STRATEGY.TMUX, new MockStrategy('tmux'));

    await comm.initialize();

    assert.strictEqual(comm.activeStrategy, STRATEGY.TMUX);
    await comm.stop();
  });

  it('should use only available strategy', async () => {
    const comm = new AgentComm({ agentName: 'test' });
    comm.registerStrategy(STRATEGY.SHARED_VOLUME, new MockStrategy('shared-volume'));

    await comm.initialize();

    assert.strictEqual(comm.activeStrategy, STRATEGY.SHARED_VOLUME);
    await comm.stop();
  });
});

// Export for use in integration tests
module.exports = {
  AgentComm,
  MockStrategy,
  STRATEGY
};
