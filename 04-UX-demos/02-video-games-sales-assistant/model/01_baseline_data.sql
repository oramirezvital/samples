-- Baseline Data Script for Customer Care Performance Measurement Platform
-- This script creates foundational data that should be loaded once
-- Run this script first before generating synthetic interaction data

-- =====================================================
-- FOUNDATIONAL REFERENCE DATA
-- =====================================================

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE TABLE customer_feedback, interaction_outcomes, journey_touchpoints, 
--          interaction_steps, customer_interactions, customer_journey_sessions,
--          daily_agent_metrics, daily_channel_metrics, customer_experience_scores,
--          system_alerts, channel_capacity, customer_service_plans CASCADE;

-- Insert Channels with enhanced capabilities
INSERT INTO channels (channel_name, channel_type, supports_bot, supports_live_chat, supports_video, supports_file_sharing, expected_response_time_seconds, max_concurrent_users, availability_sla, cost_per_interaction) VALUES
('Mobile App', 'mobile_app', true, true, false, true, 30, 5000, 0.9950, 0.25),
('Web Portal', 'web_app', true, true, true, true, 45, 3000, 0.9900, 0.30),
('IVR System', 'interactive_menu', false, false, false, false, 60, 1000, 0.9980, 0.15),
('WhatsApp Bot', 'chatbot', true, true, false, true, 15, 10000, 0.9920, 0.10),
('Facebook Messenger', 'social_media', true, true, false, true, 20, 8000, 0.9900, 0.12),
('SMS Service', 'sms', false, false, false, false, 300, 50000, 0.9990, 0.05),
('Voice Call Center', 'voice_call', false, true, false, false, 120, 500, 0.9950, 2.50),
('Video Support', 'video_call', false, true, true, true, 180, 100, 0.9900, 3.00),
('Email Support', 'email', false, true, false, true, 3600, 10000, 0.9950, 0.80),
('Live Chat Web', 'web_app', false, true, false, true, 90, 200, 0.9930, 1.20)
ON CONFLICT (channel_name) DO NOTHING;

-- Insert Interaction Types with comprehensive catalog
INSERT INTO interaction_types (interaction_code, interaction_name, interaction_category, sub_category, expected_duration_seconds, complexity_level, business_impact, revenue_impact, target_resolution_time_seconds, escalation_threshold_seconds, requires_human_agent) VALUES
-- Account Management
('BALANCE_QUERY', 'Balance Inquiry', 'account', 'information', 30, 'low', 'low', false, 60, 120, false),
('HISTORY_QUERY', 'Usage History', 'account', 'information', 45, 'low', 'low', false, 90, 180, false),
('PLAN_INFO', 'Plan Information', 'account', 'information', 60, 'low', 'low', false, 120, 240, false),
('ACCOUNT_UPDATE', 'Account Information Update', 'account', 'service_change', 180, 'medium', 'medium', false, 300, 600, false),
('PLAN_CHANGE', 'Plan Modification', 'account', 'service_change', 300, 'high', 'high', true, 600, 900, true),
('SERVICE_ACTIVATION', 'Service Activation', 'account', 'service_change', 360, 'medium', 'high', true, 720, 1080, false),
('ACCOUNT_CLOSURE', 'Account Closure', 'account', 'service_change', 600, 'high', 'critical', false, 1200, 1800, true),

-- Billing
('INVOICE_DOWNLOAD', 'Invoice Download', 'billing', 'self_service', 60, 'low', 'low', false, 120, 240, false),
('PAYMENT_PROCESS', 'Invoice Payment', 'billing', 'transaction', 180, 'medium', 'high', true, 300, 450, false),
('PAYMENT_INQUIRY', 'Payment Status Inquiry', 'billing', 'information', 90, 'low', 'medium', false, 180, 360, false),
('BILLING_DISPUTE', 'Billing Dispute', 'billing', 'complaint', 480, 'high', 'high', false, 960, 1440, true),
('REFUND_REQUEST', 'Refund Request', 'billing', 'transaction', 420, 'high', 'high', true, 840, 1260, true),

-- Top-up and Recharge
('TOP_UP', 'Account Top Up', 'account', 'transaction', 90, 'low', 'high', true, 180, 270, false),
('AUTO_RECHARGE_SETUP', 'Auto Recharge Setup', 'account', 'service_change', 240, 'medium', 'medium', true, 480, 720, false),
('RECHARGE_HISTORY', 'Recharge History', 'account', 'information', 60, 'low', 'low', false, 120, 240, false),

-- Add-ons and Sales
('ADDON_PURCHASE', 'Add-on Purchase', 'sales', 'transaction', 240, 'medium', 'high', true, 480, 720, false),
('ADDON_INFO', 'Add-on Information', 'sales', 'information', 120, 'low', 'low', false, 240, 480, false),
('ROAMING_ACTIVATION', 'Roaming Service Activation', 'sales', 'service_change', 300, 'medium', 'medium', true, 600, 900, false),
('ROAMING_INFO', 'Roaming Information', 'account', 'information', 120, 'medium', 'low', false, 240, 480, false),
('PROMOTION_INQUIRY', 'Promotion Inquiry', 'sales', 'information', 90, 'low', 'low', false, 180, 360, false),

-- Technical Support
('TECHNICAL_SUPPORT', 'Technical Issue', 'technical', 'troubleshooting', 600, 'high', 'medium', false, 1200, 1800, true),
('NETWORK_ISSUE', 'Network Problem Report', 'technical', 'network', 300, 'medium', 'medium', false, 600, 900, false),
('SIM_REPLACEMENT', 'SIM Card Replacement', 'technical', 'service_request', 420, 'high', 'medium', false, 840, 1260, true),
('DEVICE_SUPPORT', 'Device Configuration Support', 'technical', 'troubleshooting', 480, 'high', 'medium', false, 960, 1440, true),
('APN_SETUP', 'APN Configuration', 'technical', 'configuration', 240, 'medium', 'low', false, 480, 720, false),
('SIGNAL_ISSUE', 'Signal Quality Issue', 'technical', 'network', 360, 'medium', 'medium', false, 720, 1080, false),

-- Data Services
('DATA_USAGE', 'Data Usage Query', 'account', 'information', 40, 'low', 'low', false, 80, 160, false),
('DATA_SPEED_ISSUE', 'Data Speed Complaint', 'technical', 'network', 300, 'medium', 'medium', false, 600, 900, false),
('DATA_ADDON', 'Data Add-on Purchase', 'sales', 'transaction', 180, 'low', 'high', true, 360, 540, false),

-- Customer Support
('COMPLAINT_FILING', 'File Complaint', 'support', 'complaint', 480, 'high', 'critical', false, 960, 1440, true),
('COMPLIMENT', 'Customer Compliment', 'support', 'feedback', 120, 'low', 'low', false, 240, 480, false),
('SUGGESTION', 'Customer Suggestion', 'support', 'feedback', 180, 'low', 'low', false, 360, 540, false),
('ESCALATION', 'Issue Escalation', 'support', 'escalation', 300, 'high', 'high', false, 600, 900, true),

-- Information Services
('STORE_LOCATOR', 'Store Location', 'information', 'general', 60, 'low', 'low', false, 120, 240, false),
('HOURS_INFO', 'Business Hours', 'information', 'general', 30, 'low', 'low', false, 60, 120, false),
('GENERAL_INQUIRY', 'General Information', 'information', 'general', 90, 'low', 'low', false, 180, 360, false)
ON CONFLICT (interaction_code) DO NOTHING;

-- Insert Service Plans
INSERT INTO service_plans (plan_code, plan_name, plan_type, plan_category, monthly_fee, data_allowance_gb, voice_minutes, sms_allowance, validity_days) VALUES
-- Prepaid Plans
('PREP_BASIC_1GB', 'Prepaid Basic 1GB', 'combo', 'prepaid', 15.00, 1, 100, 100, 30),
('PREP_STANDARD_3GB', 'Prepaid Standard 3GB', 'combo', 'prepaid', 25.00, 3, 200, 200, 30),
('PREP_PREMIUM_5GB', 'Prepaid Premium 5GB', 'combo', 'prepaid', 35.00, 5, 300, 300, 30),
('PREP_UNLIMITED_10GB', 'Prepaid Unlimited 10GB', 'combo', 'prepaid', 50.00, 10, -1, -1, 30),

-- Postpaid Plans
('POST_STARTER_2GB', 'Postpaid Starter 2GB', 'combo', 'postpaid', 20.00, 2, -1, -1, 30),
('POST_STANDARD_5GB', 'Postpaid Standard 5GB', 'combo', 'postpaid', 35.00, 5, -1, -1, 30),
('POST_PREMIUM_10GB', 'Postpaid Premium 10GB', 'combo', 'postpaid', 50.00, 10, -1, -1, 30),
('POST_UNLIMITED_20GB', 'Postpaid Unlimited 20GB', 'combo', 'postpaid', 75.00, 20, -1, -1, 30),
('POST_ENTERPRISE_50GB', 'Postpaid Enterprise 50GB', 'combo', 'postpaid', 120.00, 50, -1, -1, 30),

-- Data Only Plans
('DATA_1GB', 'Data Only 1GB', 'data', 'prepaid', 10.00, 1, 0, 0, 30),
('DATA_5GB', 'Data Only 5GB', 'data', 'prepaid', 30.00, 5, 0, 0, 30),
('DATA_UNLIMITED', 'Data Unlimited', 'data', 'postpaid', 60.00, -1, 0, 0, 30),

-- Add-on Plans
('ADDON_DATA_1GB', 'Data Add-on 1GB', 'addon', 'prepaid', 8.00, 1, 0, 0, 30),
('ADDON_DATA_3GB', 'Data Add-on 3GB', 'addon', 'prepaid', 20.00, 3, 0, 0, 30),
('ADDON_VOICE_100MIN', 'Voice Add-on 100min', 'addon', 'prepaid', 5.00, 0, 100, 0, 30),
('ADDON_SMS_100', 'SMS Add-on 100', 'addon', 'prepaid', 3.00, 0, 0, 100, 30),
('ADDON_ROAMING_BASIC', 'Roaming Basic', 'addon', 'prepaid', 15.00, 0, 50, 50, 7),
('ADDON_ROAMING_PREMIUM', 'Roaming Premium', 'addon', 'prepaid', 35.00, 2, 200, 200, 7)
ON CONFLICT (plan_code) DO NOTHING;

-- Insert Agents with realistic distribution
INSERT INTO agents (agent_code, agent_name, agent_type, specialization, skill_level, max_concurrent_chats, languages_supported, total_interactions_handled, avg_handling_time_seconds, customer_satisfaction_avg, escalation_rate, first_contact_resolution_rate, work_schedule, current_status) VALUES
-- Bot Agents
('BOT_GENERAL_001', 'General Assistant Bot', 'bot', 'general', 'expert', 100, ARRAY['es', 'en'], 0, 45.0, 4.2, 0.15, 0.85, '{"hours": "24/7", "timezone": "UTC"}'::jsonb, 'available'),
('BOT_BILLING_001', 'Billing Support Bot', 'bot', 'billing', 'expert', 150, ARRAY['es', 'en'], 0, 60.0, 4.0, 0.25, 0.75, '{"hours": "24/7", "timezone": "UTC"}'::jsonb, 'available'),
('BOT_TECHNICAL_001', 'Technical Support Bot', 'bot', 'technical', 'senior', 75, ARRAY['es', 'en'], 0, 120.0, 3.8, 0.40, 0.60, '{"hours": "24/7", "timezone": "UTC"}'::jsonb, 'available'),
('BOT_SALES_001', 'Sales Assistant Bot', 'bot', 'sales', 'senior', 200, ARRAY['es', 'en'], 0, 90.0, 4.1, 0.20, 0.80, '{"hours": "24/7", "timezone": "UTC"}'::jsonb, 'available'),

-- Human Agents - R9 Region
('HUMAN_R9_001', 'María González', 'human', 'general', 'senior', 3, ARRAY['es', 'en'], 0, 180.0, 4.5, 0.05, 0.90, '{"hours": "08:00-17:00", "timezone": "America/Mexico_City"}'::jsonb, 'available'),
('HUMAN_R9_002', 'Carlos Rodríguez', 'human', 'technical', 'expert', 2, ARRAY['es', 'en'], 0, 240.0, 4.6, 0.03, 0.92, '{"hours": "08:00-17:00", "timezone": "America/Mexico_City"}'::jsonb, 'available'),
('HUMAN_R9_003', 'Ana López', 'human', 'billing', 'senior', 4, ARRAY['es'], 0, 150.0, 4.4, 0.06, 0.88, '{"hours": "09:00-18:00", "timezone": "America/Mexico_City"}'::jsonb, 'available'),
('HUMAN_R9_004', 'Roberto Silva', 'human', 'sales', 'junior', 3, ARRAY['es', 'en'], 0, 200.0, 4.2, 0.08, 0.85, '{"hours": "10:00-19:00", "timezone": "America/Mexico_City"}'::jsonb, 'available'),
('HUMAN_R9_005', 'Patricia Morales', 'human', 'general', 'expert', 2, ARRAY['es', 'en'], 0, 160.0, 4.7, 0.02, 0.95, '{"hours": "07:00-16:00", "timezone": "America/Mexico_City"}'::jsonb, 'available'),

-- Human Agents - DEUR Region  
('HUMAN_DEUR_001', 'Laura Martínez', 'human', 'general', 'senior', 3, ARRAY['es', 'en'], 0, 170.0, 4.5, 0.05, 0.90, '{"hours": "08:00-17:00", "timezone": "Europe/Madrid"}'::jsonb, 'available'),
('HUMAN_DEUR_002', 'Diego Fernández', 'human', 'technical', 'expert', 2, ARRAY['es', 'en'], 0, 220.0, 4.6, 0.04, 0.91, '{"hours": "09:00-18:00", "timezone": "Europe/Madrid"}'::jsonb, 'available'),
('HUMAN_DEUR_003', 'Carmen Jiménez', 'human', 'billing', 'senior', 4, ARRAY['es', 'en'], 0, 140.0, 4.4, 0.06, 0.89, '{"hours": "08:00-17:00", "timezone": "Europe/Madrid"}'::jsonb, 'available'),
('HUMAN_DEUR_004', 'Miguel Torres', 'human', 'sales', 'senior', 3, ARRAY['es', 'en'], 0, 190.0, 4.3, 0.07, 0.86, '{"hours": "10:00-19:00", "timezone": "Europe/Madrid"}'::jsonb, 'available'),

-- Supervisors
('SUPERVISOR_R9_001', 'Alejandra Vega', 'supervisor', 'general', 'expert', 1, ARRAY['es', 'en'], 0, 300.0, 4.8, 0.01, 0.98, '{"hours": "08:00-17:00", "timezone": "America/Mexico_City"}'::jsonb, 'available'),
('SUPERVISOR_DEUR_001', 'Fernando Castro', 'supervisor', 'general', 'expert', 1, ARRAY['es', 'en'], 0, 280.0, 4.8, 0.01, 0.97, '{"hours": "08:00-17:00", "timezone": "Europe/Madrid"}'::jsonb, 'available')
ON CONFLICT (agent_code) DO NOTHING;

-- Insert Knowledge Base Articles
INSERT INTO knowledge_base (kb_code, title, content, category, tags, language, confidence_score, usage_count, success_rate) VALUES
('KB_BALANCE_001', 'Cómo consultar tu saldo', 'Para consultar tu saldo puedes: 1) Marcar *123# desde tu móvil, 2) Usar la app móvil, 3) Enviar SMS con SALDO al 123', 'account', ARRAY['saldo', 'balance', 'consulta'], 'es', 0.95, 0, 0.92),
('KB_BALANCE_002', 'How to check your balance', 'To check your balance you can: 1) Dial *123# from your mobile, 2) Use the mobile app, 3) Send SMS with BALANCE to 123', 'account', ARRAY['balance', 'check', 'query'], 'en', 0.95, 0, 0.92),
('KB_PAYMENT_001', 'Métodos de pago disponibles', 'Puedes pagar tu factura mediante: tarjeta de crédito/débito, transferencia bancaria, efectivo en tiendas autorizadas, domiciliación bancaria', 'billing', ARRAY['pago', 'factura', 'métodos'], 'es', 0.90, 0, 0.88),
('KB_PAYMENT_002', 'Available payment methods', 'You can pay your bill through: credit/debit card, bank transfer, cash at authorized stores, direct debit', 'billing', ARRAY['payment', 'bill', 'methods'], 'en', 0.90, 0, 0.88),
('KB_TOPUP_001', 'Cómo recargar tu línea', 'Para recargar: 1) Compra una tarjeta de recarga, 2) Marca *134*código# , 3) Usa la app móvil, 4) Recarga online', 'account', ARRAY['recarga', 'topup', 'saldo'], 'es', 0.93, 0, 0.90),
('KB_NETWORK_001', 'Problemas de señal - Soluciones', 'Si tienes problemas de señal: 1) Reinicia tu móvil, 2) Verifica la cobertura en tu zona, 3) Actualiza configuración de red', 'technical', ARRAY['señal', 'red', 'cobertura'], 'es', 0.85, 0, 0.82),
('KB_APN_001', 'Configuración APN', 'Configuración APN: Nombre: internet, APN: internet.carrier.com, Usuario: (vacío), Contraseña: (vacío)', 'technical', ARRAY['apn', 'configuración', 'internet'], 'es', 0.88, 0, 0.85),
('KB_ROAMING_001', 'Activar servicio de roaming', 'Para activar roaming: 1) Envía SMS ROAMING SI al 123, 2) Llama al *611, 3) Actívalo desde la app móvil', 'sales', ARRAY['roaming', 'internacional', 'activar'], 'es', 0.87, 0, 0.84),
('KB_PLAN_CHANGE_001', 'Cambio de plan', 'Para cambiar tu plan: 1) Revisa planes disponibles, 2) Contacta atención al cliente, 3) Confirma el cambio', 'account', ARRAY['plan', 'cambio', 'tarifa'], 'es', 0.82, 0, 0.78),
('KB_SIM_REPLACEMENT_001', 'Reposición de SIM', 'Para reponer tu SIM: 1) Reporta el robo/pérdida, 2) Acude a una tienda con identificación, 3) Paga la tarifa de reposición', 'technical', ARRAY['sim', 'reposición', 'robo'], 'es', 0.80, 0, 0.75)
ON CONFLICT (kb_code) DO NOTHING;

-- Insert Survey Templates
INSERT INTO survey_templates (template_name, template_type, questions, trigger_conditions) VALUES
('Post-Interaction CSAT', 'csat', 
 '[{"question": "¿Qué tan satisfecho estás con la atención recibida?", "type": "rating", "scale": 5, "labels": ["Muy insatisfecho", "Insatisfecho", "Neutral", "Satisfecho", "Muy satisfecho"]}]'::jsonb,
 '{"trigger": "interaction_end", "conditions": {"interaction_status": "completed"}}'::jsonb),
('Customer Effort Score', 'ces',
 '[{"question": "¿Qué tan fácil fue resolver tu consulta?", "type": "rating", "scale": 7, "labels": ["Muy difícil", "Difícil", "Algo difícil", "Neutral", "Algo fácil", "Fácil", "Muy fácil"]}]'::jsonb,
 '{"trigger": "interaction_end", "conditions": {"interaction_mode": "live_chat"}}'::jsonb),
('Monthly NPS Survey', 'nps',
 '[{"question": "¿Qué probabilidad hay de que recomiendes nuestro servicio?", "type": "rating", "scale": 10, "labels": ["0 - Nada probable", "10 - Muy probable"]}]'::jsonb,
 '{"trigger": "monthly", "conditions": {"min_interactions": 2}}'::jsonb),
('Bot Satisfaction', 'csat',
 '[{"question": "¿El asistente virtual resolvió tu consulta?", "type": "rating", "scale": 5, "labels": ["No, para nada", "Parcialmente", "Neutral", "Sí, en su mayoría", "Sí, completamente"]}]'::jsonb,
 '{"trigger": "interaction_end", "conditions": {"interaction_mode": "bot"}}'::jsonb)
ON CONFLICT (template_name) DO NOTHING;

-- Insert Performance Thresholds
INSERT INTO performance_thresholds (metric_name, metric_category, warning_threshold, critical_threshold, target_value, channel_id, customer_segment) VALUES
('success_rate', 'quality', 0.85, 0.75, 0.95, NULL, NULL),
('escalation_rate', 'efficiency', 0.25, 0.35, 0.15, NULL, NULL),
('avg_duration_seconds', 'efficiency', 300.0, 450.0, 180.0, NULL, NULL),
('customer_satisfaction_avg', 'quality', 3.5, 3.0, 4.5, NULL, NULL),
('first_contact_resolution_rate', 'quality', 0.80, 0.70, 0.90, NULL, NULL),
('bot_automation_rate', 'efficiency', 0.60, 0.50, 0.80, NULL, NULL),
('queue_time_seconds', 'efficiency', 60.0, 120.0, 30.0, NULL, NULL),
('utilization_rate', 'capacity', 0.85, 0.95, 0.75, NULL, NULL)
ON CONFLICT (metric_name, metric_category) DO NOTHING;

-- Display summary of inserted data
SELECT 'Baseline Data Summary' as summary;
SELECT 'Channels' as table_name, COUNT(*) as records FROM channels
UNION ALL
SELECT 'Interaction Types', COUNT(*) FROM interaction_types
UNION ALL
SELECT 'Service Plans', COUNT(*) FROM service_plans
UNION ALL
SELECT 'Agents', COUNT(*) FROM agents
UNION ALL
SELECT 'Knowledge Base', COUNT(*) FROM knowledge_base
UNION ALL
SELECT 'Survey Templates', COUNT(*) FROM survey_templates
UNION ALL
SELECT 'Performance Thresholds', COUNT(*) FROM performance_thresholds
ORDER BY table_name;
