# Build Commands Reference

## Individual Service Builds

Build any service using webpack:

```bash
# Development build
npx nx build <service-name>

# Production build
npx nx build <service-name> --configuration=production

# Skip cache (force rebuild)
npx nx build <service-name> --skip-nx-cache
```

### Examples

```bash
# Build auth service
npx nx build auth-service

# Build with production optimizations
npx nx build auth-service --configuration=production

# Build scheduler
npx nx build scheduler

# Build all services
npx nx run-many --target=build --all
```

## Service Names

All services now use webpack:
- auth-service
- crm-service
- campaigns-service
- content-service
- agents-service
- tasks-service
- automations-service
- reports-service
- worker-runner
- scheduler
- api-gateway (already configured)
- web-ui (already configured)

## Development Server

Run services in watch mode (no changes to this workflow):

```bash
# Start development server for any service
npx nx serve <service-name>

# Examples
npx nx serve auth-service
npx nx serve api-gateway
```

## Build Output

Build artifacts are located at:
```
dist/apps/<service-name>/main.js
```

## Production Configuration

Production builds include:
- Code optimization (minification, tree-shaking)
- License extraction
- Source maps disabled
- Debug mode off

## Webpack Configuration

- **Base Config**: `/webpack.base.config.js` (shared)
- **Service Configs**: `/apps/<service-name>/webpack.config.js` (inherit from base)

### Bundling Strategy

- **Bundled**: Workspace libraries (@funnelagents/*)
- **External**: node_modules packages (loaded at runtime)
- **Target**: Node.js environment

## Troubleshooting

### Clear Build Cache
```bash
npx nx reset
```

### Verbose Build Output
```bash
npx nx build <service-name> --verbose
```

### Check Configuration
```bash
npx nx show project <service-name> --json
```

## CI/CD Integration

No changes needed to CI/CD commands. Continue using:
```bash
npx nx affected --target=build
```
