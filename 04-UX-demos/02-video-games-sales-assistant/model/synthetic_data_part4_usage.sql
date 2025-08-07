-- Daily Usage Data
-- This file creates realistic daily usage patterns for all active lines over 90 days

-- Create usage data for the last 90 days
DO $$
DECLARE
    line_rec RECORD;
    current_date_iter DATE;
    end_date DATE := CURRENT_DATE;
    start_date DATE := CURRENT_DATE - INTERVAL '90 days';
    
    -- Usage pattern variables
    voice_base INTEGER;
    data_base INTEGER;
    sms_base INTEGER;
    
    voice_minutes INTEGER;
    voice_minutes_roaming INTEGER;
    data_mb INTEGER;
    data_mb_roaming INTEGER;
    sms_count INTEGER;
    sms_count_roaming INTEGER;
    
    -- Charge calculation variables
    voice_charges DECIMAL(8,2);
    data_charges DECIMAL(8,2);
    sms_charges DECIMAL(8,2);
    roaming_charges DECIMAL(8,2);
    total_charges DECIMAL(8,2);
    
    bundle_rec RECORD;
    is_weekend BOOLEAN;
    is_roaming BOOLEAN;
    usage_multiplier DECIMAL(3,2);
    
    total_records INTEGER := 0;
    processed_lines INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting usage data generation for % days...', (end_date - start_date);
    
    -- Loop through each active line
    FOR line_rec IN 
        SELECT l.line_id, l.bundle_id, l.activation_date, l.status
        FROM lines l 
        WHERE l.status = 'ACTIVE' 
        ORDER BY l.line_id
    LOOP
        processed_lines := processed_lines + 1;
        
        -- Get bundle information for this line
        SELECT * INTO bundle_rec FROM bundles WHERE bundle_id = line_rec.bundle_id;
        
        -- Set base usage patterns based on bundle type
        CASE 
            WHEN bundle_rec.bundle_name LIKE '%Basic%' THEN
                voice_base := 15; data_base := 50; sms_base := 5;
            WHEN bundle_rec.bundle_name LIKE '%Professional%' THEN
                voice_base := 25; data_base := 120; sms_base := 8;
            WHEN bundle_rec.bundle_name LIKE '%Enterprise%' THEN
                voice_base := 40; data_base := 250; sms_base := 12;
            WHEN bundle_rec.bundle_name LIKE '%Unlimited%' THEN
                voice_base := 60; data_base := 800; sms_base := 20;
            WHEN bundle_rec.bundle_name LIKE '%Data Intensive%' THEN
                voice_base := 30; data_base := 1500; sms_base := 10;
            WHEN bundle_rec.bundle_name LIKE '%International%' THEN
                voice_base := 35; data_base := 200; sms_base := 15;
            WHEN bundle_rec.bundle_name LIKE '%IoT%' THEN
                voice_base := 2; data_base := 10; sms_base := 1;
            ELSE
                voice_base := 20; data_base := 100; sms_base := 8;
        END CASE;
        
        -- Generate usage for each day
        current_date_iter := GREATEST(start_date, line_rec.activation_date);
        
        WHILE current_date_iter <= end_date LOOP
            -- Check if it's weekend (lower usage typically)
            is_weekend := EXTRACT(DOW FROM current_date_iter) IN (0, 6);
            
            -- Check if roaming (10% chance)
            is_roaming := RANDOM() < 0.1;
            
            -- Adjust usage based on day type
            IF is_weekend THEN
                usage_multiplier := 0.6 + RANDOM() * 0.4; -- 60-100% of weekday usage
            ELSE
                usage_multiplier := 0.8 + RANDOM() * 0.4; -- 80-120% of base usage
            END IF;
            
            -- Calculate daily usage with some randomness
            voice_minutes := (voice_base * usage_multiplier * (0.5 + RANDOM()))::INTEGER;
            data_mb := (data_base * usage_multiplier * (0.5 + RANDOM()))::INTEGER;
            sms_count := (sms_base * usage_multiplier * (0.3 + RANDOM()))::INTEGER;
            
            -- Add roaming usage if applicable
            IF is_roaming THEN
                voice_minutes_roaming := (voice_minutes * 0.2)::INTEGER;
                data_mb_roaming := (data_mb * 0.15)::INTEGER;
                sms_count_roaming := (sms_count * 0.1)::INTEGER;
            ELSE
                voice_minutes_roaming := 0;
                data_mb_roaming := 0;
                sms_count_roaming := 0;
            END IF;
            
            -- Calculate charges based on bundle limits and overage rates
            -- Voice charges
            IF bundle_rec.voice_minutes = -1 OR voice_minutes <= bundle_rec.voice_minutes THEN
                voice_charges := 0.00;
            ELSE
                voice_charges := (voice_minutes - bundle_rec.voice_minutes) * bundle_rec.overage_voice_rate;
            END IF;
            
            -- Data charges (convert MB to GB for comparison)
            IF data_mb <= (bundle_rec.data_gb * 1024) THEN
                data_charges := 0.00;
            ELSE
                data_charges := ((data_mb - bundle_rec.data_gb * 1024) / 1024.0) * bundle_rec.overage_data_rate;
            END IF;
            
            -- SMS charges
            IF bundle_rec.sms_count = -1 OR sms_count <= bundle_rec.sms_count THEN
                sms_charges := 0.00;
            ELSE
                sms_charges := (sms_count - bundle_rec.sms_count) * bundle_rec.overage_sms_rate;
            END IF;
            
            -- Roaming charges (premium rates)
            roaming_charges := voice_minutes_roaming * 0.25 + 
                             (data_mb_roaming / 1024.0) * 2.50 + 
                             sms_count_roaming * 0.15;
            
            total_charges := voice_charges + data_charges + sms_charges + roaming_charges;
            
            -- Insert the usage record
            INSERT INTO daily_usage (
                line_id,
                usage_date,
                voice_minutes,
                voice_minutes_roaming,
                data_mb,
                data_mb_roaming,
                sms_count,
                sms_count_roaming,
                voice_charges,
                data_charges,
                sms_charges,
                roaming_charges,
                total_charges
            ) VALUES (
                line_rec.line_id,
                current_date_iter,
                voice_minutes,
                voice_minutes_roaming,
                data_mb,
                data_mb_roaming,
                sms_count,
                sms_count_roaming,
                voice_charges,
                data_charges,
                sms_charges,
                roaming_charges,
                total_charges
            );
            
            total_records := total_records + 1;
            current_date_iter := current_date_iter + 1;
        END LOOP;
        
        -- Progress indicator
        IF processed_lines % 1000 = 0 THEN
            RAISE NOTICE 'Processed % lines, created % usage records...', processed_lines, total_records;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Usage data generation completed. Total records: %', total_records;
END $$;

-- Verify the data
SELECT 'Total usage records created: ' || COUNT(*) as result FROM daily_usage;

-- Usage summary by enterprise
SELECT 
    e.enterprise_name,
    COUNT(DISTINCT du.line_id) as lines_with_usage,
    COUNT(du.usage_id) as total_usage_records,
    ROUND(SUM(du.data_mb) / 1024.0, 2) as total_data_gb,
    SUM(du.voice_minutes) as total_voice_minutes,
    SUM(du.sms_count) as total_sms,
    ROUND(SUM(du.total_charges), 2) as total_usage_charges
FROM enterprises e
JOIN lines l ON e.enterprise_id = l.enterprise_id
JOIN daily_usage du ON l.line_id = du.line_id
GROUP BY e.enterprise_id, e.enterprise_name
ORDER BY total_data_gb DESC
LIMIT 10;

-- Usage patterns by day of week
SELECT 
    CASE EXTRACT(DOW FROM usage_date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_of_week,
    ROUND(AVG(voice_minutes), 1) as avg_voice_minutes,
    ROUND(AVG(data_mb), 1) as avg_data_mb,
    ROUND(AVG(sms_count), 1) as avg_sms_count,
    ROUND(AVG(total_charges), 2) as avg_charges
FROM daily_usage
GROUP BY EXTRACT(DOW FROM usage_date)
ORDER BY EXTRACT(DOW FROM usage_date);

-- Roaming usage summary
SELECT 
    'Lines with roaming usage: ' || COUNT(DISTINCT line_id) as result
FROM daily_usage 
WHERE voice_minutes_roaming > 0 OR data_mb_roaming > 0 OR sms_count_roaming > 0;

SELECT 
    'Total roaming charges: $' || ROUND(SUM(roaming_charges), 2) as result
FROM daily_usage;
