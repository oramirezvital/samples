-- Service Lines Data
-- This file creates service lines for enterprises with realistic distribution

-- Function to generate phone numbers
CREATE OR REPLACE FUNCTION generate_phone_number() RETURNS VARCHAR(20) AS $$
DECLARE
    area_codes INTEGER[] := ARRAY[212, 213, 214, 215, 216, 312, 313, 314, 315, 404, 415, 512, 602, 617, 713, 714, 718, 773, 818, 972];
    area_code INTEGER;
    exchange INTEGER;
    number INTEGER;
BEGIN
    area_code := area_codes[(RANDOM() * (array_length(area_codes, 1) - 1) + 1)::INTEGER];
    exchange := (RANDOM() * 899 + 100)::INTEGER; -- 100-999
    number := (RANDOM() * 9999)::INTEGER; -- 0000-9999
    
    RETURN '+1-' || area_code || '-' || LPAD(exchange::TEXT, 3, '0') || '-' || LPAD(number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate SIM card numbers
CREATE OR REPLACE FUNCTION generate_sim_number() RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN 'SIM' || LPAD((RANDOM() * 9999999999999999)::BIGINT::TEXT, 16, '0');
END;
$$ LANGUAGE plpgsql;

-- Create service lines with realistic distribution across enterprises
DO $$
DECLARE
    enterprise_rec RECORD;
    bundle_ids INTEGER[];
    device_ids INTEGER[];
    lines_per_enterprise INTEGER;
    i INTEGER;
    j INTEGER;
    total_lines INTEGER := 0;
    
    first_names TEXT[] := ARRAY[
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
        'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
        'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
        'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
        'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
        'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah',
        'Timothy', 'Dorothy', 'Ronald', 'Lisa', 'Jason', 'Nancy', 'Edward', 'Karen'
    ];
    
    last_names TEXT[] := ARRAY[
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
        'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
        'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
        'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell'
    ];
    
    departments TEXT[] := ARRAY[
        'Sales', 'Marketing', 'Engineering', 'Operations', 'Finance', 'HR', 'IT',
        'Customer Service', 'Legal', 'Procurement', 'Quality Assurance', 'Research',
        'Administration', 'Security', 'Facilities', 'Training'
    ];
    
    first_name TEXT;
    last_name TEXT;
    employee_name TEXT;
    employee_email TEXT;
    department TEXT;
    bundle_id INTEGER;
    device_id INTEGER;
    activation_date DATE;
    generated_phone TEXT;
    sim_number TEXT;
    status_val TEXT;
    status_options TEXT[] := ARRAY['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'SUSPENDED', 'TERMINATED'];
BEGIN
    -- Get available bundle and device IDs
    SELECT ARRAY_AGG(b.bundle_id) INTO bundle_ids FROM bundles b WHERE b.status = 'ACTIVE';
    SELECT ARRAY_AGG(d.device_id) INTO device_ids FROM devices d WHERE d.status = 'ACTIVE';
    
    -- Create lines for each enterprise
    FOR enterprise_rec IN SELECT enterprise_id, enterprise_name FROM enterprises WHERE status = 'ACTIVE' LOOP
        -- Determine number of lines per enterprise (varying sizes)
        CASE 
            WHEN enterprise_rec.enterprise_id <= 3 THEN 
                lines_per_enterprise := (RANDOM() * 1500 + 1000)::INTEGER; -- Large enterprises
            WHEN enterprise_rec.enterprise_id <= 8 THEN 
                lines_per_enterprise := (RANDOM() * 800 + 500)::INTEGER; -- Medium enterprises
            ELSE 
                lines_per_enterprise := (RANDOM() * 400 + 200)::INTEGER; -- Smaller enterprises
        END CASE;
        
        RAISE NOTICE 'Creating % lines for %...', lines_per_enterprise, enterprise_rec.enterprise_name;
        
        FOR i IN 1..lines_per_enterprise LOOP
            -- Generate employee details
            first_name := first_names[(RANDOM() * (array_length(first_names, 1) - 1) + 1)::INTEGER];
            last_name := last_names[(RANDOM() * (array_length(last_names, 1) - 1) + 1)::INTEGER];
            employee_name := first_name || ' ' || last_name;
            employee_email := LOWER(first_name || '.' || last_name || '@' || REPLACE(LOWER(enterprise_rec.enterprise_name), ' ', '') || '.com');
            department := departments[(RANDOM() * (array_length(departments, 1) - 1) + 1)::INTEGER];
            
            -- Select random bundle and device
            bundle_id := bundle_ids[(RANDOM() * (array_length(bundle_ids, 1) - 1) + 1)::INTEGER];
            device_id := device_ids[(RANDOM() * (array_length(device_ids, 1) - 1) + 1)::INTEGER];
            
            -- Generate activation date (within last 2 years)
            activation_date := CURRENT_DATE - (RANDOM() * 730)::INTEGER;
            
            -- Generate unique phone and SIM numbers
            LOOP
                generated_phone := generate_phone_number();
                EXIT WHEN NOT EXISTS (SELECT 1 FROM lines l WHERE l.phone_number = generated_phone);
            END LOOP;
            
            LOOP
                sim_number := generate_sim_number();
                EXIT WHEN NOT EXISTS (SELECT 1 FROM lines WHERE sim_card_number = sim_number);
            END LOOP;
            
            -- Most lines are active
            status_val := status_options[(RANDOM() * (array_length(status_options, 1) - 1) + 1)::INTEGER];
            
            INSERT INTO lines (
                enterprise_id,
                bundle_id,
                device_id,
                phone_number,
                sim_card_number,
                employee_name,
                employee_email,
                department,
                activation_date,
                status
            ) VALUES (
                enterprise_rec.enterprise_id,
                bundle_id,
                device_id,
                generated_phone,
                sim_number,
                employee_name,
                employee_email,
                department,
                activation_date,
                status_val
            );
            
            total_lines := total_lines + 1;
            
            -- Progress indicator
            IF total_lines % 2000 = 0 THEN
                RAISE NOTICE 'Total lines created so far: %', total_lines;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Total lines created: %', total_lines;
END $$;

-- Clean up functions
DROP FUNCTION generate_phone_number();
DROP FUNCTION generate_sim_number();

-- Add some terminated lines with deactivation dates
UPDATE lines 
SET deactivation_date = activation_date + (RANDOM() * 365)::INTEGER,
    status = 'TERMINATED'
WHERE status = 'TERMINATED';

-- Verify the data
SELECT 'Total lines created: ' || COUNT(*) as result FROM lines;

SELECT 
    e.enterprise_name,
    COUNT(l.line_id) as total_lines,
    COUNT(CASE WHEN l.status = 'ACTIVE' THEN 1 END) as active_lines
FROM enterprises e
LEFT JOIN lines l ON e.enterprise_id = l.enterprise_id
GROUP BY e.enterprise_id, e.enterprise_name
ORDER BY total_lines DESC;

SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM lines), 1) as percentage
FROM lines 
GROUP BY status 
ORDER BY count DESC;

SELECT 'Sample lines:' as info;
SELECT 
    l.phone_number,
    l.employee_name,
    l.department,
    e.enterprise_name,
    b.bundle_name,
    l.status
FROM lines l
JOIN enterprises e ON l.enterprise_id = e.enterprise_id
JOIN bundles b ON l.bundle_id = b.bundle_id
LIMIT 10;
