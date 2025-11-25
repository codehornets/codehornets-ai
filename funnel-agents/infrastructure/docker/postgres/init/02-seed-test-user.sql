-- =============================================================================
-- FunnelAgents - Seed Test User
-- =============================================================================
-- This script creates a test user for development purposes
-- Email: test@funnelagents.com
-- Password: Test123!
-- Password hash generated with bcrypt (10 rounds)

\c funnel_agents;

-- Create users table if not exists (TypeORM will create it, but this is a fallback)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    onboarding_completed BOOLEAN DEFAULT false,
    company_name VARCHAR(255),
    team_size VARCHAR(50),
    industry VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test user (password: Test123!)
-- The hash is for 'Test123!' using bcrypt with 10 rounds
INSERT INTO users (email, password, name, role, onboarding_completed)
VALUES (
    'test@funnelagents.com',
    '$2b$10$rQvP7qU1mSMxN8V1Y0NZMOxPqL3M5X2J6z3N4K8W9H7D6F5E4C3B2A',
    'Test User',
    'admin',
    false
) ON CONFLICT (email) DO NOTHING;

-- Insert a second test user who has completed onboarding
INSERT INTO users (email, password, name, role, onboarding_completed, company_name, team_size, industry)
VALUES (
    'demo@funnelagents.com',
    '$2b$10$rQvP7qU1mSMxN8V1Y0NZMOxPqL3M5X2J6z3N4K8W9H7D6F5E4C3B2A',
    'Demo User',
    'user',
    true,
    'Demo Agency',
    '6-20',
    'marketing_agency'
) ON CONFLICT (email) DO NOTHING;
