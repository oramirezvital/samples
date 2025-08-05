-- Simplified Customer Care Analytics Schema
-- Drop existing tables and create a streamlined data model

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS journey_sessions CASCADE;
DROP TABLE IF EXISTS interaction_steps CASCADE;
DROP TABLE IF EXISTS customer_interactions CASCADE;
DROP TABLE IF EXISTS customer_service_plans CASCADE;
DROP TABLE IF EXISTS service_plans CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS interaction_types CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create simplified schema

-- 1. CUSTOMERS - Core customer information
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_segment VARCHAR(20) CHECK (customer_segment IN ('Premium', 'Standard', 'Basic')) DEFAULT 'Standard',
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

-- 5. SERVICE_PLANS - Available service plans catalog
CREATE TABLE service_plans (
    service_plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    plan_type VARCHAR(50),
    monthly_fee DECIMAL(10,2),
    data_allowance_gb INTEGER,
    voice_minutes INTEGER,
    sms_allowance INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CUSTOMER_SERVICE_PLANS - Customer to service plan relationships
CREATE TABLE customer_service_plans (
    customer_service_plan_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    service_plan_id INTEGER NOT NULL REFERENCES service_plans(service_plan_id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, service_plan_id, start_date)
);

-- 7. CUSTOMER_INTERACTIONS - Main fact table for all customer interactions
CREATE TABLE customer_interactions (
    interaction_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
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
CREATE INDEX idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_channel_id ON customer_interactions(channel_id);
CREATE INDEX idx_customer_interactions_interaction_type_id ON customer_interactions(interaction_type_id);
CREATE INDEX idx_customer_interactions_agent_id ON customer_interactions(agent_id);
CREATE INDEX idx_customer_interactions_start_timestamp ON customer_interactions(start_timestamp);
CREATE INDEX idx_customer_interactions_session_id ON customer_interactions(session_id);

CREATE INDEX idx_customer_service_plans_customer_id ON customer_service_plans(customer_id);
CREATE INDEX idx_customer_service_plans_service_plan_id ON customer_service_plans(service_plan_id);

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Core customer information and profiles';
COMMENT ON TABLE channels IS 'Communication channels catalog (Phone, Email, Chat, etc.)';
COMMENT ON TABLE agents IS 'Customer service agents catalog';
COMMENT ON TABLE interaction_types IS 'Types of customer interactions catalog (Support, Sales, Billing, etc.)';
COMMENT ON TABLE service_plans IS 'Available service plans and packages catalog';
COMMENT ON TABLE customer_service_plans IS 'Customer to service plan relationships and history';
COMMENT ON TABLE customer_interactions IS 'Main fact table storing all customer interactions across all channels';

-- Display table creation summary
SELECT 
    'Schema created successfully!' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'channels', 'agents', 'interaction_types', 'service_plans', 'customer_service_plans', 'customer_interactions');
