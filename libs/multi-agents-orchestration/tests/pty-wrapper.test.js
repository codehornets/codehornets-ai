/**
 * PTY Wrapper Communication Strategy Tests
 *
 * Tests for the node-pty wrapper approach to inter-agent communication.
 * This approach uses a PTY wrapper around Claude Code to enable programmatic input.
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');
const net = require('net');
const {
  createTestMessage,
  sleep,
  waitFor,
  waitForEvent,
  generateSpecialCharsPayload,
  generateLargePayload,
  measureTime,
  createSpy,
  TEST_CONFIG
} = require('./helpers/test-utils');

/**
 * Mock PTY for testing without actual node-pty
 */
class MockPty extends EventEmitter {
  constructor(file, args = [], options = {}) {
    super();
    this.file = file;
    this.args = args;
    this.options = options;
    this.pid = Math.floor(Math.random() * 10000);
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this.process = file;
    this._dataBuffer = [];
    this._killed = false;
    this._exitCode = 0;
  }

  write(data) {
    if (this._killed) {
      throw new Error('PTY has been killed');
    }
    this._dataBuffer.push(data);
    this.emit('data-written', data);

    // Simulate echo and response
    setImmediate(() => {
      this.emit('data', data); // Echo back
    });
  }

  resize(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.emit('resize', { cols, rows });
  }

  kill(signal = 'SIGTERM') {
    this._killed = true;
    setImmediate(() => {
      this.emit('exit', { exitCode: 0, signal });
    });
  }

  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
  }

  // Simulate output from the PTY
  simulateOutput(data) {
    this.emit('data', data);
  }

  // Simulate process exit
  simulateExit(exitCode = 0, signal = null) {
    this._killed = true;
    this._exitCode = exitCode;
    this.emit('exit', { exitCode, signal });
  }

  // Get all written data
  getWrittenData() {
    return [...this._dataBuffer];
  }

  // Clear written data
  clearWrittenData() {
    this._dataBuffer = [];
  }
}

/**
 * Mock node-pty module
 */
const mockNodePty = {
  spawn: (file, args, options) => new MockPty(file, args, options)
};

/**
 * PTY Wrapper Protocol Constants
 */
const PROTOCOL = {
  MESSAGE_START: '\x02', // STX - Start of Text
  MESSAGE_END: '\x03',   // ETX - End of Text
  ACK: '\x06',           // ACK
  NAK: '\x15',           // NAK
  HEARTBEAT: '\x05',     // ENQ
  ESCAPE: '\x1B'         // ESC
};

/**
 * PTY Wrapper Communicator
 * Wraps a PTY session and provides structured communication
 */
class PtyWrapperCommunicator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.pty = null;
    this.socketPath = options.socketPath || '/tmp/agent-wrapper.sock';
    this.server = null;
    this.clients = new Map();
    this.messageBuffer = '';
    this.pendingMessages = new Map();
    this.responseTimeout = options.responseTimeout || 30000;
    this.debug = options.debug || false;
    this.ptyFactory = options.ptyFactory || mockNodePty;
  }

  /**
   * Start the wrapper with a command
   */
  async start(command, args = [], options = {}) {
    // Create PTY
    this.pty = this.ptyFactory.spawn(command, args, {
      name: 'xterm-256color',
      cols: options.cols || 120,
      rows: options.rows || 40,
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env }
    });

    // Set up PTY event handlers
    this.pty.on('data', (data) => this._handlePtyData(data));
    this.pty.on('exit', (info) => this._handlePtyExit(info));

    // Start socket server for IPC
    await this._startServer();

    this.emit('started', { pid: this.pty.pid });

    return { pid: this.pty.pid };
  }

  /**
   * Start Unix socket server for IPC
   */
  async _startServer() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        const clientId = `client_${Date.now()}`;
        this.clients.set(clientId, socket);

        socket.on('data', (data) => {
          this._handleClientData(clientId, data);
        });

        socket.on('close', () => {
          this.clients.delete(clientId);
        });

        socket.on('error', (err) => {
          this.emit('clientError', { clientId, error: err });
        });
      });

      this.server.on('error', reject);

      // For testing, use a mock listen
      if (this.debug) {
        resolve();
        return;
      }

      this.server.listen(this.socketPath, () => {
        resolve();
      });
    });
  }

  /**
   * Handle data from PTY
   */
  _handlePtyData(data) {
    this.messageBuffer += data;

    // Check for complete protocol messages
    while (true) {
      const startIdx = this.messageBuffer.indexOf(PROTOCOL.MESSAGE_START);
      const endIdx = this.messageBuffer.indexOf(PROTOCOL.MESSAGE_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const messageContent = this.messageBuffer.substring(startIdx + 1, endIdx);
        this.messageBuffer = this.messageBuffer.substring(endIdx + 1);

        try {
          const message = JSON.parse(messageContent);
          this._handleProtocolMessage(message);
        } catch (error) {
          this.emit('parseError', { content: messageContent, error });
        }
      } else {
        break;
      }
    }

    // Emit raw data for monitoring
    this.emit('data', data);
  }

  /**
   * Handle protocol message
   */
  _handleProtocolMessage(message) {
    if (message.type === 'response' && message.requestId) {
      const pending = this.pendingMessages.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        pending.resolve(message);
        this.pendingMessages.delete(message.requestId);
      }
    }

    this.emit('message', message);
  }

  /**
   * Handle PTY exit
   */
  _handlePtyExit(info) {
    this.emit('exit', info);

    // Reject all pending messages
    for (const [id, pending] of this.pendingMessages) {
      clearTimeout(pending.timer);
      pending.reject(new Error('PTY process exited'));
    }
    this.pendingMessages.clear();
  }

  /**
   * Handle data from socket client
   */
  _handleClientData(clientId, data) {
    const dataStr = data.toString();

    try {
      const command = JSON.parse(dataStr);
      this._executeCommand(clientId, command);
    } catch (error) {
      this._sendToClient(clientId, { error: 'Invalid JSON' });
    }
  }

  /**
   * Execute command from client
   */
  async _executeCommand(clientId, command) {
    switch (command.action) {
      case 'send':
        await this.sendInput(command.data);
        this._sendToClient(clientId, { success: true, action: 'send' });
        break;

      case 'sendMessage':
        const result = await this.sendMessage(command.message);
        this._sendToClient(clientId, result);
        break;

      case 'resize':
        this.resize(command.cols, command.rows);
        this._sendToClient(clientId, { success: true, action: 'resize' });
        break;

      case 'status':
        this._sendToClient(clientId, {
          action: 'status',
          pid: this.pty?.pid,
          running: !this.pty?._killed
        });
        break;

      default:
        this._sendToClient(clientId, { error: `Unknown action: ${command.action}` });
    }
  }

  /**
   * Send data to socket client
   */
  _sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(JSON.stringify(data) + '\n');
    }
  }

  /**
   * Send raw input to PTY
   */
  async sendInput(data) {
    if (!this.pty || this.pty._killed) {
      throw new Error('PTY not running');
    }

    this.pty.write(data);
    return { success: true };
  }

  /**
   * Send structured message with protocol framing
   */
  async sendMessage(message, waitForResponse = false) {
    if (!this.pty || this.pty._killed) {
      throw new Error('PTY not running');
    }

    const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const framedMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now()
    };

    const encoded = PROTOCOL.MESSAGE_START +
                   JSON.stringify(framedMessage) +
                   PROTOCOL.MESSAGE_END;

    this.pty.write(encoded);

    if (waitForResponse) {
      return this._waitForResponse(messageId);
    }

    return { success: true, messageId };
  }

  /**
   * Wait for response to a message
   */
  _waitForResponse(messageId) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Response timeout for message ${messageId}`));
      }, this.responseTimeout);

      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timer,
        createdAt: Date.now()
      });
    });
  }

  /**
   * Resize PTY
   */
  resize(cols, rows) {
    if (this.pty) {
      this.pty.resize(cols, rows);
    }
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat() {
    if (!this.pty || this.pty._killed) {
      return { alive: false };
    }

    this.pty.write(PROTOCOL.HEARTBEAT);
    return { alive: true, pid: this.pty.pid };
  }

  /**
   * Stop the wrapper
   */
  async stop(signal = 'SIGTERM') {
    if (this.pty) {
      this.pty.kill(signal);
      this.pty = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Close all client connections
    for (const [id, socket] of this.clients) {
      socket.destroy();
    }
    this.clients.clear();

    this.emit('stopped');
  }

  /**
   * Get PTY info
   */
  getInfo() {
    return {
      running: this.pty && !this.pty._killed,
      pid: this.pty?.pid,
      cols: this.pty?.cols,
      rows: this.pty?.rows,
      clients: this.clients.size,
      pendingMessages: this.pendingMessages.size
    };
  }
}

/**
 * PTY Wrapper Client
 * Connects to a PTY wrapper via socket
 */
class PtyWrapperClient extends EventEmitter {
  constructor(socketPath, options = {}) {
    super();
    this.socketPath = socketPath;
    this.socket = null;
    this.connected = false;
    this.responseBuffer = '';
    this.pendingRequests = new Map();
    this.requestTimeout = options.requestTimeout || 10000;
  }

  /**
   * Connect to wrapper
   */
  async connect() {
    return new Promise((resolve, reject) => {
      // For testing, simulate connection
      this.connected = true;
      resolve();
    });
  }

  /**
   * Send command to wrapper
   */
  async send(action, data = {}) {
    if (!this.connected) {
      throw new Error('Not connected to wrapper');
    }

    const requestId = `req_${Date.now()}`;
    const command = { action, requestId, ...data };

    // Simulate response
    return new Promise((resolve) => {
      setImmediate(() => {
        resolve({ success: true, requestId });
      });
    });
  }

  /**
   * Send input to PTY
   */
  async sendInput(input) {
    return this.send('send', { data: input });
  }

  /**
   * Send structured message
   */
  async sendMessage(message) {
    return this.send('sendMessage', { message });
  }

  /**
   * Request status
   */
  async getStatus() {
    return this.send('status');
  }

  /**
   * Resize PTY
   */
  async resize(cols, rows) {
    return this.send('resize', { cols, rows });
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.connected = false;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}

// =============================================================================
// Test Suites
// =============================================================================

describe('PtyWrapperCommunicator', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = new PtyWrapperCommunicator({ debug: true });
  });

  afterEach(async () => {
    await wrapper.stop();
  });

  describe('Initialization', () => {
    it('should create wrapper with default options', () => {
      assert.ok(wrapper);
      assert.strictEqual(wrapper.responseTimeout, 30000);
    });

    it('should start PTY process', async () => {
      const result = await wrapper.start('node', ['--version']);

      assert.ok(result.pid);
      assert.ok(wrapper.pty);
    });

    it('should emit started event', async () => {
      const spy = createSpy();
      wrapper.on('started', spy);

      await wrapper.start('node', ['--version']);

      assert.strictEqual(spy.callCount(), 1);
      assert.ok(spy.calls[0].args[0].pid);
    });
  });

  describe('Raw Input', () => {
    beforeEach(async () => {
      await wrapper.start('node', ['--interactive']);
    });

    it('should send raw input to PTY', async () => {
      const result = await wrapper.sendInput('console.log("hello")\n');

      assert.ok(result.success);
    });

    it('should handle special characters', async () => {
      const input = generateSpecialCharsPayload();
      const result = await wrapper.sendInput(input);

      assert.ok(result.success);
    });

    it('should handle large input', async () => {
      const input = generateLargePayload(5); // 5KB
      const result = await wrapper.sendInput(input);

      assert.ok(result.success);
    });

    it('should throw error when PTY not running', async () => {
      await wrapper.stop();

      await assert.rejects(
        () => wrapper.sendInput('test'),
        { message: /PTY not running/ }
      );
    });
  });

  describe('Structured Messages', () => {
    beforeEach(async () => {
      await wrapper.start('node', ['--interactive']);
    });

    it('should send message with protocol framing', async () => {
      const message = createTestMessage({ payload: 'Hello' });
      const result = await wrapper.sendMessage(message);

      assert.ok(result.success);
      assert.ok(result.messageId);
    });

    it('should include message ID', async () => {
      const message = createTestMessage();
      const result = await wrapper.sendMessage(message);

      assert.ok(result.messageId);
    });

    it('should frame message with STX/ETX', async () => {
      const dataSpy = createSpy();
      wrapper.pty.on('data-written', dataSpy);

      await wrapper.sendMessage({ type: 'test', data: 'hello' });

      const written = dataSpy.calls[0].args[0];
      assert.ok(written.startsWith(PROTOCOL.MESSAGE_START));
      assert.ok(written.endsWith(PROTOCOL.MESSAGE_END));
    });
  });

  describe('Response Handling', () => {
    beforeEach(async () => {
      await wrapper.start('node', ['--interactive']);
    });

    it('should handle protocol response', async () => {
      const messageSpy = createSpy();
      wrapper.on('message', messageSpy);

      // Simulate receiving a response
      const response = {
        type: 'response',
        requestId: 'test123',
        result: 'success'
      };

      const framedResponse = PROTOCOL.MESSAGE_START +
                            JSON.stringify(response) +
                            PROTOCOL.MESSAGE_END;

      wrapper._handlePtyData(framedResponse);

      await sleep(10);

      assert.strictEqual(messageSpy.callCount(), 1);
      assert.strictEqual(messageSpy.calls[0].args[0].type, 'response');
    });

    it('should resolve pending message on response', async () => {
      const message = createTestMessage({ id: 'pending123' });

      // Start waiting for response
      const responsePromise = wrapper.sendMessage(message, true);

      // Simulate response
      setImmediate(() => {
        const response = PROTOCOL.MESSAGE_START +
                        JSON.stringify({ type: 'response', requestId: 'pending123', result: 'ok' }) +
                        PROTOCOL.MESSAGE_END;
        wrapper._handlePtyData(response);
      });

      const result = await responsePromise;
      assert.strictEqual(result.result, 'ok');
    });

    it('should timeout if no response received', async () => {
      wrapper.responseTimeout = 100;

      const message = createTestMessage({ id: 'timeout123' });

      await assert.rejects(
        () => wrapper.sendMessage(message, true),
        { message: /Response timeout/ }
      );
    });
  });

  describe('PTY Management', () => {
    beforeEach(async () => {
      await wrapper.start('node', ['--interactive']);
    });

    it('should resize PTY', () => {
      wrapper.resize(100, 50);

      assert.strictEqual(wrapper.pty.cols, 100);
      assert.strictEqual(wrapper.pty.rows, 50);
    });

    it('should send heartbeat', async () => {
      const result = await wrapper.sendHeartbeat();

      assert.ok(result.alive);
      assert.ok(result.pid);
    });

    it('should report not alive when stopped', async () => {
      await wrapper.stop();
      const result = await wrapper.sendHeartbeat();

      assert.strictEqual(result.alive, false);
    });

    it('should get wrapper info', () => {
      const info = wrapper.getInfo();

      assert.ok(info.running);
      assert.ok(info.pid);
      assert.strictEqual(info.cols, 120);
      assert.strictEqual(info.rows, 40);
    });
  });

  describe('Exit Handling', () => {
    beforeEach(async () => {
      await wrapper.start('node', ['--interactive']);
    });

    it('should emit exit event when PTY exits', async () => {
      const exitSpy = createSpy();
      wrapper.on('exit', exitSpy);

      wrapper.pty.simulateExit(0);

      await sleep(10);

      assert.strictEqual(exitSpy.callCount(), 1);
      assert.strictEqual(exitSpy.calls[0].args[0].exitCode, 0);
    });

    it('should reject pending messages on exit', async () => {
      wrapper.responseTimeout = 10000;

      const message = createTestMessage({ id: 'willFail' });
      const responsePromise = wrapper.sendMessage(message, true);

      // Simulate exit before response
      wrapper.pty.simulateExit(1);

      await assert.rejects(
        () => responsePromise,
        { message: /PTY process exited/ }
      );
    });
  });

  describe('Stop', () => {
    beforeEach(async () => {
      await wrapper.start('node', ['--interactive']);
    });

    it('should stop PTY process', async () => {
      await wrapper.stop();

      assert.ok(!wrapper.pty);
    });

    it('should emit stopped event', async () => {
      const spy = createSpy();
      wrapper.on('stopped', spy);

      await wrapper.stop();

      assert.strictEqual(spy.callCount(), 1);
    });

    it('should kill with custom signal', async () => {
      const exitSpy = createSpy();
      wrapper.pty.on('exit', exitSpy);

      await wrapper.stop('SIGKILL');

      await sleep(10);

      assert.strictEqual(exitSpy.calls[0].args[0].signal, 'SIGKILL');
    });
  });
});

describe('PtyWrapperClient', () => {
  let client;

  beforeEach(() => {
    client = new PtyWrapperClient('/tmp/test.sock');
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('Connection', () => {
    it('should connect to wrapper', async () => {
      await client.connect();
      assert.ok(client.connected);
    });

    it('should throw when sending while disconnected', async () => {
      await assert.rejects(
        () => client.sendInput('test'),
        { message: /Not connected/ }
      );
    });
  });

  describe('Commands', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should send input', async () => {
      const result = await client.sendInput('test input');
      assert.ok(result.success);
    });

    it('should send message', async () => {
      const result = await client.sendMessage({ type: 'test' });
      assert.ok(result.success);
    });

    it('should get status', async () => {
      const result = await client.getStatus();
      assert.ok(result.success);
    });

    it('should resize', async () => {
      const result = await client.resize(100, 50);
      assert.ok(result.success);
    });
  });
});

describe('Protocol Constants', () => {
  it('should have correct ASCII values', () => {
    assert.strictEqual(PROTOCOL.MESSAGE_START.charCodeAt(0), 0x02);
    assert.strictEqual(PROTOCOL.MESSAGE_END.charCodeAt(0), 0x03);
    assert.strictEqual(PROTOCOL.ACK.charCodeAt(0), 0x06);
    assert.strictEqual(PROTOCOL.NAK.charCodeAt(0), 0x15);
    assert.strictEqual(PROTOCOL.HEARTBEAT.charCodeAt(0), 0x05);
    assert.strictEqual(PROTOCOL.ESCAPE.charCodeAt(0), 0x1B);
  });
});

// Export for use in other tests
module.exports = {
  PtyWrapperCommunicator,
  PtyWrapperClient,
  MockPty,
  PROTOCOL
};
