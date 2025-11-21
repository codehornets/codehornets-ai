const EventEmitter = require('eventemitter3');

/**
 * Signal Strategy
 * Uses Unix signals (SIGUSR1) to trigger message reading
 * Performance: ~15ms latency
 * Works only on Unix-based systems
 */
class SignalStrategy extends EventEmitter {
  constructor(docker, options = {}) {
    super();
    this.docker = docker;
    this.messagesDir = options.messagesDir || '/tmp/bridge-messages';
    this.watchers = new Map();
    this.debug = options.debug || false;
  }

  async send(targetContainer, message, options = {}) {
    const messageFile = `${this.messagesDir}/${message.id}.json`;

    const container = this.docker.getContainer(targetContainer);

    // Write message to file
    const messageStr = JSON.stringify(message);
    const writeCmd = `mkdir -p ${this.messagesDir} && echo '${messageStr.replace(/'/g, "'\\''")}' > ${messageFile}`;

    const writeExec = await container.exec({
      Cmd: ['sh', '-c', writeCmd],
      AttachStdout: true,
      AttachStderr: true
    });

    await writeExec.start();

    // Send SIGUSR1 to trigger read
    const signalCmd = `pkill -USR1 -f "bridge-signal-handler"`;

    const signalExec = await container.exec({
      Cmd: ['sh', '-c', signalCmd],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await signalExec.start();

    return new Promise((resolve, reject) => {
      stream.on('end', () => {
        resolve({
          strategy: 'signal',
          success: true,
          target: targetContainer,
          messageId: message.id,
          file: messageFile,
          timestamp: Date.now()
        });
      });

      stream.on('error', reject);
    });
  }

  async listen(containerName, options = {}) {
    const container = this.docker.getContainer(containerName);

    // Setup signal handler process
    const handlerCmd = `
      mkdir -p ${this.messagesDir}

      # Signal handler function
      handle_signal() {
        for file in ${this.messagesDir}/*.json; do
          if [ -f "$file" ]; then
            cat "$file"
            rm "$file"
          fi
        done
      }

      # Register signal handler
      trap handle_signal USR1

      # Keep process alive with identifiable name
      while true; do
        sleep 1
      done &

      # Store PID for signal handling
      echo $! > ${this.messagesDir}/handler.pid

      # Tag the process
      exec -a bridge-signal-handler sleep infinity
    `;

    const exec = await container.exec({
      Cmd: ['sh', '-c', handlerCmd],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Detach: false
    });

    const stream = await exec.start();

    stream.on('data', (chunk) => {
      try {
        const message = JSON.parse(chunk.toString());
        this.emit('message', message);
      } catch (error) {
        if (this.debug) {
          console.error('Failed to parse message:', error);
        }
      }
    });

    this.watchers.set(containerName, { stream, exec });
  }

  async stop() {
    for (const [containerName, { stream }] of this.watchers) {
      // Kill signal handler process
      const container = this.docker.getContainer(containerName);

      try {
        const killExec = await container.exec({
          Cmd: ['sh', '-c', 'pkill -f "bridge-signal-handler"'],
          AttachStdout: true,
          AttachStderr: true
        });

        await killExec.start();
      } catch (error) {
        // Ignore errors
      }

      if (stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    }

    this.watchers.clear();
  }
}

module.exports = SignalStrategy;
