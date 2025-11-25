-- CRM Service - Initial Database Schema
-- Version: 1.0.0
-- Description: Creates all tables for the CRM Service

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- WORKSPACES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    team_members TEXT[], -- Array of team member IDs or emails
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_status ON workspaces(status);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at);

-- ========================================
-- LEADS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'enriched', 'qualified', 'contacted',
        'in_conversation', 'proposal_sent', 'won', 'lost'
    )),
    score DECIMAL(5,2),
    score_breakdown JSONB, -- {icp_fit, engagement, recency, confidence}
    source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- ========================================
-- LEAD ACTIVITIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'call', 'email', 'meeting', 'note', 'ai_action', 'status_change'
    )),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(type);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at);

-- ========================================
-- CONTACTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    type VARCHAR(50) NOT NULL DEFAULT 'lead' CHECK (type IN ('lead', 'client', 'partner', 'other')),
    workspace_id UUID, -- Soft reference, no FK constraint for flexibility
    linkedin_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

-- ========================================
-- DEALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    workspace_id UUID, -- Soft reference
    contact_id UUID, -- Soft reference
    value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(50) NOT NULL DEFAULT 'discovery' CHECK (stage IN (
        'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    )),
    expected_close_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_workspace_id ON deals(workspace_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_value ON deals(value);
CREATE INDEX idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_created_at ON deals(created_at);

-- ========================================
-- CLIENT FEEDBACK TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL, -- Soft reference
    contact_id UUID, -- Soft reference
    subject VARCHAR(255) NOT NULL,
    feedback TEXT NOT NULL,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'addressed', 'closed')),
    response TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_feedback_workspace_id ON client_feedback(workspace_id);
CREATE INDEX idx_client_feedback_contact_id ON client_feedback(contact_id);
CREATE INDEX idx_client_feedback_sentiment ON client_feedback(sentiment);
CREATE INDEX idx_client_feedback_status ON client_feedback(status);
CREATE INDEX idx_client_feedback_rating ON client_feedback(rating);
CREATE INDEX idx_client_feedback_created_at ON client_feedback(created_at);

-- ========================================
-- UPDATED_AT TRIGGERS
-- ========================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_feedback_updated_at BEFORE UPDATE ON client_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA (Optional - for development)
-- ========================================
-- Uncomment to insert sample data

-- INSERT INTO workspaces (name, description, status, settings) VALUES
-- ('Acme Corp', 'Enterprise software company', 'active', '{"industry": "SaaS"}'),
-- ('TechStart Inc', 'Startup accelerator', 'active', '{"industry": "Consulting"}');

-- INSERT INTO leads (name, email, company, status, score, source) VALUES
-- ('John Doe', 'john@example.com', 'Example Inc', 'new', 85.5, 'Website'),
-- ('Jane Smith', 'jane@sample.com', 'Sample LLC', 'qualified', 92.0, 'Referral');

-- ========================================
-- NOTES
-- ========================================
-- 1. All tables use UUID as primary keys for better distribution and security
-- 2. Timestamps are stored with timezone information
-- 3. JSONB is used for flexible metadata storage
-- 4. Indexes are created on commonly queried fields
-- 5. Triggers automatically update the updated_at field
-- 6. Cascade delete is used for lead_activities when lead is deleted
-- 7. Soft references (no FK constraints) used for workspace_id and contact_id for flexibility
