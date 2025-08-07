-- B2B Wireless Carrier Data Model
-- Drop existing objects if they exist
DROP TABLE IF EXISTS daily_usage CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS lines CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
DROP TABLE IF EXISTS enterprises CASCADE;

-- Create enterprises table
CREATE TABLE enterprises (
    enterprise_id SERIAL PRIMARY KEY,
    enterprise_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    billing_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

-- Create bundles table (service plans/packages)
CREATE TABLE bundles (
    bundle_id SERIAL PRIMARY KEY,
    bundle_name VARCHAR(255) NOT NULL,
    bundle_description TEXT,
    voice_minutes INTEGER DEFAULT 0,
    data_gb INTEGER DEFAULT 0,
    sms_count INTEGER DEFAULT 0,
    price_per_line DECIMAL(10,2) NOT NULL,
    overage_voice_rate DECIMAL(6,4) DEFAULT 0.00,
    overage_data_rate DECIMAL(6,4) DEFAULT 0.00,
    overage_sms_rate DECIMAL(6,4) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED'))
);

-- Create devices table
CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    device_imei VARCHAR(20) UNIQUE NOT NULL,
    device_model VARCHAR(100),
    device_manufacturer VARCHAR(100),
    device_type VARCHAR(50) DEFAULT 'SMARTPHONE' CHECK (device_type IN ('SMARTPHONE', 'TABLET', 'IOT_DEVICE', 'HOTSPOT', 'OTHER')),
    purchase_date DATE,
    warranty_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DAMAGED', 'LOST', 'RETIRED'))
);

-- Create lines table (individual service lines)
CREATE TABLE lines (
    line_id SERIAL PRIMARY KEY,
    enterprise_id INTEGER NOT NULL REFERENCES enterprises(enterprise_id),
    bundle_id INTEGER NOT NULL REFERENCES bundles(bundle_id),
    device_id INTEGER REFERENCES devices(device_id),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    sim_card_number VARCHAR(20) UNIQUE,
    employee_name VARCHAR(255),
    employee_email VARCHAR(255),
    department VARCHAR(100),
    activation_date DATE NOT NULL,
    deactivation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING'))
);

-- Create bills table
CREATE TABLE bills (
    bill_id SERIAL PRIMARY KEY,
    enterprise_id INTEGER NOT NULL REFERENCES enterprises(enterprise_id),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_lines INTEGER NOT NULL DEFAULT 0,
    base_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    overage_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxes DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED'))
);

-- Create daily_usage table
CREATE TABLE daily_usage (
    usage_id SERIAL PRIMARY KEY,
    line_id INTEGER NOT NULL REFERENCES lines(line_id),
    usage_date DATE NOT NULL,
    voice_minutes INTEGER DEFAULT 0,
    voice_minutes_roaming INTEGER DEFAULT 0,
    data_mb INTEGER DEFAULT 0,
    data_mb_roaming INTEGER DEFAULT 0,
    sms_count INTEGER DEFAULT 0,
    sms_count_roaming INTEGER DEFAULT 0,
    voice_charges DECIMAL(8,2) DEFAULT 0.00,
    data_charges DECIMAL(8,2) DEFAULT 0.00,
    sms_charges DECIMAL(8,2) DEFAULT 0.00,
    roaming_charges DECIMAL(8,2) DEFAULT 0.00,
    total_charges DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(line_id, usage_date)
);

-- Create indexes for better performance
CREATE INDEX idx_enterprises_status ON enterprises(status);
CREATE INDEX idx_enterprises_name ON enterprises(enterprise_name);

CREATE INDEX idx_bundles_status ON bundles(status);
CREATE INDEX idx_bundles_name ON bundles(bundle_name);

CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_type ON devices(device_type);
CREATE INDEX idx_devices_imei ON devices(device_imei);

CREATE INDEX idx_lines_enterprise ON lines(enterprise_id);
CREATE INDEX idx_lines_bundle ON lines(bundle_id);
CREATE INDEX idx_lines_device ON lines(device_id);
CREATE INDEX idx_lines_status ON lines(status);
CREATE INDEX idx_lines_phone ON lines(phone_number);

CREATE INDEX idx_bills_enterprise ON bills(enterprise_id);
CREATE INDEX idx_bills_period ON bills(billing_period_start, billing_period_end);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);

CREATE INDEX idx_daily_usage_line ON daily_usage(line_id);
CREATE INDEX idx_daily_usage_date ON daily_usage(usage_date);
CREATE INDEX idx_daily_usage_line_date ON daily_usage(line_id, usage_date);

-- Add comments to tables
COMMENT ON TABLE enterprises IS 'B2B customers who purchase wireless services';
COMMENT ON TABLE bundles IS 'Service plans/packages offered to enterprises';
COMMENT ON TABLE devices IS 'Mobile devices assigned to enterprise users';
COMMENT ON TABLE lines IS 'Individual wireless service lines';
COMMENT ON TABLE bills IS 'Monthly billing statements for enterprises';
COMMENT ON TABLE daily_usage IS 'Daily usage tracking per line for voice, data, and SMS';

-- Add column comments for key fields
COMMENT ON COLUMN enterprises.enterprise_name IS 'Company name (e.g., Coca-Cola Company)';
COMMENT ON COLUMN bundles.price_per_line IS 'Monthly price per line in USD';
COMMENT ON COLUMN lines.phone_number IS 'Assigned phone number for the line';
COMMENT ON COLUMN daily_usage.voice_minutes IS 'Voice usage in minutes for the day';
COMMENT ON COLUMN daily_usage.data_mb IS 'Data usage in megabytes for the day';
COMMENT ON COLUMN daily_usage.sms_count IS 'SMS count for the day';
