const EventEmitter = require('eventemitter3');

/**
 * Exec Strategy
 * Uses docker exec to run commands in target container
 * Performance: ~50ms latency
 * Universal fallback - works everywhere
 */
class ExecStrategy extends EventEmitter {
  constructor(docker, options = {}) {
    super();
    this.docker = docker;
    this.debug = options.debug || false;
  }

  async send(targetContainer, message, options = {}) {
    const container = this.docker.getContainer(targetContainer);

    // Format message for echo
    const messageStr = JSON.stringify(message);
    const formattedMessage = this._formatMessage(message, options);

    // Execute echo command to display message
    const displayCmd = `echo -e "${formattedMessage}"`;

    const exec = await container.exec({
      Cmd: ['sh', '-c', displayCmd],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });

    const stream = await exec.start();

    return new Promise((resolve, reject) => {
      let output = '';

      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      stream.on('end', () => {
        resolve({
          strategy: 'exec',
          success: true,
          target: targetContainer,
          messageId: message.id,
          output: output,
          timestamp: Date.now()
        });
      });

      stream.on('error', reject);
    });
  }

  _formatMessage(message, options = {}) {
    const prefix = options.prefix || '📨';
    const separator = '─'.repeat(60);

    // Escape for shell
    const payload = message.payload
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');

    return `\\n${separator}\\n${prefix} MESSAGE FROM: ${message.from}\\nTO: ${message.to}\\nTIME: ${new Date(message.timestamp).toISOString()}\\n${separator}\\n${payload}\\n${separator}\\n`;
  }

  // Exec strategy doesn't support native listening
  // Could be extended to poll a shared location
  async listen(containerName, options = {}) {
    if (this.debug) {
      console.warn('Exec strategy has limited listening support');
    }

    // Basic implementation: could poll for messages
    // For now, just log that we're in listening mode
    return;
  }
}

module.exports = ExecStrategy;
