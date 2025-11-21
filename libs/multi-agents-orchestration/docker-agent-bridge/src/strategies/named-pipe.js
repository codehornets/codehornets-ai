const EventEmitter = require('eventemitter3');
const fs = require('fs');
const path = require('path');

/**
 * Named Pipe (FIFO) Strategy
 * Creates Unix named pipes for high-performance IPC
 * Performance: ~5ms latency
 */
class NamedPipeStrategy extends EventEmitter {
  constructor(docker, options = {}) {
    super();
    this.docker = docker;
    this.pipeDir = options.pipeDir || '/shared/pipes';
    this.watchers = new Map();
    this.debug = options.debug || false;
  }

  async send(targetContainer, message, options = {}) {
    const pipePath = `${this.pipeDir}/${targetContainer}_input`;

    // Ensure pipe exists in target container
    await this._ensurePipe(targetContainer, pipePath);

    // Write message to pipe
    const messageStr = JSON.stringify(message) + '\n';

    const container = this.docker.getContainer(targetContainer);
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo '${messageStr.replace(/'/g, "'\\''")}' > ${pipePath}`],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();

    return new Promise((resolve, reject) => {
      let output = '';

      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      stream.on('end', () => {
        resolve({
          strategy: 'named-pipe',
          success: true,
          target: targetContainer,
          messageId: message.id,
          timestamp: Date.now()
        });
      });

      stream.on('error', reject);
    });
  }

  async listen(containerName, options = {}) {
    const pipePath = `${this.pipeDir}/${containerName}_input`;

    // Create background reader process in container
    const container = this.docker.getContainer(containerName);

    // Setup named pipe and reader
    const setupCmd = `
      mkdir -p ${this.pipeDir}
      mkfifo ${pipePath} 2>/dev/null || true
      while true; do
        if read line < ${pipePath}; then
          echo "BRIDGE_MESSAGE:$line"
        fi
      done
    `;

    const exec = await container.exec({
      Cmd: ['sh', '-c', setupCmd],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });

    const stream = await exec.start();

    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');

      for (const line of lines) {
        if (line.startsWith('BRIDGE_MESSAGE:')) {
          try {
            const messageStr = line.substring('BRIDGE_MESSAGE:'.length);
            const message = JSON.parse(messageStr);
            this.emit('message', message);
          } catch (error) {
            if (this.debug) {
              console.error('Failed to parse message:', error);
            }
          }
        }
      }
    });

    this.watchers.set(containerName, { stream, exec });
  }

  async _ensurePipe(containerName, pipePath) {
    const container = this.docker.getContainer(containerName);

    const createPipeCmd = `mkdir -p ${this.pipeDir} && mkfifo ${pipePath} 2>/dev/null || true`;

    const exec = await container.exec({
      Cmd: ['sh', '-c', createPipeCmd],
      AttachStdout: true,
      AttachStderr: true
    });

    await exec.start();
  }

  async stop() {
    for (const [containerName, { stream }] of this.watchers) {
      if (stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    }
    this.watchers.clear();
  }
}

module.exports = NamedPipeStrategy;
