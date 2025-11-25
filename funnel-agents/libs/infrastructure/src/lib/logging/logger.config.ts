import { Params } from 'nestjs-pino';
import { Options } from 'pino-http';

export interface LoggerConfig {
  level: string;
  format: 'json' | 'pretty';
  redactPaths: string[];
}

export function createLoggerConfig(): LoggerConfig {
  return {
    level: process.env['LOG_LEVEL'] || 'info',
    format: (process.env['LOG_FORMAT'] as 'json' | 'pretty') ||
            (process.env['NODE_ENV'] === 'production' ? 'json' : 'pretty'),
    redactPaths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.oldPassword',
      'req.body.newPassword',
      'req.body.token',
      'req.body.refreshToken',
      'req.body.secret',
      'req.body.apiKey',
      'req.body.creditCard',
      'req.body.ssn',
      'res.headers["set-cookie"]',
    ],
  };
}

export function createPinoConfig(serviceName: string): Params {
  const config = createLoggerConfig();

  const pinoHttpOptions: Options = {
    level: config.level,
    redact: {
      paths: config.redactPaths,
      censor: '[REDACTED]',
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        path: req.raw?.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'x-correlation-id': req.headers['x-correlation-id'],
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers?.['content-type'],
        },
      }),
      err: (err) => ({
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode,
      }),
    },
    customProps: (req) => ({
      correlationId: req.headers?.['x-correlation-id'] || req.id,
      serviceName,
      environment: process.env['NODE_ENV'] || 'development',
    }),
    customLogLevel: function (req, res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return 'silent';
      }
      return 'info';
    },
    customSuccessMessage: function (req, res) {
      const duration = Math.round((res as any).responseTime || 0);
      return `${req.method} ${req.url} completed with ${res.statusCode} in ${duration}ms`;
    },
    customErrorMessage: function (req, res, err) {
      return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
    },
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },
  };

  const pinoOptions = {
    name: serviceName,
    level: config.level,
    redact: {
      paths: config.redactPaths,
      censor: '[REDACTED]',
    },
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
      bindings: (bindings: any) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          serviceName,
        };
      },
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    base: {
      serviceName,
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['APP_VERSION'] || '1.0.0',
    },
  };

  // Add pretty printing for development
  if (config.format === 'pretty') {
    return {
      pinoHttp: {
        ...pinoHttpOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
            messageFormat: '{msg}',
          },
        },
      },
    };
  }

  // JSON format for production
  return {
    pinoHttp: pinoHttpOptions,
  };
}

export const SENSITIVE_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
];

export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
