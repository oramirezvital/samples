-- Device Inventory Data
-- This file creates a realistic inventory of mobile devices

-- Function to generate random IMEI numbers
CREATE OR REPLACE FUNCTION generate_imei() RETURNS VARCHAR(20) AS $$
DECLARE
    imei VARCHAR(20);
BEGIN
    -- Generate a 15-digit IMEI (simplified format)
    imei := LPAD((RANDOM() * 999999999999999)::BIGINT::TEXT, 15, '0');
    RETURN imei;
END;
$$ LANGUAGE plpgsql;

-- Insert devices with realistic models and manufacturers
DO $$
DECLARE
    device_models TEXT[] := ARRAY[
        'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13',
        'Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54', 'Samsung Galaxy A34',
        'Google Pixel 8 Pro', 'Google Pixel 8', 'Google Pixel 7a',
        'OnePlus 12', 'OnePlus 11', 'Xiaomi 14', 'Xiaomi 13T',
        'iPad Pro 12.9', 'iPad Air', 'Samsung Galaxy Tab S9', 'Surface Pro 9',
        'IoT Sensor Module', 'Fleet Tracker Pro', 'Smart Meter Device'
    ];
    
    manufacturers TEXT[] := ARRAY[
        'Apple', 'Apple', 'Apple', 'Apple', 'Apple',
        'Samsung', 'Samsung', 'Samsung', 'Samsung',
        'Google', 'Google', 'Google',
        'OnePlus', 'OnePlus', 'Xiaomi', 'Xiaomi',
        'Apple', 'Apple', 'Samsung', 'Microsoft',
        'Generic', 'TechTrack', 'SmartTech'
    ];
    
    device_types TEXT[] := ARRAY[
        'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE',
        'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE',
        'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE',
        'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE', 'SMARTPHONE',
        'TABLET', 'TABLET', 'TABLET', 'TABLET',
        'IOT_DEVICE', 'IOT_DEVICE', 'IOT_DEVICE'
    ];
    
    i INTEGER;
    model_idx INTEGER;
    purchase_date_val DATE;
    warranty_date_val DATE;
    status_val TEXT;
    status_options TEXT[] := ARRAY['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'DAMAGED'];
BEGIN
    -- Generate 5000 devices
    FOR i IN 1..5000 LOOP
        model_idx := (RANDOM() * (array_length(device_models, 1) - 1) + 1)::INTEGER;
        
        -- Random purchase date within last 3 years
        purchase_date_val := CURRENT_DATE - (RANDOM() * 1095)::INTEGER;
        
        -- Warranty typically 1-2 years from purchase
        warranty_date_val := purchase_date_val + (365 + RANDOM() * 365)::INTEGER;
        
        -- Most devices are active
        status_val := status_options[(RANDOM() * (array_length(status_options, 1) - 1) + 1)::INTEGER];
        
        INSERT INTO devices (
            device_imei,
            device_model,
            device_manufacturer,
            device_type,
            purchase_date,
            warranty_expiry,
            status
        ) VALUES (
            generate_imei(),
            device_models[model_idx],
            manufacturers[model_idx],
            device_types[model_idx],
            purchase_date_val,
            warranty_date_val,
            status_val
        );
        
        -- Progress indicator
        IF i % 1000 = 0 THEN
            RAISE NOTICE 'Generated % devices...', i;
        END IF;
    END LOOP;
END $$;

-- Clean up the function
DROP FUNCTION generate_imei();

-- Update some devices to be retired or lost (realistic scenarios)
UPDATE devices 
SET status = 'RETIRED' 
WHERE purchase_date < CURRENT_DATE - INTERVAL '2 years' 
AND RANDOM() < 0.05;

UPDATE devices 
SET status = 'LOST' 
WHERE RANDOM() < 0.02;

-- Verify the data
SELECT 'Total devices created: ' || COUNT(*) as result FROM devices;

SELECT 
    device_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM devices), 1) as percentage
FROM devices 
GROUP BY device_type 
ORDER BY count DESC;

SELECT 
    status,
    COUNT(*) as count
FROM devices 
GROUP BY status 
ORDER BY count DESC;

SELECT 'Sample devices:' as info;
SELECT device_model, device_manufacturer, device_type, status 
FROM devices 
LIMIT 10;
