const fs = require('fs');
const path = require('path');

// Fix parser.ts
let parserContent = fs.readFileSync('src/cli/parser.ts', 'utf8');

// Fix array indexing issues in parser.ts
parserContent = parserContent
  // Fix line 128 - positionals.push(arg) where arg could be undefined
  .replace(/positionals\.push\(arg\);/g, 'positionals.push(arg!);')
  // Fix line 134-137 - arg.startsWith checks and array access
  .replace(/if \(arg\.startsWith\('--'\) && arg\.includes\('='\)\) \{/g, "if (arg && arg.startsWith('--') && arg.includes('=')) {")
  // Fix line 152 - if (arg.startsWith('--'))
  .replace(/if \(arg\.startsWith\('--'\)\) \{/g, "if (arg && arg.startsWith('--')) {")
  // Fix line 156 - argv[i + 1]
  .replace(/!argv\[i \+ 1\]\.startsWith\('-'\)/g, "argv[i + 1] && !argv[i + 1].startsWith('-')")
  // Fix line 178 - if (arg.startsWith('-') && arg.length > 1)
  .replace(/if \(arg\.startsWith\('-'\) && arg\.length > 1\) \{/g, "if (arg && arg.startsWith('-') && arg.length > 1) {")
  // Fix line 182 - argv[i + 1]
  .replace(/if \(spec\.takesValue && i \+ 1 < argv\.length && !argv\[i \+ 1\]\.startsWith\('-'\)\)/g, "if (spec.takesValue && i + 1 < argv.length && argv[i + 1] && !argv[i + 1]!.startsWith('-'))")
  // Fix line 197 - arg.slice(1)
  .replace(/const flags = arg\.slice\(1\);/g, "const flags = arg!.slice(1);")
  // Fix line 221-226 - positionals[j]
  .replace(/const pos = positionals\[j\];/g, "const pos = positionals[j]!;")
  .replace(/if \(!command && !pos\.startsWith\('-'\)\) \{/g, "if (!command && pos && !pos.startsWith('-')) {")
  .replace(/else if \(command && !subcommand && !pos\.startsWith\('-'\)\) \{/g, "} else if (command && !subcommand && pos && !pos.startsWith('-')) {");

fs.writeFileSync('src/cli/parser.ts', parserContent);

// Fix help.ts - array destructuring issues
let helpContent = fs.readFileSync('src/cli/help.ts', 'utf8');

// Fix Math.max(...commands.map(([cmd]) => cmd.length)) patterns
helpContent = helpContent
  .replace(/Math\.max\(\.\.\.commands\.map\(\(\[cmd\]\) => cmd\.length\)\)/g, 'Math.max(...commands.map(([cmd]) => (cmd ?? "").length))')
  .replace(/Math\.max\(\.\.\.options\.map\(\(\[opt\]\) => opt\.length\)\)/g, 'Math.max(...options.map(([opt]) => (opt ?? "").length))')
  .replace(/Math\.max\(\.\.\.mcpCliCommands\.map\(\(\[cmd\]\) => cmd\.length\)\)/g, 'Math.max(...mcpCliCommands.map(([cmd]) => (cmd ?? "").length))')
  // Fix the for...of loops with destructuring
  .replace(/for \(const \[cmd, desc\] of commands\) \{/g, 'for (const entry of commands) { const cmd = entry[0]!; const desc = entry[1]!')
  .replace(/for \(const \[opt, desc\] of options\) \{/g, 'for (const entry of options) { const opt = entry[0]!; const desc = entry[1]!')
  .replace(/for \(const \[cmd, desc\] of mcpCliCommands\) \{/g, 'for (const entry of mcpCliCommands) { const cmd = entry[0]!; const desc = entry[1]!');

fs.writeFileSync('src/cli/help.ts', helpContent);

// Fix main.ts
let mainContent = fs.readFileSync('src/main.ts', 'utf8');
mainContent = mainContent
  .replace(/parseInt\(nodeVersion\.slice\(1\)\.split\('\.'\)\[0\], 10\)/g, "parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10)");
fs.writeFileSync('src/main.ts', mainContent);

console.log('Fixed parser.ts, help.ts, and main.ts');
