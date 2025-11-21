const EventEmitter = require('eventemitter3');

/**
 * TTY Injection Strategy
 * Writes directly to the TTY device of the target container
 * Performance: ~10ms latency
 * The "genius hacker" approach - bypasses everything
 */
class TTYStrategy extends EventEmitter {
  constructor(docker, options = {}) {
    super();
    this.docker = docker;
    this.debug = options.debug || false;
  }

  async send(targetContainer, message, options = {}) {
    const container = this.docker.getContainer(targetContainer);

    // Find the TTY device
    const ttyDevice = await this._findTTY(container);

    if (!ttyDevice) {
      throw new Error('No TTY found in target container');
    }

    // Format message for terminal display
    const formattedMessage = this._formatForTerminal(message, options);

    // Write directly to TTY device
    const writeCmd = `echo -e "${formattedMessage}" > ${ttyDevice}`;

    const exec = await container.exec({
      Cmd: ['sh', '-c', writeCmd],
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
          strategy: 'tty-injection',
          success: true,
          target: targetContainer,
          tty: ttyDevice,
          messageId: message.id,
          timestamp: Date.now()
        });
      });

      stream.on('error', reject);
    });
  }

  async _findTTY(container) {
    // Find process using TTY
    const exec = await container.exec({
      Cmd: ['sh', '-c', 'ps aux | grep -E "claude|bash|sh" | grep -v grep | head -1 | awk \'{print $7}\''],
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
        const tty = output.trim();
        // Common TTY patterns: tty1, pts/0, etc.
        if (tty && (tty.startsWith('tty') || tty.startsWith('pts/'))) {
          resolve(`/dev/${tty}`);
        } else {
          // Fallback to /dev/tty
          resolve('/dev/tty');
        }
      });

      stream.on('error', reject);
    });
  }

  _formatForTerminal(message, options = {}) {
    const prefix = options.prefix || '📨';
    const separator = '═'.repeat(60);

    // Escape for shell
    const payload = message.payload.replace(/"/g, '\\"').replace(/\$/g, '\\$');

    return `\\n\\n${separator}\\n${prefix} MESSAGE FROM ${message.from.toUpperCase()}\\n${separator}\\n${payload}\\n${separator}\\n\\n`;
  }

  // TTY strategy doesn't support listening (messages are injected)
  async listen(containerName, options = {}) {
    throw new Error('TTY strategy does not support listening');
  }
}

module.exports = TTYStrategy;
