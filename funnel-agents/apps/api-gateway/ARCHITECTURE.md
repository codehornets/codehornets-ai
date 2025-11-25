# API Gateway Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Applications                        │
│  (Web UI: localhost:5173, Mobile Apps, Third-party Integrations)   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP/HTTPS
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                        API Gateway (Port 3000)                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     HTTP Layer                                  │ │
│  │  • CORS Configuration                                          │ │
│  │  • Global Prefix: /api                                         │ │
│  │  • Request Validation                                          │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                          │
│  ┌─────────────────────────▼──────────────────────────────────────┐ │
│  │                   Middleware Layer                              │ │
│  │  • LoggingInterceptor                                          │ │
│  │  • TransformInterceptor                                        │ │
│  │  • HttpExceptionFilter                                         │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                          │
│  ┌─────────────────────────▼──────────────────────────────────────┐ │
│  │                   Authentication Layer                          │ │
│  │  • AuthGuard (validates JWT tokens)                            │ │
│  │  • Communicates with auth-service                              │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                          │
│  ┌─────────────────────────▼──────────────────────────────────────┐ │
│  │                   Proxy Controllers                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │   Auth       │  │     CRM      │  │  Campaigns   │  ...   │ │
│  │  │   Proxy      │  │    Proxy     │  │    Proxy     │        │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                          │
│  ┌─────────────────────────▼──────────────────────────────────────┐ │
│  │              ClientProxy Layer (TCP Transport)                  │ │
│  │  • AUTH_SERVICE    • CRM_SERVICE    • CAMPAIGNS_SERVICE        │ │
│  │  • CONTENT_SERVICE • AGENTS_SERVICE • TASKS_SERVICE            │ │
│  │  • AUTOMATIONS_SERVICE • REPORTS_SERVICE                       │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
└────────────────────────────┼──────────────────────────────────────┬─┘
                             │                                       │
         ┌───────────────────┴──────┬────────────────┬──────────────┤
         │                          │                │              │
    ┌────▼────┐               ┌────▼────┐      ┌───▼────┐    ┌───▼────┐
    │  Auth   │               │   CRM   │      │Campaign│    │Content │
    │ Service │               │ Service │      │Service │    │Service │
    │ :3001   │               │  :3002  │      │ :3003  │    │ :3004  │
    └─────────┘               └─────────┘      └────────┘    └────────┘
         │                          │                │              │
    ┌────▼────┐               ┌────▼────┐      ┌───▼────┐    ┌───▼────┐
    │ Agents  │               │  Tasks  │      │Automat.│    │Reports │
    │ Service │               │ Service │      │Service │    │Service │
    │ :3005   │               │  :3006  │      │ :3007  │    │ :3008  │
    └─────────┘               └─────────┘      └────────┘    └────────┘
```

## Request Flow

### 1. Unauthenticated Request (Login)

```
Client
  │
  │ POST /api/auth/login
  │ { email, password }
  │
  ▼
API Gateway (AuthProxyController)
  │
  │ Pattern: "auth.post.login"
  │ Transport: TCP
  │
  ▼
Auth Service
  │
  │ Validate credentials
  │ Generate JWT token
  │
  ▼
Response { token, user }
  │
  ▼
Client
```

### 2. Authenticated Request (Get Leads)

```
Client
  │
  │ GET /api/leads
  │ Authorization: Bearer <token>
  │
  ▼
API Gateway
  │
  ├─► LoggingInterceptor (logs request)
  │
  ├─► AuthGuard
  │   │
  │   ├─► Extract token from header
  │   │
  │   ├─► Send to Auth Service via TCP
  │   │   Pattern: "auth.validate_token"
  │   │
  │   ├─► Receive user object
  │   │
  │   └─► Attach user to request
  │
  ▼
CrmProxyController
  │
  │ Pattern: "crm.get.leads.root"
  │ Payload: { body, query, params, headers, user }
  │ Transport: TCP
  │
  ▼
CRM Service
  │
  │ Process request
  │ Access control checks
  │ Database queries
  │
  ▼
Response { leads: [...] }
  │
  ├─► TransformInterceptor (transforms response)
  │
  ├─► LoggingInterceptor (logs response time)
  │
  ▼
Client
```

## Component Breakdown

### Proxy Controllers

Each proxy controller is responsible for:
1. Receiving HTTP requests for specific route patterns
2. Constructing TCP message patterns
3. Sending requests to appropriate microservice via ClientProxy
4. Handling timeouts and errors
5. Returning responses to clients

**Example Structure:**
```typescript
@Controller('leads')
@UseGuards(AuthGuard)
export class CrmProxyController {
  constructor(@Inject('CRM_SERVICE') private crmClient: ClientProxy) {}

  @All('*')
  async proxyRequest(req: Request, res: Response) {
    // Build pattern: crm.get.leads.123
    // Send via TCP
    // Return response
  }
}
```

### ClientProxy Configuration

The ClientsModule registers TCP clients for each microservice:

```typescript
ClientsModule.register([
  {
    name: 'CRM_SERVICE',
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3002,
    },
  },
  // ... other services
])
```

### Authentication Guard

The AuthGuard:
1. Intercepts protected routes
2. Extracts JWT from Authorization header
3. Validates token with auth-service
4. Attaches user object to request
5. Allows/denies request based on validation

### Interceptors

**LoggingInterceptor:**
- Logs all incoming requests
- Tracks response time
- Logs errors with context

**TransformInterceptor:**
- Standardizes response format
- Handles data transformation
- Ensures consistent API responses

### Exception Filter

**HttpExceptionFilter:**
- Catches all exceptions
- Formats error responses
- Logs error details
- Returns appropriate HTTP status codes

## Message Pattern Convention

Format: `<service>.<method>.<resource>.<subPath>`

Examples:
- `auth.post.login` → POST /api/auth/login
- `crm.get.leads.root` → GET /api/leads
- `crm.get.leads.123` → GET /api/leads/123
- `campaigns.patch.campaigns.456/status` → PATCH /api/campaigns/456/status

## Service Discovery

Currently using static configuration via environment variables:
- `CRM_SERVICE_HOST` and `CRM_SERVICE_PORT`
- Defaults to localhost and predefined ports

Future considerations:
- Consul for service discovery
- Kubernetes service mesh
- Load balancing across service instances

## Error Handling Strategy

### Service Unavailable (503)
```
Timeout after 30 seconds
↓
Return 500 with descriptive message
↓
Log error for debugging
```

### Authentication Failure (401)
```
Invalid/missing token
↓
AuthGuard throws UnauthorizedException
↓
HttpExceptionFilter catches
↓
Return 401 with error message
```

### Validation Error (400)
```
Invalid request body
↓
ValidationPipe catches
↓
Return 400 with validation errors
```

## Health Monitoring

### Gateway Health Check
```
GET /api/health
Response: { status, timestamp, service, version }
```

### Services Health Check
```
GET /api/health/services
Response: {
  status: "healthy" | "degraded",
  services: [
    { name, status, responseTime, error? }
  ]
}
```

Health check flow:
1. Send `health.check` pattern to each service
2. Wait up to 3 seconds for response
3. Record status and response time
4. Return aggregated results

## Scalability Considerations

### Horizontal Scaling
- Multiple API Gateway instances behind load balancer
- Stateless design allows easy scaling
- Session data in JWT (no server-side sessions)

### Connection Pooling
- ClientProxy maintains persistent TCP connections
- Connection reuse for better performance
- Configurable timeout and retry logic

### Caching Strategy (Future)
- Redis for response caching
- Cache invalidation via events
- TTL-based expiration

## Security Features

1. **CORS Protection**
   - Whitelist allowed origins
   - Credential support
   - Method restrictions

2. **JWT Validation**
   - Token verification via auth-service
   - Token expiration checking
   - Refresh token support

3. **Request Validation**
   - ValidationPipe for input sanitization
   - Whitelist unknown properties
   - Type transformation

4. **Rate Limiting (Future)**
   - Per-user rate limits
   - IP-based throttling
   - Graceful degradation

## Performance Optimization

1. **Timeout Management**
   - 30s timeout for service calls
   - Prevents hanging requests
   - Fast failure for better UX

2. **Async/Await Pattern**
   - Non-blocking I/O
   - Efficient resource usage
   - Better throughput

3. **Connection Reuse**
   - Persistent TCP connections
   - Reduced handshake overhead
   - Lower latency

## Monitoring & Observability

### Logging
- Request/response logging
- Error logging with stack traces
- Service health logs

### Metrics (Future)
- Request count per endpoint
- Average response time
- Error rate
- Service availability

### Tracing (Future)
- Distributed tracing with OpenTelemetry
- Request ID propagation
- Service call visualization

## Development vs Production

### Development
- Localhost service URLs
- Verbose logging
- CORS allowing localhost origins
- No rate limiting

### Production
- Service mesh/discovery
- Structured JSON logging
- Strict CORS policy
- Rate limiting enabled
- API versioning
- Load balancing
- SSL/TLS termination

## Future Enhancements

1. **WebSocket Support**
   - Real-time updates
   - Bi-directional communication
   - Event streaming

2. **GraphQL Gateway**
   - Single endpoint for queries
   - Client-specified responses
   - Reduced over-fetching

3. **API Versioning**
   - Version prefix in routes
   - Backward compatibility
   - Deprecation warnings

4. **Advanced Caching**
   - Redis integration
   - Cache warming
   - Intelligent invalidation

5. **Circuit Breaker**
   - Prevent cascade failures
   - Automatic recovery
   - Fallback responses
