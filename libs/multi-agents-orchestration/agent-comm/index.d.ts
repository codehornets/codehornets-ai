/**
 * Type definitions for agent-comm module
 *
 * @module agent-comm
 */

import { EventEmitter } from 'events';

/**
 * Communication strategy types
 */
export type StrategyType = 'auto' | 'tmux' | 'pty-wrapper' | 'file-based';

/**
 * Agent status information
 */
export interface AgentStatus {
  /** Whether the agent is available */
  available: boolean;
  /** Current state of the agent */
  state: 'running' | 'stopped' | 'stale' | 'unknown';
  /** Timestamp of last activity */
  lastSeen?: number;
  /** Error message if unavailable */
  error?: string;
  /** Name of the agent */
  agent?: string;
  /** Strategy used to check status */
  strategy?: string;
}

/**
 * Result of a send operation
 */
export interface SendResult {
  /** Whether the send was successful */
  success: boolean;
  /** Response text from the agent */
  response?: string;
  /** Error message if failed */
  error?: string;
  /** Time taken in milliseconds */
  duration: number;
}

/**
 * Result of a delegation operation
 */
export interface DelegateResult extends SendResult {
  /** Name of the assigned agent */
  assignedTo: string;
  /** Role of the assigned agent */
  assignedRole: string;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent name */
  name: string;
  /** Agent role description */
  role: string;
  /** Areas of expertise for task routing */
  expertise?: string[];
}

/**
 * Options for tmux strategy
 */
export interface TmuxStrategyOptions {
  /** Execute tmux commands via docker exec */
  useDockerExec?: boolean;
  /** Path to tmux binary */
  tmuxPath?: string;
  /** Default lines to capture from pane */
  captureLines?: number;
}

/**
 * Options for pty-wrapper strategy
 */
export interface PtyWrapperStrategyOptions {
  /** Directory containing agent sockets */
  socketDir?: string;
  /** Pattern for socket file names (use {agent} placeholder) */
  socketPattern?: string;
  /** Socket connection timeout */
  connectTimeout?: number;
  /** Read response timeout */
  readTimeout?: number;
}

/**
 * Options for file-based strategy
 */
export interface FileBasedStrategyOptions {
  /** Directory for task files */
  tasksDir?: string;
  /** Directory for result files */
  resultsDir?: string;
  /** Directory for heartbeat files */
  heartbeatsDir?: string;
  /** Interval for polling results */
  pollInterval?: number;
  /** Maximum time to wait for response */
  maxWaitTime?: number;
}

/**
 * Options for AgentCommunicator
 */
export interface CommunicatorOptions {
  /** Communication strategy to use */
  strategy?: StrategyType;
  /** List of agent names to manage */
  agents?: string[];
  /** Shared directory path */
  sharedDir?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Custom agent configurations */
  agentConfigs?: Record<string, AgentConfig>;
  /** Options for tmux strategy */
  tmuxOptions?: TmuxStrategyOptions;
  /** Options for pty-wrapper strategy */
  ptyOptions?: PtyWrapperStrategyOptions;
  /** Options for file-based strategy */
  fileOptions?: FileBasedStrategyOptions;
  /** Directory for agent sockets */
  socketDir?: string;
  /** Custom logger instance */
  logger?: Console;
}

/**
 * Options for send operations
 */
export interface SendOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Override strategy for this request */
  strategy?: StrategyType;
  /** Wait for response (default: true) */
  waitForResponse?: boolean;
  /** Delay before capturing response (tmux strategy) */
  responseDelay?: number;
}

/**
 * Options for broadcast operations
 */
export interface BroadcastOptions extends SendOptions {
  /** Continue on failure */
  continueOnError?: boolean;
}

/**
 * Options for getOutput operations
 */
export interface OutputOptions {
  /** Number of lines to retrieve */
  lines?: number;
  /** Limit for result files (file-based) */
  limit?: number;
}

/**
 * Options for delegate operations
 */
export interface DelegateOptions extends SendOptions {
  /** Force specific agent */
  agent?: string;
}

/**
 * Broadcast results
 */
export interface BroadcastResults {
  [agentName: string]: SendResult;
}

/**
 * All agent statuses
 */
export interface AllStatuses {
  [agentName: string]: AgentStatus;
}

/**
 * Base communication strategy interface
 */
export interface BaseStrategy {
  /** Strategy name */
  name: string;
  /** Whether strategy is initialized */
  initialized: boolean;

  /** Initialize the strategy */
  initialize(): Promise<void>;

  /** Check if strategy is available */
  isAvailable(): Promise<boolean>;

  /** Send message to agent */
  send(agentName: string, message: string, options?: SendOptions): Promise<SendResult>;

  /** Send message without waiting for response */
  sendAsync(agentName: string, message: string): Promise<void>;

  /** Get current output from agent */
  getOutput(agentName: string, options?: OutputOptions): Promise<string>;

  /** Get agent status */
  getStatus(agentName: string): Promise<AgentStatus>;

  /** Clean up resources */
  cleanup(): Promise<void>;
}

/**
 * tmux strategy implementation
 */
export class TmuxStrategy extends EventEmitter implements BaseStrategy {
  name: string;
  initialized: boolean;

  constructor(options?: TmuxStrategyOptions & CommunicatorOptions);

  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  send(agentName: string, message: string, options?: SendOptions): Promise<SendResult>;
  sendAsync(agentName: string, message: string): Promise<void>;
  getOutput(agentName: string, options?: OutputOptions): Promise<string>;
  getStatus(agentName: string): Promise<AgentStatus>;
  cleanup(): Promise<void>;
}

/**
 * pty-wrapper strategy implementation
 */
export class PtyWrapperStrategy extends EventEmitter implements BaseStrategy {
  name: string;
  initialized: boolean;

  constructor(options?: PtyWrapperStrategyOptions & CommunicatorOptions);

  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  send(agentName: string, message: string, options?: SendOptions): Promise<SendResult>;
  sendAsync(agentName: string, message: string): Promise<void>;
  getOutput(agentName: string, options?: OutputOptions): Promise<string>;
  getStatus(agentName: string): Promise<AgentStatus>;
  cleanup(): Promise<void>;
}

/**
 * File-based strategy implementation
 */
export class FileBasedStrategy extends EventEmitter implements BaseStrategy {
  name: string;
  initialized: boolean;

  constructor(options?: FileBasedStrategyOptions & CommunicatorOptions);

  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  send(agentName: string, message: string, options?: SendOptions): Promise<SendResult>;
  sendAsync(agentName: string, message: string): Promise<void>;
  getOutput(agentName: string, options?: OutputOptions): Promise<string>;
  getStatus(agentName: string): Promise<AgentStatus>;
  cleanup(): Promise<void>;

  /** Watch for new task files */
  watchTasks(agentName: string, callback: (task: any, filePath: string) => void): () => void;
}

/**
 * AgentCommunicator - Main class for agent communication
 *
 * Unified interface for communicating with Claude Code agents.
 * Supports multiple strategies: tmux, pty-wrapper, and file-based.
 */
export class AgentCommunicator extends EventEmitter {
  /** Current active strategy */
  activeStrategy: string | null;

  /** Whether communicator is initialized */
  initialized: boolean;

  /** Agent configurations */
  agentConfigs: Record<string, AgentConfig>;

  /**
   * Create a new AgentCommunicator
   */
  constructor(options?: CommunicatorOptions);

  /**
   * Initialize the communicator and detect best strategy
   */
  initialize(): Promise<void>;

  /**
   * Send message to an agent and wait for response
   *
   * @param agentName - Target agent name
   * @param message - Message to send
   * @param options - Send options
   * @returns Result with success, response, and duration
   */
  send(agentName: string, message: string, options?: SendOptions): Promise<SendResult>;

  /**
   * Send message without waiting for response
   *
   * @param agentName - Target agent name
   * @param message - Message to send
   * @param options - Send options
   */
  sendAsync(agentName: string, message: string, options?: SendOptions): Promise<void>;

  /**
   * Get current output from an agent
   *
   * @param agentName - Target agent name
   * @param options - Options including lines to retrieve
   */
  getOutput(agentName: string, options?: OutputOptions): Promise<string>;

  /**
   * Get status of an agent
   *
   * @param agentName - Target agent name
   */
  getStatus(agentName: string): Promise<AgentStatus>;

  /**
   * Get status of all agents
   */
  getAllStatuses(): Promise<AllStatuses>;

  /**
   * Broadcast message to multiple agents
   *
   * @param targets - 'all', 'workers', or array of agent names
   * @param message - Message to broadcast
   * @param options - Broadcast options
   */
  broadcast(
    targets: 'all' | 'workers' | string[],
    message: string,
    options?: BroadcastOptions
  ): Promise<BroadcastResults>;

  /**
   * Delegate task to the most appropriate agent
   *
   * @param taskDescription - Task description
   * @param options - Delegate options
   */
  delegateTask(taskDescription: string, options?: DelegateOptions): Promise<DelegateResult>;

  /**
   * Get agent configuration
   *
   * @param agentName - Agent name
   */
  getAgentConfig(agentName: string): AgentConfig | undefined;

  /**
   * Shutdown and clean up resources
   */
  shutdown(): Promise<void>;
}

/**
 * Default agent configurations
 */
export const DEFAULT_AGENTS: Record<string, AgentConfig>;

/**
 * Worker agent names (excluding orchestrator)
 */
export const WORKER_AGENTS: string[];

export default AgentCommunicator;
