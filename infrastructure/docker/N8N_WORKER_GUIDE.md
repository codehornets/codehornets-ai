# n8n Worker Architecture Guide

## Overview

The HandyMate project uses a multi-worker n8n setup where each CRM application (Dancer and Painter) has dedicated workflow workers. This architecture provides:

- **Isolation**: Each app's workflows run independently
- **Scalability**: Workers can be scaled per app based on demand
- **Monitoring**: Separate logs for each app's workflow executions
- **Reliability**: If one worker fails, other apps are unaffected

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         n8n Main Service                     │
│                  (UI & API on port 5678)                     │
│                   Database: handymate_n8n                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├─────────────────┬──────────────────┐
                         │                 │                  │
              ┌──────────▼──────────┐  ┌──▼────────────┐  ┌──▼──────────────┐
              │  Redis Queue        │  │  Redis Queue  │  │  Redis Queue    │
              │  n8n:dancer         │  │  n8n:painter  │  │  n8n:default    │
              └──────────┬──────────┘  └──┬────────────┘  └──┬──────────────┘
                         │                │                  │
              ┌──────────▼──────────┐  ┌──▼────────────┐    │
              │ n8n-worker-dancer  │  │n8n-worker-     │    │
              │                    │  │painter         │    │
              │ Processes:         │  │                │    │
              │ - Dancer workflows │  │ Processes:     │    │
              │ - Integrations     │  │ - Painter      │    │
              │ - Automations      │  │   workflows    │    │
              └────────────────────┘  └────────────────┘    │
                         │                 │                 │
              ┌──────────▼─────────────────▼─────────────────▼──┐
              │         Dancer CRM      Painter CRM              │
              │    (handymate_dancer) (handymate_painter)        │
              └──────────────────────────────────────────────────┘
```

## Worker Configuration

### Container Details

| Worker | Container | Queue Prefix | Database | Logs |
|--------|-----------|--------------|----------|------|
| **Dancer Worker** | handymate-n8n-worker-dancer | `n8n:dancer` | handymate_n8n | storage/logs/n8n/dancer |
| **Painter Worker** | handymate-n8n-worker-painter | `n8n:painter` | handymate_n8n | storage/logs/n8n/painter |

### Environment Variables

Each worker has unique environment variables for identification:

**Dancer Worker:**
```env
WORKER_APP=dancer
WORKER_ID=dancer-1
QUEUE_BULL_PREFIX=n8n:dancer
```

**Painter Worker:**
```env
WORKER_APP=painter
WORKER_ID=painter-1
QUEUE_BULL_PREFIX=n8n:painter
```

## Using Workers in n8n Workflows

### Option 1: Workflow Execution Settings (Recommended)

When creating a workflow in n8n, configure it to use the specific worker:

1. Open your workflow in n8n UI (http://localhost:5678)
2. Click on workflow settings (gear icon)
3. Under "Workflow Settings", find "Execution Settings"
4. Set the queue name to match your app:
   - For Dancer workflows: Use queue `dancer`
   - For Painter workflows: Use queue `painter`

### Option 2: Programmatic Queue Assignment

In your Laravel application, when triggering n8n workflows via API:

**Dancer Example:**
```php
use Illuminate\Support\Facades\Http;

// Trigger a workflow for Dancer CRM
$response = Http::post('http://n8n:5678/webhook/dancer-lead-created', [
    'lead_id' => $lead->id,
    'queue' => 'dancer', // Route to dancer worker
    'metadata' => [
        'app' => 'dancer',
        'triggered_by' => auth()->user()->id,
    ]
]);
```

**Painter Example:**
```php
// Trigger a workflow for Painter CRM
$response = Http::post('http://n8n:5678/webhook/painter-job-assigned', [
    'job_id' => $job->id,
    'queue' => 'painter', // Route to painter worker
    'metadata' => [
        'app' => 'painter',
        'triggered_by' => auth()->user()->id,
    ]
]);
```

### Option 3: Webhook URL Convention

Use consistent webhook URLs to identify the app:

- Dancer: `http://localhost:5678/webhook/dancer-*`
- Painter: `http://localhost:5678/webhook/painter-*`

Configure your workflows to use the appropriate queue based on the webhook URL.

## Worker Management Commands

### Start/Stop Workers

```bash
# Start all n8n workers
make n8n-workers-up

# Stop all n8n workers
make n8n-workers-down

# Restart all n8n workers
make n8n-workers-restart

# Start individual workers
make n8n-worker-dancer-up
make n8n-worker-painter-up
```

### View Logs

```bash
# View all worker logs
make n8n-workers-logs

# View dancer worker logs only
make n8n-worker-dancer-logs

# View painter worker logs only
make n8n-worker-painter-logs

# View main n8n service logs
make n8n-logs
```

### Check Worker Status

```bash
# Check all running containers
make infra-ps

# Check n8n workers specifically
docker-compose -f infrastructure/docker/docker-compose.yml ps | grep n8n-worker
```

## Scaling Workers

To add more workers for an app (e.g., for high load):

### Add a Second Dancer Worker

Add to `docker-compose.yml`:

```yaml
n8n-worker-dancer-2:
  image: n8nio/n8n:latest
  container_name: handymate-n8n-worker-dancer-2
  restart: unless-stopped
  depends_on:
    n8n:
      condition: service_healthy
    mysql:
      condition: service_healthy
    redis:
      condition: service_healthy
    dancer:
      condition: service_started
  command: worker
  environment:
    # Same as dancer-1 but with:
    WORKER_ID: dancer-2
    QUEUE_BULL_PREFIX: "n8n:dancer"
  # ... rest of configuration same as dancer-1
```

Update Makefile:
```makefile
n8n-workers-up:
	docker-compose -f infrastructure/docker/docker-compose.yml up -d \
		n8n-worker-dancer n8n-worker-dancer-2 \
		n8n-worker-painter
```

## Monitoring & Debugging

### Check Worker Health

```bash
# View worker container health
docker inspect handymate-n8n-worker-dancer --format='{{.State.Health.Status}}'
docker inspect handymate-n8n-worker-painter --format='{{.State.Health.Status}}'
```

### Monitor Queue Size

Connect to Redis and check queue sizes:

```bash
# Access Redis CLI
docker-compose -f infrastructure/docker/docker-compose.yml exec redis redis-cli

# Check dancer queue
KEYS n8n:dancer:*

# Check painter queue
KEYS n8n:painter:*

# Check pending jobs in a queue
LLEN n8n:dancer:jobs
LLEN n8n:painter:jobs
```

### View Execution History

1. Access n8n UI: http://localhost:5678
2. Navigate to "Executions" in the sidebar
3. Filter by workflow tags (tag your workflows with "dancer" or "painter")

### Debug Worker Issues

```bash
# Check worker logs for errors
make n8n-worker-dancer-logs | grep -i error
make n8n-worker-painter-logs | grep -i error

# Check if worker can connect to database
docker-compose -f infrastructure/docker/docker-compose.yml exec n8n-worker-dancer \
  env | grep DB_

# Check if worker can connect to Redis
docker-compose -f infrastructure/docker/docker-compose.yml exec n8n-worker-dancer \
  env | grep REDIS
```

## Best Practices

### 1. Tag Workflows by App

In n8n, add tags to your workflows:
- Tag dancer workflows with: `dancer`, `crm-dancer`
- Tag painter workflows with: `painter`, `crm-painter`

### 2. Use Descriptive Webhook Names

Follow naming conventions:
- Dancer: `dancer-lead-created`, `dancer-task-updated`
- Painter: `painter-job-assigned`, `painter-invoice-paid`

### 3. Monitor Worker Logs

Regularly check logs for each worker to catch issues early:
```bash
# Add to cron or monitoring system
make n8n-worker-dancer-logs | grep -i "error\|warning" >> logs/dancer-worker-errors.log
make n8n-worker-painter-logs | grep -i "error\|warning" >> logs/painter-worker-errors.log
```

### 4. Set Resource Limits

Each worker is configured with resource limits:
- CPU: 1 core limit, 0.25 core reservation
- Memory: 1GB limit, 256MB reservation

Adjust in `docker-compose.yml` if needed based on your workload.

### 5. Implement Error Handling

In your workflows:
- Add error handling nodes
- Configure retry logic for failed executions
- Send notifications on critical failures
- Log errors to your Laravel application

### 6. Use Environment-Specific Configuration

Set different queue prefixes for environments:

**Development:**
```env
QUEUE_BULL_PREFIX=n8n:dev:dancer
```

**Production:**
```env
QUEUE_BULL_PREFIX=n8n:prod:dancer
```

## Integration with Laravel

### Create a Service Class

**app/Services/N8nWorkflowService.php:**
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class N8nWorkflowService
{
    protected string $baseUrl;
    protected string $app;

    public function __construct(string $app)
    {
        $this->baseUrl = config('services.n8n.url', 'http://n8n:5678');
        $this->app = $app; // 'dancer' or 'painter'
    }

    public function trigger(string $webhook, array $data): bool
    {
        try {
            $response = Http::timeout(30)->post(
                "{$this->baseUrl}/webhook/{$this->app}-{$webhook}",
                array_merge($data, [
                    'queue' => $this->app,
                    'triggered_at' => now()->toIso8601String(),
                    'triggered_by' => auth()->id(),
                ])
            );

            Log::info("n8n workflow triggered", [
                'app' => $this->app,
                'webhook' => $webhook,
                'status' => $response->status(),
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Failed to trigger n8n workflow", [
                'app' => $this->app,
                'webhook' => $webhook,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
```

### Usage in Controllers

```php
// In DancerLeadController
$n8n = new N8nWorkflowService('dancer');
$n8n->trigger('lead-created', [
    'lead_id' => $lead->id,
    'lead_name' => $lead->name,
    'lead_email' => $lead->email,
]);

// In PainterJobController
$n8n = new N8nWorkflowService('painter');
$n8n->trigger('job-assigned', [
    'job_id' => $job->id,
    'painter_id' => $job->painter_id,
    'scheduled_date' => $job->scheduled_at,
]);
```

## Troubleshooting

### Worker Not Starting

Check dependencies:
```bash
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

Ensure MySQL and Redis are healthy before workers start.

### Workflows Not Executing

1. Check if workflow is active in n8n UI
2. Verify webhook URL is correct
3. Check queue configuration matches worker prefix
4. Review worker logs for errors

### Queue Backlog Building Up

```bash
# Check Redis queue size
docker-compose -f infrastructure/docker/docker-compose.yml exec redis redis-cli
LLEN n8n:dancer:jobs
```

If backlog is large, consider:
- Scaling up workers (add more worker containers)
- Increasing worker resources (CPU/memory)
- Optimizing workflow logic

## Performance Tuning

### Increase Worker Concurrency

In `docker-compose.yml`, add to worker environment:

```yaml
EXECUTIONS_PROCESS: 10  # Process up to 10 workflows concurrently
```

### Optimize Workflow Execution

- Use "Set" nodes to prepare data in bulk
- Minimize HTTP request nodes where possible
- Use pagination for large datasets
- Implement proper error handling to avoid retries

### Database Connection Pooling

Ensure your Laravel app uses connection pooling when interacting with n8n-triggered actions.

## Security Considerations

1. **Use JWT Authentication**: Enable JWT auth for n8n API calls
2. **Webhook Signatures**: Verify webhook signatures in Laravel
3. **Environment Variables**: Never commit `.env` files with real credentials
4. **Network Isolation**: Keep n8n workers on internal network
5. **Log Sanitization**: Remove sensitive data from logs

## Resources

- [n8n Documentation](https://docs.n8n.io)
- [n8n Queue Mode](https://docs.n8n.io/hosting/scaling/queue-mode/)
- [Redis Bull Queue](https://github.com/OptimalBits/bull)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
