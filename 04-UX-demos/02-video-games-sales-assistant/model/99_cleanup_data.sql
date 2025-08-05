-- Cleanup Script for Simplified Customer Care Analytics
-- Use this script to clear existing data before loading new synthetic data

-- WARNING: This will delete all existing data!
-- Only run this if you want to start fresh with new synthetic data

-- Disable foreign key checks temporarily (PostgreSQL doesn't have this, so we delete in order)

-- Delete data in reverse dependency order
DELETE FROM customer_interactions;
DELETE FROM customer_service_plans;
DELETE FROM service_plans;
DELETE FROM agents;
DELETE FROM interaction_types;
DELETE FROM channels;
DELETE FROM customers;

-- Reset sequences to start from 1
ALTER SEQUENCE customers_customer_id_seq RESTART WITH 1;
ALTER SEQUENCE channels_channel_id_seq RESTART WITH 1;
ALTER SEQUENCE agents_agent_id_seq RESTART WITH 1;
ALTER SEQUENCE interaction_types_interaction_type_id_seq RESTART WITH 1;
ALTER SEQUENCE service_plans_service_plan_id_seq RESTART WITH 1;
ALTER SEQUENCE customer_service_plans_customer_service_plan_id_seq RESTART WITH 1;
ALTER SEQUENCE customer_interactions_interaction_id_seq RESTART WITH 1;

-- Display cleanup summary
SELECT 'Data cleanup completed successfully!' as status;

-- Show current record counts (should all be 0)
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'channels', COUNT(*) FROM channels
UNION ALL
SELECT 'agents', COUNT(*) FROM agents
UNION ALL
SELECT 'interaction_types', COUNT(*) FROM interaction_types
UNION ALL
SELECT 'service_plans', COUNT(*) FROM service_plans
UNION ALL
SELECT 'customer_service_plans', COUNT(*) FROM customer_service_plans
UNION ALL
SELECT 'customer_interactions', COUNT(*) FROM customer_interactions
ORDER BY table_name;
