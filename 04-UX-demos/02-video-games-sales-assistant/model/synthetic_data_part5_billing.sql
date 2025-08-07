-- Billing Data
-- This file creates monthly billing statements for enterprises

-- Generate bills for the last 6 months
DO $$
DECLARE
    enterprise_rec RECORD;
    bill_month DATE;
    current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
    
    total_lines INTEGER;
    base_charges DECIMAL(12,2);
    overage_charges DECIMAL(12,2);
    taxes DECIMAL(12,2);
    total_amount DECIMAL(12,2);
    due_date DATE;
    paid_date DATE;
    bill_status TEXT;
    
    status_options TEXT[] := ARRAY['PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'OVERDUE', 'PENDING'];
    total_bills INTEGER := 0;
BEGIN
    RAISE NOTICE 'Generating billing data for last 6 months...';
    
    -- Loop through each enterprise
    FOR enterprise_rec IN 
        SELECT enterprise_id, enterprise_name 
        FROM enterprises 
        WHERE status = 'ACTIVE' 
        ORDER BY enterprise_id
    LOOP
        -- Generate bills for last 6 months
        FOR i IN 0..5 LOOP
            bill_month := current_month - (i || ' months')::INTERVAL;
            
            -- Count active lines for this enterprise in this billing period
            SELECT COUNT(*) INTO total_lines
            FROM lines l
            WHERE l.enterprise_id = enterprise_rec.enterprise_id
            AND l.status = 'ACTIVE'
            AND l.activation_date <= (bill_month + INTERVAL '1 month' - INTERVAL '1 day');
            
            -- Skip if no lines
            CONTINUE WHEN total_lines = 0;
            
            -- Calculate base charges (sum of all line monthly fees)
            SELECT COALESCE(SUM(b.price_per_line), 0) INTO base_charges
            FROM lines l
            JOIN bundles b ON l.bundle_id = b.bundle_id
            WHERE l.enterprise_id = enterprise_rec.enterprise_id
            AND l.status = 'ACTIVE'
            AND l.activation_date <= (bill_month + INTERVAL '1 month' - INTERVAL '1 day');
            
            -- Calculate overage charges from usage data
            SELECT COALESCE(SUM(du.total_charges), 0) INTO overage_charges
            FROM lines l
            JOIN daily_usage du ON l.line_id = du.line_id
            WHERE l.enterprise_id = enterprise_rec.enterprise_id
            AND du.usage_date >= bill_month
            AND du.usage_date < bill_month + INTERVAL '1 month';
            
            -- Calculate taxes (8.5% of base + overage)
            taxes := (base_charges + overage_charges) * 0.085;
            
            -- Total amount
            total_amount := base_charges + overage_charges + taxes;
            
            -- Due date (30 days from end of billing period)
            due_date := (bill_month + INTERVAL '1 month' - INTERVAL '1 day') + INTERVAL '30 days';
            
            -- Determine bill status and payment date
            bill_status := status_options[(RANDOM() * (array_length(status_options, 1) - 1) + 1)::INTEGER];
            
            IF bill_status = 'PAID' THEN
                -- Paid within 0-25 days of due date
                paid_date := due_date - (RANDOM() * 25)::INTEGER;
            ELSIF bill_status = 'OVERDUE' THEN
                paid_date := NULL;
                -- Only recent bills can be overdue
                IF bill_month < current_month - INTERVAL '2 months' THEN
                    bill_status := 'PAID';
                    paid_date := due_date + (RANDOM() * 15)::INTEGER;
                END IF;
            ELSE
                paid_date := NULL;
            END IF;
            
            -- Insert the bill
            INSERT INTO bills (
                enterprise_id,
                billing_period_start,
                billing_period_end,
                total_lines,
                base_charges,
                overage_charges,
                taxes,
                total_amount,
                due_date,
                paid_date,
                status
            ) VALUES (
                enterprise_rec.enterprise_id,
                bill_month,
                bill_month + INTERVAL '1 month' - INTERVAL '1 day',
                total_lines,
                base_charges,
                overage_charges,
                taxes,
                total_amount,
                due_date,
                paid_date,
                bill_status
            );
            
            total_bills := total_bills + 1;
        END LOOP;
        
        -- Progress indicator
        IF enterprise_rec.enterprise_id % 5 = 0 THEN
            RAISE NOTICE 'Generated bills for % enterprises...', enterprise_rec.enterprise_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Billing data generation completed. Total bills: %', total_bills;
END $$;

-- Update some recent bills to be pending (current month)
UPDATE bills 
SET status = 'PENDING', paid_date = NULL
WHERE billing_period_start = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month';

-- Verify the data
SELECT 'Total bills created: ' || COUNT(*) as result FROM bills;

-- Billing summary by enterprise
SELECT 
    e.enterprise_name,
    COUNT(b.bill_id) as total_bills,
    ROUND(SUM(b.total_amount), 2) as total_billed,
    ROUND(AVG(b.total_amount), 2) as avg_monthly_bill,
    COUNT(CASE WHEN b.status = 'PAID' THEN 1 END) as paid_bills,
    COUNT(CASE WHEN b.status = 'OVERDUE' THEN 1 END) as overdue_bills,
    COUNT(CASE WHEN b.status = 'PENDING' THEN 1 END) as pending_bills
FROM enterprises e
JOIN bills b ON e.enterprise_id = b.enterprise_id
GROUP BY e.enterprise_id, e.enterprise_name
ORDER BY total_billed DESC
LIMIT 10;

-- Monthly billing trends
SELECT 
    TO_CHAR(billing_period_start, 'YYYY-MM') as billing_month,
    COUNT(*) as total_bills,
    ROUND(SUM(total_amount), 2) as total_revenue,
    ROUND(AVG(total_amount), 2) as avg_bill_amount,
    ROUND(SUM(base_charges), 2) as total_base_charges,
    ROUND(SUM(overage_charges), 2) as total_overage_charges,
    ROUND(SUM(taxes), 2) as total_taxes
FROM bills
GROUP BY billing_period_start
ORDER BY billing_period_start DESC;

-- Payment status summary
SELECT 
    status,
    COUNT(*) as bill_count,
    ROUND(SUM(total_amount), 2) as total_amount,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bills), 1) as percentage
FROM bills
GROUP BY status
ORDER BY bill_count DESC;

-- Outstanding amounts (overdue + pending)
SELECT 
    'Outstanding amount: $' || ROUND(SUM(total_amount), 2) as result
FROM bills 
WHERE status IN ('OVERDUE', 'PENDING');

-- Average payment time for paid bills
SELECT 
    'Average payment time: ' || ROUND(AVG(paid_date - due_date), 1) || ' days' as result
FROM bills 
WHERE status = 'PAID' AND paid_date IS NOT NULL;
