#!/usr/bin/env node
/**
 * claude-inject-wrapper.js
 * 
 * Wraps Claude Code CLI with PTY and exposes injection via Unix socket.
 * 
 * Usage:
 *   node claude-inject-wrapper.js [claude args...]
 * 
 * Then from another terminal:
 *   echo "your prompt" | nc -U /tmp/claude-inject.sock
 *   # or
 *   node -e "require('net').connect('/tmp/claude-inject.sock').end('your prompt')"
 */

const pty = require('node-pty');
const net = require('net');
const fs = require('fs');
const path = require('path');

const SOCKET_PATH = process.env.CLAUDE_INJECT_SOCKET || '/tmp/claude-inject.sock';

// Clean up old socket
try { fs.unlinkSync(SOCKET_PATH); } catch {}

// Find claude binary
function findClaude() {
    const locations = [
        // npm global
        path.join(process.env.npm_config_prefix || '/usr/local', 'bin/claude'),
        // npx location
        path.join(process.env.HOME, '.npm/_npx'),
        // homebrew
        '/opt/homebrew/bin/claude',
        '/usr/local/bin/claude',
        // which
        'claude'
    ];
    
    for (const loc of locations) {
        try {
            if (fs.existsSync(loc)) return loc;
        } catch {}
    }
    return 'claude'; // hope it's in PATH
}

const claudePath = findClaude();
const args = process.argv.slice(2);

console.log(`Starting Claude: ${claudePath} ${args.join(' ')}`);
console.log(`Injection socket: ${SOCKET_PATH}`);

// Spawn Claude in PTY
const proc = pty.spawn(claudePath, args, {
    name: 'xterm-256color',
    cols: process.stdout.columns || 120,
    rows: process.stdout.rows || 40,
    cwd: process.cwd(),
    env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
    }
});

// Pipe PTY output to stdout
proc.onData(data => process.stdout.write(data));

// Handle stdin (for direct typing)
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdin.resume();
process.stdin.on('data', data => proc.write(data.toString()));

// Handle resize
process.stdout.on('resize', () => {
    proc.resize(process.stdout.columns, process.stdout.rows);
});

// Create injection server
const server = net.createServer(socket => {
    let buffer = '';
    
    socket.on('data', chunk => {
        buffer += chunk.toString();
    });
    
    socket.on('end', () => {
        const input = buffer.trim();
        if (input) {
            console.log(`\n[INJECT] ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
            // Write to PTY as if typed
            proc.write(input);
            // Send Enter to submit
            proc.write('\r');
        }
        socket.end('OK\n');
    });
    
    socket.on('error', err => {
        console.error('[INJECT ERROR]', err.message);
    });
});

server.listen(SOCKET_PATH, () => {
    console.log(`Injection server listening on ${SOCKET_PATH}`);
    // Make socket accessible
    fs.chmodSync(SOCKET_PATH, 0o666);
});

// Cleanup on exit
proc.onExit(({ exitCode }) => {
    console.log(`\nClaude exited with code ${exitCode}`);
    server.close();
    try { fs.unlinkSync(SOCKET_PATH); } catch {}
    process.exit(exitCode);
});

process.on('SIGINT', () => {
    proc.kill('SIGINT');
});

process.on('SIGTERM', () => {
    proc.kill('SIGTERM');
});

// Handle uncaught errors
process.on('uncaughtException', err => {
    console.error('Uncaught:', err);
    proc.kill();
    server.close();
    try { fs.unlinkSync(SOCKET_PATH); } catch {}
    process.exit(1);
});
