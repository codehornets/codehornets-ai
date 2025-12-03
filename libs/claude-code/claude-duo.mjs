#!/usr/bin/env node
/**
 * claude-duo.mjs - Two Claude instances talking to each other
 * 
 * Usage:
 *   node claude-duo.mjs "initial prompt to start the conversation"
 * 
 * Example:
 *   node claude-duo.mjs "You are Claude A. Discuss the meaning of life with Claude B."
 */

import pty from 'node-pty';
import net from 'net';
import fs from 'fs';
import { EventEmitter } from 'events';

const SOCKET_A = '/tmp/claude-a.sock';
const SOCKET_B = '/tmp/claude-b.sock';

// Clean up old sockets
try { fs.unlinkSync(SOCKET_A); } catch {}
try { fs.unlinkSync(SOCKET_B); } catch {}

class ClaudeInstance extends EventEmitter {
    constructor(name, socketPath, color) {
        super();
        this.name = name;
        this.socketPath = socketPath;
        this.color = color;
        this.buffer = '';
        this.isResponding = false;
        this.responseBuffer = '';
        this.idleTimer = null;
        this.ready = false;
    }

    colorize(text) {
        const colors = {
            red: '\x1b[31m',
            blue: '\x1b[34m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            cyan: '\x1b[36m',
            magenta: '\x1b[35m',
            reset: '\x1b[0m'
        };
        return `${colors[this.color] || ''}${text}${colors.reset}`;
    }

    log(msg) {
        console.log(this.colorize(`[${this.name}] ${msg}`));
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
            this.handleOutput(data);
        });

        // Create injection server
        this.server = net.createServer(socket => {
            let buf = '';
            socket.on('data', chunk => { buf += chunk.toString(); });
            socket.on('end', () => {
                const input = buf.replace(/[\r\n]+/g, '');
                if (input) {
                    this.inject(input);
                }
                socket.end('OK\n');
            });
        });

        this.server.listen(this.socketPath, () => {
            fs.chmodSync(this.socketPath, 0o666);
            this.log(`Socket ready: ${this.socketPath}`);
        });

        this.proc.onExit(({ exitCode }) => {
            this.log(`Exited with code ${exitCode}`);
            this.server.close();
            try { fs.unlinkSync(this.socketPath); } catch {}
            this.emit('exit', exitCode);
        });
    }

    handleOutput(data) {
        // Display output with color prefix
        const lines = data.split('\n');
        for (const line of lines) {
            if (line.trim()) {
                process.stdout.write(this.colorize(`[${this.name}] `) + line + '\n');
            }
        }

        // Detect ready state (prompt showing)
        if (data.includes('> ') || data.includes('Try "')) {
            if (!this.ready) {
                this.ready = true;
                this.log('Ready');
                this.emit('ready');
            }
        }

        // Track response state
        if (this.isResponding) {
            this.responseBuffer += data;
            
            // Reset idle timer
            if (this.idleTimer) clearTimeout(this.idleTimer);
            
            // Detect end of response (prompt reappears)
            // Claude shows "> " when ready for next input
            if (data.includes('\n> ') || data.match(/\n>\s*$/)) {
                this.idleTimer = setTimeout(() => {
                    this.finishResponse();
                }, 500);
            } else {
                // Also detect by idle time
                this.idleTimer = setTimeout(() => {
                    this.finishResponse();
                }, 2000);
            }
        }
    }

    finishResponse() {
        if (!this.isResponding) return;
        
        this.isResponding = false;
        const response = this.extractResponse(this.responseBuffer);
        this.responseBuffer = '';
        
        if (response) {
            this.log(`Response complete (${response.length} chars)`);
            this.emit('response', response);
        }
    }

    extractResponse(buffer) {
        // Remove ANSI codes
        let clean = buffer.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        
        // Try to extract just Claude's response (after ● marker or similar)
        const lines = clean.split('\n');
        const responseLines = [];
        let capturing = false;
        
        for (const line of lines) {
            // Start capturing after the user input echo
            if (line.includes('●') || capturing) {
                capturing = true;
                // Stop at the next prompt
                if (line.match(/^>\s*$/) || line.includes('> ')) {
                    break;
                }
                responseLines.push(line);
            }
        }
        
        let response = responseLines.join('\n').trim();
        
        // Clean up common prefixes
        response = response.replace(/^●\s*/, '');
        
        // If we couldn't extract nicely, just return cleaned buffer
        if (!response) {
            response = clean.trim();
        }
        
        return response;
    }

    inject(text) {
        this.log(`Injecting: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        this.isResponding = true;
        this.responseBuffer = '';
        this.proc.write(text);
        setTimeout(() => {
            this.proc.write('\r');
        }, 50);
    }

    kill() {
        this.proc.kill();
    }
}

// Main orchestrator
async function main() {
    const initialPrompt = process.argv[2] || 'Introduce yourself briefly.';
    const maxTurns = parseInt(process.argv[3]) || 10;
    
    console.log('\n🤖 Claude Duo - Multi-Agent Conversation\n');
    console.log(`Initial prompt: "${initialPrompt}"`);
    console.log(`Max turns: ${maxTurns}\n`);

    const claudeA = new ClaudeInstance('Claude-A', SOCKET_A, 'cyan');
    const claudeB = new ClaudeInstance('Claude-B', SOCKET_B, 'magenta');

    let turn = 0;
    let currentSpeaker = claudeA;
    let waitingFor = null;

    // Start both instances
    claudeA.start();
    claudeB.start();

    // Wait for both to be ready
    await Promise.all([
        new Promise(r => claudeA.once('ready', r)),
        new Promise(r => claudeB.once('ready', r))
    ]);

    console.log('\n✅ Both instances ready. Starting conversation...\n');
    console.log('─'.repeat(80));

    // Set up response handlers
    const handleResponse = (speaker, response) => {
        if (waitingFor !== speaker) return;
        
        turn++;
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`Turn ${turn}/${maxTurns}`);
        console.log('─'.repeat(80));

        if (turn >= maxTurns) {
            console.log('\n🏁 Max turns reached. Ending conversation.\n');
            claudeA.kill();
            claudeB.kill();
            return;
        }

        // Send response to the other Claude
        const other = speaker === claudeA ? claudeB : claudeA;
        const prompt = `[Message from ${speaker.name}]: ${response}\n\nRespond to continue the conversation.`;
        
        waitingFor = other;
        setTimeout(() => {
            other.inject(prompt);
        }, 1000);
    };

    claudeA.on('response', (r) => handleResponse(claudeA, r));
    claudeB.on('response', (r) => handleResponse(claudeB, r));

    // Handle exits
    claudeA.on('exit', () => { claudeB.kill(); process.exit(); });
    claudeB.on('exit', () => { claudeA.kill(); process.exit(); });

    // Start the conversation with Claude A
    waitingFor = claudeA;
    claudeA.inject(`You are Claude A in a multi-agent conversation with Claude B. ${initialPrompt}`);

    // Ctrl+C handler
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Stopping conversation...');
        claudeA.kill();
        claudeB.kill();
        process.exit();
    });
}

main().catch(console.error);
