-- Migration: Create tasks table
-- Created: 2025-11-25
-- Description: Initial schema for tasks service

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    agent_id UUID NOT NULL,
    workspace_id UUID,
    campaign_id UUID,
    status task_status NOT NULL DEFAULT 'pending',
    priority task_priority NOT NULL DEFAULT 'medium',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tasks_status_created_at ON tasks (status, created_at DESC);
CREATE INDEX idx_tasks_agent_id_status ON tasks (agent_id, status);
CREATE INDEX idx_tasks_workspace_id_status ON tasks (workspace_id, status);
CREATE INDEX idx_tasks_campaign_id_status ON tasks (campaign_id, status);
CREATE INDEX idx_tasks_agent_id ON tasks (agent_id);
CREATE INDEX idx_tasks_workspace_id ON tasks (workspace_id);
CREATE INDEX idx_tasks_campaign_id ON tasks (campaign_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE tasks IS 'Stores task information for agent execution';
COMMENT ON COLUMN tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN tasks.title IS 'Task title';
COMMENT ON COLUMN tasks.description IS 'Detailed task description';
COMMENT ON COLUMN tasks.agent_id IS 'ID of the agent assigned to this task';
COMMENT ON COLUMN tasks.workspace_id IS 'ID of the workspace this task belongs to';
COMMENT ON COLUMN tasks.campaign_id IS 'ID of the campaign this task belongs to';
COMMENT ON COLUMN tasks.status IS 'Current status of the task';
COMMENT ON COLUMN tasks.priority IS 'Task priority level';
COMMENT ON COLUMN tasks.input_data IS 'Input data for task execution';
COMMENT ON COLUMN tasks.output_data IS 'Output data from task execution';
COMMENT ON COLUMN tasks.error_message IS 'Error message if task failed';
COMMENT ON COLUMN tasks.started_at IS 'Timestamp when task execution started';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task execution completed';
COMMENT ON COLUMN tasks.duration IS 'Task execution duration in milliseconds';
