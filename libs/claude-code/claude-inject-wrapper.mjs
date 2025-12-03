#!/usr/bin/env node
import pty from 'node-pty';
import net from 'net';
import fs from 'fs';

const SOCKET_PATH = process.env.CLAUDE_INJECT_SOCKET || '/tmp/claude-inject.sock';

try { fs.unlinkSync(SOCKET_PATH); } catch {}

const claudePath = 'claude';
const args = process.argv.slice(2);

console.log(`Starting Claude: ${claudePath} ${args.join(' ')}`);
console.log(`Injection socket: ${SOCKET_PATH}`);

const proc = pty.spawn(claudePath, args, {
    name: 'xterm-256color',
    cols: process.stdout.columns || 120,
    rows: process.stdout.rows || 40,
    cwd: process.cwd(),
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' }
});

proc.onData(data => process.stdout.write(data));

if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', data => proc.write(data.toString()));

process.stdout.on('resize', () => {
    proc.resize(process.stdout.columns, process.stdout.rows);
});

const server = net.createServer(socket => {
    let buffer = '';
    socket.on('data', chunk => { buffer += chunk.toString(); });
    socket.on('end', () => {
        // Strip all newlines/carriage returns from input
        const input = buffer.replace(/[\r\n]+/g, '');
        if (input) {
            console.log(`\n[INJECT] ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
            // Write the text
            proc.write(input);
            // Small delay then send Enter (Ctrl+M / carriage return)
            setTimeout(() => {
                proc.write('\r');
            }, 50);
        }
        socket.end('OK\n');
    });
    socket.on('error', err => console.error('[INJECT ERROR]', err.message));
});

server.listen(SOCKET_PATH, () => {
    console.log(`Injection server listening on ${SOCKET_PATH}`);
    fs.chmodSync(SOCKET_PATH, 0o666);
});

proc.onExit(({ exitCode }) => {
    console.log(`\nClaude exited with code ${exitCode}`);
    server.close();
    try { fs.unlinkSync(SOCKET_PATH); } catch {}
    process.exit(exitCode);
});

process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGTERM', () => proc.kill('SIGTERM'));
