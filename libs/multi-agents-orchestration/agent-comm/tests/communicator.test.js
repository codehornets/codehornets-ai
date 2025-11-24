/**
 * Unit tests for AgentCommunicator
 *
 * @module agent-comm/tests/communicator
 */

const AgentCommunicator = require('../index');
const TmuxStrategy = require('../strategies/tmux');
const PtyWrapperStrategy = require('../strategies/pty-wrapper');
const FileBasedStrategy = require('../strategies/file-based');

// Mock implementations
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue('{}'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ mtime: new Date(), isSocket: () => false }),
    access: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('net', () => ({
  createConnection: jest.fn()
}));

describe('AgentCommunicator', () => {
  let communicator;

  beforeEach(() => {
    communicator = new AgentCommunicator({
      strategy: 'auto',
      debug: false
    });
  });

  afterEach(async () => {
    if (communicator && communicator.initialized) {
      await communicator.shutdown();
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const comm = new AgentCommunicator();

      expect(comm.options.strategy).toBe('auto');
      expect(comm.options.timeout).toBe(30000);
      expect(comm.options.debug).toBe(false);
      expect(comm.initialized).toBe(false);
    });

    it('should accept custom options', () => {
      const comm = new AgentCommunicator({
        strategy: 'tmux',
        timeout: 60000,
        debug: true
      });

      expect(comm.options.strategy).toBe('tmux');
      expect(comm.options.timeout).toBe(60000);
      expect(comm.options.debug).toBe(true);
    });

    it('should include default agents', () => {
      const comm = new AgentCommunicator();

      expect(comm.options.agents).toContain('orchestrator');
      expect(comm.options.agents).toContain('marie');
      expect(comm.options.agents).toContain('anga');
      expect(comm.options.agents).toContain('fabien');
    });

    it('should initialize all strategies', () => {
      const comm = new AgentCommunicator();

      expect(comm.strategies['tmux']).toBeInstanceOf(TmuxStrategy);
      expect(comm.strategies['pty-wrapper']).toBeInstanceOf(PtyWrapperStrategy);
      expect(comm.strategies['file-based']).toBeInstanceOf(FileBasedStrategy);
    });
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await communicator.initialize();

      expect(communicator.initialized).toBe(true);
    });

    it('should emit initialized event', async () => {
      const handler = jest.fn();
      communicator.on('initialized', handler);

      await communicator.initialize();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: expect.any(String) })
      );
    });

    it('should detect active strategy in auto mode', async () => {
      await communicator.initialize();

      expect(communicator.activeStrategy).toBeDefined();
      expect(['tmux', 'pty-wrapper', 'file-based']).toContain(communicator.activeStrategy);
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should throw if not initialized', async () => {
      const uninitComm = new AgentCommunicator();

      await expect(uninitComm.send('anga', 'test'))
        .rejects.toThrow('not initialized');
    });

    it('should return SendResult object', async () => {
      // Mock strategy send method
      const mockResult = {
        success: true,
        response: 'test response',
        duration: 100
      };

      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue(mockResult);

      const result = await communicator.send('anga', 'test message');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
    });

    it('should emit messageSent event on success', async () => {
      const handler = jest.fn();
      communicator.on('messageSent', handler);

      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, duration: 100 });

      await communicator.send('anga', 'test');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agent: 'anga' })
      );
    });

    it('should emit sendError event on failure', async () => {
      const handler = jest.fn();
      communicator.on('sendError', handler);

      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: false, error: 'test error', duration: 100 });

      await communicator.send('anga', 'test');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agent: 'anga', error: 'test error' })
      );
    });

    it('should allow strategy override', async () => {
      const tmuxSend = jest.fn().mockResolvedValue({ success: true, duration: 100 });
      communicator.strategies['tmux'].send = tmuxSend;

      await communicator.send('anga', 'test', { strategy: 'tmux' });

      expect(tmuxSend).toHaveBeenCalled();
    });
  });

  describe('sendAsync', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should call strategy sendAsync method', async () => {
      const mockSendAsync = jest.fn().mockResolvedValue(undefined);
      communicator.strategies[communicator.activeStrategy].sendAsync = mockSendAsync;

      await communicator.sendAsync('marie', 'async message');

      expect(mockSendAsync).toHaveBeenCalledWith('marie', 'async message');
    });

    it('should emit messageSent event with async flag', async () => {
      const handler = jest.fn();
      communicator.on('messageSent', handler);

      communicator.strategies[communicator.activeStrategy].sendAsync =
        jest.fn().mockResolvedValue(undefined);

      await communicator.sendAsync('marie', 'test');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agent: 'marie', async: true })
      );
    });
  });

  describe('getStatus', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should return agent status', async () => {
      const mockStatus = {
        available: true,
        state: 'running'
      };

      communicator.strategies[communicator.activeStrategy].getStatus =
        jest.fn().mockResolvedValue(mockStatus);

      const status = await communicator.getStatus('anga');

      expect(status).toHaveProperty('agent', 'anga');
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('state');
    });
  });

  describe('getAllStatuses', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should return status for all agents', async () => {
      communicator.strategies[communicator.activeStrategy].getStatus =
        jest.fn().mockResolvedValue({ available: true, state: 'running' });

      const statuses = await communicator.getAllStatuses();

      expect(Object.keys(statuses)).toEqual(
        expect.arrayContaining(['orchestrator', 'marie', 'anga', 'fabien'])
      );
    });
  });

  describe('broadcast', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should broadcast to all agents', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, duration: 100 });

      const results = await communicator.broadcast('all', 'broadcast message');

      expect(Object.keys(results)).toEqual(
        expect.arrayContaining(['orchestrator', 'marie', 'anga', 'fabien'])
      );
    });

    it('should broadcast to workers only', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, duration: 100 });

      const results = await communicator.broadcast('workers', 'worker message');

      expect(Object.keys(results)).toEqual(
        expect.arrayContaining(['marie', 'anga', 'fabien'])
      );
      expect(Object.keys(results)).not.toContain('orchestrator');
    });

    it('should broadcast to specific agents', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, duration: 100 });

      const results = await communicator.broadcast(['marie', 'anga'], 'specific message');

      expect(Object.keys(results)).toEqual(['marie', 'anga']);
    });

    it('should throw on invalid target', async () => {
      await expect(communicator.broadcast('invalid', 'test'))
        .rejects.toThrow('Invalid broadcast target');
    });
  });

  describe('delegateTask', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should delegate coding tasks to anga', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, response: 'done', duration: 100 });

      const result = await communicator.delegateTask('review this code');

      expect(result.assignedTo).toBe('anga');
    });

    it('should delegate marketing tasks to fabien', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, response: 'done', duration: 100 });

      const result = await communicator.delegateTask('create marketing campaign');

      expect(result.assignedTo).toBe('fabien');
    });

    it('should delegate dance tasks to marie', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, response: 'done', duration: 100 });

      const result = await communicator.delegateTask('choreography for students');

      expect(result.assignedTo).toBe('marie');
    });

    it('should default to marie for unknown tasks', async () => {
      communicator.strategies[communicator.activeStrategy].send =
        jest.fn().mockResolvedValue({ success: true, response: 'done', duration: 100 });

      const result = await communicator.delegateTask('random unknown task');

      expect(result.assignedTo).toBe('marie');
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await communicator.initialize();
    });

    it('should set initialized to false', async () => {
      await communicator.shutdown();

      expect(communicator.initialized).toBe(false);
    });

    it('should emit shutdown event', async () => {
      const handler = jest.fn();
      communicator.on('shutdown', handler);

      await communicator.shutdown();

      expect(handler).toHaveBeenCalled();
    });

    it('should clean up all strategies', async () => {
      const cleanupSpies = Object.values(communicator.strategies).map(
        strategy => jest.spyOn(strategy, 'cleanup').mockResolvedValue(undefined)
      );

      await communicator.shutdown();

      cleanupSpies.forEach(spy => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});

describe('Strategy Detection', () => {
  it('should prioritize pty-wrapper when available', async () => {
    const comm = new AgentCommunicator({ strategy: 'auto', debug: false });

    // Mock pty-wrapper as available
    comm.strategies['pty-wrapper'].isAvailable = jest.fn().mockResolvedValue(true);
    comm.strategies['tmux'].isAvailable = jest.fn().mockResolvedValue(true);

    await comm.initialize();

    expect(comm.activeStrategy).toBe('pty-wrapper');
  });

  it('should fall back to tmux when pty-wrapper unavailable', async () => {
    const comm = new AgentCommunicator({ strategy: 'auto', debug: false });

    // Mock strategies
    comm.strategies['pty-wrapper'].isAvailable = jest.fn().mockResolvedValue(false);
    comm.strategies['tmux'].isAvailable = jest.fn().mockResolvedValue(true);

    await comm.initialize();

    expect(comm.activeStrategy).toBe('tmux');
  });

  it('should fall back to file-based as last resort', async () => {
    const comm = new AgentCommunicator({ strategy: 'auto', debug: false });

    // Mock all strategies as unavailable except file-based
    comm.strategies['pty-wrapper'].isAvailable = jest.fn().mockResolvedValue(false);
    comm.strategies['tmux'].isAvailable = jest.fn().mockResolvedValue(false);
    comm.strategies['file-based'].isAvailable = jest.fn().mockResolvedValue(true);

    await comm.initialize();

    expect(comm.activeStrategy).toBe('file-based');
  });
});
