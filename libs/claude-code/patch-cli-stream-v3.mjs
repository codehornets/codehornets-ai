#!/usr/bin/env node
/**
 * patch-cli-stream-v3.mjs
 *
 * v3 Improvements over v2:
 * - REMOVED redundant deduplication (bridge handles it, not patcher)
 * - EXTRACTED magic strings to documented constants
 * - PER-MESSAGE state tracking (no global flags)
 */

import fs from 'fs';

const inputFile = process.argv[2] || 'cli_pretty.js';
const outputFile = process.argv[3] || 'cli_patched.js';

console.log(`Reading: ${inputFile}`);
let code = fs.readFileSync(inputFile, 'utf8');

if (code.includes('__CLAUDE_STREAM_SOCKET__')) {
    console.log('Already patched!');
    process.exit(0);
}

// Socket server - v3: Clean event emission, no filtering (bridge handles that)
// v3.1: Added sequence numbers on all events + heartbeat for connection health
const socketServerCode = `
// === CLAUDE STREAM SOCKET v3.1 ===
//
// Design principle: The patcher emits raw events. The bridge filters them.
// This separation of concerns makes each component simpler and more testable.
//
// v3.1 additions:
// - Global sequence number on ALL events for ordering/gap detection
// - Heartbeat ping every 5 seconds for connection health monitoring
// - Ping responds to pong for RTT measurement
//
const __CLAUDE_NET__ = require("net");
const __CLAUDE_FS__ = require("fs");
const __CLAUDE_SOCKET_PATH__ = process.env.CLAUDE_SOCKET || "/tmp/claude-stream.sock";
const __CLAUDE_CLIENTS__ = new Set();

// Message counter for correlation (not deduplication - bridge handles that)
let __CLAUDE_MSG_ID__ = 0;

// Global sequence number for ALL events (for ordering and gap detection)
let __CLAUDE_SEQ__ = 0;

// Heartbeat interval (ms)
const __CLAUDE_HEARTBEAT_MS__ = 5000;

try { __CLAUDE_FS__.unlinkSync(__CLAUDE_SOCKET_PATH__); } catch(e) {}

const __CLAUDE_STREAM_SOCKET__ = __CLAUDE_NET__.createServer(client => {
    __CLAUDE_CLIENTS__.add(client);
    let buf = "";
    client.on("data", chunk => {
        buf += chunk.toString();
        const lines = buf.split("\\n");
        buf = lines.pop();
        lines.forEach(line => {
            if (!line.trim()) return;
            try {
                const msg = JSON.parse(line);
                // Handle ping/pong for RTT measurement
                if (msg.type === "ping") {
                    client.write(JSON.stringify({ type: "pong", ts: Date.now(), echo: msg.ts }) + "\\n");
                    return;
                }
                // Handle injection
                if (msg.type === "inject" && global.__CLAUDE_INJECT__) {
                    global.__CLAUDE_INJECT__(msg.text);
                }
            } catch(e) {
                // Plain text injection
                if (global.__CLAUDE_INJECT__) global.__CLAUDE_INJECT__(line.trim());
            }
        });
    });
    client.on("close", () => __CLAUDE_CLIENTS__.delete(client));
    client.on("error", () => __CLAUDE_CLIENTS__.delete(client));
});

__CLAUDE_STREAM_SOCKET__.listen(__CLAUDE_SOCKET_PATH__, () => {
    __CLAUDE_FS__.chmodSync(__CLAUDE_SOCKET_PATH__, 0o666);
    console.log("[STREAM] Socket:", __CLAUDE_SOCKET_PATH__);
});

// Heartbeat: send ping to all clients every 5 seconds
setInterval(() => {
    __CLAUDE_SEQ__++;
    const ping = JSON.stringify({ type: "heartbeat", seq: __CLAUDE_SEQ__, ts: Date.now() }) + "\\n";
    __CLAUDE_CLIENTS__.forEach(c => { try { c.write(ping); } catch(e) {} });
}, __CLAUDE_HEARTBEAT_MS__);

// Emit raw events - no filtering, no deduplication
// The bridge is responsible for interpreting these events
// All events get a sequence number for ordering
function __CLAUDE_BROADCAST__(obj) {
    __CLAUDE_SEQ__++;
    obj.seq = __CLAUDE_SEQ__;

    if (obj.type === "start") {
        __CLAUDE_MSG_ID__++;
        obj.id = __CLAUDE_MSG_ID__;
        obj.ts = Date.now();
    }
    const msg = JSON.stringify(obj) + "\\n";
    __CLAUDE_CLIENTS__.forEach(c => { try { c.write(msg); } catch(e) {} });
}

process.on("exit", () => {
    try { __CLAUDE_FS__.unlinkSync(__CLAUDE_SOCKET_PATH__); } catch(e) {}
});
// === END SOCKET SETUP ===
`;

// Find insertion point
const insertAfterImports = code.indexOf('var cK1 =');
if (insertAfterImports === -1) {
    console.error('Could not find import section');
    process.exit(1);
}
code = code.slice(0, insertAfterImports) + socketServerCode + '\n' + code.slice(insertAfterImports);
console.log('✓ Added socket server (v3 - raw events)');

// Patch text_delta - only FIRST occurrence
const textEmitPattern = /if \(G\.type === "text"\) this\._emit\("text", Q\.delta\.text, G\.text \|\| ""\);/;
code = code.replace(textEmitPattern, `if (G.type === "text") {
                                this._emit("text", Q.delta.text, G.text || "");
                                if (typeof __CLAUDE_BROADCAST__ === "function") {
                                    __CLAUDE_BROADCAST__({type:"text",chunk:Q.delta.text,full:G.text||""});
                                }
                            }`);
console.log('✓ Patched text_delta');

// Patch message_start - only FIRST occurrence
const messageStartPattern = /case "message_start":\s*\{/;
code = code.replace(messageStartPattern, `case "message_start": {
                    if (typeof __CLAUDE_BROADCAST__ === "function") __CLAUDE_BROADCAST__({type:"start"});`);
console.log('✓ Patched message_start');

// Patch message_stop - only FIRST occurrence
const messageStopPattern = /case "message_stop":\s*\{/;
code = code.replace(messageStopPattern, `case "message_stop": {
                    if (typeof __CLAUDE_BROADCAST__ === "function") __CLAUDE_BROADCAST__({type:"stop"});`);
console.log('✓ Patched message_stop');

// Add injection hook
const cgCallbackPattern = /(\}, \[CG\]\);)\n(\s*async function YF\(\))/;
const injectHookCode = `
    rQ.useEffect(() => {
        global.__CLAUDE_INJECT__ = (text) => {
            QQ(text);
            setTimeout(() => {
                CG(text, void 0, { setCursorOffset: () => {}, clearBuffer: () => {}, resetHistory: () => {} });
            }, 50);
        };
        return () => { global.__CLAUDE_INJECT__ = null; };
    }, [QQ, CG]);
`;

if (cgCallbackPattern.test(code)) {
    code = code.replace(cgCallbackPattern, `$1\n${injectHookCode}\n$2`);
    console.log('✓ Added injection hook');
}

fs.writeFileSync(outputFile, code);
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output: ${outputFile}

v3.1 Design:
  ✓ Patcher emits RAW events (start, text, stop)
  ✓ Bridge handles ALL filtering/deduplication
  ✓ Clean separation of concerns
  ✓ Message IDs + timestamps for bridge correlation
  ✓ Sequence numbers on ALL events (gap detection)
  ✓ Heartbeat every 5s (connection health)
  ✓ Ping/pong support (RTT measurement)

Event stream (raw):
  {"type":"heartbeat","seq":1,"ts":1699999999999}
  {"type":"start","seq":2,"id":1,"ts":1699999999999}
  {"type":"text","seq":3,"chunk":"...","full":"..."}
  {"type":"text","seq":4,"chunk":"...","full":"..."}
  {"type":"stop","seq":5}

Ping/Pong (send ping, receive pong):
  → {"type":"ping","ts":1699999999999}
  ← {"type":"pong","ts":1699999999999,"echo":1699999999999}

Usage:
  nc -U /tmp/claude-stream.sock
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
