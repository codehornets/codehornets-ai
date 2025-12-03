#!/usr/bin/env node
/**
 * claude-inject.js - Client to inject prompts into running Claude
 * 
 * Usage:
 *   node claude-inject.js "your prompt here"
 *   echo "prompt" | node claude-inject.js
 *   node claude-inject.js --no-submit "just set text"
 */

const net = require('net');
const readline = require('readline');

const SOCKET_PATH = process.env.CLAUDE_INJECT_SOCKET || '/tmp/claude-inject.sock';

async function getInput() {
    // Check for --no-submit flag
    const args = process.argv.slice(2);
    const noSubmit = args.includes('--no-submit') || args.includes('-n');
    const filteredArgs = args.filter(a => a !== '--no-submit' && a !== '-n');
    
    let text;
    
    if (filteredArgs.length > 0) {
        text = filteredArgs.join(' ');
    } else if (!process.stdin.isTTY) {
        // Read from pipe
        const rl = readline.createInterface({ input: process.stdin });
        const lines = [];
        for await (const line of rl) {
            lines.push(line);
        }
        text = lines.join('\n');
    } else {
        console.error('Usage: claude-inject "prompt" or echo "prompt" | claude-inject');
        process.exit(1);
    }
    
    return { text, autoSubmit: !noSubmit };
}

async function inject({ text, autoSubmit }) {
    return new Promise((resolve, reject) => {
        const client = net.connect(SOCKET_PATH, () => {
            // Send as JSON for the patched version, or raw for PTY wrapper
            const payload = JSON.stringify({ text, autoSubmit }) + '\n';
            client.write(payload);
            client.end();
        });
        
        let response = '';
        client.on('data', chunk => { response += chunk; });
        client.on('end', () => resolve(response.trim()));
        client.on('error', err => {
            if (err.code === 'ENOENT' || err.code === 'ECONNREFUSED') {
                // Try raw write for PTY wrapper
                const client2 = net.connect(SOCKET_PATH, () => {
                    client2.write(text);
                    client2.end();
                });
                client2.on('data', chunk => { response += chunk; });
                client2.on('end', () => resolve(response.trim()));
                client2.on('error', reject);
            } else {
                reject(err);
            }
        });
    });
}

async function main() {
    try {
        const input = await getInput();
        const result = await inject(input);
        console.log(result || 'Injected');
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`Socket not found: ${SOCKET_PATH}`);
            console.error('Is Claude running with injection enabled?');
        } else {
            console.error('Error:', err.message);
        }
        process.exit(1);
    }
}

main();
