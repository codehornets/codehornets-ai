#!/usr/bin/env node
/**
 * patch-cli-stream.mjs
 * 
 * Patches Claude Code cli.js to stream responses as JSON over a socket.
 * 
 * Events emitted (newline-delimited JSON):
 *   {"type":"start"}                           - Response starting
 *   {"type":"text","chunk":"Hello","full":"Hello"}  - Each text chunk
 *   {"type":"stop"}                            - Response complete
 *   {"type":"error","message":"..."}           - Error occurred
 * 
 * Socket: /tmp/claude-stream.sock (or CLAUDE_SOCKET env var)
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

// 1. Add socket server initialization at the top of the file (after imports)
const socketServerCode = `
// === CLAUDE STREAM SOCKET ===
const __CLAUDE_NET__ = require("net");
const __CLAUDE_FS__ = require("fs");
const __CLAUDE_SOCKET_PATH__ = process.env.CLAUDE_SOCKET || "/tmp/claude-stream.sock";
const __CLAUDE_CLIENTS__ = new Set();

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
    const msg = JSON.stringify(obj) + "\\n";
    __CLAUDE_CLIENTS__.forEach(c => { try { c.write(msg); } catch(e) {} });
}

process.on("exit", () => {
    try { __CLAUDE_FS__.unlinkSync(__CLAUDE_SOCKET_PATH__); } catch(e) {}
});
// === END SOCKET SETUP ===
`;

// Find a good insertion point - after the first few imports
const insertAfterImports = code.indexOf('var cK1 =');
if (insertAfterImports === -1) {
    console.error('Could not find import section');
    process.exit(1);
}
code = code.slice(0, insertAfterImports) + socketServerCode + '\n' + code.slice(insertAfterImports);
console.log('✓ Added socket server');

// 2. Patch text_delta to broadcast each chunk
// Find: if (G.type === "text") this._emit("text", Q.delta.text, G.text || "");
const textEmitPattern = /if \(G\.type === "text"\) this\._emit\("text", Q\.delta\.text, G\.text \|\| ""\);/g;

let patchCount = 0;
code = code.replace(textEmitPattern, (match) => {
    patchCount++;
    return `if (G.type === "text") {
                                this._emit("text", Q.delta.text, G.text || "");
                                if (typeof __CLAUDE_BROADCAST__ === "function") {
                                    __CLAUDE_BROADCAST__({type:"text",chunk:Q.delta.text,full:G.text||""});
                                }
                            }`;
});
console.log(`✓ Patched ${patchCount} text_delta handlers`);

// 3. Patch message_start to broadcast start event
const messageStartPattern = /case "message_start":\s*\{/g;
code = code.replace(messageStartPattern, (match) => {
    return `case "message_start": {
                    if (typeof __CLAUDE_BROADCAST__ === "function") __CLAUDE_BROADCAST__({type:"start"});`;
});
console.log('✓ Patched message_start');

// 4. Patch message_stop to broadcast stop event  
const messageStopPattern = /case "message_stop":\s*\{/g;
code = code.replace(messageStopPattern, (match) => {
    return `case "message_stop": {
                    if (typeof __CLAUDE_BROADCAST__ === "function") __CLAUDE_BROADCAST__({type:"stop"});`;
});
console.log('✓ Patched message_stop');

// 5. Add injection hook in the React component (find the CG callback area)
const cgCallbackPattern = /(\}, \[CG\]\);)\n(\s*async function YF\(\))/;
const injectHookCode = `
    // === INJECT HOOK ===
    rQ.useEffect(() => {
        global.__CLAUDE_INJECT__ = (text) => {
            QQ(text);
            setTimeout(() => {
                CG(text, void 0, { setCursorOffset: () => {}, clearBuffer: () => {}, resetHistory: () => {} });
            }, 50);
        };
        return () => { global.__CLAUDE_INJECT__ = null; };
    }, [QQ, CG]);
    // === END INJECT HOOK ===
`;

if (cgCallbackPattern.test(code)) {
    code = code.replace(cgCallbackPattern, `$1\n${injectHookCode}\n$2`);
    console.log('✓ Added injection hook');
} else {
    console.log('⚠ Could not add injection hook (optional)');
}

fs.writeFileSync(outputFile, code);
console.log(`\nOutput: ${outputFile}`);
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage:
  1. Replace your cli.js with the patched version
  2. Run Claude normally
  3. Connect to stream:
     
     nc -U /tmp/claude-stream.sock
     
     # Or with Node:
     const net = require('net');
     const sock = net.connect('/tmp/claude-stream.sock');
     sock.on('data', d => console.log(d.toString()));

Stream format (newline-delimited JSON):
  {"type":"start"}
  {"type":"text","chunk":"Hello","full":"Hello"}
  {"type":"text","chunk":" world","full":"Hello world"}
  {"type":"stop"}

Inject prompt:
  echo '{"type":"inject","text":"hello"}' | nc -U /tmp/claude-stream.sock
  # Or plain text:
  echo "hello" | nc -U /tmp/claude-stream.sock

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
