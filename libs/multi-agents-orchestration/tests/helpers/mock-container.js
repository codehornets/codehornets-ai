/**
 * Mock Docker Container for Testing
 *
 * Provides a mock implementation of Docker container functionality
 * for unit testing without requiring actual Docker daemon.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { Readable, Writable } = require('stream');

/**
 * Mock stream for exec operations
 */
class MockExecStream extends Readable {
  constructor(options = {}) {
    super(options);
    this.output = options.output || '';
    this.delay = options.delay || 10;
    this._sent = false;
  }

  _read() {
    if (!this._sent) {
      this._sent = true;
      setTimeout(() => {
        this.push(this.output);
        this.push(null);
      }, this.delay);
    }
  }
}

/**
 * Mock exec result
 */
class MockExec {
  constructor(container, options = {}) {
    this.container = container;
    this.cmd = options.Cmd || [];
    this.attachStdout = options.AttachStdout || false;
    this.attachStderr = options.AttachStderr || false;
    this.tty = options.Tty || false;
    this.started = false;
    this.exitCode = 0;
  }

  async start() {
    this.started = true;

    // Simulate command execution
    const cmdStr = this.cmd.join(' ');
    let output = '';

    // Handle common commands
    if (cmdStr.includes('echo')) {
      const match = cmdStr.match(/echo ['"](.*)['"]/);
      output = match ? match[1] + '\n' : '\n';
    } else if (cmdStr.includes('mkfifo')) {
      output = ''; // Silent success
    } else if (cmdStr.includes('mkdir')) {
      output = ''; // Silent success
    } else if (cmdStr.includes('tty')) {
      output = '/dev/pts/0\n';
    } else if (cmdStr.includes('ps')) {
      output = 'PID TTY TIME CMD\n1 pts/0 00:00:00 node\n';
    }

    // Record the command for testing
    this.container._recordCommand(cmdStr, output);

    return new MockExecStream({ output });
  }

  async inspect() {
    return {
      ExitCode: this.exitCode,
      Running: !this.started
    };
  }
}

/**
 * Mock Docker Container
 */
class MockContainer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.id = options.id || `mock_${Date.now()}`;
    this.name = options.name || 'mock-container';
    this.state = {
      Running: options.running !== undefined ? options.running : true,
      Paused: false,
      Restarting: false,
      OOMKilled: false,
      Dead: false,
      Pid: options.pid || 12345,
      ExitCode: 0,
      StartedAt: new Date().toISOString()
    };
    this.config = {
      Tty: options.tty !== undefined ? options.tty : true,
      OpenStdin: options.stdin !== undefined ? options.stdin : true
    };

    // Track executed commands for verification
    this._executedCommands = [];
    this._messageQueue = [];
    this._attachStream = null;
  }

  /**
   * Record executed command for test verification
   */
  _recordCommand(cmd, output) {
    this._executedCommands.push({
      cmd,
      output,
      timestamp: Date.now()
    });
  }

  /**
   * Get executed commands for verification
   */
  getExecutedCommands() {
    return [...this._executedCommands];
  }

  /**
   * Clear executed commands
   */
  clearCommands() {
    this._executedCommands = [];
  }

  /**
   * Inspect container
   */
  async inspect() {
    return {
      Id: this.id,
      Name: `/${this.name}`,
      State: { ...this.state },
      Config: { ...this.config },
      NetworkSettings: {
        IPAddress: '172.17.0.2'
      }
    };
  }

  /**
   * Execute command in container
   */
  async exec(options = {}) {
    return new MockExec(this, options);
  }

  /**
   * Attach to container
   */
  async attach(options = {}) {
    const stream = new MockAttachStream(this, options);
    this._attachStream = stream;
    return stream;
  }

  /**
   * Start container
   */
  async start() {
    this.state.Running = true;
    this.emit('start');
  }

  /**
   * Stop container
   */
  async stop() {
    this.state.Running = false;
    this.emit('stop');
  }

  /**
   * Kill container
   */
  async kill(options = {}) {
    const signal = options.signal || 'SIGKILL';
    this.state.Running = false;
    this.emit('kill', signal);
  }

  /**
   * Remove container
   */
  async remove() {
    this.emit('remove');
  }

  /**
   * Get container logs
   */
  async logs(options = {}) {
    return new MockExecStream({ output: 'Mock container logs\n' });
  }

  /**
   * Simulate receiving a message
   */
  simulateMessage(message) {
    this._messageQueue.push(message);
    if (this._attachStream) {
      this._attachStream.push(JSON.stringify(message) + '\n');
    }
    this.emit('message', message);
  }

  /**
   * Simulate container crash
   */
  simulateCrash() {
    this.state.Running = false;
    this.state.ExitCode = 1;
    this.emit('crash');
    this.emit('die', { exitCode: 1 });
  }

  /**
   * Simulate container restart
   */
  simulateRestart() {
    this.state.Running = false;
    this.emit('stop');

    setTimeout(() => {
      this.state.Running = true;
      this.state.ExitCode = 0;
      this.emit('start');
      this.emit('restart');
    }, 100);
  }
}

/**
 * Mock attach stream
 */
class MockAttachStream extends Readable {
  constructor(container, options = {}) {
    super(options);
    this.container = container;
    this.hijack = options.hijack || false;
    this._stdin = new Writable({
      write: (chunk, encoding, callback) => {
        container._recordCommand(`stdin: ${chunk.toString()}`, '');
        callback();
      }
    });
  }

  _read() {
    // Messages are pushed by simulateMessage
  }

  get stdin() {
    return this._stdin;
  }
}

/**
 * Mock Docker API (dockerode-compatible)
 */
class MockDocker {
  constructor(options = {}) {
    this.socketPath = options.socketPath || '/var/run/docker.sock';
    this._containers = new Map();
    this._images = new Map();
  }

  /**
   * Add a mock container
   */
  addContainer(name, options = {}) {
    const container = new MockContainer({ ...options, name });
    this._containers.set(name, container);
    return container;
  }

  /**
   * Get container by name or ID
   */
  getContainer(nameOrId) {
    // Try to find by exact name
    if (this._containers.has(nameOrId)) {
      return this._containers.get(nameOrId);
    }

    // Try to find by ID prefix
    for (const [name, container] of this._containers) {
      if (container.id.startsWith(nameOrId)) {
        return container;
      }
    }

    // Return a new mock container that doesn't exist
    const notFoundContainer = new MockContainer({
      name: nameOrId,
      running: false
    });

    // Override inspect to throw not found error
    notFoundContainer.inspect = async () => {
      const error = new Error(`No such container: ${nameOrId}`);
      error.statusCode = 404;
      throw error;
    };

    return notFoundContainer;
  }

  /**
   * List containers
   */
  async listContainers(options = {}) {
    const containers = [];

    for (const [name, container] of this._containers) {
      const info = await container.inspect();

      // Filter by running state if specified
      if (options.all || info.State.Running) {
        containers.push({
          Id: container.id,
          Names: [`/${name}`],
          State: info.State.Running ? 'running' : 'exited',
          Status: info.State.Running ? 'Up 1 hour' : 'Exited (0)'
        });
      }
    }

    return containers;
  }

  /**
   * Get Docker info
   */
  async info() {
    return {
      Containers: this._containers.size,
      ContainersRunning: Array.from(this._containers.values())
        .filter(c => c.state.Running).length,
      ContainersPaused: 0,
      ContainersStopped: Array.from(this._containers.values())
        .filter(c => !c.state.Running).length,
      Images: this._images.size,
      ServerVersion: '20.10.0-mock',
      OperatingSystem: 'Mock OS'
    };
  }

  /**
   * Get Docker version
   */
  async version() {
    return {
      Version: '20.10.0-mock',
      ApiVersion: '1.41',
      MinAPIVersion: '1.12',
      GitCommit: 'mock',
      GoVersion: 'go1.16',
      Os: 'linux',
      Arch: 'amd64'
    };
  }

  /**
   * Ping Docker daemon
   */
  async ping() {
    return 'OK';
  }

  /**
   * Get events stream
   */
  async getEvents(options = {}) {
    return new EventEmitter();
  }

  /**
   * Clear all containers
   */
  reset() {
    this._containers.clear();
    this._images.clear();
  }
}

/**
 * Create a pre-configured mock Docker instance for orchestration tests
 */
function createOrchestrationMockDocker() {
  const docker = new MockDocker();

  // Add orchestrator container
  docker.addContainer('codehornets-orchestrator', {
    id: 'orch123456789',
    running: true,
    tty: true,
    stdin: true
  });

  // Add worker containers
  docker.addContainer('codehornets-worker-marie', {
    id: 'marie123456789',
    running: true,
    tty: true,
    stdin: true
  });

  docker.addContainer('codehornets-worker-anga', {
    id: 'anga123456789',
    running: true,
    tty: true,
    stdin: true
  });

  docker.addContainer('codehornets-worker-fabien', {
    id: 'fabien123456789',
    running: true,
    tty: true,
    stdin: true
  });

  return docker;
}

module.exports = {
  MockContainer,
  MockDocker,
  MockExec,
  MockExecStream,
  MockAttachStream,
  createOrchestrationMockDocker
};
