-- Simplified Customer Care Analytics Schema
-- Drop existing tables and create a streamlined data model

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS journey_sessions CASCADE;
DROP TABLE IF EXISTS interaction_steps CASCADE;
DROP TABLE IF EXISTS subscriber_interactions CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS interaction_types CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;

-- Create simplified schema

-- 1. SUBSCRIBERS - Core subscriber information
CREATE TABLE subscribers (
    subscriber_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subscriber_type VARCHAR(20) CHECK (subscriber_type IN ('prepaid', 'postpaid', 'mix')) DEFAULT 'prepaid',
    status VARCHAR(20) CHECK (status IN ('Active', 'Inactive', 'Suspended')) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CHANNELS - Communication channels catalog
CREATE TABLE channels (
    channel_id SERIAL PRIMARY KEY,
    channel_name VARCHAR(50) NOT NULL UNIQUE,
    channel_type VARCHAR(30) CHECK (channel_type IN ('Digital', 'Voice', 'In-Person')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AGENTS - Customer service agents catalog
CREATE TABLE agents (
    agent_id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(20) UNIQUE,
    department VARCHAR(50),
    skill_level VARCHAR(20) CHECK (skill_level IN ('Junior', 'Senior', 'Expert')) DEFAULT 'Junior',
    is_active BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INTERACTION_TYPES - Types of customer interactions catalog
CREATE TABLE interaction_types (
    interaction_type_id SERIAL PRIMARY KEY,
    interaction_code VARCHAR(20) NOT NULL UNIQUE,
    interaction_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    priority_level VARCHAR(20) CHECK (priority_level IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SUBSCRIBER_INTERACTIONS - Main fact table for all subscriber interactions
CREATE TABLE subscriber_interactions (
    interaction_id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(subscriber_id),
    channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
    interaction_type_id INTEGER NOT NULL REFERENCES interaction_types(interaction_type_id),
    agent_id INTEGER REFERENCES agents(agent_id),
    session_id VARCHAR(50),
    start_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_timestamp TIMESTAMP,
    duration_seconds INTEGER,
    queue_time_seconds INTEGER DEFAULT 0,
    resolution_status VARCHAR(20) CHECK (resolution_status IN ('Resolved', 'Pending', 'Escalated', 'Cancelled')) DEFAULT 'Pending',
    satisfaction_score DECIMAL(3,2) CHECK (satisfaction_score BETWEEN -1.0 AND 1.0),
    interaction_summary TEXT,
    language VARCHAR(5) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_subscriber_interactions_subscriber_id ON subscriber_interactions(subscriber_id);
CREATE INDEX idx_subscriber_interactions_channel_id ON subscriber_interactions(channel_id);
CREATE INDEX idx_subscriber_interactions_interaction_type_id ON subscriber_interactions(interaction_type_id);
CREATE INDEX idx_subscriber_interactions_agent_id ON subscriber_interactions(agent_id);
CREATE INDEX idx_subscriber_interactions_start_timestamp ON subscriber_interactions(start_timestamp);
CREATE INDEX idx_subscriber_interactions_session_id ON subscriber_interactions(session_id);

-- Add comments for documentation
COMMENT ON TABLE subscribers IS 'Core subscriber information and profiles';
COMMENT ON TABLE channels IS 'Communication channels catalog (Phone, Email, Chat, etc.)';
COMMENT ON TABLE agents IS 'Customer service agents catalog';
COMMENT ON TABLE interaction_types IS 'Types of customer interactions catalog (Support, Sales, Billing, etc.)';
COMMENT ON TABLE subscriber_interactions IS 'Main fact table storing all subscriber interactions across all channels';

-- Display table creation summary
SELECT 
    'Schema created successfully!' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscribers', 'channels', 'agents', 'interaction_types', 'subscriber_interactions');
