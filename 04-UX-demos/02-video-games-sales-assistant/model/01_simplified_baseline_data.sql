-- Simplified Baseline Data for Customer Care Analytics
-- Populate reference/catalog tables with essential data

-- 1. Insert Channels
INSERT INTO channels (channel_name, channel_type) VALUES
('Phone', 'Voice'),
('Email', 'Digital'),
('Web Chat', 'Digital'),
('Mobile App', 'Digital'),
('WhatsApp', 'Digital'),
('In-Store', 'In-Person'),
('Social Media', 'Digital'),
('SMS', 'Digital');

-- 2. Insert Interaction Types
INSERT INTO interaction_types (interaction_code, interaction_name, category, priority_level) VALUES
('BILLING', 'Billing Inquiry', 'Billing', 'Medium'),
('TECH_SUPPORT', 'Technical Support', 'Technical', 'High'),
('PLAN_CHANGE', 'Plan Change Request', 'Account', 'Medium'),
('COMPLAINT', 'Service Complaint', 'Support', 'High'),
('NEW_SERVICE', 'New Service Request', 'Sales', 'Medium'),
('PAYMENT', 'Payment Issue', 'Billing', 'High'),
('CANCELLATION', 'Service Cancellation', 'Account', 'Critical'),
('INFO_REQUEST', 'General Information', 'Support', 'Low'),
('ROAMING', 'Roaming Services', 'Technical', 'Medium'),
('DATA_ISSUE', 'Data Connection Problem', 'Technical', 'High'),
('DEVICE_SUPPORT', 'Device Support', 'Technical', 'Medium'),
('PROMOTION', 'Promotion Inquiry', 'Sales', 'Low');

-- 3. Insert Service Plans
INSERT INTO service_plans (plan_name, plan_type, monthly_fee, data_allowance_gb, voice_minutes, sms_allowance) VALUES
('Basic Mobile', 'Prepaid', 15.00, 2, 100, 50),
('Standard Mobile', 'Postpaid', 25.00, 5, 300, 100),
('Premium Mobile', 'Postpaid', 45.00, 15, 1000, 500),
('Unlimited Pro', 'Postpaid', 65.00, 50, 2000, 1000),
('Family Plan', 'Postpaid', 85.00, 25, 1500, 750),
('Business Basic', 'Business', 35.00, 10, 500, 200),
('Business Pro', 'Business', 55.00, 30, 1200, 600),
('Student Plan', 'Prepaid', 20.00, 8, 200, 100),
('Senior Plan', 'Postpaid', 30.00, 3, 400, 150),
('Data Only', 'Postpaid', 40.00, 20, 0, 0);

-- 4. Insert Sample Agents
INSERT INTO agents (agent_name, employee_id, department, skill_level, hire_date) VALUES
('María González', 'EMP001', 'Customer Service', 'Senior', '2022-01-15'),
('Carlos Rodríguez', 'EMP002', 'Technical Support', 'Expert', '2021-03-10'),
('Ana Martínez', 'EMP003', 'Billing', 'Senior', '2022-06-20'),
('Luis Hernández', 'EMP004', 'Customer Service', 'Junior', '2023-02-01'),
('Carmen López', 'EMP005', 'Technical Support', 'Senior', '2021-11-12'),
('Roberto Silva', 'EMP006', 'Sales', 'Expert', '2020-08-05'),
('Patricia Morales', 'EMP007', 'Customer Service', 'Senior', '2022-04-18'),
('Diego Vargas', 'EMP008', 'Technical Support', 'Junior', '2023-01-10'),
('Isabel Ruiz', 'EMP009', 'Billing', 'Expert', '2021-07-22'),
('Fernando Castro', 'EMP010', 'Customer Service', 'Senior', '2022-09-14'),
('Sofía Jiménez', 'EMP011', 'Technical Support', 'Senior', '2021-12-03'),
('Andrés Peña', 'EMP012', 'Sales', 'Junior', '2023-03-15');

-- 5. Insert Sample Customers
INSERT INTO customers (customer_name, email, phone, customer_segment, status) VALUES
('Juan Pérez', 'juan.perez@email.com', '+52-555-0001', 'Standard', 'Active'),
('María García', 'maria.garcia@email.com', '+52-555-0002', 'Premium', 'Active'),
('Carlos López', 'carlos.lopez@email.com', '+52-555-0003', 'Basic', 'Active'),
('Ana Rodríguez', 'ana.rodriguez@email.com', '+52-555-0004', 'Standard', 'Active'),
('Luis Martínez', 'luis.martinez@email.com', '+52-555-0005', 'Premium', 'Active'),
('Carmen Hernández', 'carmen.hernandez@email.com', '+52-555-0006', 'Basic', 'Active'),
('Roberto González', 'roberto.gonzalez@email.com', '+52-555-0007', 'Standard', 'Active'),
('Patricia Silva', 'patricia.silva@email.com', '+52-555-0008', 'Premium', 'Active'),
('Diego Morales', 'diego.morales@email.com', '+52-555-0009', 'Basic', 'Active'),
('Isabel Vargas', 'isabel.vargas@email.com', '+52-555-0010', 'Standard', 'Active');

-- 6. Insert Sample Customer Service Plans
INSERT INTO customer_service_plans (customer_id, service_plan_id, start_date, is_active) VALUES
(1, 2, '2023-01-01', TRUE),  -- Juan Pérez - Standard Mobile
(2, 4, '2023-01-15', TRUE),  -- María García - Unlimited Pro
(3, 1, '2023-02-01', TRUE),  -- Carlos López - Basic Mobile
(4, 3, '2023-02-15', TRUE),  -- Ana Rodríguez - Premium Mobile
(5, 5, '2023-03-01', TRUE),  -- Luis Martínez - Family Plan
(6, 1, '2023-03-15', TRUE),  -- Carmen Hernández - Basic Mobile
(7, 2, '2023-04-01', TRUE),  -- Roberto González - Standard Mobile
(8, 4, '2023-04-15', TRUE),  -- Patricia Silva - Unlimited Pro
(9, 8, '2023-05-01', TRUE),  -- Diego Morales - Student Plan
(10, 3, '2023-05-15', TRUE); -- Isabel Vargas - Premium Mobile

-- Display summary of inserted data
SELECT 'Baseline data inserted successfully!' as status;

SELECT 'Channels' as table_name, COUNT(*) as record_count FROM channels
UNION ALL
SELECT 'Interaction Types', COUNT(*) FROM interaction_types
UNION ALL
SELECT 'Service Plans', COUNT(*) FROM service_plans
UNION ALL
SELECT 'Agents', COUNT(*) FROM agents
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Customer Service Plans', COUNT(*) FROM customer_service_plans
ORDER BY table_name;
