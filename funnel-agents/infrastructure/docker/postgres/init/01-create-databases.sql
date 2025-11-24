-- =============================================================================
-- FunnelAgents - PostgreSQL Database Initialization
-- =============================================================================

-- Create n8n database for workflow automation
CREATE DATABASE funnel_agents_n8n;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE funnel_agents TO funnel_agents;
GRANT ALL PRIVILEGES ON DATABASE funnel_agents_n8n TO funnel_agents;

-- Connect to main database and create extensions
\c funnel_agents;

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Connect to n8n database and create extensions
\c funnel_agents_n8n;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
