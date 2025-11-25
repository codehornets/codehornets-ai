/**
 * Unit tests for communication strategies
 *
 * @module agent-comm/tests/strategies
 */

const TmuxStrategy = require('../strategies/tmux');
const PtyWrapperStrategy = require('../strategies/pty-wrapper');
const FileBasedStrategy = require('../strategies/file-based');

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

const { exec } = require('child_process');
const { promisify } = require('util');

// Mock fs
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue('{}'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({
      mtime: new Date(),
      isSocket: () => true
    }),
    access: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined)
  }
}));

const fs = require('fs').promises;

// Mock net
jest.mock('net', () => ({
  createConnection: jest.fn()
}));

const net = require('net');

describe('TmuxStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new TmuxStrategy({
      debug: false,
      useDockerExec: true
    });

    // Reset mocks
    exec.mockReset();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const s = new TmuxStrategy();

      expect(s.name).toBe('tmux');
      expect(s.useDockerExec).toBe(true);
      expect(s.captureLines).toBe(100);
    });

    it('should accept custom options', () => {
      const s = new TmuxStrategy({
        useDockerExec: false,
        captureLines: 50,
        tmuxPath: '/usr/local/bin/tmux'
      });

      expect(s.useDockerExec).toBe(false);
      expect(s.captureLines).toBe(50);
      expect(s.tmuxPath).toBe('/usr/local/bin/tmux');
    });
  });

  describe('isAvailable', () => {
    it('should return true when docker is available', async () => {
      exec.mockImplementation((cmd, callback) => {
        if (cmd.includes('docker version')) {
          callback(null, { stdout: '20.10.0' });
        }
      });

      const available = await strategy.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when docker is not available', async () => {
      exec.mockImplementation((cmd, callback) => {
        callback(new Error('docker not found'));
      });

      const available = await strategy.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('getContainerName', () => {
    it('should map agent names to container names', () => {
      expect(strategy.getContainerName('anga'))
        .toBe('multi-agents-orchestration-anga-1');

      expect(strategy.getContainerName('marie'))
        .toBe('multi-agents-orchestration-marie-1');
    });

    it('should handle full container names', () => {
      const fullName = 'codehornets-orchestrator';

      expect(strategy.getContainerName(fullName)).toBe(fullName);
    });
  });

  describe('getTmuxSessionName', () => {
    it('should generate correct session names', () => {
      expect(strategy.getTmuxSessionName('anga')).toBe('claude-anga');
      expect(strategy.getTmuxSessionName('marie')).toBe('claude-marie');
    });

    it('should normalize prefixed names', () => {
      expect(strategy.getTmuxSessionName('worker-anga')).toBe('claude-anga');
    });
  });

  describe('escapeTmuxString', () => {
    it('should escape special characters', () => {
      expect(strategy.escapeTmuxString('test "quote"'))
        .toBe('test \\"quote\\"');

      expect(strategy.escapeTmuxString('test $var'))
        .toBe('test \\$var');

      expect(strategy.escapeTmuxString('test `cmd`'))
        .toBe('test \\`cmd\\`');
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await strategy.initialize().catch(() => {});
    });

    it('should check if session exists before sending', async () => {
      exec.mockImplementation((cmd, callback) => {
        if (cmd.includes('has-session')) {
          callback(new Error('session not found'));
        }
        callback(null, { stdout: '' });
      });

      const result = await strategy.send('anga', 'test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('cleanup', () => {
    it('should clear known sessions', async () => {
      strategy.knownSessions.set('test', true);

      await strategy.cleanup();

      expect(strategy.knownSessions.size).toBe(0);
      expect(strategy.initialized).toBe(false);
    });
  });
});

describe('PtyWrapperStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new PtyWrapperStrategy({
      debug: false,
      socketDir: '/test/sockets'
    });

    // Reset mocks
    fs.readdir.mockReset();
    fs.stat.mockReset();
    net.createConnection.mockReset();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const s = new PtyWrapperStrategy();

      expect(s.name).toBe('pty-wrapper');
      expect(s.socketDir).toBe('/shared/sockets');
      expect(s.socketPattern).toBe('{agent}.sock');
    });

    it('should accept custom options', () => {
      const s = new PtyWrapperStrategy({
        socketDir: '/custom/sockets',
        socketPattern: 'agent-{agent}.socket'
      });

      expect(s.socketDir).toBe('/custom/sockets');
      expect(s.socketPattern).toBe('agent-{agent}.socket');
    });
  });

  describe('isAvailable', () => {
    it('should return true when sockets exist', async () => {
      fs.readdir.mockResolvedValue(['anga.sock', 'marie.sock']);

      const available = await strategy.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when no sockets exist', async () => {
      fs.readdir.mockResolvedValue([]);

      const available = await strategy.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when directory not accessible', async () => {
      fs.readdir.mockRejectedValue(new Error('ENOENT'));

      const available = await strategy.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('getSocketPath', () => {
    it('should generate correct socket paths', () => {
      expect(strategy.getSocketPath('anga'))
        .toBe('/test/sockets/anga.sock');

      expect(strategy.getSocketPath('marie'))
        .toBe('/test/sockets/marie.sock');
    });

    it('should normalize prefixed names', () => {
      expect(strategy.getSocketPath('worker-anga'))
        .toBe('/test/sockets/anga.sock');

      expect(strategy.getSocketPath('multi-agents-orchestration-marie-1'))
        .toBe('/test/sockets/marie.sock');
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await strategy.initialize().catch(() => {});
    });

    it('should check if socket exists before sending', async () => {
      fs.stat.mockRejectedValue(new Error('ENOENT'));

      const result = await strategy.send('anga', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Socket not found');
    });
  });

  describe('cleanup', () => {
    it('should clear connections and set initialized to false', async () => {
      await strategy.cleanup();

      expect(strategy.connections.size).toBe(0);
      expect(strategy.initialized).toBe(false);
    });
  });
});

describe('FileBasedStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new FileBasedStrategy({
      debug: false,
      sharedDir: '/test/shared'
    });

    // Reset mocks
    fs.mkdir.mockReset();
    fs.readdir.mockReset();
    fs.readFile.mockReset();
    fs.writeFile.mockReset();
    fs.stat.mockReset();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const s = new FileBasedStrategy();

      expect(s.name).toBe('file-based');
      expect(s.pollInterval).toBe(500);
      expect(s.maxWaitTime).toBe(60000);
    });

    it('should accept custom options', () => {
      const s = new FileBasedStrategy({
        tasksDir: '/custom/tasks',
        resultsDir: '/custom/results',
        pollInterval: 1000
      });

      expect(s.tasksDir).toBe('/custom/tasks');
      expect(s.resultsDir).toBe('/custom/results');
      expect(s.pollInterval).toBe(1000);
    });
  });

  describe('initialize', () => {
    it('should create required directories', async () => {
      await strategy.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('tasks'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('results'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('heartbeats'),
        { recursive: true }
      );
    });

    it('should set initialized to true', async () => {
      await strategy.initialize();

      expect(strategy.initialized).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when shared directory accessible', async () => {
      fs.access.mockResolvedValue(undefined);

      const available = await strategy.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when shared directory not accessible', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));

      const available = await strategy.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('generateTaskId', () => {
    it('should generate unique task IDs', () => {
      const id1 = strategy.generateTaskId();
      const id2 = strategy.generateTaskId();

      expect(id1).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getAgentTasksDir', () => {
    it('should return correct task directory path', () => {
      expect(strategy.getAgentTasksDir('anga'))
        .toBe('/test/shared/tasks/anga');

      expect(strategy.getAgentTasksDir('worker-marie'))
        .toBe('/test/shared/tasks/marie');
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await strategy.initialize();
    });

    it('should create task file', async () => {
      // Don't wait for response to avoid timeout
      const result = await strategy.send('anga', 'test', { waitForResponse: false });

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('sendAsync', () => {
    beforeEach(async () => {
      await strategy.initialize();
    });

    it('should create task file without waiting', async () => {
      await strategy.sendAsync('anga', 'async test');

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    beforeEach(async () => {
      await strategy.initialize();
    });

    it('should return available status when heartbeat is recent', async () => {
      fs.stat.mockResolvedValue({
        mtime: new Date()
      });
      fs.readFile.mockResolvedValue('{"status": "active"}');

      const status = await strategy.getStatus('anga');

      expect(status.available).toBe(true);
      expect(status.state).toBe('running');
    });

    it('should return stale status when heartbeat is old', async () => {
      fs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 120000) // 2 minutes ago
      });
      fs.readFile.mockResolvedValue('{}');

      const status = await strategy.getStatus('anga');

      expect(status.available).toBe(false);
      expect(status.state).toBe('stale');
    });

    it('should return unknown status when heartbeat file missing', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.stat.mockRejectedValue(error);

      const status = await strategy.getStatus('anga');

      expect(status.available).toBe(false);
      expect(status.state).toBe('unknown');
      expect(status.error).toContain('heartbeat');
    });
  });

  describe('cleanup', () => {
    it('should clear pending tasks and set initialized to false', async () => {
      await strategy.initialize();
      strategy.pendingTasks.set('test', {});

      await strategy.cleanup();

      expect(strategy.pendingTasks.size).toBe(0);
      expect(strategy.initialized).toBe(false);
    });
  });
});

describe('BaseStrategy', () => {
  const BaseStrategy = require('../strategies/base');

  it('should throw on abstract method calls', async () => {
    const strategy = new BaseStrategy();

    await expect(strategy.initialize())
      .rejects.toThrow('must be implemented');

    await expect(strategy.isAvailable())
      .rejects.toThrow('must be implemented');

    await expect(strategy.send('agent', 'msg'))
      .rejects.toThrow('must be implemented');

    await expect(strategy.sendAsync('agent', 'msg'))
      .rejects.toThrow('must be implemented');

    await expect(strategy.getOutput('agent'))
      .rejects.toThrow('must be implemented');

    await expect(strategy.getStatus('agent'))
      .rejects.toThrow('must be implemented');

    await expect(strategy.cleanup())
      .rejects.toThrow('must be implemented');
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes in time', async () => {
      const strategy = new BaseStrategy();
      const fastPromise = Promise.resolve('done');

      const result = await strategy.withTimeout(fastPromise, 1000);

      expect(result).toBe('done');
    });

    it('should reject if promise times out', async () => {
      const strategy = new BaseStrategy();
      const slowPromise = new Promise(resolve => setTimeout(resolve, 2000));

      await expect(strategy.withTimeout(slowPromise, 100, 'Test timeout'))
        .rejects.toThrow('Test timeout');
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const strategy = new BaseStrategy();
      const start = Date.now();

      await strategy.sleep(100);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});
