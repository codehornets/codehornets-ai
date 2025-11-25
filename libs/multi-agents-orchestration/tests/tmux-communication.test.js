/**
 * tmux Communication Strategy Tests
 *
 * Tests for the tmux send-keys approach to inter-agent communication.
 * This approach uses tmux sessions to send commands to containerized agents.
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');
const { spawn, exec } = require('child_process');
const {
  createTestMessage,
  sleep,
  waitFor,
  generateSpecialCharsPayload,
  generateLargePayload,
  measureTime,
  createSpy,
  TEST_CONFIG
} = require('./helpers/test-utils');
const { MockDocker, createOrchestrationMockDocker } = require('./helpers/mock-container');

/**
 * Mock tmux command executor for unit testing
 */
class MockTmuxExecutor extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.commandHistory = [];
    this.simulateFailure = false;
    this.failureMessage = '';
  }

  /**
   * Create a mock tmux session
   */
  createSession(name) {
    if (!this.sessions.has(name)) {
      this.sessions.set(name, {
        name,
        panes: [{ id: 0, content: '' }],
        created: Date.now()
      });
    }
    return this.sessions.get(name);
  }

  /**
   * Check if session exists
   */
  hasSession(name) {
    return this.sessions.has(name);
  }

  /**
   * Execute tmux command
   */
  async execute(command, args = []) {
    this.commandHistory.push({ command, args, timestamp: Date.now() });

    if (this.simulateFailure) {
      throw new Error(this.failureMessage || 'Simulated tmux failure');
    }

    // Simulate command processing
    const fullCommand = `tmux ${command} ${args.join(' ')}`;

    switch (command) {
      case 'send-keys':
        return this._handleSendKeys(args);
      case 'capture-pane':
        return this._handleCapturePane(args);
      case 'list-sessions':
        return this._handleListSessions();
      case 'new-session':
        return this._handleNewSession(args);
      case 'kill-session':
        return this._handleKillSession(args);
      default:
        return { stdout: '', stderr: '' };
    }
  }

  _handleSendKeys(args) {
    const targetIndex = args.indexOf('-t');
    const target = targetIndex >= 0 ? args[targetIndex + 1] : null;
    const keys = args.filter((_, i) => i !== targetIndex && i !== targetIndex + 1);

    if (target) {
      const session = this.sessions.get(target);
      if (session) {
        session.panes[0].content += keys.join('');
        this.emit('send-keys', { target, keys: keys.join('') });
      }
    }

    return { stdout: '', stderr: '' };
  }

  _handleCapturePane(args) {
    const targetIndex = args.indexOf('-t');
    const target = targetIndex >= 0 ? args[targetIndex + 1] : null;

    if (target && this.sessions.has(target)) {
      return { stdout: this.sessions.get(target).panes[0].content, stderr: '' };
    }

    return { stdout: '', stderr: '' };
  }

  _handleListSessions() {
    const sessions = Array.from(this.sessions.keys()).join('\n');
    return { stdout: sessions, stderr: '' };
  }

  _handleNewSession(args) {
    const nameIndex = args.indexOf('-s');
    const name = nameIndex >= 0 ? args[nameIndex + 1] : `session_${Date.now()}`;
    this.createSession(name);
    return { stdout: '', stderr: '' };
  }

  _handleKillSession(args) {
    const targetIndex = args.indexOf('-t');
    const target = targetIndex >= 0 ? args[targetIndex + 1] : null;

    if (target) {
      this.sessions.delete(target);
    }

    return { stdout: '', stderr: '' };
  }

  reset() {
    this.sessions.clear();
    this.commandHistory = [];
    this.simulateFailure = false;
    this.failureMessage = '';
  }
}

/**
 * TmuxCommunicator class for testing
 * This simulates the tmux-based communication approach
 */
class TmuxCommunicator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.executor = options.executor || new MockTmuxExecutor();
    this.sessionPrefix = options.sessionPrefix || 'agent';
    this.pendingMessages = new Map();
    this.messageTimeout = options.messageTimeout || 30000;
    this.debug = options.debug || false;
  }

  /**
   * Initialize communicator and ensure sessions exist
   */
  async initialize(agents = []) {
    for (const agent of agents) {
      const sessionName = this._getSessionName(agent);
      if (!this.executor.hasSession(sessionName)) {
        await this.executor.execute('new-session', ['-d', '-s', sessionName]);
      }
    }
  }

  /**
   * Send message to agent via tmux send-keys
   */
  async sendMessage(targetAgent, message) {
    const sessionName = this._getSessionName(targetAgent);

    if (!this.executor.hasSession(sessionName)) {
      throw new Error(`Session not found: ${sessionName}`);
    }

    // Format message for tmux send-keys
    const formattedMessage = this._formatMessage(message);

    try {
      await this.executor.execute('send-keys', ['-t', sessionName, formattedMessage, 'Enter']);

      const messageId = message.id || `msg_${Date.now()}`;
      this.pendingMessages.set(messageId, {
        target: targetAgent,
        message,
        sentAt: Date.now(),
        status: 'sent'
      });

      this.emit('messageSent', { target: targetAgent, messageId });

      return { success: true, messageId, target: targetAgent };
    } catch (error) {
      this.emit('error', { target: targetAgent, error });
      throw error;
    }
  }

  /**
   * Send message and wait for response
   */
  async sendAndWait(targetAgent, message, timeout = this.messageTimeout) {
    const result = await this.sendMessage(targetAgent, message);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingMessages.delete(result.messageId);
        reject(new Error(`Timeout waiting for response from ${targetAgent}`));
      }, timeout);

      // Listen for response
      const handler = (response) => {
        if (response.replyTo === result.messageId) {
          clearTimeout(timer);
          this.off('response', handler);
          this.pendingMessages.delete(result.messageId);
          resolve(response);
        }
      };

      this.on('response', handler);
    });
  }

  /**
   * Capture current pane content
   */
  async capturePane(agent) {
    const sessionName = this._getSessionName(agent);
    const result = await this.executor.execute('capture-pane', ['-t', sessionName, '-p']);
    return result.stdout;
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(agents, message) {
    const results = await Promise.allSettled(
      agents.map(agent => this.sendMessage(agent, message))
    );

    return {
      total: agents.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Check if session is active
   */
  async isSessionActive(agent) {
    const sessionName = this._getSessionName(agent);
    return this.executor.hasSession(sessionName);
  }

  /**
   * Kill agent session
   */
  async killSession(agent) {
    const sessionName = this._getSessionName(agent);
    await this.executor.execute('kill-session', ['-t', sessionName]);
  }

  /**
   * Format message for tmux transmission
   */
  _formatMessage(message) {
    if (typeof message === 'string') {
      return this._escapeForTmux(message);
    }
    return this._escapeForTmux(JSON.stringify(message));
  }

  /**
   * Escape special characters for tmux
   */
  _escapeForTmux(str) {
    // Escape characters that have special meaning in tmux
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
  }

  /**
   * Get session name for agent
   */
  _getSessionName(agent) {
    return `${this.sessionPrefix}-${agent}`;
  }

  /**
   * Get command history
   */
  getCommandHistory() {
    return this.executor.commandHistory;
  }

  /**
   * Reset state
   */
  reset() {
    this.pendingMessages.clear();
    this.executor.reset();
    this.removeAllListeners();
  }
}

// =============================================================================
// Test Suites
// =============================================================================

describe('TmuxCommunicator', () => {
  let communicator;
  let mockExecutor;

  beforeEach(() => {
    mockExecutor = new MockTmuxExecutor();
    communicator = new TmuxCommunicator({ executor: mockExecutor });
  });

  afterEach(() => {
    communicator.reset();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const comm = new TmuxCommunicator();
      assert.ok(comm.executor);
      assert.strictEqual(comm.sessionPrefix, 'agent');
      assert.strictEqual(comm.messageTimeout, 30000);
    });

    it('should create sessions for specified agents', async () => {
      await communicator.initialize(['anga', 'marie', 'fabien']);

      assert.ok(mockExecutor.hasSession('agent-anga'));
      assert.ok(mockExecutor.hasSession('agent-marie'));
      assert.ok(mockExecutor.hasSession('agent-fabien'));
    });

    it('should not duplicate existing sessions', async () => {
      mockExecutor.createSession('agent-anga');
      const initialCount = mockExecutor.commandHistory.length;

      await communicator.initialize(['anga']);

      // Should not create new session command
      const newSessionCommands = mockExecutor.commandHistory
        .slice(initialCount)
        .filter(c => c.command === 'new-session');
      assert.strictEqual(newSessionCommands.length, 0);
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      await communicator.initialize(['anga', 'marie']);
    });

    it('should send simple message', async () => {
      const message = createTestMessage({ payload: 'Hello Anga!' });
      const result = await communicator.sendMessage('anga', message);

      assert.ok(result.success);
      assert.strictEqual(result.target, 'anga');
      assert.ok(result.messageId);
    });

    it('should emit messageSent event', async () => {
      const spy = createSpy();
      communicator.on('messageSent', spy);

      await communicator.sendMessage('anga', 'test message');

      assert.strictEqual(spy.callCount(), 1);
      assert.strictEqual(spy.calls[0].args[0].target, 'anga');
    });

    it('should handle special characters in message', async () => {
      const specialPayload = generateSpecialCharsPayload();
      const message = createTestMessage({ payload: specialPayload });

      const result = await communicator.sendMessage('anga', message);

      assert.ok(result.success);

      // Verify escaping was applied
      const sendKeysCommand = mockExecutor.commandHistory.find(c => c.command === 'send-keys');
      assert.ok(sendKeysCommand);
    });

    it('should handle large messages', async () => {
      const largePayload = generateLargePayload(10); // 10KB
      const message = createTestMessage({ payload: largePayload });

      const result = await communicator.sendMessage('anga', message);

      assert.ok(result.success);
    });

    it('should throw error for non-existent session', async () => {
      await assert.rejects(
        () => communicator.sendMessage('nonexistent', 'test'),
        { message: /Session not found/ }
      );
    });

    it('should track pending messages', async () => {
      const message = createTestMessage();
      await communicator.sendMessage('anga', message);

      assert.strictEqual(communicator.pendingMessages.size, 1);
      const pending = communicator.pendingMessages.get(message.id);
      assert.strictEqual(pending.target, 'anga');
      assert.strictEqual(pending.status, 'sent');
    });
  });

  describe('Message Broadcasting', () => {
    beforeEach(async () => {
      await communicator.initialize(['anga', 'marie', 'fabien']);
    });

    it('should broadcast to all agents', async () => {
      const result = await communicator.broadcast(
        ['anga', 'marie', 'fabien'],
        'Broadcast message'
      );

      assert.strictEqual(result.total, 3);
      assert.strictEqual(result.success, 3);
      assert.strictEqual(result.failed, 0);
    });

    it('should report partial failures', async () => {
      // Remove one session to cause failure
      mockExecutor.sessions.delete('agent-marie');

      const result = await communicator.broadcast(
        ['anga', 'marie', 'fabien'],
        'Broadcast message'
      );

      assert.strictEqual(result.total, 3);
      assert.strictEqual(result.success, 2);
      assert.strictEqual(result.failed, 1);
    });

    it('should send concurrent messages efficiently', async () => {
      const { duration } = await measureTime(async () => {
        await communicator.broadcast(
          ['anga', 'marie', 'fabien'],
          'Concurrent message'
        );
      });

      // All messages should be sent in parallel, not serially
      // With mock executor, this should be very fast
      assert.ok(duration < 100, `Broadcast took ${duration}ms`);
    });
  });

  describe('Session Management', () => {
    it('should check if session is active', async () => {
      await communicator.initialize(['anga']);

      const active = await communicator.isSessionActive('anga');
      const inactive = await communicator.isSessionActive('nonexistent');

      assert.strictEqual(active, true);
      assert.strictEqual(inactive, false);
    });

    it('should kill session', async () => {
      await communicator.initialize(['anga']);
      assert.ok(mockExecutor.hasSession('agent-anga'));

      await communicator.killSession('anga');
      assert.ok(!mockExecutor.hasSession('agent-anga'));
    });

    it('should capture pane content', async () => {
      await communicator.initialize(['anga']);
      await communicator.sendMessage('anga', 'test content');

      const content = await communicator.capturePane('anga');
      assert.ok(content.includes('test content'));
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await communicator.initialize(['anga']);
    });

    it('should handle tmux command failure', async () => {
      mockExecutor.simulateFailure = true;
      mockExecutor.failureMessage = 'tmux server not running';

      await assert.rejects(
        () => communicator.sendMessage('anga', 'test'),
        { message: /tmux server not running/ }
      );
    });

    it('should emit error event on failure', async () => {
      mockExecutor.simulateFailure = true;
      const errorSpy = createSpy();
      communicator.on('error', errorSpy);

      try {
        await communicator.sendMessage('anga', 'test');
      } catch {
        // Expected
      }

      assert.strictEqual(errorSpy.callCount(), 1);
    });

    it('should timeout waiting for response', async () => {
      communicator.messageTimeout = 100; // Very short timeout

      await assert.rejects(
        () => communicator.sendAndWait('anga', 'test', 100),
        { message: /Timeout waiting for response/ }
      );
    });
  });

  describe('Message Escaping', () => {
    beforeEach(async () => {
      await communicator.initialize(['anga']);
    });

    it('should escape double quotes', async () => {
      await communicator.sendMessage('anga', 'Test "quoted" text');

      const sendCmd = mockExecutor.commandHistory.find(c => c.command === 'send-keys');
      const keysArg = sendCmd.args.find(a => a.includes('Test'));
      assert.ok(keysArg.includes('\\"'));
    });

    it('should escape single quotes', async () => {
      await communicator.sendMessage('anga', "Test 'quoted' text");

      const sendCmd = mockExecutor.commandHistory.find(c => c.command === 'send-keys');
      const keysArg = sendCmd.args.find(a => a.includes('Test'));
      assert.ok(keysArg.includes("\\'"));
    });

    it('should escape dollar signs', async () => {
      await communicator.sendMessage('anga', 'Test $variable');

      const sendCmd = mockExecutor.commandHistory.find(c => c.command === 'send-keys');
      const keysArg = sendCmd.args.find(a => a.includes('Test'));
      assert.ok(keysArg.includes('\\$'));
    });

    it('should escape backticks', async () => {
      await communicator.sendMessage('anga', 'Test `command`');

      const sendCmd = mockExecutor.commandHistory.find(c => c.command === 'send-keys');
      const keysArg = sendCmd.args.find(a => a.includes('Test'));
      assert.ok(keysArg.includes('\\`'));
    });

    it('should escape backslashes', async () => {
      await communicator.sendMessage('anga', 'Test \\path');

      const sendCmd = mockExecutor.commandHistory.find(c => c.command === 'send-keys');
      const keysArg = sendCmd.args.find(a => a.includes('Test'));
      assert.ok(keysArg.includes('\\\\'));
    });
  });

  describe('Command History', () => {
    it('should track all executed commands', async () => {
      await communicator.initialize(['anga', 'marie']);
      await communicator.sendMessage('anga', 'msg1');
      await communicator.sendMessage('marie', 'msg2');

      const history = communicator.getCommandHistory();

      assert.ok(history.length >= 4); // 2 new-session + 2 send-keys
      assert.ok(history.some(c => c.command === 'new-session'));
      assert.ok(history.some(c => c.command === 'send-keys'));
    });

    it('should include timestamps in history', async () => {
      await communicator.initialize(['anga']);

      const history = communicator.getCommandHistory();
      assert.ok(history.every(c => typeof c.timestamp === 'number'));
    });
  });
});

describe('TmuxCommunicator Integration Scenarios', () => {
  let communicator;
  let mockExecutor;

  beforeEach(() => {
    mockExecutor = new MockTmuxExecutor();
    communicator = new TmuxCommunicator({ executor: mockExecutor });
  });

  afterEach(() => {
    communicator.reset();
  });

  it('should handle rapid sequential messages', async () => {
    await communicator.initialize(['anga']);

    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(await communicator.sendMessage('anga', `Message ${i}`));
    }

    assert.strictEqual(results.length, 10);
    assert.ok(results.every(r => r.success));
  });

  it('should handle concurrent messages to same agent', async () => {
    await communicator.initialize(['anga']);

    const promises = Array.from({ length: 10 }, (_, i) =>
      communicator.sendMessage('anga', `Concurrent ${i}`)
    );

    const results = await Promise.all(promises);

    assert.strictEqual(results.length, 10);
    assert.ok(results.every(r => r.success));
  });

  it('should handle messages to multiple agents simultaneously', async () => {
    await communicator.initialize(['anga', 'marie', 'fabien']);

    const promises = ['anga', 'marie', 'fabien'].flatMap(agent =>
      Array.from({ length: 5 }, (_, i) =>
        communicator.sendMessage(agent, `${agent}-msg-${i}`)
      )
    );

    const results = await Promise.all(promises);

    assert.strictEqual(results.length, 15);
    assert.ok(results.every(r => r.success));
  });

  it('should recover from temporary failure', async () => {
    await communicator.initialize(['anga']);

    // First message succeeds
    const result1 = await communicator.sendMessage('anga', 'msg1');
    assert.ok(result1.success);

    // Simulate temporary failure
    mockExecutor.simulateFailure = true;
    await assert.rejects(() => communicator.sendMessage('anga', 'msg2'));

    // Recovery
    mockExecutor.simulateFailure = false;
    const result3 = await communicator.sendMessage('anga', 'msg3');
    assert.ok(result3.success);
  });

  it('should handle session recreation after kill', async () => {
    await communicator.initialize(['anga']);
    await communicator.killSession('anga');

    // Session no longer exists
    assert.ok(!await communicator.isSessionActive('anga'));

    // Re-initialize
    await communicator.initialize(['anga']);
    assert.ok(await communicator.isSessionActive('anga'));

    // Should work again
    const result = await communicator.sendMessage('anga', 'after recreation');
    assert.ok(result.success);
  });
});

// Export for use in other test files
module.exports = {
  TmuxCommunicator,
  MockTmuxExecutor
};
