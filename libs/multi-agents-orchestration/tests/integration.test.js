/**
 * Integration Tests for Multi-Agent Communication
 *
 * End-to-end tests that verify the complete communication flow
 * between orchestrator and worker agents.
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
  TEST_CONFIG,
  skipIf,
  isRunningInDocker
} = require('./helpers/test-utils');
const { MockDocker, createOrchestrationMockDocker, MockContainer } = require('./helpers/mock-container');

/**
 * Multi-Agent Test Environment
 * Simulates the complete orchestration system for testing
 */
class TestEnvironment extends EventEmitter {
  constructor() {
    super();
    this.docker = createOrchestrationMockDocker();
    this.agents = new Map();
    this.messageLog = [];
    this.running = false;
  }

  /**
   * Start test environment
   */
  async start() {
    // Create agent simulators
    this.agents.set('orchestrator', new AgentSimulator('orchestrator', this));
    this.agents.set('marie', new AgentSimulator('marie', this));
    this.agents.set('anga', new AgentSimulator('anga', this));
    this.agents.set('fabien', new AgentSimulator('fabien', this));

    // Start all agents
    for (const agent of this.agents.values()) {
      await agent.start();
    }

    this.running = true;
    this.emit('started');
  }

  /**
   * Stop test environment
   */
  async stop() {
    for (const agent of this.agents.values()) {
      await agent.stop();
    }
    this.running = false;
    this.emit('stopped');
  }

  /**
   * Get agent by name
   */
  getAgent(name) {
    return this.agents.get(name);
  }

  /**
   * Send message between agents
   */
  async routeMessage(from, to, message) {
    const targetAgent = this.agents.get(to);
    if (!targetAgent) {
      throw new Error(`Agent not found: ${to}`);
    }

    // Simulate network delay
    await sleep(Math.random() * 10);

    // Log message
    this.messageLog.push({
      from,
      to,
      message,
      timestamp: Date.now()
    });

    // Deliver to target
    targetAgent.receiveMessage({ ...message, from });

    this.emit('messageRouted', { from, to, message });

    return { delivered: true };
  }

  /**
   * Get message log
   */
  getMessageLog() {
    return [...this.messageLog];
  }

  /**
   * Clear message log
   */
  clearLog() {
    this.messageLog = [];
  }

  /**
   * Simulate agent crash
   */
  crashAgent(name) {
    const agent = this.agents.get(name);
    if (agent) {
      agent.simulateCrash();
    }
  }

  /**
   * Simulate agent recovery
   */
  async recoverAgent(name) {
    const agent = this.agents.get(name);
    if (agent) {
      await agent.recover();
    }
  }
}

/**
 * Agent Simulator
 * Simulates a single agent in the orchestration system
 */
class AgentSimulator extends EventEmitter {
  constructor(name, environment) {
    super();
    this.name = name;
    this.env = environment;
    this.inbox = [];
    this.outbox = [];
    this.status = 'stopped';
    this.tasksReceived = [];
    this.tasksCompleted = [];
    this.messageHandlers = new Map();
    this.autoRespond = true;
    this.responseDelay = 10;
  }

  /**
   * Start agent
   */
  async start() {
    this.status = 'running';
    this.emit('started');
  }

  /**
   * Stop agent
   */
  async stop() {
    this.status = 'stopped';
    this.emit('stopped');
  }

  /**
   * Send message to another agent
   */
  async send(targetAgent, payload) {
    if (this.status !== 'running') {
      throw new Error(`Agent ${this.name} is not running`);
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.name,
      to: targetAgent,
      payload,
      timestamp: Date.now()
    };

    this.outbox.push(message);
    await this.env.routeMessage(this.name, targetAgent, message);

    return { success: true, messageId: message.id };
  }

  /**
   * Receive message
   */
  receiveMessage(message) {
    if (this.status !== 'running') {
      return; // Drop message if not running
    }

    this.inbox.push(message);
    this.emit('message', message);

    // Handle message based on type
    const handler = this.messageHandlers.get(message.payload?.type);
    if (handler) {
      handler(message);
    } else if (this.autoRespond && message.payload?.type === 'task') {
      this._handleTask(message);
    }
  }

  /**
   * Handle task message
   */
  async _handleTask(message) {
    this.tasksReceived.push(message);

    await sleep(this.responseDelay);

    // Simulate task completion
    const result = {
      type: 'result',
      taskId: message.payload.taskId || message.id,
      status: 'completed',
      output: `Task completed by ${this.name}`,
      completedAt: Date.now()
    };

    this.tasksCompleted.push(result);

    // Send result back
    await this.send(message.from, result);
  }

  /**
   * Register message handler
   */
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Simulate crash
   */
  simulateCrash() {
    this.status = 'crashed';
    this.emit('crashed');
  }

  /**
   * Recover from crash
   */
  async recover() {
    this.status = 'running';
    this.emit('recovered');
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      status: this.status,
      inbox: this.inbox.length,
      outbox: this.outbox.length,
      tasksReceived: this.tasksReceived.length,
      tasksCompleted: this.tasksCompleted.length
    };
  }
}

// =============================================================================
// Integration Test Suites
// =============================================================================

describe('Integration Tests', () => {
  let env;

  before(async () => {
    env = new TestEnvironment();
    await env.start();
  });

  after(async () => {
    await env.stop();
  });

  afterEach(() => {
    env.clearLog();
  });

  describe('Basic Message Flow', () => {
    it('should send message from orchestrator to worker', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const result = await orchestrator.send('anga', { type: 'ping', data: 'test' });

      assert.ok(result.success);

      const anga = env.getAgent('anga');
      assert.strictEqual(anga.inbox.length, 1);
      assert.strictEqual(anga.inbox[0].payload.type, 'ping');
    });

    it('should send message from worker to orchestrator', async () => {
      const marie = env.getAgent('marie');
      await marie.send('orchestrator', { type: 'status', status: 'ready' });

      const orchestrator = env.getAgent('orchestrator');
      assert.ok(orchestrator.inbox.some(m => m.from === 'marie'));
    });

    it('should route messages between workers', async () => {
      const anga = env.getAgent('anga');
      await anga.send('fabien', { type: 'request', action: 'help' });

      const fabien = env.getAgent('fabien');
      assert.ok(fabien.inbox.some(m => m.from === 'anga'));
    });

    it('should preserve message content', async () => {
      const originalPayload = {
        type: 'complex',
        data: { nested: { value: 42 } },
        array: [1, 2, 3]
      };

      await env.getAgent('orchestrator').send('marie', originalPayload);

      const marie = env.getAgent('marie');
      const received = marie.inbox[marie.inbox.length - 1];
      assert.deepStrictEqual(received.payload, originalPayload);
    });
  });

  describe('Task Delegation', () => {
    it('should delegate task and receive result', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const anga = env.getAgent('anga');

      // Set up result listener
      const resultPromise = new Promise(resolve => {
        orchestrator.onMessage('result', resolve);
      });

      // Send task
      await orchestrator.send('anga', {
        type: 'task',
        taskId: 'task-001',
        action: 'review code',
        priority: 'high'
      });

      // Wait for result
      const result = await resultPromise;

      assert.strictEqual(result.payload.status, 'completed');
      assert.strictEqual(result.payload.taskId, 'task-001');
    });

    it('should handle multiple concurrent tasks', async () => {
      const orchestrator = env.getAgent('orchestrator');

      // Clear any previous messages
      orchestrator.messageHandlers.clear();

      // Collect results
      const results = [];
      orchestrator.onMessage('result', (msg) => results.push(msg));

      // Send tasks to all workers
      await Promise.all([
        orchestrator.send('marie', { type: 'task', taskId: 'task-m1' }),
        orchestrator.send('anga', { type: 'task', taskId: 'task-a1' }),
        orchestrator.send('fabien', { type: 'task', taskId: 'task-f1' })
      ]);

      // Wait for all results
      await waitFor(() => results.length >= 3, 5000);

      assert.strictEqual(results.length, 3);
      assert.ok(results.some(r => r.from === 'marie'));
      assert.ok(results.some(r => r.from === 'anga'));
      assert.ok(results.some(r => r.from === 'fabien'));
    });

    it('should track task completion in workers', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const anga = env.getAgent('anga');

      const initialCompleted = anga.tasksCompleted.length;

      await orchestrator.send('anga', { type: 'task', taskId: 'track-test' });

      await waitFor(() => anga.tasksCompleted.length > initialCompleted, 1000);

      assert.ok(anga.tasksCompleted.some(t => t.taskId === 'track-test'));
    });
  });

  describe('Broadcast Communication', () => {
    it('should broadcast to all workers', async () => {
      const orchestrator = env.getAgent('orchestrator');

      // Clear previous messages
      for (const name of ['marie', 'anga', 'fabien']) {
        env.getAgent(name).inbox = [];
      }

      // Send to all workers
      const targets = ['marie', 'anga', 'fabien'];
      await Promise.all(
        targets.map(t => orchestrator.send(t, { type: 'announcement', message: 'System update' }))
      );

      // Verify all received
      for (const name of targets) {
        const agent = env.getAgent(name);
        assert.ok(agent.inbox.some(m => m.payload.type === 'announcement'));
      }
    });

    it('should track all broadcast messages in log', async () => {
      env.clearLog();
      const orchestrator = env.getAgent('orchestrator');

      await Promise.all([
        orchestrator.send('marie', { type: 'broadcast' }),
        orchestrator.send('anga', { type: 'broadcast' }),
        orchestrator.send('fabien', { type: 'broadcast' })
      ]);

      const log = env.getMessageLog();
      assert.strictEqual(log.filter(m => m.message.payload.type === 'broadcast').length, 3);
    });
  });

  describe('Special Characters and Large Messages', () => {
    it('should handle special characters in messages', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const anga = env.getAgent('anga');
      anga.inbox = [];

      const specialPayload = generateSpecialCharsPayload();
      await orchestrator.send('anga', { type: 'text', content: specialPayload });

      await waitFor(() => anga.inbox.length > 0, 1000);

      const received = anga.inbox[0].payload;
      assert.strictEqual(received.content, specialPayload);
    });

    it('should handle messages larger than 1KB', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const marie = env.getAgent('marie');
      marie.inbox = [];

      const largeContent = generateLargePayload(5); // 5KB
      await orchestrator.send('marie', { type: 'large', content: largeContent });

      await waitFor(() => marie.inbox.length > 0, 1000);

      const received = marie.inbox[0].payload;
      assert.strictEqual(received.content.length, largeContent.length);
    });

    it('should handle Unicode characters', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const fabien = env.getAgent('fabien');
      fabien.inbox = [];

      const unicodePayload = {
        greeting: 'Hello World',
        japanese: 'Japanese text',
        emoji: 'Emoji text',
        arabic: 'Arabic text'
      };

      await orchestrator.send('fabien', { type: 'unicode', ...unicodePayload });

      await waitFor(() => fabien.inbox.length > 0, 1000);

      const received = fabien.inbox[0].payload;
      assert.strictEqual(received.greeting, unicodePayload.greeting);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid sequential messages', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const anga = env.getAgent('anga');
      const initialCount = anga.inbox.length;

      for (let i = 0; i < 20; i++) {
        await orchestrator.send('anga', { type: 'seq', index: i });
      }

      await waitFor(() => anga.inbox.length >= initialCount + 20, 2000);

      assert.ok(anga.inbox.length >= initialCount + 20);
    });

    it('should handle parallel messages to same agent', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const anga = env.getAgent('anga');
      const initialCount = anga.inbox.length;

      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          orchestrator.send('anga', { type: 'parallel', index: i })
        )
      );

      await waitFor(() => anga.inbox.length >= initialCount + 10, 2000);

      assert.ok(anga.inbox.length >= initialCount + 10);
    });

    it('should handle messages to multiple agents simultaneously', async () => {
      const orchestrator = env.getAgent('orchestrator');

      // Clear inboxes
      ['marie', 'anga', 'fabien'].forEach(name => {
        env.getAgent(name).inbox = [];
      });

      const { duration } = await measureTime(async () => {
        await Promise.all([
          orchestrator.send('marie', { type: 'multi', target: 'marie' }),
          orchestrator.send('anga', { type: 'multi', target: 'anga' }),
          orchestrator.send('fabien', { type: 'multi', target: 'fabien' })
        ]);
      });

      // Verify all received
      for (const name of ['marie', 'anga', 'fabien']) {
        const agent = env.getAgent(name);
        assert.ok(agent.inbox.some(m => m.payload.target === name));
      }

      // Should execute in parallel (under 100ms with 10ms delay per message)
      assert.ok(duration < 100, `Parallel messages took ${duration}ms`);
    });
  });

  describe('Agent Crash Recovery', () => {
    it('should detect agent crash', async () => {
      const marie = env.getAgent('marie');
      const crashSpy = createSpy();
      marie.on('crashed', crashSpy);

      env.crashAgent('marie');

      assert.strictEqual(crashSpy.callCount(), 1);
      assert.strictEqual(marie.status, 'crashed');
    });

    it('should drop messages to crashed agent', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const marie = env.getAgent('marie');
      const inboxCount = marie.inbox.length;

      env.crashAgent('marie');

      // Message should be routed but dropped
      await orchestrator.send('marie', { type: 'test' });

      // Inbox should not grow
      assert.strictEqual(marie.inbox.length, inboxCount);
    });

    it('should recover agent and resume messaging', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const marie = env.getAgent('marie');

      // Crash and recover
      env.crashAgent('marie');
      await env.recoverAgent('marie');

      assert.strictEqual(marie.status, 'running');

      // Should be able to receive messages again
      const inboxCount = marie.inbox.length;
      await orchestrator.send('marie', { type: 'afterRecovery' });

      await waitFor(() => marie.inbox.length > inboxCount, 1000);

      assert.ok(marie.inbox.some(m => m.payload.type === 'afterRecovery'));
    });

    it('should fail gracefully when sending to non-running agent', async () => {
      const marie = env.getAgent('marie');
      marie.status = 'stopped';

      await assert.rejects(
        () => marie.send('orchestrator', { type: 'test' }),
        { message: /not running/ }
      );

      // Restore
      marie.status = 'running';
    });
  });

  describe('Message Logging and Tracing', () => {
    it('should log all routed messages', async () => {
      env.clearLog();

      const orchestrator = env.getAgent('orchestrator');
      await orchestrator.send('anga', { type: 'logged' });

      const log = env.getMessageLog();
      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0].from, 'orchestrator');
      assert.strictEqual(log[0].to, 'anga');
    });

    it('should include timestamps in log', async () => {
      env.clearLog();
      const before = Date.now();

      await env.getAgent('orchestrator').send('marie', { type: 'timed' });

      const after = Date.now();
      const log = env.getMessageLog();

      assert.ok(log[0].timestamp >= before);
      assert.ok(log[0].timestamp <= after);
    });

    it('should emit events for message routing', async () => {
      const routeSpy = createSpy();
      env.on('messageRouted', routeSpy);

      await env.getAgent('orchestrator').send('fabien', { type: 'event' });

      assert.strictEqual(routeSpy.callCount(), 1);
      assert.strictEqual(routeSpy.calls[0].args[0].from, 'orchestrator');
      assert.strictEqual(routeSpy.calls[0].args[0].to, 'fabien');

      env.off('messageRouted', routeSpy);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle slow task completion', async () => {
      const orchestrator = env.getAgent('orchestrator');
      const anga = env.getAgent('anga');

      // Make anga respond slowly
      anga.responseDelay = 500;

      const resultPromise = new Promise(resolve => {
        orchestrator.onMessage('result', resolve);
      });

      await orchestrator.send('anga', { type: 'task', taskId: 'slow-task' });

      const result = await resultPromise;
      assert.strictEqual(result.payload.taskId, 'slow-task');

      // Restore
      anga.responseDelay = 10;
    });
  });
});

describe('Docker Mock Integration', () => {
  let docker;

  beforeEach(() => {
    docker = createOrchestrationMockDocker();
  });

  it('should list all orchestration containers', async () => {
    const containers = await docker.listContainers();

    assert.strictEqual(containers.length, 4);
    assert.ok(containers.some(c => c.Names[0] === '/codehornets-orchestrator'));
    assert.ok(containers.some(c => c.Names[0] === '/codehornets-worker-marie'));
    assert.ok(containers.some(c => c.Names[0] === '/codehornets-worker-anga'));
    assert.ok(containers.some(c => c.Names[0] === '/codehornets-worker-fabien'));
  });

  it('should get container info', async () => {
    const orchestrator = docker.getContainer('codehornets-orchestrator');
    const info = await orchestrator.inspect();

    assert.ok(info.State.Running);
    assert.ok(info.Config.Tty);
    assert.ok(info.Config.OpenStdin);
  });

  it('should execute commands in container', async () => {
    const orchestrator = docker.getContainer('codehornets-orchestrator');
    const exec = await orchestrator.exec({
      Cmd: ['echo', 'hello'],
      AttachStdout: true
    });

    const stream = await exec.start();
    assert.ok(exec.started);
    assert.ok(orchestrator.getExecutedCommands().some(c => c.cmd.includes('echo')));
  });

  it('should simulate container crash', async () => {
    const anga = docker.getContainer('codehornets-worker-anga');
    const crashSpy = createSpy();
    anga.on('crash', crashSpy);

    anga.simulateCrash();

    assert.strictEqual(crashSpy.callCount(), 1);
    const info = await anga.inspect();
    assert.ok(!info.State.Running);
    assert.strictEqual(info.State.ExitCode, 1);
  });

  it('should simulate container restart', async () => {
    const marie = docker.getContainer('codehornets-worker-marie');
    const restartSpy = createSpy();
    marie.on('restart', restartSpy);

    marie.simulateRestart();

    await waitFor(() => restartSpy.callCount() > 0, 500);

    assert.strictEqual(restartSpy.callCount(), 1);
    const info = await marie.inspect();
    assert.ok(info.State.Running);
  });

  it('should return error for non-existent container', async () => {
    const notFound = docker.getContainer('nonexistent-container');

    await assert.rejects(
      () => notFound.inspect(),
      { statusCode: 404 }
    );
  });
});

// Export for external use
module.exports = {
  TestEnvironment,
  AgentSimulator
};
