#!/usr/bin/env node
import pty from 'node-pty';
import net from 'net';
import fs from 'fs';

const SOCKET_A = '/tmp/claude-a.sock';
const SOCKET_B = '/tmp/claude-b.sock';
const SOCKET_BRIDGE = '/tmp/claude-bridge.sock';

[SOCKET_A, SOCKET_B, SOCKET_BRIDGE].forEach(s => { try { fs.unlinkSync(s); } catch {} });

const colors = { A: '\x1b[36m', B: '\x1b[35m', bridge: '\x1b[33m', reset: '\x1b[0m' };

function log(source, msg) {
    console.log(`${colors[source] || ''}[${source}]${colors.reset} ${msg}`);
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
        // Use local patched CLI instead of global claude
        const cliPath = new URL('../cli.patched.js', import.meta.url).pathname;
        this.proc = pty.spawn('node', [cliPath], {
            name: 'xterm-256color',
            cols: 120,
            rows: 40,
            cwd: process.cwd(),
            env: { ...process.env, TERM: 'xterm-256color' }
        });

        this.proc.onData(data => {
            const color = colors[this.name] || '';
            process.stdout.write(`${color}[${this.name}]${colors.reset} `);
            process.stdout.write(data.replace(/\n/g, `\n${color}[${this.name}]${colors.reset} `));
            
            if (this.isResponding) {
                this.responseBuffer += data;
                if (this.idleTimer) clearTimeout(this.idleTimer);
                
                if (data.includes('\n> ') || data.includes('? for shortcuts')) {
                    this.idleTimer = setTimeout(() => this.finishResponse(), 500);
                } else {
                    this.idleTimer = setTimeout(() => this.finishResponse(), 3000);
                }
            }
        });

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
        
        // Strip ALL ANSI and escape codes
        let response = this.responseBuffer
            .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
            .replace(/\x1b\][^\x07]*\x07/g, '')
            .replace(/\x1b./g, '')
            .replace(/\?2026[hl]/g, '');
        
        // Find Claude's response (after ●)
        const bulletIdx = response.indexOf('●');
        if (bulletIdx > -1) {
            response = response.slice(bulletIdx + 1);
        }
        
        // Cut at next prompt
        const promptIdx = response.indexOf('\n>');
        if (promptIdx > 0) response = response.slice(0, promptIdx);
        
        // Clean up
        response = response
            .replace(/[●✻·✢✳∗✽─│╭╮╯╰]/g, '')
            .replace(/ctrl-g.*$/gm, '')
            .replace(/\? for shortcuts.*$/gm, '')
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        this.responseBuffer = '';
        
        if (response.length > 20 && this.forwardTo) {
            log('bridge', `Forwarding ${this.name} → ${this.forwardTo.name} (${response.length} chars)`);
            setTimeout(() => {
                this.forwardTo.inject(`${this.name} says: ${response}`);
            }, 1000);
        }
    }

    kill() { this.proc.kill(); }
}

const agentA = new ClaudeAgent('A', SOCKET_A);
const agentB = new ClaudeAgent('B', SOCKET_B);

console.log('\n🤖 Claude Bridge\n');
agentA.start();
agentB.start();

const bridgeServer = net.createServer(socket => {
    let buf = '';
    socket.on('data', chunk => { buf += chunk.toString(); });
    socket.on('end', () => {
        const cmd = buf.trim();
        if (cmd.startsWith('A:')) { agentA.inject(cmd.slice(2)); socket.end('OK\n'); }
        else if (cmd.startsWith('B:')) { agentB.inject(cmd.slice(2)); socket.end('OK\n'); }
        else if (cmd === 'FORWARD:BOTH') {
            agentA.forwardTo = agentB;
            agentB.forwardTo = agentA;
            log('bridge', '✓ Conversation mode ON');
            socket.end('OK\n');
        }
        else if (cmd === 'FORWARD:STOP') {
            agentA.forwardTo = null;
            agentB.forwardTo = null;
            socket.end('OK\n');
        }
        else socket.end('A:msg | B:msg | FORWARD:BOTH | FORWARD:STOP\n');
    });
});

bridgeServer.listen(SOCKET_BRIDGE, () => fs.chmodSync(SOCKET_BRIDGE, 0o666));

console.log(`Commands:
  node -e "require('net').connect('/tmp/claude-bridge.sock').end('FORWARD:BOTH')"
  node -e "require('net').connect('/tmp/claude-bridge.sock').end('A:Debate AI rights. 2 sentences.')"
`);

process.on('SIGINT', () => { agentA.kill(); agentB.kill(); process.exit(); });