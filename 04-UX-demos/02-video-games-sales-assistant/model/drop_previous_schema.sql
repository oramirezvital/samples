-- Drop Previous Schema
-- This file removes all existing tables and data for a clean setup

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS daily_usage CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS lines CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
DROP TABLE IF EXISTS enterprises CASCADE;

-- Drop any remaining sequences
DROP SEQUENCE IF EXISTS enterprises_enterprise_id_seq CASCADE;
DROP SEQUENCE IF EXISTS bundles_bundle_id_seq CASCADE;
DROP SEQUENCE IF EXISTS devices_device_id_seq CASCADE;
DROP SEQUENCE IF EXISTS lines_line_id_seq CASCADE;
DROP SEQUENCE IF EXISTS daily_usage_usage_id_seq CASCADE;
DROP SEQUENCE IF EXISTS bills_bill_id_seq CASCADE;

-- Drop any remaining functions (if any were created)
DROP FUNCTION IF EXISTS generate_phone_number() CASCADE;
DROP FUNCTION IF EXISTS generate_sim_number() CASCADE;
DROP FUNCTION IF EXISTS generate_imei() CASCADE;

COMMENT ON SCHEMA public IS 'Previous wireless carrier schema dropped successfully';
