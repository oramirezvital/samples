-- Customer Care Performance Measurement Platform - Data Model
-- PostgreSQL Schema for Wireless Carrier Digital Channels Analytics

-- Enable UUID extension for better primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE DIMENSION TABLES
-- =====================================================

-- Customers table - Mobile subscriber profiles
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    msisdn VARCHAR(20) UNIQUE NOT NULL, -- Mobile Station International Subscriber Directory Number
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('prepaid', 'postpaid', 'hybrid')),
    customer_name VARCHAR(255),
    region VARCHAR(10) NOT NULL CHECK (region IN ('R9', 'DEUR')),
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'terminated', 'churned')),
    registration_date DATE NOT NULL,
    last_activity_date TIMESTAMP,
    preferred_language VARCHAR(5) DEFAULT 'es',
    customer_segment VARCHAR(50), -- VIP, Premium, Standard, Basic
    credit_limit DECIMAL(10,2), -- For postpaid customers
    current_balance DECIMAL(10,2), -- For prepaid customers
    data_plan VARCHAR(100),
    voice_plan VARCHAR(100),
    
    -- Enhanced CX fields
    customer_lifetime_value DECIMAL(12,2),
    churn_risk_score DECIMAL(3,2), -- 0.00 to 1.00
    nps_score INTEGER CHECK (nps_score BETWEEN -100 AND 100), -- Net Promoter Score
    customer_effort_score DECIMAL(3,2), -- Average CES
    total_interactions_count INTEGER DEFAULT 0,
    successful_interactions_count INTEGER DEFAULT 0,
    escalated_interactions_count INTEGER DEFAULT 0,
    avg_satisfaction_score DECIMAL(3,2),
    preferred_contact_time VARCHAR(20), -- morning, afternoon, evening
    communication_preferences JSONB, -- email, sms, push notifications preferences
    accessibility_needs JSONB, -- Special accessibility requirements
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table - Digital interaction channels
CREATE TABLE channels (
    channel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_name VARCHAR(50) UNIQUE NOT NULL,
    channel_type VARCHAR(30) NOT NULL CHECK (channel_type IN ('mobile_app', 'web_app', 'interactive_menu', 'chatbot', 'social_media', 'email', 'sms', 'voice_call', 'video_call')),
    channel_description TEXT,
    is_active BOOLEAN DEFAULT true,
    supports_bot BOOLEAN DEFAULT false,
    supports_live_chat BOOLEAN DEFAULT false,
    supports_video BOOLEAN DEFAULT false,
    supports_file_sharing BOOLEAN DEFAULT false,
    
    -- Channel performance baselines
    expected_response_time_seconds INTEGER,
    max_concurrent_users INTEGER,
    availability_sla DECIMAL(5,4), -- 99.99% as 0.9999
    cost_per_interaction DECIMAL(8,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interaction types - Catalog of possible customer interactions
CREATE TABLE interaction_types (
    interaction_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_code VARCHAR(50) UNIQUE NOT NULL,
    interaction_name VARCHAR(100) NOT NULL,
    interaction_category VARCHAR(50) NOT NULL, -- billing, account, technical, sales, etc.
    sub_category VARCHAR(50),
    description TEXT,
    expected_duration_seconds INTEGER, -- Expected duration for this type of interaction
    complexity_level VARCHAR(20) CHECK (complexity_level IN ('low', 'medium', 'high', 'critical')),
    requires_authentication BOOLEAN DEFAULT true,
    requires_human_agent BOOLEAN DEFAULT false,
    business_impact VARCHAR(20) CHECK (business_impact IN ('low', 'medium', 'high', 'critical')),
    revenue_impact BOOLEAN DEFAULT false,
    
    -- SLA definitions
    target_resolution_time_seconds INTEGER,
    escalation_threshold_seconds INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table - For live chat and human interactions
CREATE TABLE agents (
    agent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(20) CHECK (agent_type IN ('bot', 'human', 'hybrid', 'supervisor')),
    specialization VARCHAR(100), -- billing, technical, sales, etc.
    skill_level VARCHAR(20) CHECK (skill_level IN ('trainee', 'junior', 'senior', 'expert', 'specialist')),
    is_active BOOLEAN DEFAULT true,
    max_concurrent_chats INTEGER DEFAULT 1,
    languages_supported VARCHAR(100)[], -- Array of language codes
    
    -- Performance metrics
    total_interactions_handled INTEGER DEFAULT 0,
    avg_handling_time_seconds DECIMAL(8,2),
    customer_satisfaction_avg DECIMAL(3,2),
    escalation_rate DECIMAL(5,4),
    first_contact_resolution_rate DECIMAL(5,4),
    
    -- Scheduling and availability
    work_schedule JSONB, -- Working hours, time zones
    current_status VARCHAR(20) DEFAULT 'available' CHECK (current_status IN ('available', 'busy', 'break', 'offline', 'training')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FACT TABLES
-- =====================================================

-- Customer interactions - Main fact table
CREATE TABLE customer_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    channel_id UUID NOT NULL REFERENCES channels(channel_id),
    interaction_type_id UUID NOT NULL REFERENCES interaction_types(interaction_type_id),
    session_id VARCHAR(255), -- Groups related interactions in same session
    
    -- Timing information
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Interaction details
    interaction_status VARCHAR(20) NOT NULL CHECK (interaction_status IN ('completed', 'failed', 'abandoned', 'escalated', 'in_progress')),
    error_code VARCHAR(50), -- HTTP or internal error code when status is failed
    error_message TEXT,
    
    -- Channel specific information
    device_type VARCHAR(20), -- android, ios, web, etc.
    client_type VARCHAR(50), -- app version, browser type, etc.
    client_version VARCHAR(20),
    operating_system VARCHAR(50),
    
    -- Bot vs Human interaction tracking
    interaction_mode VARCHAR(20) CHECK (interaction_mode IN ('bot', 'live_chat', 'self_service', 'ivr')),
    bot_duration_seconds INTEGER, -- Time spent with bot
    human_duration_seconds INTEGER, -- Time spent with human agent
    escalated_to_human BOOLEAN DEFAULT false,
    escalation_reason VARCHAR(255),
    
    -- Agent information (when applicable)
    agent_id UUID REFERENCES agents(agent_id),
    
    -- Additional metrics
    customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score BETWEEN 1 AND 5),
    resolution_on_first_contact BOOLEAN,
    number_of_attempts INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interaction steps - Detailed breakdown of each interaction
CREATE TABLE interaction_steps (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID NOT NULL REFERENCES customer_interactions(interaction_id),
    step_sequence INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- authentication, menu_selection, data_input, processing, result
    step_name VARCHAR(100),
    step_status VARCHAR(20) CHECK (step_status IN ('completed', 'failed', 'skipped')),
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP,
    duration_seconds INTEGER,
    error_code VARCHAR(50),
    step_data JSONB, -- Flexible storage for step-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer journey sessions - Groups interactions into customer journeys
CREATE TABLE customer_journey_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER,
    total_interactions INTEGER DEFAULT 0,
    primary_channel_id UUID REFERENCES channels(channel_id),
    journey_outcome VARCHAR(50), -- completed, abandoned, escalated, etc.
    journey_goal VARCHAR(100), -- What the customer was trying to achieve
    goal_achieved BOOLEAN,
    cross_channel_journey BOOLEAN DEFAULT false, -- Did customer use multiple channels?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics aggregation table
CREATE TABLE daily_channel_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    channel_id UUID NOT NULL REFERENCES channels(channel_id),
    
    -- Volume metrics
    total_interactions INTEGER DEFAULT 0,
    successful_interactions INTEGER DEFAULT 0,
    failed_interactions INTEGER DEFAULT 0,
    abandoned_interactions INTEGER DEFAULT 0,
    
    -- Bot vs Human metrics
    bot_interactions INTEGER DEFAULT 0,
    live_chat_interactions INTEGER DEFAULT 0,
    escalated_interactions INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_duration_seconds DECIMAL(10,2),
    avg_bot_duration_seconds DECIMAL(10,2),
    avg_human_duration_seconds DECIMAL(10,2),
    success_rate DECIMAL(5,4), -- Percentage as decimal (0.95 = 95%)
    first_contact_resolution_rate DECIMAL(5,4),
    avg_customer_satisfaction DECIMAL(3,2),
    
    -- Efficiency metrics
    total_duration_seconds BIGINT DEFAULT 0,
    peak_hour INTEGER, -- Hour of day with most activity (0-23)
    unique_customers INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(metric_date, channel_id)
);

-- =====================================================
-- ADDITIONAL CX PERFORMANCE TABLES
-- =====================================================

-- Service plans - Customer service plan details
CREATE TABLE service_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) CHECK (plan_type IN ('data', 'voice', 'combo', 'addon')),
    plan_category VARCHAR(20) CHECK (plan_category IN ('prepaid', 'postpaid', 'hybrid')),
    monthly_fee DECIMAL(8,2),
    data_allowance_gb INTEGER,
    voice_minutes INTEGER,
    sms_allowance INTEGER,
    validity_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer service plans - Many-to-many relationship
CREATE TABLE customer_service_plans (
    customer_id UUID REFERENCES customers(customer_id),
    plan_id UUID REFERENCES service_plans(plan_id),
    activation_date DATE NOT NULL,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT true,
    monthly_charge DECIMAL(8,2),
    PRIMARY KEY (customer_id, plan_id, activation_date)
);

-- Knowledge base - For bot and agent support
CREATE TABLE knowledge_base (
    kb_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kb_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    tags VARCHAR(100)[],
    language VARCHAR(5) DEFAULT 'es',
    confidence_score DECIMAL(3,2), -- How confident we are in this answer
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4), -- How often this KB article resolves issues
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey templates
CREATE TABLE survey_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) CHECK (template_type IN ('csat', 'nps', 'ces', 'custom')),
    questions JSONB NOT NULL, -- Array of question objects
    trigger_conditions JSONB, -- When to trigger this survey
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer feedback
CREATE TABLE customer_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    interaction_id UUID REFERENCES customer_interactions(interaction_id),
    session_id UUID REFERENCES customer_journey_sessions(session_id),
    template_id UUID REFERENCES survey_templates(template_id),
    
    -- Feedback details
    feedback_type VARCHAR(30) CHECK (feedback_type IN ('csat', 'nps', 'ces', 'complaint', 'compliment', 'suggestion')),
    feedback_channel VARCHAR(30), -- How feedback was collected
    feedback_timestamp TIMESTAMP NOT NULL,
    
    -- Structured feedback
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    effort_score INTEGER CHECK (effort_score BETWEEN 1 AND 7),
    nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),
    
    -- Unstructured feedback
    feedback_text TEXT,
    sentiment_score DECIMAL(3,2),
    sentiment_confidence DECIMAL(3,2),
    
    -- Response and resolution
    response_required BOOLEAN DEFAULT false,
    response_provided BOOLEAN DEFAULT false,
    response_timestamp TIMESTAMP,
    resolution_status VARCHAR(20),
    
    feedback_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent performance metrics
CREATE TABLE daily_agent_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(agent_id),
    
    -- Volume metrics
    total_interactions INTEGER DEFAULT 0,
    successful_resolutions INTEGER DEFAULT 0,
    escalations_received INTEGER DEFAULT 0,
    escalations_made INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_handling_time_seconds DECIMAL(10,2),
    first_contact_resolution_rate DECIMAL(5,4),
    customer_satisfaction_avg DECIMAL(3,2),
    utilization_rate DECIMAL(5,4), -- % of time actively handling interactions
    
    -- Efficiency metrics
    interactions_per_hour DECIMAL(6,2),
    concurrent_interactions_avg DECIMAL(4,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_date, agent_id)
);

-- Customer experience scores - Historical tracking
CREATE TABLE customer_experience_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    score_date DATE NOT NULL,
    
    -- Experience scores
    overall_satisfaction DECIMAL(3,2),
    effort_score DECIMAL(3,2),
    nps_score INTEGER,
    
    -- Interaction-based metrics
    interactions_count INTEGER DEFAULT 0,
    successful_interactions_rate DECIMAL(5,4),
    avg_resolution_time_seconds DECIMAL(10,2),
    escalation_rate DECIMAL(5,4),
    
    -- Journey metrics
    journey_completion_rate DECIMAL(5,4),
    cross_channel_usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, score_date)
);

-- System alerts and notifications
CREATE TABLE system_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(30) CHECK (alert_type IN ('performance', 'quality', 'volume', 'error', 'sla_breach')),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Context
    channel_id UUID REFERENCES channels(channel_id),
    agent_id UUID REFERENCES agents(agent_id),
    interaction_id UUID REFERENCES customer_interactions(interaction_id),
    
    -- Alert lifecycle
    alert_timestamp TIMESTAMP NOT NULL,
    acknowledged_timestamp TIMESTAMP,
    resolved_timestamp TIMESTAMP,
    alert_status VARCHAR(20) DEFAULT 'open' CHECK (alert_status IN ('open', 'acknowledged', 'resolved', 'closed')),
    
    -- Metrics that triggered the alert
    metric_values JSONB,
    threshold_values JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuration and thresholds
CREATE TABLE performance_thresholds (
    threshold_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50),
    
    -- Threshold values
    warning_threshold DECIMAL(10,4),
    critical_threshold DECIMAL(10,4),
    target_value DECIMAL(10,4),
    
    -- Context filters
    channel_id UUID REFERENCES channels(channel_id),
    interaction_type_id UUID REFERENCES interaction_types(interaction_type_id),
    customer_segment VARCHAR(50),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interaction outcomes - Track business outcomes
CREATE TABLE interaction_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID NOT NULL REFERENCES customer_interactions(interaction_id),
    outcome_type VARCHAR(50) NOT NULL, -- sale, retention, churn_prevention, cost_saving
    outcome_value DECIMAL(10,2), -- Monetary value of the outcome
    outcome_description TEXT,
    outcome_timestamp TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT false,
    verification_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channel capacity planning
CREATE TABLE channel_capacity (
    capacity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(channel_id),
    capacity_date DATE NOT NULL,
    hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
    
    -- Capacity metrics
    max_concurrent_interactions INTEGER,
    actual_concurrent_interactions INTEGER,
    queue_length INTEGER DEFAULT 0,
    avg_wait_time_seconds DECIMAL(8,2),
    
    -- Utilization
    utilization_rate DECIMAL(5,4), -- % of capacity used
    overflow_count INTEGER DEFAULT 0, -- Interactions that couldn't be handled
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, capacity_date, hour_of_day)
);

-- Customer journey touchpoints - Track all customer touchpoints
CREATE TABLE journey_touchpoints (
    touchpoint_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES customer_journey_sessions(session_id),
    interaction_id UUID REFERENCES customer_interactions(interaction_id),
    touchpoint_sequence INTEGER NOT NULL,
    touchpoint_type VARCHAR(50), -- interaction, page_view, app_open, notification, etc.
    touchpoint_timestamp TIMESTAMP NOT NULL,
    channel_id UUID REFERENCES channels(channel_id),
    touchpoint_data JSONB, -- Flexible data storage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer interactions indexes
CREATE INDEX idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_channel_id ON customer_interactions(channel_id);
CREATE INDEX idx_customer_interactions_timestamp ON customer_interactions(start_timestamp);
CREATE INDEX idx_customer_interactions_status ON customer_interactions(interaction_status);
CREATE INDEX idx_customer_interactions_mode ON customer_interactions(interaction_mode);
CREATE INDEX idx_customer_interactions_session ON customer_interactions(session_id);

-- Customer indexes
CREATE INDEX idx_customers_msisdn ON customers(msisdn);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_region ON customers(region);
CREATE INDEX idx_customers_status ON customers(account_status);

-- Performance metrics indexes
CREATE INDEX idx_daily_metrics_date ON daily_channel_metrics(metric_date);
CREATE INDEX idx_daily_metrics_channel ON daily_channel_metrics(channel_id);

-- Journey sessions indexes
CREATE INDEX idx_journey_sessions_customer ON customer_journey_sessions(customer_id);
CREATE INDEX idx_journey_sessions_start ON customer_journey_sessions(session_start);

-- Additional indexes for new tables
CREATE INDEX idx_customer_feedback_customer ON customer_feedback(customer_id);
CREATE INDEX idx_customer_feedback_interaction ON customer_feedback(interaction_id);
CREATE INDEX idx_customer_feedback_timestamp ON customer_feedback(feedback_timestamp);
CREATE INDEX idx_customer_feedback_type ON customer_feedback(feedback_type);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

CREATE INDEX idx_agent_metrics_date ON daily_agent_metrics(metric_date);
CREATE INDEX idx_agent_metrics_agent ON daily_agent_metrics(agent_id);

CREATE INDEX idx_experience_scores_customer ON customer_experience_scores(customer_id);
CREATE INDEX idx_experience_scores_date ON customer_experience_scores(score_date);

CREATE INDEX idx_system_alerts_timestamp ON system_alerts(alert_timestamp);
CREATE INDEX idx_system_alerts_status ON system_alerts(alert_status);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);

CREATE INDEX idx_interaction_outcomes_interaction ON interaction_outcomes(interaction_id);
CREATE INDEX idx_interaction_outcomes_type ON interaction_outcomes(outcome_type);

CREATE INDEX idx_channel_capacity_channel_date ON channel_capacity(channel_id, capacity_date);
CREATE INDEX idx_journey_touchpoints_session ON journey_touchpoints(session_id);

CREATE INDEX idx_service_plans_type ON service_plans(plan_type);
CREATE INDEX idx_customer_service_plans_customer ON customer_service_plans(customer_id);

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert sample channels
INSERT INTO channels (channel_name, channel_type, supports_bot, supports_live_chat) VALUES
('Mobile App', 'mobile_app', true, true),
('Web Portal', 'web_app', true, true),
('IVR System', 'interactive_menu', false, false),
('WhatsApp Bot', 'chatbot', true, true),
('Facebook Messenger', 'social_media', true, true),
('SMS Service', 'sms', false, false);

-- Insert sample interaction types
INSERT INTO interaction_types (interaction_code, interaction_name, interaction_category, expected_duration_seconds, complexity_level) VALUES
('BALANCE_QUERY', 'Balance Inquiry', 'account', 30, 'low'),
('INVOICE_DOWNLOAD', 'Invoice Download', 'billing', 60, 'low'),
('PAYMENT_PROCESS', 'Invoice Payment', 'billing', 180, 'medium'),
('TOP_UP', 'Account Top Up', 'account', 90, 'low'),
('HISTORY_QUERY', 'Usage History', 'account', 45, 'low'),
('ADDON_PURCHASE', 'Add-on Purchase', 'sales', 240, 'medium'),
('PLAN_CHANGE', 'Plan Modification', 'account', 300, 'high'),
('TECHNICAL_SUPPORT', 'Technical Issue', 'technical', 600, 'high'),
('SIM_REPLACEMENT', 'SIM Card Replacement', 'technical', 420, 'high'),
('ROAMING_INFO', 'Roaming Information', 'account', 120, 'medium'),
('DATA_USAGE', 'Data Usage Query', 'account', 40, 'low'),
('COMPLAINT_FILING', 'File Complaint', 'support', 480, 'high');

-- Insert sample agents
INSERT INTO agents (agent_code, agent_name, agent_type, specialization, skill_level) VALUES
('BOT_001', 'Customer Service Bot', 'bot', 'general', 'expert'),
('BOT_002', 'Technical Support Bot', 'bot', 'technical', 'senior'),
('HUMAN_001', 'Maria Rodriguez', 'human', 'billing', 'senior'),
('HUMAN_002', 'Carlos Martinez', 'human', 'technical', 'expert'),
('HUMAN_003', 'Ana Lopez', 'human', 'sales', 'junior');

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for bot vs human interaction analysis
CREATE VIEW v_bot_human_analysis AS
SELECT 
    c.channel_name,
    DATE(ci.start_timestamp) as interaction_date,
    ci.interaction_mode,
    COUNT(*) as interaction_count,
    AVG(ci.duration_seconds) as avg_duration,
    AVG(CASE WHEN ci.interaction_mode = 'bot' THEN ci.bot_duration_seconds END) as avg_bot_duration,
    AVG(CASE WHEN ci.interaction_mode = 'live_chat' THEN ci.human_duration_seconds END) as avg_human_duration,
    COUNT(CASE WHEN ci.escalated_to_human THEN 1 END) as escalated_count,
    AVG(ci.customer_satisfaction_score) as avg_satisfaction
FROM customer_interactions ci
JOIN channels c ON ci.channel_id = c.channel_id
WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.channel_name, DATE(ci.start_timestamp), ci.interaction_mode;

-- View for customer journey analysis
CREATE VIEW v_customer_journey_summary AS
SELECT 
    cjs.customer_id,
    cust.customer_type,
    cust.region,
    COUNT(ci.interaction_id) as total_interactions,
    COUNT(DISTINCT ci.channel_id) as channels_used,
    MIN(ci.start_timestamp) as journey_start,
    MAX(ci.end_timestamp) as journey_end,
    SUM(ci.duration_seconds) as total_duration,
    AVG(ci.customer_satisfaction_score) as avg_satisfaction,
    BOOL_OR(ci.escalated_to_human) as had_escalation
FROM customer_journey_sessions cjs
JOIN customers cust ON cjs.customer_id = cust.customer_id
JOIN customer_interactions ci ON cjs.session_id = ci.session_id
GROUP BY cjs.customer_id, cust.customer_type, cust.region;

-- =====================================================
-- TRIGGERS FOR DATA CONSISTENCY
-- =====================================================

-- Function to update interaction duration
CREATE OR REPLACE FUNCTION update_interaction_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_timestamp IS NOT NULL AND NEW.start_timestamp IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_timestamp - NEW.start_timestamp));
    END IF;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate duration
CREATE TRIGGER tr_update_interaction_duration
    BEFORE UPDATE ON customer_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_interaction_duration();

-- Function to update daily metrics
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_channel_metrics (
        metric_date, 
        channel_id, 
        total_interactions,
        successful_interactions,
        failed_interactions,
        bot_interactions,
        live_chat_interactions
    )
    VALUES (
        DATE(NEW.start_timestamp),
        NEW.channel_id,
        1,
        CASE WHEN NEW.interaction_status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.interaction_status = 'failed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.interaction_mode = 'bot' THEN 1 ELSE 0 END,
        CASE WHEN NEW.interaction_mode = 'live_chat' THEN 1 ELSE 0 END
    )
    ON CONFLICT (metric_date, channel_id) 
    DO UPDATE SET
        total_interactions = daily_channel_metrics.total_interactions + 1,
        successful_interactions = daily_channel_metrics.successful_interactions + 
            CASE WHEN NEW.interaction_status = 'completed' THEN 1 ELSE 0 END,
        failed_interactions = daily_channel_metrics.failed_interactions + 
            CASE WHEN NEW.interaction_status = 'failed' THEN 1 ELSE 0 END,
        bot_interactions = daily_channel_metrics.bot_interactions + 
            CASE WHEN NEW.interaction_mode = 'bot' THEN 1 ELSE 0 END,
        live_chat_interactions = daily_channel_metrics.live_chat_interactions + 
            CASE WHEN NEW.interaction_mode = 'live_chat' THEN 1 ELSE 0 END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily metrics on new interactions
CREATE TRIGGER tr_update_daily_metrics
    AFTER INSERT ON customer_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_metrics();

-- Comments for documentation
COMMENT ON TABLE customers IS 'Mobile subscriber profiles and account information';
COMMENT ON TABLE channels IS 'Digital interaction channels available to customers';
COMMENT ON TABLE customer_interactions IS 'Main fact table storing all customer interactions across channels';
COMMENT ON TABLE interaction_types IS 'Catalog of possible customer interaction types';
COMMENT ON TABLE agents IS 'Bot and human agents handling customer interactions';
COMMENT ON TABLE daily_channel_metrics IS 'Pre-aggregated daily performance metrics by channel';
COMMENT ON TABLE customer_journey_sessions IS 'Customer journey sessions grouping related interactions';

COMMENT ON COLUMN customer_interactions.interaction_mode IS 'Tracks whether interaction was handled by bot, live_chat, self_service, or ivr';
COMMENT ON COLUMN customer_interactions.bot_duration_seconds IS 'Time spent with automated bot before escalation';
COMMENT ON COLUMN customer_interactions.human_duration_seconds IS 'Time spent with human agent after escalation';
COMMENT ON COLUMN customer_interactions.escalated_to_human IS 'Flag indicating if bot interaction was escalated to human';
