-- Migration: Add Campaign Features (Analytics, Channels, Scheduling)
-- Description: Adds campaign analytics, multi-channel support, and scheduling capabilities
-- Date: 2025-11-25

-- ============================================================================
-- 1. CAMPAIGN ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    entity_id VARCHAR(255),
    entity_type VARCHAR(50),
    workspace_id VARCHAR(255),
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaign_analytics_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE CASCADE
);

-- Indexes for campaign_analytics
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id
    ON campaign_analytics(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_event_type
    ON campaign_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_timestamp
    ON campaign_analytics(event_timestamp);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_workspace
    ON campaign_analytics(workspace_id);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_entity
    ON campaign_analytics(entity_id, entity_type);

-- Composite index for performance queries
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_composite
    ON campaign_analytics(campaign_id, event_type, event_timestamp);

-- Comment
COMMENT ON TABLE campaign_analytics IS 'Tracks analytics events for campaigns (email opens, lead conversions, etc.)';

-- ============================================================================
-- 2. CAMPAIGN CHANNELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    description TEXT,
    configuration JSONB,
    send_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaign_channels_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_channel_type
        CHECK (channel_type IN ('email', 'sms', 'social_media', 'webhook', 'push_notification')),

    CONSTRAINT chk_channel_status
        CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed'))
);

-- Indexes for campaign_channels
CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign_id
    ON campaign_channels(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_type
    ON campaign_channels(channel_type);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_status
    ON campaign_channels(status);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_scheduled
    ON campaign_channels(scheduled_at)
    WHERE scheduled_at IS NOT NULL;

-- Composite index for scheduled channel queries
CREATE INDEX IF NOT EXISTS idx_campaign_channels_active_scheduled
    ON campaign_channels(status, scheduled_at)
    WHERE status = 'active' AND scheduled_at IS NOT NULL;

-- Comment
COMMENT ON TABLE campaign_channels IS 'Multi-channel configurations for campaigns (email, SMS, social media, etc.)';

-- ============================================================================
-- 3. CAMPAIGN SCHEDULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID UNIQUE NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    recurrence VARCHAR(20) NOT NULL DEFAULT 'none',
    cron_expression VARCHAR(100),
    recurrence_config JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    next_run_at TIMESTAMP,
    last_run_at TIMESTAMP,
    run_count INTEGER NOT NULL DEFAULT 0,
    max_runs INTEGER,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaign_schedules_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_schedule_recurrence
        CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'custom')),

    CONSTRAINT chk_schedule_status
        CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),

    CONSTRAINT chk_schedule_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT chk_schedule_cron
        CHECK (recurrence != 'custom' OR cron_expression IS NOT NULL)
);

-- Indexes for campaign_schedules
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_schedules_campaign_id
    ON campaign_schedules(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_schedules_status
    ON campaign_schedules(status);

CREATE INDEX IF NOT EXISTS idx_campaign_schedules_next_run
    ON campaign_schedules(next_run_at)
    WHERE next_run_at IS NOT NULL;

-- Composite index for cron job queries
CREATE INDEX IF NOT EXISTS idx_campaign_schedules_due
    ON campaign_schedules(status, next_run_at)
    WHERE status = 'active' AND next_run_at IS NOT NULL;

-- Comment
COMMENT ON TABLE campaign_schedules IS 'Campaign scheduling with recurrence patterns and cron support';

-- ============================================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaign_analytics
CREATE TRIGGER update_campaign_analytics_updated_at
    BEFORE UPDATE ON campaign_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for campaign_channels
CREATE TRIGGER update_campaign_channels_updated_at
    BEFORE UPDATE ON campaign_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for campaign_schedules
CREATE TRIGGER update_campaign_schedules_updated_at
    BEFORE UPDATE ON campaign_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Uncomment to insert sample data

/*
-- Sample analytics events
INSERT INTO campaign_analytics (campaign_id, event_type, metadata, workspace_id)
SELECT
    id,
    'CAMPAIGN_STARTED',
    jsonb_build_object('initiated_by', 'system'),
    workspace_id
FROM campaigns
WHERE status = 'active'
LIMIT 5;

-- Sample email channel
INSERT INTO campaign_channels (campaign_id, channel_type, status, configuration)
SELECT
    id,
    'email',
    'draft',
    jsonb_build_object(
        'template_id', 'welcome-email',
        'from_email', 'noreply@company.com',
        'from_name', 'Company Name',
        'subject', 'Welcome!',
        'track_opens', true,
        'track_clicks', true
    )
FROM campaigns
WHERE status = 'planning'
LIMIT 3;
*/

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_analytics') THEN
        RAISE EXCEPTION 'Table campaign_analytics not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_channels') THEN
        RAISE EXCEPTION 'Table campaign_channels not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_schedules') THEN
        RAISE EXCEPTION 'Table campaign_schedules not created';
    END IF;

    RAISE NOTICE 'Migration completed successfully';
END $$;

-- ============================================================================
-- ROLLBACK (Run this to undo the migration)
-- ============================================================================

/*
-- Drop triggers
DROP TRIGGER IF EXISTS update_campaign_analytics_updated_at ON campaign_analytics;
DROP TRIGGER IF EXISTS update_campaign_channels_updated_at ON campaign_channels;
DROP TRIGGER IF EXISTS update_campaign_schedules_updated_at ON campaign_schedules;

-- Drop tables (CASCADE will drop associated constraints and indexes)
DROP TABLE IF EXISTS campaign_schedules CASCADE;
DROP TABLE IF EXISTS campaign_channels CASCADE;
DROP TABLE IF EXISTS campaign_analytics CASCADE;

-- Drop function if no other tables use it
-- DROP FUNCTION IF EXISTS update_updated_at_column();
*/
