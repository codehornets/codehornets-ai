-- Scheduler Service Database Migration
-- Creates tables for scheduled tasks and execution tracking

-- Create scheduled_tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('workflow', 'report', 'agent', 'custom')),
  target_id VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed', 'completed')),
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  config JSONB,
  created_by VARCHAR(255),
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create task_executions table
CREATE TABLE IF NOT EXISTS task_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'timeout', 'cancelled')),
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  error_message TEXT,
  error_details JSONB,
  result JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled_next_run
  ON scheduled_tasks(enabled, next_run_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_task_type_enabled
  ON scheduled_tasks(task_type, enabled);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status
  ON scheduled_tasks(status);

CREATE INDEX IF NOT EXISTS idx_task_executions_task_id_created
  ON task_executions(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_executions_status_created
  ON task_executions(status, created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for scheduled_tasks updated_at
DROP TRIGGER IF EXISTS update_scheduled_tasks_updated_at ON scheduled_tasks;
CREATE TRIGGER update_scheduled_tasks_updated_at
  BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- UNCOMMENT BELOW FOR SAMPLE DATA

/*
-- Sample workflow task - runs daily at 9 AM
INSERT INTO scheduled_tasks (name, description, cron_expression, task_type, target_id, enabled, config)
VALUES (
  'Daily Analytics Processing',
  'Process analytics data and generate daily reports',
  '0 9 * * *',
  'workflow',
  'workflow-analytics-001',
  true,
  '{"priority": "high", "timeout": 600}'::jsonb
);

-- Sample report task - runs every Monday at 2 AM
INSERT INTO scheduled_tasks (name, description, cron_expression, task_type, target_id, enabled, config)
VALUES (
  'Weekly Sales Report',
  'Generate and email weekly sales performance report',
  '0 2 * * 1',
  'report',
  'report-weekly-sales',
  true,
  '{"format": "pdf", "recipients": ["sales@example.com"]}'::jsonb
);

-- Sample agent task - runs every 30 minutes
INSERT INTO scheduled_tasks (name, description, cron_expression, task_type, target_id, enabled, config)
VALUES (
  'Lead Qualification',
  'Run AI agent to qualify new leads',
  '*/30 * * * *',
  'agent',
  'agent-lead-qualifier',
  true,
  '{"batch_size": 50, "priority": "medium"}'::jsonb
);

-- Sample custom webhook task - runs every 15 minutes
INSERT INTO scheduled_tasks (name, description, cron_expression, task_type, config)
VALUES (
  'Sync External CRM',
  'Call webhook to sync data with external CRM',
  '*/15 * * * *',
  'custom',
  '{
    "type": "webhook",
    "webhook_url": "https://api.example.com/sync",
    "method": "POST",
    "headers": {"Authorization": "Bearer token"},
    "body": {"source": "funnelagents"}
  }'::jsonb
);
*/

-- Verify tables created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('scheduled_tasks', 'task_executions')
ORDER BY table_name;
