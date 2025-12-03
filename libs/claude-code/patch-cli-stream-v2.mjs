#!/usr/bin/env node
/**
 * patch-cli-stream-v2.mjs
 * 
 * Improved version:
 * - Deduplicates start events
 * - Filters internal JSON responses (topic classification)
 * - Only patches first occurrence to avoid duplicates
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

// Socket server with built-in filtering
const socketServerCode = `
// === CLAUDE STREAM SOCKET v2 ===
const __CLAUDE_NET__ = require("net");
const __CLAUDE_FS__ = require("fs");
const __CLAUDE_SOCKET_PATH__ = process.env.CLAUDE_SOCKET || "/tmp/claude-stream.sock";
const __CLAUDE_CLIENTS__ = new Set();
let __CLAUDE_LAST_START__ = 0;
let __CLAUDE_IS_INTERNAL__ = false;
let __CLAUDE_MSG_COUNT__ = 0;

try { __CLAUDE_FS__.unlinkSync(__CLAUDE_SOCKET_PATH__); } catch(e) {}

const __CLAUDE_STREAM_SOCKET__ = __CLAUDE_NET__.createServer(client => {
    __CLAUDE_CLIENTS__.add(client);
    let buf = "";
    client.on("data", chunk => {
        buf += chunk.toString();
        const lines = buf.split("\\n");
        buf = lines.pop();
        lines.forEach(line => {
            if (line.trim() && global.__CLAUDE_INJECT__) {
                try {
                    const msg = JSON.parse(line);
                    if (msg.type === "inject") global.__CLAUDE_INJECT__(msg.text);
                } catch(e) {
                    global.__CLAUDE_INJECT__(line.trim());
                }
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

function __CLAUDE_BROADCAST__(obj) {
    // Dedupe start events (200ms window)
    if (obj.type === "start") {
        const now = Date.now();
        if (now - __CLAUDE_LAST_START__ < 200) return;
        __CLAUDE_LAST_START__ = now;
        __CLAUDE_IS_INTERNAL__ = false;
        __CLAUDE_MSG_COUNT__++;
        obj.id = __CLAUDE_MSG_COUNT__;
    }
    
    // Detect internal JSON (topic classification)
    if (obj.type === "text") {
        const full = obj.full || "";
        const chunk = obj.chunk || "";
        
        // Check for internal JSON patterns
        if (full.includes("isNewTopic") || full.includes('\\"title\\"') ||
            chunk.includes("isNewTopic") || chunk.includes('\\"title\\"') ||
            (full.trim().startsWith("{") && (full.includes("title") || full.includes("isNew")))) {
            __CLAUDE_IS_INTERNAL__ = true;
            return;
        }
        
        // Skip all text in internal message
        if (__CLAUDE_IS_INTERNAL__) return;
    }
    
    // Skip stop for internal messages
    if (obj.type === "stop" && __CLAUDE_IS_INTERNAL__) {
        __CLAUDE_IS_INTERNAL__ = false;
        return;
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
console.log('✓ Added socket server with filtering');

// Patch text_delta - only FIRST occurrence
const textEmitPattern = /if \(G\.type === "text"\) this\._emit\("text", Q\.delta\.text, G\.text \|\| ""\);/;
code = code.replace(textEmitPattern, `if (G.type === "text") {
                                this._emit("text", Q.delta.text, G.text || "");
                                if (typeof __CLAUDE_BROADCAST__ === "function") {
                                    __CLAUDE_BROADCAST__({type:"text",chunk:Q.delta.text,full:G.text||""});
                                }
                            }`);
console.log('✓ Patched text_delta (first only)');

// Patch message_start - only FIRST occurrence
const messageStartPattern = /case "message_start":\s*\{/;
code = code.replace(messageStartPattern, `case "message_start": {
                    if (typeof __CLAUDE_BROADCAST__ === "function") __CLAUDE_BROADCAST__({type:"start"});`);
console.log('✓ Patched message_start (first only)');

// Patch message_stop - only FIRST occurrence
const messageStopPattern = /case "message_stop":\s*\{/;
code = code.replace(messageStopPattern, `case "message_stop": {
                    if (typeof __CLAUDE_BROADCAST__ === "function") __CLAUDE_BROADCAST__({type:"stop"});`);
console.log('✓ Patched message_stop (first only)');

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

v2 Improvements:
  ✓ Deduplicates start events (200ms window)
  ✓ Filters internal JSON (topic classification)
  ✓ Only patches first handler (no duplicate events)
  ✓ Message IDs for tracking

Clean stream:
  {"type":"start","id":1}
  {"type":"text","chunk":"Hello!","full":"Hello!"}
  {"type":"stop"}

Usage:
  nc -U /tmp/claude-stream.sock
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
