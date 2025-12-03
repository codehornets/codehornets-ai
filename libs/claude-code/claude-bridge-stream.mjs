#!/usr/bin/env node
/**
 * claude-bridge-stream.mjs
 * 
 * Two Claude instances communicating via streaming JSON.
 * Requires patched cli.js (use patch-cli-stream.mjs)
 * 
 * Each Claude streams its response in real-time as JSON chunks.
 * When one finishes, its full response is forwarded to the other.
 */

import pty from 'node-pty';
import net from 'net';
import fs from 'fs';
import readline from 'readline';

const SOCKET_A = '/tmp/claude-a.sock';
const SOCKET_B = '/tmp/claude-b.sock';
const SOCKET_BRIDGE = '/tmp/claude-bridge.sock';

// Clean up
[SOCKET_A, SOCKET_B, SOCKET_BRIDGE].forEach(s => { try { fs.unlinkSync(s); } catch {} });

const colors = { A: '\x1b[36m', B: '\x1b[35m', bridge: '\x1b[33m', reset: '\x1b[0m' };
const log = (src, msg) => console.log(`${colors[src]||''}[${src}]${colors.reset} ${msg}`);

class ClaudeAgent {
    constructor(name, socketPath) {
        this.name = name;
        this.socketPath = socketPath;
        this.forwardTo = null;
        this.proc = null;
        this.streamClient = null;
        this.currentResponse = '';
        this.isResponding = false;
    }

    start() {
        return new Promise((resolve) => {
            // Spawn Claude with custom socket path
            this.proc = pty.spawn('claude', [], {
                name: 'xterm-256color',
                cols: 120,
                rows: 40,
                cwd: process.cwd(),
                env: { 
                    ...process.env, 
                    CLAUDE_SOCKET: this.socketPath,
                    TERM: 'xterm-256color'
                }
            });

            // Display PTY output (the TUI)
            this.proc.onData(data => {
                const c = colors[this.name];
                process.stdout.write(`${c}[${this.name}]${colors.reset} `);
                process.stdout.write(data.replace(/\n/g, `\n${c}[${this.name}]${colors.reset} `));
            });

            this.proc.onExit(({ exitCode }) => {
                log(this.name, `Exited (${exitCode})`);
                if (this.streamClient) this.streamClient.destroy();
            });

            // Wait for socket, then connect
            const waitForSocket = (attempts = 0) => {
                if (attempts > 50) {
                    log(this.name, 'Socket timeout - continuing anyway');
                    resolve();
                    return;
                }
                if (fs.existsSync(this.socketPath)) {
                    setTimeout(() => {
                        this.connectStream();
                        resolve();
                    }, 300);
                } else {
                    setTimeout(() => waitForSocket(attempts + 1), 200);
                }
            };
            setTimeout(waitForSocket, 1000);
        });
    }

    connectStream() {
        this.streamClient = net.connect(this.socketPath, () => {
            log(this.name, `Stream connected: ${this.socketPath}`);
        });

        const rl = readline.createInterface({ input: this.streamClient });

        rl.on('line', line => {
            try {
                const event = JSON.parse(line);
                this.handleStreamEvent(event);
            } catch (e) {
                // Ignore non-JSON
            }
        });

        this.streamClient.on('error', () => {});
        this.streamClient.on('close', () => {
            log(this.name, 'Stream disconnected');
        });
    }

    handleStreamEvent(event) {
        switch (event.type) {
            case 'start':
                this.isResponding = true;
                this.currentResponse = '';
                log(this.name, '⏳ Streaming...');
                break;

            case 'text':
                // Accumulate the full response
                this.currentResponse = event.full || (this.currentResponse + event.chunk);
                // Show streaming progress (optional - can be noisy)
                // process.stdout.write(`${colors[this.name]}◦${colors.reset}`);
                break;

            case 'stop':
                this.isResponding = false;
                log(this.name, `✓ Response complete (${this.currentResponse.length} chars)`);
                
                // Forward to other agent
                if (this.forwardTo && this.currentResponse.trim()) {
                    log('bridge', `→ Forwarding to ${this.forwardTo.name}`);
                    setTimeout(() => {
                        this.forwardTo.inject(`${this.name} says: ${this.currentResponse}`);
                    }, 1000);
                }
                break;

            case 'error':
                log(this.name, `Error: ${event.message}`);
                break;
        }
    }

    inject(text) {
        if (this.streamClient && !this.streamClient.destroyed) {
            // Use JSON protocol
            const msg = JSON.stringify({ type: 'inject', text }) + '\n';
            this.streamClient.write(msg);
            log(this.name, `← Inject: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
        } else {
            // Fallback to PTY
            const clean = text.replace(/[\r\n]+/g, ' ').trim();
            this.proc.write(clean);
            setTimeout(() => this.proc.write('\r'), 50);
            log(this.name, `← PTY Inject: "${clean.substring(0, 60)}..."`);
        }
    }

    kill() {
        if (this.streamClient) this.streamClient.destroy();
        if (this.proc) this.proc.kill();
    }
}

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🤖 Claude Bridge (Streaming JSON)                    ║
║                                                              ║
║  Requires: Patched cli.js (run patch-cli-stream.mjs first)   ║
╚══════════════════════════════════════════════════════════════╝
`);

    const agentA = new ClaudeAgent('A', SOCKET_A);
    const agentB = new ClaudeAgent('B', SOCKET_B);

    log('bridge', 'Starting Agent A...');
    await agentA.start();

    log('bridge', 'Starting Agent B...');
    await agentB.start();

    log('bridge', 'Both agents ready!');

    // Bridge control socket
    const bridgeServer = net.createServer(socket => {
        let buf = '';
        socket.on('data', c => buf += c.toString());
        socket.on('end', () => {
            const cmd = buf.replace(/[\r\n]+/g, '').trim();

            if (cmd.startsWith('A:')) {
                agentA.inject(cmd.slice(2));
                socket.end('OK\n');
            } else if (cmd.startsWith('B:')) {
                agentB.inject(cmd.slice(2));
                socket.end('OK\n');
            } else if (cmd === 'FORWARD:BOTH') {
                agentA.forwardTo = agentB;
                agentB.forwardTo = agentA;
                log('bridge', '✓ Conversation mode ON');
                socket.end('OK\n');
            } else if (cmd === 'FORWARD:STOP') {
                agentA.forwardTo = null;
                agentB.forwardTo = null;
                log('bridge', '✗ Forwarding OFF');
                socket.end('OK\n');
            } else if (cmd === 'FORWARD:A->B') {
                agentA.forwardTo = agentB;
                agentB.forwardTo = null;
                log('bridge', '→ A→B forwarding');
                socket.end('OK\n');
            } else if (cmd === 'FORWARD:B->A') {
                agentB.forwardTo = agentA;
                agentA.forwardTo = null;
                log('bridge', '← B→A forwarding');
                socket.end('OK\n');
            } else if (cmd === 'STATUS') {
                const status = JSON.stringify({
                    A: { responding: agentA.isResponding, forwardTo: agentA.forwardTo?.name },
                    B: { responding: agentB.isResponding, forwardTo: agentB.forwardTo?.name }
                });
                socket.end(status + '\n');
            } else {
                socket.end('Commands: A:msg | B:msg | FORWARD:BOTH | FORWARD:A->B | FORWARD:B->A | FORWARD:STOP | STATUS\n');
            }
        });
    });

    bridgeServer.listen(SOCKET_BRIDGE, () => {
        fs.chmodSync(SOCKET_BRIDGE, 0o666);
        log('bridge', `Control: ${SOCKET_BRIDGE}`);
    });

    console.log(`
Commands:
  # Enable conversation mode
  node -e "require('net').connect('${SOCKET_BRIDGE}').end('FORWARD:BOTH')"
  
  # Send to Agent A
  node -e "require('net').connect('${SOCKET_BRIDGE}').end('A:Debate AI consciousness with B')"
  
  # Check status
  node -e "require('net').connect('${SOCKET_BRIDGE}').on('data',d=>console.log(d.toString())).end('STATUS')"
`);

    process.on('SIGINT', () => {
        console.log('\n');
        log('bridge', 'Shutting down...');
        agentA.kill();
        agentB.kill();
        bridgeServer.close();
        [SOCKET_A, SOCKET_B, SOCKET_BRIDGE].forEach(s => { try { fs.unlinkSync(s); } catch {} });
        process.exit();
    });
}

main().catch(console.error);
