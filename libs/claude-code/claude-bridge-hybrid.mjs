#!/usr/bin/env node
/**
 * claude-bridge-hybrid.mjs
 * 
 * Uses:
 * - PTY to spawn Claude (for interactive TUI)
 * - Socket events for clean response detection (no ANSI parsing!)
 * 
 * Requires patched cli.js with socket event system.
 * 
 * Setup:
 *   1. node patch-cli-socket.mjs ~/.npm/.../cli.js ~/.npm/.../cli_patched.js
 *   2. Backup original, replace with patched
 *   3. node claude-bridge-hybrid.mjs
 */

import pty from 'node-pty';
import net from 'net';
import fs from 'fs';
import readline from 'readline';

const SOCKET_A = '/tmp/claude-a-events.sock';
const SOCKET_B = '/tmp/claude-b-events.sock';
const SOCKET_BRIDGE = '/tmp/claude-bridge.sock';

// Clean up
[SOCKET_A, SOCKET_B, SOCKET_BRIDGE].forEach(s => { try { fs.unlinkSync(s); } catch {} });

const colors = { A: '\x1b[36m', B: '\x1b[35m', bridge: '\x1b[33m', reset: '\x1b[0m' };
const log = (src, msg) => console.log(`${colors[src]||''}[${src}]${colors.reset} ${msg}`);

class ClaudeAgent {
    constructor(name, eventSocketPath) {
        this.name = name;
        this.eventSocketPath = eventSocketPath;
        this.forwardTo = null;
        this.proc = null;
        this.eventClient = null;
    }

    start() {
        return new Promise((resolve, reject) => {
            // Spawn Claude in PTY with custom socket path
            this.proc = pty.spawn('claude', [], {
                name: 'xterm-256color',
                cols: 120,
                rows: 40,
                cwd: process.cwd(),
                env: { 
                    ...process.env, 
                    CLAUDE_SOCKET: this.eventSocketPath,
                    TERM: 'xterm-256color'
                }
            });

            // Display PTY output
            this.proc.onData(data => {
                const c = colors[this.name];
                process.stdout.write(`${c}[${this.name}]${colors.reset} `);
                process.stdout.write(data.replace(/\n/g, `\n${c}[${this.name}]${colors.reset} `));
            });

            this.proc.onExit(({ exitCode }) => {
                log(this.name, `Exited (${exitCode})`);
                if (this.eventClient) this.eventClient.destroy();
            });

            // Wait for event socket, then connect
            const waitAndConnect = (attempts = 0) => {
                if (attempts > 50) {
                    log(this.name, 'Timeout waiting for event socket');
                    resolve(); // Continue anyway
                    return;
                }
                
                if (fs.existsSync(this.eventSocketPath)) {
                    setTimeout(() => {
                        this.connectEventSocket();
                        resolve();
                    }, 200);
                } else {
                    setTimeout(() => waitAndConnect(attempts + 1), 200);
                }
            };
            
            setTimeout(waitAndConnect, 1000);
        });
    }

    connectEventSocket() {
        this.eventClient = net.connect(this.eventSocketPath, () => {
            log(this.name, `Event socket connected: ${this.eventSocketPath}`);
        });

        // Parse JSON events line by line
        const rl = readline.createInterface({ input: this.eventClient });
        
        rl.on('line', line => {
            try {
                const event = JSON.parse(line);
                this.handleEvent(event);
            } catch (e) {
                // Ignore non-JSON
            }
        });

        this.eventClient.on('error', err => {
            // Socket errors are usually just disconnects
        });

        this.eventClient.on('close', () => {
            log(this.name, 'Event socket closed');
        });
    }

    handleEvent(event) {
        if (event.type === 'response' && event.text) {
            log('bridge', `${this.name} completed response (${event.text.length} chars)`);
            
            // Forward to other agent - clean text, no ANSI!
            if (this.forwardTo) {
                log('bridge', `→ Forwarding to ${this.forwardTo.name}`);
                setTimeout(() => {
                    this.forwardTo.inject(`${this.name} says: ${event.text}`);
                }, 1000);
            }
        }
    }

    inject(text) {
        // Option 1: Send via event socket (if connected)
        if (this.eventClient && !this.eventClient.destroyed) {
            const cmd = JSON.stringify({ type: 'inject', text, autoSubmit: true }) + '\n';
            this.eventClient.write(cmd);
            log(this.name, `← Injected via socket: "${text.substring(0, 50)}..."`);
            return;
        }
        
        // Option 2: Fallback to PTY write
        log(this.name, `← Injected via PTY: "${text.substring(0, 50)}..."`);
        const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
        this.proc.write(cleanText);
        setTimeout(() => this.proc.write('\r'), 50);
    }

    kill() {
        if (this.eventClient) this.eventClient.destroy();
        if (this.proc) this.proc.kill();
    }
}

async function main() {
    console.log('\n🤖 Claude Bridge (Hybrid: PTY + Socket Events)\n');
    console.log('Requires: Patched cli.js with socket event system');
    console.log('If events don\'t work, run: node patch-cli-socket.mjs\n');

    const agentA = new ClaudeAgent('A', SOCKET_A);
    const agentB = new ClaudeAgent('B', SOCKET_B);

    log('bridge', 'Starting Agent A...');
    await agentA.start();
    
    log('bridge', 'Starting Agent B...');
    await agentB.start();

    log('bridge', 'Both agents started!');

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
            } else {
                socket.end('A:msg | B:msg | FORWARD:BOTH | FORWARD:STOP\n');
            }
        });
    });

    bridgeServer.listen(SOCKET_BRIDGE, () => {
        fs.chmodSync(SOCKET_BRIDGE, 0o666);
        log('bridge', `Control socket: ${SOCKET_BRIDGE}`);
    });

    console.log(`
Commands:
  node -e "require('net').connect('/tmp/claude-bridge.sock').end('FORWARD:BOTH')"
  node -e "require('net').connect('/tmp/claude-bridge.sock').end('A:Hello!')"
`);

    process.on('SIGINT', () => {
        log('bridge', 'Shutting down...');
        agentA.kill();
        agentB.kill();
        bridgeServer.close();
        process.exit();
    });
}

main().catch(console.error);
