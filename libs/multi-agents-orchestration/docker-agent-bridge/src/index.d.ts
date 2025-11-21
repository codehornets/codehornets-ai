import { EventEmitter } from 'eventemitter3';
import Docker from 'dockerode';

export interface AgentBridgeOptions {
  strategy?: 'auto' | 'named-pipe' | 'tty' | 'signal' | 'exec' | 'shared-volume';
  retryAttempts?: number;
  retryDelay?: number;
  debug?: boolean;
  docker?: Docker;
  dockerOptions?: Docker.DockerOptions;
  pipeDir?: string;
  messagesDir?: string;
  pollInterval?: number;
}

export interface Message {
  from: string;
  to: string;
  payload: string | object;
  timestamp: number;
  id: string;
}

export interface SendOptions {
  from?: string;
  id?: string;
  prefix?: string;
}

export interface SendResult {
  strategy: string;
  success: boolean;
  target: string;
  messageId: string;
  timestamp: number;
  [key: string]: any;
}

export interface FormatOptions {
  prefix?: string;
  color?: string;
}

export default class AgentBridge extends EventEmitter {
  constructor(options?: AgentBridgeOptions);

  /**
   * Send a message to a target container
   */
  send(
    targetContainer: string,
    payload: string | object,
    options?: SendOptions
  ): Promise<SendResult>;

  /**
   * Broadcast message to multiple containers
   */
  broadcast(
    targets: string[],
    payload: string | object,
    options?: SendOptions
  ): Promise<PromiseSettledResult<SendResult>[]>;

  /**
   * Listen for incoming messages
   */
  listen(containerName?: string, options?: object): Promise<void>;

  /**
   * Stop all listeners
   */
  stop(): Promise<void>;

  /**
   * Get container info
   */
  getContainerInfo(containerName: string): Promise<Docker.ContainerInspectInfo>;

  /**
   * Check if container is running
   */
  isContainerRunning(containerName: string): Promise<boolean>;

  /**
   * Format message for display
   */
  formatMessage(message: Message, options?: FormatOptions): string;

  // Events
  on(event: 'message', listener: (message: Message) => void): this;
  once(event: 'message', listener: (message: Message) => void): this;
  off(event: 'message', listener: (message: Message) => void): this;
}

export { AgentBridge };
