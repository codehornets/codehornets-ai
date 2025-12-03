#!/usr/bin/env node
/**
 * patch-cli-socket.mjs
 * 
 * Patches Claude Code cli.js to:
 * 1. Emit response events over a Unix socket
 * 2. Accept prompt injection via socket
 * 
 * Socket protocol:
 *   INJECT: {"type":"inject","text":"your prompt","autoSubmit":true}
 *   RESPONSE EVENT: {"type":"response","text":"Claude's response","timestamp":123}
 *   LOADING EVENT: {"type":"loading","isLoading":true}
 */

import fs from 'fs';

const inputFile = process.argv[2] || 'cli_pretty.js';
const outputFile = process.argv[3] || 'cli_patched.js';
const socketPath = process.argv[4] || '/tmp/claude-events.sock';

console.log(`Reading: ${inputFile}`);
let code = fs.readFileSync(inputFile, 'utf8');

if (code.includes('__CLAUDE_SOCKET_SERVER__')) {
    console.log('Already patched!');
    process.exit(0);
}

const socketHookCode = `
    // === CLAUDE CODE SOCKET EVENT SYSTEM ===
    rQ.useEffect(() => {
        const net = require("net");
        const fs = require("fs");
        const SOCKET_PATH = process.env.CLAUDE_SOCKET || "${socketPath}";
        
        // Clean up old socket
        try { fs.unlinkSync(SOCKET_PATH); } catch(e) {}
        
        // Track connected clients
        const clients = new Set();
        
        // Broadcast to all clients
        const broadcast = (data) => {
            const msg = JSON.stringify(data) + "\\n";
            clients.forEach(c => {
                try { c.write(msg); } catch(e) {}
            });
        };
        
        // Create server
        const server = net.createServer(socket => {
            clients.add(socket);
            console.log("[SOCKET] Client connected");
            
            let buffer = "";
            socket.on("data", chunk => {
                buffer += chunk.toString();
                const lines = buffer.split("\\n");
                buffer = lines.pop(); // Keep incomplete line
                
                lines.forEach(line => {
                    if (!line.trim()) return;
                    try {
                        const msg = JSON.parse(line);
                        if (msg.type === "inject" && global.__CLAUDE_INJECT__) {
                            global.__CLAUDE_INJECT__(msg.text, msg.autoSubmit !== false);
                        }
                    } catch(e) {
                        // Plain text = inject directly
                        if (line.trim() && global.__CLAUDE_INJECT__) {
                            global.__CLAUDE_INJECT__(line.trim(), true);
                        }
                    }
                });
            });
            
            socket.on("close", () => {
                clients.delete(socket);
                console.log("[SOCKET] Client disconnected");
            });
            
            socket.on("error", () => clients.delete(socket));
        });
        
        server.listen(SOCKET_PATH, () => {
            fs.chmodSync(SOCKET_PATH, 0o666);
            console.log("[SOCKET] Listening on " + SOCKET_PATH);
        });
        
        global.__CLAUDE_SOCKET_SERVER__ = server;
        global.__CLAUDE_BROADCAST__ = broadcast;
        
        return () => {
            server.close();
            try { fs.unlinkSync(SOCKET_PATH); } catch(e) {}
        };
    }, []);
    
    // Track loading and emit response events
    const __prevLoadingRef__ = rQ.useRef(eA);
    rQ.useEffect(() => {
        const wasLoading = __prevLoadingRef__.current;
        __prevLoadingRef__.current = eA;
        
        // Broadcast loading state
        if (global.__CLAUDE_BROADCAST__) {
            global.__CLAUDE_BROADCAST__({ type: "loading", isLoading: eA });
        }
        
        // Response complete: loading true -> false
        if (wasLoading && !eA && N0.length > 0) {
            const lastMessage = N0[N0.length - 1];
            
            if (lastMessage && lastMessage.role === "assistant") {
                let text = "";
                if (Array.isArray(lastMessage.content)) {
                    text = lastMessage.content
                        .filter(b => b.type === "text")
                        .map(b => b.text)
                        .join("\\n");
                } else if (typeof lastMessage.content === "string") {
                    text = lastMessage.content;
                }
                
                if (global.__CLAUDE_BROADCAST__) {
                    global.__CLAUDE_BROADCAST__({
                        type: "response",
                        text: text,
                        messageCount: N0.length,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }, [eA, N0]);
    
    // Expose injection function
    rQ.useEffect(() => {
        global.__CLAUDE_INJECT__ = (text, autoSubmit = true) => {
            QQ(text);
            if (autoSubmit) {
                CG(text, void 0, {
                    setCursorOffset: () => {},
                    clearBuffer: () => {},
                    resetHistory: () => {}
                });
            }
        };
    }, [QQ, CG]);
    // === END SOCKET EVENT SYSTEM ===
`;

const pattern = /(\}, \[CG\]\);)\n(\s*async function YF\(\))/;

if (pattern.test(code)) {
    code = code.replace(pattern, `$1\n${socketHookCode}\n$2`);
    console.log('Patched successfully!');
} else {
    console.error('Could not find injection point!');
    process.exit(1);
}

fs.writeFileSync(outputFile, code);
console.log(`Output: ${outputFile}`);
console.log(`
Socket: ${socketPath}

To use:
  1. Replace your Claude cli.js with the patched version
  2. Run Claude normally - it will create the socket
  3. Listen for events:
     nc -U ${socketPath}
  
  4. Inject prompts:
     echo '{"type":"inject","text":"hello"}' | nc -U ${socketPath}
     # or plain text:
     echo "hello" | nc -U ${socketPath}

Event format:
  {"type":"response","text":"Claude's response","timestamp":123456}
  {"type":"loading","isLoading":true}
`);
