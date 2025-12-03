#!/usr/bin/env node
/**
 * claude-bridge-stream-v3.mjs
 *
 * v3 Fixes:
 * 1. SINGLE deduplication layer (bridge only, patcher sends raw events)
 * 2. DOCUMENTED constants for internal message patterns (no magic strings)
 * 3. PER-AGENT state encapsulation (no global flags, no race conditions)
 */

import pty from 'node-pty';
import net from 'net';
import fs from 'fs';
import readline from 'readline';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Internal message detection patterns.
 *
 * Claude emits internal JSON for topic classification that looks like:
 *   {"isNewTopic": true, "title": "Some conversation title"}
 *
 * These should NOT be forwarded to other agents.
 *
 * If Claude changes this format, update these patterns.
 * Last verified: 2024-12 (Claude Code v1.x)
 */
const INTERNAL_MESSAGE_PATTERNS = {
    // Topic classification JSON fields
    TOPIC_FIELD: 'isNewTopic',
    TITLE_FIELD: '"title"',

    // Full pattern check for JSON objects
    isInternalJson: (text) => {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();

        // Check for known internal fields
        if (trimmed.includes(INTERNAL_MESSAGE_PATTERNS.TOPIC_FIELD)) return true;

        // Check for title field in JSON context
        if (trimmed.startsWith('{') && trimmed.includes(INTERNAL_MESSAGE_PATTERNS.TITLE_FIELD)) {
            return true;
        }

        return false;
    }
};

/**
 * Timing constants for event handling
 */
const TIMING = {
    // Debounce window for duplicate start events (ms)
    START_DEBOUNCE_MS: 200,

    // Delay before forwarding response to other agent (ms)
    FORWARD_DELAY_MS: 1000,

    // Socket connection retry timing
    SOCKET_RETRY_MS: 200,
    SOCKET_TIMEOUT_ATTEMPTS: 50,
    SOCKET_INITIAL_DELAY_MS: 1000,
    SOCKET_CONNECT_DELAY_MS: 300,

    // Stale message timeout - discard messages older than this (ms)
    // Prevents zombie messages from being forwarded if stop event is missed
    MESSAGE_TIMEOUT_MS: 30000,

    // How often to check for stale messages (ms)
    STALE_CHECK_INTERVAL_MS: 5000,
};

// Socket paths
const SOCKET_A = '/tmp/claude-a.sock';
const SOCKET_B = '/tmp/claude-b.sock';
const SOCKET_BRIDGE = '/tmp/claude-bridge.sock';

// Clean up old sockets
[SOCKET_A, SOCKET_B, SOCKET_BRIDGE].forEach(s => { try { fs.unlinkSync(s); } catch {} });

// Logging
const colors = { A: '\x1b[36m', B: '\x1b[35m', bridge: '\x1b[33m', reset: '\x1b[0m' };
const log = (src, msg) => console.log(`${colors[src] || ''}[${src}]${colors.reset} ${msg}`);

// ============================================================================
// MESSAGE STATE (per-message, not global)
// ============================================================================

/**
 * Creates a fresh state object for tracking a single message.
 * Each message gets its own state - no shared globals.
 */
function createMessageState() {
    return {
        id: null,           // Message ID from start event
        startTime: 0,       // Timestamp of start event
        content: '',        // Accumulated response text
        isInternal: false,  // Whether this is an internal message
    };
}

// ============================================================================
// CLAUDE AGENT CLASS
// ============================================================================

class ClaudeAgent {
    constructor(name, socketPath) {
        this.name = name;
        this.socketPath = socketPath;
        this.forwardTo = null;
        this.proc = null;
        this.streamClient = null;

        // Per-agent state (not global)
        this.isResponding = false;
        this.lastStartTime = 0;          // For deduplication
        this.currentMessage = null;      // Current message state object
        this.staleCheckInterval = null;  // Interval for stale message cleanup
    }

    /**
     * Start periodic stale message cleanup.
     * Discards any message that has been accumulating longer than MESSAGE_TIMEOUT_MS.
     */
    startStaleMessageCleanup() {
        this.staleCheckInterval = setInterval(() => {
            if (this.currentMessage) {
                const age = Date.now() - this.currentMessage.startTime;
                if (age > TIMING.MESSAGE_TIMEOUT_MS) {
                    const msgId = this.currentMessage.id || '?';
                    log(this.name, `⚠️  Discarding stale message #${msgId} (age: ${Math.round(age / 1000)}s)`);
                    this.currentMessage = null;
                    this.isResponding = false;
                }
            }
        }, TIMING.STALE_CHECK_INTERVAL_MS);
    }

    /**
     * Stop the stale message cleanup interval.
     */
    stopStaleMessageCleanup() {
        if (this.staleCheckInterval) {
            clearInterval(this.staleCheckInterval);
            this.staleCheckInterval = null;
        }
    }

    start() {
        return new Promise((resolve) => {
            // Use local patched CLI that creates the streaming socket
            // Note: .mjs extension for ES modules (file uses import statements)
            const cliPath = new URL('./cli.patched.mjs', import.meta.url).pathname;
            this.proc = pty.spawn('node', [cliPath], {
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

            // Display PTY output
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
                if (attempts > TIMING.SOCKET_TIMEOUT_ATTEMPTS) {
                    log(this.name, 'Socket timeout - continuing anyway');
                    resolve();
                    return;
                }
                if (fs.existsSync(this.socketPath)) {
                    setTimeout(() => {
                        this.connectStream();
                        this.startStaleMessageCleanup();
                        resolve();
                    }, TIMING.SOCKET_CONNECT_DELAY_MS);
                } else {
                    setTimeout(() => waitForSocket(attempts + 1), TIMING.SOCKET_RETRY_MS);
                }
            };
            setTimeout(waitForSocket, TIMING.SOCKET_INITIAL_DELAY_MS);
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
                this._handleStart(event);
                break;

            case 'text':
                this._handleText(event);
                break;

            case 'stop':
                this._handleStop(event);
                break;

            case 'error':
                log(this.name, `Error: ${event.message}`);
                break;
        }
    }

    _handleStart(event) {
        const now = event.ts || Date.now();

        // Deduplicate start events (single layer - here in bridge only)
        if (now - this.lastStartTime < TIMING.START_DEBOUNCE_MS) {
            return; // Skip duplicate
        }
        this.lastStartTime = now;

        // Create fresh state for this message
        this.currentMessage = createMessageState();
        this.currentMessage.id = event.id;
        this.currentMessage.startTime = now;

        this.isResponding = true;
        log(this.name, `⏳ Streaming... (msg #${event.id || '?'})`);
    }

    _handleText(event) {
        // No current message? Skip (orphan text event)
        if (!this.currentMessage) return;

        const chunk = event.chunk || '';
        const full = event.full || '';

        // Check for internal message using documented patterns
        if (INTERNAL_MESSAGE_PATTERNS.isInternalJson(full) ||
            INTERNAL_MESSAGE_PATTERNS.isInternalJson(chunk)) {
            this.currentMessage.isInternal = true;
            return;
        }

        // Skip if already marked internal
        if (this.currentMessage.isInternal) return;

        // Accumulate content
        this.currentMessage.content = full;
    }

    _handleStop(event) {
        // No current message? Skip
        if (!this.currentMessage) return;

        const msg = this.currentMessage;
        this.currentMessage = null;  // Clear for next message
        this.isResponding = false;

        // Skip internal messages
        if (msg.isInternal) {
            return;
        }

        // Process actual response
        if (msg.content.trim()) {
            const preview = msg.content.substring(0, 80);
            const ellipsis = msg.content.length > 80 ? '...' : '';
            log(this.name, `✓ Response: "${preview}${ellipsis}"`);

            // Forward to other agent
            if (this.forwardTo) {
                log('bridge', `→ Forwarding to ${this.forwardTo.name}`);
                setTimeout(() => {
                    this.forwardTo.inject(`${this.name} says: ${msg.content}`);
                }, TIMING.FORWARD_DELAY_MS);
            }
        }
    }

    inject(text) {
        if (this.streamClient && !this.streamClient.destroyed) {
            const msg = JSON.stringify({ type: 'inject', text }) + '\n';
            this.streamClient.write(msg);
            const preview = text.substring(0, 60);
            const ellipsis = text.length > 60 ? '...' : '';
            log(this.name, `← Inject: "${preview}${ellipsis}"`);
        } else {
            // Fallback to PTY
            const clean = text.replace(/[\r\n]+/g, ' ').trim();
            this.proc.write(clean);
            setTimeout(() => this.proc.write('\r'), 50);
            log(this.name, `← PTY Inject: "${clean.substring(0, 60)}..."`);
        }
    }

    kill() {
        this.stopStaleMessageCleanup();
        if (this.streamClient) this.streamClient.destroy();
        if (this.proc) this.proc.kill();
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🤖 Claude Bridge (Streaming JSON v3.1)               ║
║                                                              ║
║  v3 Improvements:                                            ║
║  • Single deduplication layer (bridge only)                  ║
║  • Documented pattern constants (no magic strings)           ║
║  • Per-message state (no global flags)                       ║
║                                                              ║
║  v3.1 Additions:                                             ║
║  • Stale message timeout (${TIMING.MESSAGE_TIMEOUT_MS / 1000}s) - discards zombie msgs     ║
║  • Periodic cleanup every ${TIMING.STALE_CHECK_INTERVAL_MS / 1000}s                             ║
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
                    A: {
                        responding: agentA.isResponding,
                        forwardTo: agentA.forwardTo?.name,
                        hasActiveMessage: !!agentA.currentMessage
                    },
                    B: {
                        responding: agentB.isResponding,
                        forwardTo: agentB.forwardTo?.name,
                        hasActiveMessage: !!agentB.currentMessage
                    }
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

Press Ctrl+C to stop.
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
