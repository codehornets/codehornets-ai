import { Injectable, LoggerService, Inject, Optional } from '@nestjs/common';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private context?: string;
  private logLevel: string;
  private pretty: boolean;

  constructor(
    @Optional() @Inject('LOGGING_OPTIONS') private options?: { level?: string; pretty?: boolean; context?: string }
  ) {
    this.logLevel = options?.level ?? process.env['LOG_LEVEL'] ?? 'info';
    this.pretty = options?.pretty ?? process.env['NODE_ENV'] !== 'production';
    this.context = options?.context;
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string | LogContext): void {
    this.writeLog('info', message, context);
  }

  error(message: string, trace?: string, context?: string | LogContext): void {
    this.writeLog('error', message, context, { trace });
  }

  warn(message: string, context?: string | LogContext): void {
    this.writeLog('warn', message, context);
  }

  debug(message: string, context?: string | LogContext): void {
    this.writeLog('debug', message, context);
  }

  verbose(message: string, context?: string | LogContext): void {
    this.writeLog('verbose', message, context);
  }

  private writeLog(
    level: string,
    message: string,
    context?: string | LogContext,
    extra?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logContext = typeof context === 'string' ? context : this.context;
    const logMeta = typeof context === 'object' ? context : {};

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: logContext,
      message,
      ...logMeta,
      ...extra,
    };

    if (this.pretty) {
      const contextStr = logContext ? `[${logContext}] ` : '';
      const coloredLevel = this.colorize(level, level.toUpperCase().padEnd(7));
      console.log(`${logEntry.timestamp} ${coloredLevel} ${contextStr}${message}`);
      if (extra?.trace) {
        console.log(extra.trace);
      }
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private colorize(level: string, text: string): string {
    const colors: Record<string, string> = {
      error: '\x1b[31m', // red
      warn: '\x1b[33m', // yellow
      info: '\x1b[32m', // green
      debug: '\x1b[36m', // cyan
      verbose: '\x1b[35m', // magenta
    };
    const reset = '\x1b[0m';
    return `${colors[level] ?? ''}${text}${reset}`;
  }
}
