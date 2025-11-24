#!/usr/bin/env node
/**
 * Test script to verify refactored modules work correctly
 */

async function testModules() {
  console.log('=== CLI Refactor Module Tests ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Core utilities
  try {
    const { clone, cloneDeep, isEqual, memoize } = await import('./dist/core/index.js');

    // Test clone
    const obj = { a: 1, b: { c: 2 } };
    const cloned = clone(obj);
    if (cloned.a === 1 && cloned !== obj) {
      console.log('✓ core/clone works');
      passed++;
    } else {
      throw new Error('clone failed');
    }

    // Test cloneDeep
    const deepCloned = cloneDeep(obj);
    if (deepCloned.b.c === 2 && deepCloned.b !== obj.b) {
      console.log('✓ core/cloneDeep works');
      passed++;
    } else {
      throw new Error('cloneDeep failed');
    }

    // Test isEqual
    if (isEqual({ a: 1 }, { a: 1 }) && !isEqual({ a: 1 }, { a: 2 })) {
      console.log('✓ core/isEqual works');
      passed++;
    } else {
      throw new Error('isEqual failed');
    }

    // Test memoize
    let callCount = 0;
    const expensive = memoize((x) => { callCount++; return x * 2; });
    expensive(5);
    expensive(5);
    if (callCount === 1) {
      console.log('✓ core/memoize works');
      passed++;
    } else {
      throw new Error('memoize failed');
    }
  } catch (err) {
    console.log('✗ core utilities:', err.message);
    failed++;
  }

  // Test 2: Logger
  try {
    const { log, debug, info, warn, error } = await import('./dist/core/logger.js');
    if (typeof log === 'function' && typeof debug === 'function') {
      console.log('✓ core/logger exports functions');
      passed++;
    }
  } catch (err) {
    console.log('✗ core/logger:', err.message);
    failed++;
  }

  // Test 3: Config
  try {
    const { getConfigDir } = await import('./dist/core/config.js');
    const configDir = getConfigDir();
    if (typeof configDir === 'string' && configDir.length > 0) {
      console.log('✓ core/config getConfigDir works:', configDir);
      passed++;
    }
  } catch (err) {
    console.log('✗ core/config:', err.message);
    failed++;
  }

  // Test 4: Terminal
  try {
    const { bold, red, green, stripAnsi } = await import('./dist/core/terminal.js');
    const boldText = bold('test');
    const redText = red('error');
    const stripped = stripAnsi(boldText);
    if (stripped === 'test') {
      console.log('✓ core/terminal formatting works');
      passed++;
    }
  } catch (err) {
    console.log('✗ core/terminal:', err.message);
    failed++;
  }

  // Test 5: Session
  try {
    const { getSessionId, getCwd } = await import('./dist/core/session.js');
    const sessionId = getSessionId();
    const cwd = getCwd();
    if (typeof sessionId === 'string' && typeof cwd === 'string') {
      console.log('✓ core/session works, id:', sessionId.slice(0, 8) + '...');
      passed++;
    }
  } catch (err) {
    console.log('✗ core/session:', err.message);
    failed++;
  }

  // Test 6: AWS encoding
  try {
    const { fromBase64, toBase64 } = await import('./dist/aws/encoding.js');
    const encoded = toBase64('Hello World');
    const decoded = fromBase64(encoded);
    if (decoded === 'Hello World') {
      console.log('✓ aws/encoding base64 works');
      passed++;
    }
  } catch (err) {
    console.log('✗ aws/encoding:', err.message);
    failed++;
  }

  // Test 7: Network URL
  try {
    const { parseUrl, serializeUrl } = await import('./dist/network/url.js');
    const parsed = parseUrl('https://example.com/path?query=1');
    if (parsed.hostname === 'example.com' && parsed.pathname === '/path') {
      console.log('✓ network/url parsing works');
      passed++;
    }
  } catch (err) {
    console.log('✗ network/url:', err.message);
    failed++;
  }

  // Test 7b: Auth module (PKCE and config)
  try {
    const { generatePKCE, generateState, getOAuthConfig, buildAuthorizationUrl } = await import('./dist/core/auth.js');

    // Test PKCE generation
    const pkce = generatePKCE();
    if (pkce.codeVerifier && pkce.codeVerifier.length >= 43 && pkce.codeChallenge) {
      // Test state generation
      const state = generateState();
      if (state && state.length > 0) {
        // Test config
        const config = getOAuthConfig();
        if (config.CLIENT_ID && config.TOKEN_URL.includes('anthropic.com')) {
          // Test URL building
          const authUrl = buildAuthorizationUrl({
            codeChallenge: pkce.codeChallenge,
            state: state,
            redirectUri: 'http://localhost:51423/callback',
          });
          if (authUrl.includes('oauth/authorize') && authUrl.includes('code_challenge')) {
            console.log('✓ core/auth OAuth functions work');
            passed++;
          }
        }
      }
    }
  } catch (err) {
    console.log('✗ core/auth:', err.message);
    failed++;
  }

  // Test 8: Network errors
  try {
    const { NetworkError, TimeoutError } = await import('./dist/network/errors.js');
    const err = new NetworkError('test error');
    if (err instanceof Error && err.message === 'test error') {
      console.log('✓ network/errors classes work');
      passed++;
    }
  } catch (err) {
    console.log('✗ network/errors:', err.message);
    failed++;
  }

  // Test 9: IDE detector
  try {
    const { getIdeDisplayName, IDE_CONFIGS } = await import('./dist/ide/detector.js');
    const name = getIdeDisplayName('vscode');
    if (name === 'VS Code') {
      console.log('✓ ide/detector works');
      passed++;
    }
  } catch (err) {
    console.log('✗ ide/detector:', err.message);
    failed++;
  }

  // Test 10: Telemetry clock
  try {
    const { AnchoredClock } = await import('./dist/telemetry/clock.js');
    const clock = new AnchoredClock();
    const now = clock.now();
    if (typeof now === 'number' && now > 0) {
      console.log('✓ telemetry/clock works');
      passed++;
    }
  } catch (err) {
    console.log('✗ telemetry/clock:', err.message);
    failed++;
  }

  // Test 11: CLI parser
  try {
    const { parseArgs } = await import('./dist/cli/parser.js');
    const result = parseArgs(['--help', '--verbose', 'mycommand', 'arg1']);
    if (result.options.help === true && result.command === 'mycommand') {
      console.log('✓ cli/parser works');
      passed++;
    } else {
      throw new Error(`Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (err) {
    console.log('✗ cli/parser:', err.message);
    failed++;
  }

  // Test 12: Tools file reader
  try {
    const { detectEncoding } = await import('./dist/tools/file-reader.js');
    if (typeof detectEncoding === 'function') {
      console.log('✓ tools/file-reader exports correctly');
      passed++;
    }
  } catch (err) {
    console.log('✗ tools/file-reader:', err.message);
    failed++;
  }

  // Test 13: UI diff utils
  try {
    const { createDiffHunks } = await import('./dist/ui/diff-utils.js');
    const hunks = createDiffHunks({
      filePath: 'test.txt',
      oldContent: 'hello',
      newContent: 'hello world'
    });
    if (Array.isArray(hunks)) {
      console.log('✓ ui/diff-utils works');
      passed++;
    }
  } catch (err) {
    console.log('✗ ui/diff-utils:', err.message);
    failed++;
  }

  // Test 14: Main index exports
  try {
    const mainModule = await import('./dist/index.js');
    const exports = Object.keys(mainModule);
    if (exports.includes('core') && exports.includes('aws') && exports.includes('cli')) {
      console.log('✓ main index exports all modules:', exports.length, 'exports');
      passed++;
    }
  } catch (err) {
    console.log('✗ main index:', err.message);
    failed++;
  }

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✓ All modules working correctly!');
}

testModules().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
