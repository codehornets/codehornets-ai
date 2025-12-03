#!/usr/bin/env node
/**
 * patch-claude.js - Patches Claude Code CLI for stdin injection
 * Usage: node patch-claude.js [input.js] [output.js]
 */

const fs = require('fs');

const inputFile = process.argv[2] || 'cli_pretty.js';
const outputFile = process.argv[3] || 'cli_patched.js';

console.log(`Reading: ${inputFile}`);
let code = fs.readFileSync(inputFile, 'utf8');

// Check if already patched
if (code.includes('CLAUDE_INJECT_EMITTER')) {
    console.log('Already patched!');
    process.exit(0);
}

// The injection code
const injectCode = `
    // === CLAUDE CODE INJECTION HOOK ===
    rQ.useEffect(() => {
        const { EventEmitter } = require("events");
        if (!global.__CLAUDE_INJECT_EMITTER__) {
            global.__CLAUDE_INJECT_EMITTER__ = new EventEmitter();
        }
        const handler = (text, autoSubmit = true) => {
            QQ(text);
            if (autoSubmit) {
                CG(text, void 0, {
                    setCursorOffset: () => {},
                    clearBuffer: () => {},
                    resetHistory: () => {}
                });
            }
        };
        global.__CLAUDE_INJECT__ = handler;
        global.__CLAUDE_INJECT_EMITTER__.on("inject", handler);
        return () => global.__CLAUDE_INJECT_EMITTER__.off("inject", handler);
    }, [QQ, CG]);
    // === END INJECTION HOOK ===
`;

// Strategy 1: Look for prettified pattern
// }, [CG]);\n    async function YF()
let pattern1 = /(\}, \[CG\]\);)\n(\s*async function YF\(\))/;
if (pattern1.test(code)) {
    code = code.replace(pattern1, `$1\n${injectCode}\n$2`);
    console.log('Patched using prettified pattern');
} else {
    // Strategy 2: Look for minified pattern
    // },[CG]);async function
    let pattern2 = /(\},\s*\[CG\]\s*\]\s*\))\s*;?\s*(async function)/;
    if (pattern2.test(code)) {
        code = code.replace(pattern2, `$1;${injectCode.replace(/\n/g, '')}$2`);
        console.log('Patched using minified pattern');
    } else {
        // Strategy 3: Find CG callback end more broadly
        const cgPattern = /\[eA,\s*d9,\s*LA,\s*QQ.*?D\]\)/;
        const match = code.match(cgPattern);
        if (match) {
            const idx = code.indexOf(match[0]) + match[0].length;
            // Find the next semicolon or comma
            let endIdx = idx;
            while (endIdx < code.length && code[endIdx] !== ';' && code[endIdx] !== ',') {
                endIdx++;
            }
            if (code[endIdx] === ';' || code[endIdx] === ',') {
                code = code.slice(0, endIdx + 1) + injectCode + code.slice(endIdx + 1);
                console.log('Patched using dependency array pattern');
            } else {
                console.error('Could not find injection point');
                process.exit(1);
            }
        } else {
            console.error('Could not find CG callback pattern');
            process.exit(1);
        }
    }
}

fs.writeFileSync(outputFile, code);
console.log(`Patched file written to: ${outputFile}`);
console.log('');
console.log('To use:');
console.log('  1. Backup your original cli.js');
console.log('  2. Replace cli.js with this patched version');
console.log('  3. Run Claude normally');
console.log('  4. Inject via: global.__CLAUDE_INJECT__("your prompt")');
