-- Foundation Data: Enterprises and Service Bundles
-- This file creates the base enterprises and service bundles

-- Insert enterprises (B2B customers)
INSERT INTO enterprises (enterprise_name, industry, contact_person, contact_email, contact_phone, billing_address, status) VALUES
('TechCorp Solutions', 'Technology', 'John Smith', 'john.smith@techcorp.com', '+1-555-0101', '123 Tech Street, San Francisco, CA 94105', 'ACTIVE'),
('Global Manufacturing Inc', 'Manufacturing', 'Sarah Johnson', 'sarah.johnson@globalmfg.com', '+1-555-0102', '456 Industrial Blvd, Detroit, MI 48201', 'ACTIVE'),
('HealthCare Partners', 'Healthcare', 'Dr. Michael Brown', 'michael.brown@healthpartners.com', '+1-555-0103', '789 Medical Center Dr, Houston, TX 77030', 'ACTIVE'),
('Financial Services Group', 'Finance', 'Emily Davis', 'emily.davis@finservices.com', '+1-555-0104', '321 Wall Street, New York, NY 10005', 'ACTIVE'),
('Retail Chain Corp', 'Retail', 'David Wilson', 'david.wilson@retailchain.com', '+1-555-0105', '654 Commerce Ave, Chicago, IL 60601', 'ACTIVE'),
('Construction Dynamics', 'Construction', 'Lisa Martinez', 'lisa.martinez@constructiondyn.com', '+1-555-0106', '987 Builder Lane, Phoenix, AZ 85001', 'ACTIVE'),
('Education Solutions', 'Education', 'Robert Taylor', 'robert.taylor@edusolutions.com', '+1-555-0107', '147 Campus Drive, Boston, MA 02101', 'ACTIVE'),
('Transportation Logistics', 'Transportation', 'Jennifer Anderson', 'jennifer.anderson@translogistics.com', '+1-555-0108', '258 Freight Road, Atlanta, GA 30301', 'ACTIVE'),
('Energy Systems Ltd', 'Energy', 'Christopher Thomas', 'christopher.thomas@energysystems.com', '+1-555-0109', '369 Power Plant Way, Dallas, TX 75201', 'ACTIVE'),
('Media & Entertainment Co', 'Media', 'Amanda Jackson', 'amanda.jackson@mediaent.com', '+1-555-0110', '741 Studio Boulevard, Los Angeles, CA 90210', 'ACTIVE'),
('Agricultural Services', 'Agriculture', 'Mark White', 'mark.white@agriservices.com', '+1-555-0111', '852 Farm Road, Des Moines, IA 50301', 'ACTIVE'),
('Hospitality Group', 'Hospitality', 'Michelle Harris', 'michelle.harris@hospitalitygroup.com', '+1-555-0112', '963 Hotel Avenue, Las Vegas, NV 89101', 'ACTIVE'),
('Legal Associates', 'Legal', 'James Clark', 'james.clark@legalassoc.com', '+1-555-0113', '159 Law Street, Washington, DC 20001', 'ACTIVE'),
('Consulting Partners', 'Consulting', 'Karen Lewis', 'karen.lewis@consultpartners.com', '+1-555-0114', '357 Advisory Lane, Seattle, WA 98101', 'ACTIVE'),
('Real Estate Holdings', 'Real Estate', 'Steven Walker', 'steven.walker@realestateholdings.com', '+1-555-0115', '468 Property Plaza, Miami, FL 33101', 'ACTIVE');

-- Insert service bundles (plans)
INSERT INTO bundles (bundle_name, bundle_description, voice_minutes, data_gb, sms_count, price_per_line, overage_voice_rate, overage_data_rate, overage_sms_rate, status) VALUES
('Basic Business', 'Essential plan for basic business needs', 500, 2, 200, 25.00, 0.05, 0.10, 0.02, 'ACTIVE'),
('Professional', 'Enhanced plan for growing businesses', 1000, 5, 500, 45.00, 0.04, 0.08, 0.015, 'ACTIVE'),
('Enterprise Standard', 'Comprehensive plan for medium enterprises', 2000, 10, 1000, 75.00, 0.03, 0.06, 0.01, 'ACTIVE'),
('Enterprise Premium', 'Premium plan with high allowances', 5000, 25, 2500, 125.00, 0.025, 0.05, 0.008, 'ACTIVE'),
('Unlimited Business', 'Unlimited voice and text with high data', -1, 50, -1, 175.00, 0.00, 0.04, 0.00, 'ACTIVE'),
('Data Intensive', 'High data plan for data-heavy operations', 1500, 100, 1000, 200.00, 0.03, 0.03, 0.01, 'ACTIVE'),
('International Plus', 'Includes international roaming benefits', 2000, 15, 1500, 95.00, 0.02, 0.07, 0.005, 'ACTIVE'),
('IoT Device Plan', 'Specialized plan for IoT and M2M devices', 100, 1, 50, 15.00, 0.10, 0.15, 0.05, 'ACTIVE');

-- Verify the data was inserted
SELECT 'Enterprises inserted: ' || COUNT(*) as result FROM enterprises;
SELECT 'Bundles inserted: ' || COUNT(*) as result FROM bundles;

-- Show sample data
SELECT 'Sample Enterprises:' as info;
SELECT enterprise_name, industry, contact_person FROM enterprises LIMIT 5;

SELECT 'Sample Bundles:' as info;
SELECT bundle_name, price_per_line, data_gb, voice_minutes FROM bundles ORDER BY price_per_line;
