const EventEmitter = require('eventemitter3');
const fs = require('fs');

/**
 * Shared Volume Strategy
 * Uses shared filesystem with file watching
 * Performance: ~500ms latency (but most reliable)
 */
class SharedVolumeStrategy extends EventEmitter {
  constructor(docker, options = {}) {
    super();
    this.docker = docker;
    this.messagesDir = options.messagesDir || '/shared/messages';
    this.pollInterval = options.pollInterval || 500;
    this.watchers = new Map();
    this.debug = options.debug || false;
  }

  async send(targetContainer, message, options = {}) {
    const targetDir = `${this.messagesDir}/${targetContainer}`;
    const messageFile = `${targetDir}/${message.id}.json`;

    // Ensure target directory exists
    await this._ensureDirectory(targetContainer, targetDir);

    // Write message file
    const messageStr = JSON.stringify(message, null, 2);

    const container = this.docker.getContainer(targetContainer);
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo '${messageStr.replace(/'/g, "'\\''")}' > ${messageFile}`],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();

    return new Promise((resolve, reject) => {
      stream.on('end', () => {
        resolve({
          strategy: 'shared-volume',
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
    const inboxDir = `${this.messagesDir}/${containerName}`;

    // Ensure inbox exists
    await this._ensureDirectory(containerName, inboxDir);

    // Start file watcher process
    const container = this.docker.getContainer(containerName);

    const watcherCmd = `
      mkdir -p ${inboxDir}
      while true; do
        for file in ${inboxDir}/*.json; do
          if [ -f "$file" ]; then
            cat "$file"
            rm "$file"
          fi
        done
        sleep 0.5
      done
    `;

    const exec = await container.exec({
      Cmd: ['sh', '-c', watcherCmd],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });

    const stream = await exec.start();

    stream.on('data', (chunk) => {
      try {
        const message = JSON.parse(chunk.toString());
        this.emit('message', message);
      } catch (error) {
        // Might be partial data, ignore
        if (this.debug) {
          console.error('Failed to parse message:', error);
        }
      }
    });

    this.watchers.set(containerName, { stream, exec });
  }

  async _ensureDirectory(containerName, dirPath) {
    const container = this.docker.getContainer(containerName);

    const exec = await container.exec({
      Cmd: ['mkdir', '-p', dirPath],
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

module.exports = SharedVolumeStrategy;
