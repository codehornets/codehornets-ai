-- =============================================================================
-- Migration: 008 - Add Missing Foreign Keys
-- Description: Add foreign key constraints for referential integrity
-- =============================================================================

-- Add foreign keys for leads table
ALTER TABLE leads
    DROP CONSTRAINT IF EXISTS fk_leads_workspace_id,
    DROP CONSTRAINT IF EXISTS fk_leads_user_id;

ALTER TABLE leads
    ADD CONSTRAINT fk_leads_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_leads_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign keys for contacts table
ALTER TABLE contacts
    DROP CONSTRAINT IF EXISTS fk_contacts_workspace_id,
    DROP CONSTRAINT IF EXISTS fk_contacts_user_id;

ALTER TABLE contacts
    ADD CONSTRAINT fk_contacts_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_contacts_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign keys for deals table
ALTER TABLE deals
    DROP CONSTRAINT IF EXISTS fk_deals_workspace_id,
    DROP CONSTRAINT IF EXISTS fk_deals_contact_id,
    DROP CONSTRAINT IF EXISTS fk_deals_user_id;

ALTER TABLE deals
    ADD CONSTRAINT fk_deals_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_deals_contact_id
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_deals_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign keys for campaigns table
ALTER TABLE campaigns
    DROP CONSTRAINT IF EXISTS fk_campaigns_workspace_id,
    DROP CONSTRAINT IF EXISTS fk_campaigns_user_id;

ALTER TABLE campaigns
    ADD CONSTRAINT fk_campaigns_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_campaigns_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign keys for tasks table
ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS fk_tasks_agent_id;

ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_agent_id
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Add foreign keys for workflows table
ALTER TABLE workflows
    DROP CONSTRAINT IF EXISTS fk_workflows_workspace_id,
    DROP CONSTRAINT IF EXISTS fk_workflows_created_by;

ALTER TABLE workflows
    ADD CONSTRAINT fk_workflows_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_workflows_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign keys for content table
ALTER TABLE content
    DROP CONSTRAINT IF EXISTS fk_content_author_id,
    DROP CONSTRAINT IF EXISTS fk_content_workspace_id;

ALTER TABLE content
    ADD CONSTRAINT fk_content_author_id
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_content_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Add foreign keys for files table
ALTER TABLE files
    DROP CONSTRAINT IF EXISTS fk_files_uploaded_by,
    DROP CONSTRAINT IF EXISTS fk_files_workspace_id;

ALTER TABLE files
    ADD CONSTRAINT fk_files_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_files_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Add foreign keys for scheduled_reports table
ALTER TABLE scheduled_reports
    DROP CONSTRAINT IF EXISTS fk_scheduled_reports_created_by,
    DROP CONSTRAINT IF EXISTS fk_scheduled_reports_workspace_id;

ALTER TABLE scheduled_reports
    ADD CONSTRAINT fk_scheduled_reports_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_scheduled_reports_workspace_id
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
