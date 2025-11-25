import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

export const correlationIdStorage = new AsyncLocalStorage<Map<string, any>>();

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get correlation ID from header or generate new one
    let correlationId = req.headers[CORRELATION_ID_HEADER] as string;

    if (!correlationId) {
      correlationId = uuidv4();
    }

    // Generate unique request ID
    const requestId = req.headers[REQUEST_ID_HEADER] as string || uuidv4();

    // Store in request object
    (req as any).correlationId = correlationId;
    (req as any).requestId = requestId;

    // Add to response headers for traceability
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Store in AsyncLocalStorage for access throughout the request lifecycle
    const store = new Map<string, any>();
    store.set('correlationId', correlationId);
    store.set('requestId', requestId);
    store.set('userId', (req as any).user?.id);
    store.set('userEmail', (req as any).user?.email);
    store.set('method', req.method);
    store.set('url', req.url);
    store.set('ip', req.ip);
    store.set('userAgent', req.headers['user-agent']);

    correlationIdStorage.run(store, () => {
      next();
    });
  }
}

export function getCorrelationId(): string | undefined {
  const store = correlationIdStorage.getStore();
  return store?.get('correlationId');
}

export function getRequestId(): string | undefined {
  const store = correlationIdStorage.getStore();
  return store?.get('requestId');
}

export function getRequestContext(): Record<string, any> {
  const store = correlationIdStorage.getStore();
  if (!store) {
    return {};
  }

  return {
    correlationId: store.get('correlationId'),
    requestId: store.get('requestId'),
    userId: store.get('userId'),
    userEmail: store.get('userEmail'),
    method: store.get('method'),
    url: store.get('url'),
    ip: store.get('ip'),
    userAgent: store.get('userAgent'),
  };
}

export function setContextValue(key: string, value: any): void {
  const store = correlationIdStorage.getStore();
  if (store) {
    store.set(key, value);
  }
}

export function getContextValue(key: string): any {
  const store = correlationIdStorage.getStore();
  return store?.get(key);
}
