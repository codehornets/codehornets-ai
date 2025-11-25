/**
 * Interactive Mode Module
 *
 * Provides interactive Claude Code session functionality.
 * Supports both single-prompt (-p) mode and full interactive REPL mode.
 * Uses OAuth web session authentication via /v1/sessions API.
 *
 * @module cli/interactive
 */

import * as readline from 'readline';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ContentBlockDeltaEvent } from '@anthropic-ai/sdk/resources/messages';
import type { CLIOptions, ExitCode } from './types.js';
import { ExitCodes } from './types.js';
import { cyan, green, red, yellow, dim, bold } from '../core/terminal.js';
import {
  isAuthenticated,
  authenticate,
  readCredentials,
  getOAuthConfig,
} from '../core/auth.js';

/**
 * Interactive session options.
 */
export interface InteractiveOptions extends CLIOptions {
  /** Model to use for API calls */
  model?: string;
  /** System prompt override */
  systemPrompt?: string;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Skip authentication check (for testing) */
  skipAuth?: boolean;
}

/**
 * Conversation message structure for history tracking.
 */
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Default values for interactive session.
 */
const DEFAULTS = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
  systemPrompt: 'You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest. You are running in Claude Code CLI interactive mode.',
} as const;

/**
 * Checks if any authentication is available (OAuth tokens or API key).
 *
 * @returns True if credentials are available
 */
export async function hasCredentials(): Promise<boolean> {
  // Check for environment API key first
  if (process.env.ANTHROPIC_API_KEY) {
    return true;
  }

  // Check for stored credentials
  return await isAuthenticated();
}

/**
 * Legacy function - checks for API key only.
 * @deprecated Use hasCredentials() instead
 *
 * @returns True if API key is available
 */
export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Determines if we should use OAuth web session or API key.
 *
 * @returns 'oauth' | 'apikey' | null
 */
function getAuthMode(): 'oauth' | 'apikey' | null {
  const credentials = readCredentials();

  // OAuth tokens take priority (web session / Claude Pro subscription)
  if (credentials.oauthTokens?.accessToken) {
    return 'oauth';
  }

  // Fall back to API key
  if (process.env.ANTHROPIC_API_KEY || credentials.primaryApiKey) {
    return 'apikey';
  }

  return null;
}

/**
 * Creates an Anthropic client for API key authentication.
 *
 * @returns Anthropic client
 * @throws Error if no API key is available
 */
function createApiKeyClient(): Anthropic {
  if (process.env.ANTHROPIC_API_KEY) {
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  const credentials = readCredentials();
  if (credentials.primaryApiKey) {
    return new Anthropic({
      apiKey: credentials.primaryApiKey,
    });
  }

  throw new Error('No API key available');
}

/**
 * Prompts user to authenticate if not already authenticated.
 *
 * @returns True if authentication succeeded or already authenticated
 */
async function ensureAuthenticated(): Promise<boolean> {
  if (await hasCredentials()) {
    return true;
  }

  console.log(yellow('No authentication credentials found.'));
  console.log('You need to authenticate to use Claude Code.\n');

  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question('Would you like to authenticate now? (y/n): ', resolve);
  });

  rl.close();

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    try {
      await authenticate({ useClaudeAi: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(red(`\nAuthentication failed: ${message}`));
      return false;
    }
  }

  console.log(dim('\nYou can authenticate later by running: claude login'));
  return false;
}

// ============================================================================
// OAuth Web Session API
// ============================================================================

/**
 * Sends a message using OAuth web session API (/v1/messages with proper headers).
 * This uses the same endpoint but with OAuth-specific headers that enable web session billing.
 *
 * @param accessToken - OAuth access token
 * @param messages - Conversation messages
 * @param options - Session options
 * @returns AsyncGenerator yielding text chunks
 */
async function* streamOAuthMessage(
  accessToken: string,
  messages: ConversationMessage[],
  options: InteractiveOptions
): AsyncGenerator<string, void, unknown> {
  const config = getOAuthConfig();
  const model = options.model ?? DEFAULTS.model;
  const maxTokens = options.maxTokens ?? DEFAULTS.maxTokens;
  const systemPrompt = options.systemPrompt ?? DEFAULTS.systemPrompt;

  const response = await fetch(`${config.BASE_API_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14',
      'x-app': 'cli',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      stream: true,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            yield event.delta.text;
          }
        } catch {
          // Ignore parse errors for malformed events
        }
      }
    }
  }
}

// ============================================================================
// API Key Mode (standard Anthropic SDK)
// ============================================================================

/**
 * Sends a message using standard Anthropic SDK (API key mode).
 *
 * @param client - Anthropic client
 * @param messages - Conversation messages
 * @param options - Session options
 * @returns The assistant's response text
 */
async function streamApiKeyMessage(
  client: Anthropic,
  messages: MessageParam[],
  options: InteractiveOptions
): Promise<string> {
  const model = options.model ?? DEFAULTS.model;
  const maxTokens = options.maxTokens ?? DEFAULTS.maxTokens;
  const systemPrompt = options.systemPrompt ?? DEFAULTS.systemPrompt;

  let responseText = '';

  const stream = await client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const delta = event as ContentBlockDeltaEvent;
      if (delta.delta.type === 'text_delta') {
        const text = delta.delta.text;
        process.stdout.write(text);
        responseText += text;
      }
    }
  }

  // Ensure we end with a newline
  if (!responseText.endsWith('\n')) {
    process.stdout.write('\n');
  }

  return responseText;
}

// ============================================================================
// Single Prompt Mode
// ============================================================================

/**
 * Runs a single prompt and exits.
 * Used when the -p flag is provided.
 *
 * @param prompt - The prompt to send to Claude
 * @param options - Session options
 * @returns Exit code
 */
export async function runSinglePrompt(
  prompt: string,
  options: InteractiveOptions = {}
): Promise<ExitCode> {
  // Check for credentials
  if (!options.skipAuth && !(await ensureAuthenticated())) {
    return ExitCodes.ERROR;
  }

  const authMode = getAuthMode();

  try {
    if (authMode === 'oauth') {
      const credentials = readCredentials();
      const accessToken = credentials.oauthTokens!.accessToken;
      const messages: ConversationMessage[] = [{ role: 'user', content: prompt }];

      for await (const text of streamOAuthMessage(accessToken, messages, options)) {
        process.stdout.write(text);
      }
      process.stdout.write('\n');
    } else if (authMode === 'apikey') {
      const client = createApiKeyClient();
      const messages: MessageParam[] = [{ role: 'user', content: prompt }];
      await streamApiKeyMessage(client, messages, options);
    } else {
      console.error(red('No authentication credentials available.'));
      return ExitCodes.ERROR;
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(red(`Error: ${message}`));

    if (process.env.DEBUG || process.env.CLAUDE_DEBUG) {
      if (error instanceof Error && error.stack) {
        console.error(dim(error.stack));
      }
    }

    return ExitCodes.ERROR;
  }
}

// ============================================================================
// Interactive REPL Mode
// ============================================================================

/**
 * Handles built-in commands (starting with /).
 *
 * @param command - The command (including /)
 * @param conversationHistory - Current conversation history (may be modified)
 * @returns Object indicating whether to continue the loop and any messages
 */
function handleCommand(
  command: string,
  conversationHistory: ConversationMessage[]
): { shouldContinue: boolean; message?: string; action?: 'login' | 'logout' | 'status' } {
  const cmd = command.toLowerCase().trim();

  switch (cmd) {
    case '/exit':
    case '/quit':
    case '/q':
      return { shouldContinue: false, message: 'Goodbye!' };

    case '/help':
    case '/h':
    case '/?':
      return {
        shouldContinue: true,
        message: `
${bold('Available Commands:')}
  ${cyan('/help')}    - Show this help message
  ${cyan('/clear')}   - Clear conversation history
  ${cyan('/history')} - Show conversation history count
  ${cyan('/login')}   - Authenticate with Anthropic
  ${cyan('/logout')}  - Clear stored credentials
  ${cyan('/status')}  - Show authentication status
  ${cyan('/exit')}    - Exit the interactive session

${bold('Tips:')}
  - Type your message and press Enter to send
  - Press Ctrl+C to interrupt a response
  - Press Ctrl+D or type /exit to quit
`,
      };

    case '/clear':
      conversationHistory.length = 0;
      return { shouldContinue: true, message: 'Conversation history cleared.' };

    case '/history':
      return {
        shouldContinue: true,
        message: `Conversation history: ${conversationHistory.length} messages`,
      };

    case '/login':
      return { shouldContinue: true, action: 'login' };

    case '/logout':
      return { shouldContinue: true, action: 'logout' };

    case '/status':
      return { shouldContinue: true, action: 'status' };

    default:
      return {
        shouldContinue: true,
        message: yellow(`Unknown command: ${command}. Type /help for available commands.`),
      };
  }
}

/**
 * Shows authentication status.
 */
async function showAuthStatus(): Promise<void> {
  const credentials = readCredentials();
  const hasEnvKey = !!process.env.ANTHROPIC_API_KEY;
  const authMode = getAuthMode();

  console.log(bold('Authentication Status:'));
  console.log(dim(`  Mode: ${authMode ?? 'none'}`));

  if (hasEnvKey) {
    console.log(green('  API Key: ') + 'Set via ANTHROPIC_API_KEY environment variable');
  }

  if (credentials.oauthTokens) {
    const expiresAt = new Date(credentials.oauthTokens.expiresAt);
    const isExpired = Date.now() >= credentials.oauthTokens.expiresAt;

    console.log(green('  OAuth: ') + (isExpired ? yellow('Expired') : 'Authenticated (Web Session)'));
    console.log(dim(`    Expires: ${expiresAt.toLocaleString()}`));

    if (credentials.oauthAccount?.emailAddress) {
      console.log(dim(`    Account: ${credentials.oauthAccount.emailAddress}`));
    }

    if (credentials.oauthAccount?.displayName) {
      console.log(dim(`    Name: ${credentials.oauthAccount.displayName}`));
    }
  } else if (!hasEnvKey) {
    console.log(yellow('  Not authenticated'));
    console.log(dim('  Run /login to authenticate'));
  }
}

/**
 * Creates a readline interface for user input.
 *
 * @returns Readline interface
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY ?? false,
  });
}

/**
 * Prompts the user for input.
 *
 * @param rl - Readline interface
 * @param prompt - Prompt string to display
 * @returns Promise resolving to user input
 */
function promptUser(rl: readline.Interface, prompt: string): Promise<string | null> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });

    rl.once('close', () => {
      resolve(null);
    });
  });
}

/**
 * Runs the interactive REPL session.
 *
 * @param options - Session options
 * @returns Exit code
 */
export async function runInteractiveSession(
  options: InteractiveOptions = {}
): Promise<ExitCode> {
  // Check for credentials
  if (!options.skipAuth && !(await ensureAuthenticated())) {
    return ExitCodes.ERROR;
  }

  let authMode = getAuthMode();
  let apiKeyClient: Anthropic | null = null;

  if (authMode === 'apikey') {
    try {
      apiKeyClient = createApiKeyClient();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(red(`Error creating client: ${message}`));
      return ExitCodes.ERROR;
    }
  }

  // Display welcome message
  const modeInfo = authMode === 'oauth' ? '(Web Session)' : authMode === 'apikey' ? '(API Key)' : '';
  console.log(bold(cyan('Claude Code (refactored)')) + dim(` ${modeInfo} - Type your message, or /help for commands`));
  console.log();

  // Initialize conversation history
  const conversationHistory: ConversationMessage[] = [];

  // Create readline interface
  const rl = createReadlineInterface();

  // Track if we're currently streaming a response
  let isStreaming = false;

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    if (isStreaming) {
      // Interrupt current stream
      console.log(yellow('\n[Interrupted]'));
      isStreaming = false;
    } else {
      // Exit the session
      console.log('\nGoodbye!');
      rl.close();
      process.exit(ExitCodes.SUCCESS);
    }
  });

  // Main REPL loop
  while (true) {
    const input = await promptUser(rl, green('You: '));

    // Handle EOF (Ctrl+D)
    if (input === null) {
      console.log('\nGoodbye!');
      break;
    }

    const trimmedInput = input.trim();

    // Skip empty input
    if (!trimmedInput) {
      continue;
    }

    // Handle commands
    if (trimmedInput.startsWith('/')) {
      const result = handleCommand(trimmedInput, conversationHistory);

      // Handle special actions
      if (result.action === 'login') {
        try {
          await authenticate({ useClaudeAi: false });
          // Update auth mode
          authMode = getAuthMode();
          if (authMode === 'apikey') {
            apiKeyClient = createApiKeyClient();
          }
          console.log(green('Authentication successful!'));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(red(`Authentication failed: ${message}`));
        }
        continue;
      }

      if (result.action === 'logout') {
        const { logout } = await import('../core/auth.js');
        logout();
        authMode = null;
        apiKeyClient = null;
        console.log('Logged out. You will need to re-authenticate to continue using Claude.');
        continue;
      }

      if (result.action === 'status') {
        await showAuthStatus();
        continue;
      }

      if (result.message) {
        console.log(result.message);
      }
      if (!result.shouldContinue) {
        break;
      }
      continue;
    }

    // Add user message to history
    conversationHistory.push({ role: 'user', content: trimmedInput });

    // Stream response
    console.log(cyan('Claude: '));
    isStreaming = true;

    try {
      let responseText = '';

      if (authMode === 'oauth') {
        const credentials = readCredentials();
        const accessToken = credentials.oauthTokens!.accessToken;

        for await (const text of streamOAuthMessage(accessToken, conversationHistory, options)) {
          process.stdout.write(text);
          responseText += text;
        }
        if (!responseText.endsWith('\n')) {
          process.stdout.write('\n');
        }
      } else if (authMode === 'apikey' && apiKeyClient) {
        const messages: MessageParam[] = conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        responseText = await streamApiKeyMessage(apiKeyClient, messages, options);
      } else {
        throw new Error('No authentication available. Use /login to authenticate.');
      }

      conversationHistory.push({ role: 'assistant', content: responseText });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(red(`\nError: ${message}`));

      // Remove the failed user message from history
      conversationHistory.pop();

      // Check if this is an auth error and prompt to re-authenticate
      if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('authentication')) {
        console.log(yellow('\nAuthentication may have expired. Try /login to re-authenticate.'));
      }

      if (process.env.DEBUG || process.env.CLAUDE_DEBUG) {
        if (error instanceof Error && error.stack) {
          console.error(dim(error.stack));
        }
      }
    } finally {
      isStreaming = false;
      console.log(); // Add blank line after response
    }
  }

  rl.close();
  return ExitCodes.SUCCESS;
}

/**
 * Main entry point for interactive mode.
 * Determines whether to run single prompt or interactive session.
 *
 * @param prompt - Optional initial prompt (for -p mode)
 * @param options - Session options
 * @returns Exit code
 */
export async function runInteractiveMode(
  prompt?: string,
  options: InteractiveOptions = {}
): Promise<ExitCode> {
  if (prompt) {
    return runSinglePrompt(prompt, options);
  }

  return runInteractiveSession(options);
}

// Keep createClient for backwards compatibility but it now only works for API key mode
export async function createClient(): Promise<Anthropic> {
  const authMode = getAuthMode();
  if (authMode === 'apikey') {
    return createApiKeyClient();
  }
  throw new Error('createClient() only works with API key authentication. OAuth uses direct fetch.');
}

export default runInteractiveMode;
