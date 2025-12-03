#!/usr/bin/env node
/**
 * claude-bridge.mjs - Simple bridge between two Claude instances
 * 
 * Starts two Claude instances with separate sockets.
 * You can inject to either, or set up auto-forwarding.
 * 
 * Usage:
 *   node claude-bridge.mjs
 * 
 * Then from another terminal:
 *   # Send to Claude A
 *   echo "hello" | nc -U /tmp/claude-a.sock
 *   
 *   # Send to Claude B  
 *   echo "hello" | nc -U /tmp/claude-b.sock
 *   
 *   # Or use the bridge commands:
 *   echo "A:hello from A" | nc -U /tmp/claude-bridge.sock  # sends to A
 *   echo "B:hello from B" | nc -U /tmp/claude-bridge.sock  # sends to B
 *   echo "FORWARD:A->B" | nc -U /tmp/claude-bridge.sock    # auto-forward A's responses to B
 */

import pty from 'node-pty';
import net from 'net';
import fs from 'fs';

const SOCKET_A = '/tmp/claude-a.sock';
const SOCKET_B = '/tmp/claude-b.sock';
const SOCKET_BRIDGE = '/tmp/claude-bridge.sock';

// Clean up old sockets
[SOCKET_A, SOCKET_B, SOCKET_BRIDGE].forEach(s => { try { fs.unlinkSync(s); } catch {} });

const colors = {
    A: '\x1b[36m',      // Cyan
    B: '\x1b[35m',      // Magenta
    bridge: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
};

function log(source, msg) {
    const color = colors[source] || '';
    console.log(`${color}[${source}]${colors.reset} ${msg}`);
}

class ClaudeAgent {
    constructor(name, socketPath) {
        this.name = name;
        this.socketPath = socketPath;
        this.forwardTo = null;
        this.responseBuffer = '';
        this.isResponding = false;
        this.idleTimer = null;
    }

    start() {
        this.proc = pty.spawn('claude', [], {
            name: 'xterm-256color',
            cols: 120,
            rows: 40,
            cwd: process.cwd(),
            env: { ...process.env, TERM: 'xterm-256color' }
        });

        this.proc.onData(data => {
            // Color and display
            const color = colors[this.name] || '';
            process.stdout.write(`${color}[${this.name}]${colors.reset} `);
            process.stdout.write(data.replace(/\n/g, `\n${color}[${this.name}]${colors.reset} `));
            
            // Track responses for forwarding
            if (this.isResponding) {
                this.responseBuffer += data;
                
                if (this.idleTimer) clearTimeout(this.idleTimer);
                
                // Detect response end
                if (data.includes('\n> ')) {
                    this.idleTimer = setTimeout(() => this.finishResponse(), 300);
                } else {
                    this.idleTimer = setTimeout(() => this.finishResponse(), 1500);
                }
            }
        });

        // Injection socket
        this.server = net.createServer(socket => {
            let buf = '';
            socket.on('data', chunk => { buf += chunk.toString(); });
            socket.on('end', () => {
                const input = buf.replace(/[\r\n]+/g, '');
                if (input) this.inject(input);
                socket.end('OK\n');
            });
        });

        this.server.listen(this.socketPath, () => {
            fs.chmodSync(this.socketPath, 0o666);
            log(this.name, `Socket: ${this.socketPath}`);
        });

        this.proc.onExit(({ exitCode }) => {
            log(this.name, `Exited (${exitCode})`);
            this.server.close();
            try { fs.unlinkSync(this.socketPath); } catch {}
        });
    }

    inject(text) {
        log(this.name, `← Inject: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`);
        this.isResponding = true;
        this.responseBuffer = '';
        this.proc.write(text);
        setTimeout(() => this.proc.write('\r'), 50);
    }

    finishResponse() {
        if (!this.isResponding) return;
        this.isResponding = false;
        
        // Extract response text
        let response = this.responseBuffer
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')  // Remove ANSI
            .replace(/●\s*/g, '')                   // Remove bullet
            .trim();
        
        // Get just the actual response part
        const lines = response.split('\n').filter(l => 
            l.trim() && 
            !l.includes('> ') && 
            !l.includes('shortcuts')
        );
        response = lines.join('\n').trim();
        
        this.responseBuffer = '';
        
        if (response && this.forwardTo) {
            log('bridge', `Forwarding ${this.name} → ${this.forwardTo.name}`);
            setTimeout(() => {
                this.forwardTo.inject(`[From ${this.name}]: ${response}`);
            }, 500);
        }
    }

    kill() {
        this.proc.kill();
    }
}

// Create agents
const agentA = new ClaudeAgent('A', SOCKET_A);
const agentB = new ClaudeAgent('B', SOCKET_B);

console.log('\n🤖 Claude Bridge - Two Agents\n');

// Start both
agentA.start();
agentB.start();

// Bridge control socket
const bridgeServer = net.createServer(socket => {
    let buf = '';
    socket.on('data', chunk => { buf += chunk.toString(); });
    socket.on('end', () => {
        const cmd = buf.trim();
        
        if (cmd.startsWith('A:')) {
            agentA.inject(cmd.slice(2));
            socket.end('Sent to A\n');
        } else if (cmd.startsWith('B:')) {
            agentB.inject(cmd.slice(2));
            socket.end('Sent to B\n');
        } else if (cmd === 'FORWARD:A->B') {
            agentA.forwardTo = agentB;
            log('bridge', 'Auto-forward: A → B enabled');
            socket.end('Forwarding A->B\n');
        } else if (cmd === 'FORWARD:B->A') {
            agentB.forwardTo = agentA;
            log('bridge', 'Auto-forward: B → A enabled');
            socket.end('Forwarding B->A\n');
        } else if (cmd === 'FORWARD:BOTH') {
            agentA.forwardTo = agentB;
            agentB.forwardTo = agentA;
            log('bridge', 'Auto-forward: A ↔ B enabled (conversation mode)');
            socket.end('Bidirectional forwarding enabled\n');
        } else if (cmd === 'FORWARD:STOP') {
            agentA.forwardTo = null;
            agentB.forwardTo = null;
            log('bridge', 'Auto-forward disabled');
            socket.end('Forwarding stopped\n');
        } else if (cmd === 'STATUS') {
            const status = `A→${agentA.forwardTo?.name || 'none'}, B→${agentB.forwardTo?.name || 'none'}`;
            socket.end(`Status: ${status}\n`);
        } else {
            socket.end('Commands: A:msg, B:msg, FORWARD:A->B, FORWARD:B->A, FORWARD:BOTH, FORWARD:STOP, STATUS\n');
        }
    });
});

bridgeServer.listen(SOCKET_BRIDGE, () => {
    fs.chmodSync(SOCKET_BRIDGE, 0o666);
    log('bridge', `Control socket: ${SOCKET_BRIDGE}`);
});

console.log(`
Commands (from another terminal):
  echo "A:hello" | nc -U ${SOCKET_BRIDGE}     # Send to A
  echo "B:hello" | nc -U ${SOCKET_BRIDGE}     # Send to B
  echo "FORWARD:BOTH" | nc -U ${SOCKET_BRIDGE}  # Enable conversation mode
  echo "STATUS" | nc -U ${SOCKET_BRIDGE}      # Check status

Direct injection:
  echo "prompt" | nc -U ${SOCKET_A}           # Direct to A
  echo "prompt" | nc -U ${SOCKET_B}           # Direct to B

Press Ctrl+C to stop both agents.
${'─'.repeat(60)}
`);

process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping agents...');
    agentA.kill();
    agentB.kill();
    bridgeServer.close();
    try { fs.unlinkSync(SOCKET_BRIDGE); } catch {}
    process.exit();
});