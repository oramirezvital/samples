# Simplified Customer Care Analytics Data Model

This is a streamlined version of the customer care analytics data model, focusing on essential tables with `customer_interactions` as the main fact table and reference/catalog tables for supporting data.

## Database Schema

### Core Tables

1. **`customers`** - Core customer information and profiles
2. **`channels`** - Communication channels catalog (Phone, Email, Chat, etc.)
3. **`agents`** - Customer service agents catalog
4. **`interaction_types`** - Types of customer interactions catalog (Support, Sales, Billing, etc.)
5. **`service_plans`** - Available service plans and packages catalog
6. **`customer_service_plans`** - Customer to service plan relationships and history
7. **`customer_interactions`** - Main fact table storing all customer interactions across all channels

## Key Features

- **Simplified Design**: Only 7 tables instead of the complex multi-table structure
- **Centralized Interactions**: All interaction data stored in one main table
- **Reference Tables**: Clean separation of master data (customers, agents, plans) from transactional data
- **Realistic Data**: Generated synthetic data includes realistic patterns, durations, and satisfaction scores
- **Performance Optimized**: Proper indexing on key columns for fast queries

## Files

### Schema and Data Files
- `00_simplified_schema.sql` - Database schema creation script
- `01_simplified_baseline_data.sql` - Reference data population script
- `02_simplified_generate_synthetic_interactions.py` - Python script for generating synthetic interaction data
- `generate_simplified_data.sh` - Bash script to generate different sizes of synthetic data

### Generated Data Files
- `simplified_synthetic_data_small.sql` - 1,000 interactions (~516KB)
- `simplified_synthetic_data_medium.sql` - 5,000 interactions (~2.5MB)
- `simplified_synthetic_data_large.sql` - 20,000 interactions (~10MB)
- `simplified_synthetic_data_xlarge.sql` - 50,000 interactions (~25MB)

## Quick Start

### 1. Create Database Schema
```bash
psql -d your_database -f 00_simplified_schema.sql
```

### 2. Load Reference Data
```bash
psql -d your_database -f 01_simplified_baseline_data.sql
```

### 3. Generate and Load Synthetic Data
```bash
# Generate synthetic data (choose size: small, medium, large, xlarge)
./generate_simplified_data.sh small

# Load the generated data
psql -d your_database -f simplified_synthetic_data_small.sql
```

## Data Generation Options

| Size | Interactions | Approx File Size | Description |
|------|-------------|------------------|-------------|
| small | 1,000 | ~516KB | Quick testing and development |
| medium | 5,000 | ~2.5MB | Standard testing scenarios |
| large | 20,000 | ~10MB | Performance testing |
| xlarge | 50,000 | ~25MB | Load testing and analytics |

## Sample Queries

### Basic Analytics
```sql
-- Interactions by channel
SELECT 
    c.channel_name,
    COUNT(*) as interaction_count,
    AVG(ci.satisfaction_score) as avg_satisfaction
FROM customer_interactions ci
JOIN channels c ON ci.channel_id = c.channel_id
GROUP BY c.channel_name
ORDER BY interaction_count DESC;

-- Top interaction types
SELECT 
    it.interaction_name,
    COUNT(*) as interaction_count,
    AVG(ci.duration_seconds) as avg_duration_seconds
FROM customer_interactions ci
JOIN interaction_types it ON ci.interaction_type_id = it.interaction_type_id
WHERE ci.duration_seconds IS NOT NULL
GROUP BY it.interaction_name
ORDER BY interaction_count DESC;

-- Agent performance
SELECT 
    a.agent_name,
    COUNT(*) as interactions_handled,
    AVG(ci.satisfaction_score) as avg_satisfaction,
    AVG(ci.duration_seconds) as avg_duration
FROM customer_interactions ci
JOIN agents a ON ci.agent_id = a.agent_id
WHERE ci.duration_seconds IS NOT NULL
GROUP BY a.agent_name
ORDER BY interactions_handled DESC;
```

### Customer Analysis
```sql
-- Customer interaction history
SELECT 
    c.customer_name,
    COUNT(*) as total_interactions,
    AVG(ci.satisfaction_score) as avg_satisfaction,
    MAX(ci.start_timestamp) as last_interaction
FROM customer_interactions ci
JOIN customers c ON ci.customer_id = c.customer_id
GROUP BY c.customer_id, c.customer_name
ORDER BY total_interactions DESC;

-- Customer service plan analysis
SELECT 
    sp.plan_name,
    COUNT(DISTINCT csp.customer_id) as customer_count,
    COUNT(ci.interaction_id) as total_interactions,
    AVG(ci.satisfaction_score) as avg_satisfaction
FROM service_plans sp
JOIN customer_service_plans csp ON sp.service_plan_id = csp.service_plan_id
LEFT JOIN customer_interactions ci ON csp.customer_id = ci.customer_id
WHERE csp.is_active = TRUE
GROUP BY sp.service_plan_id, sp.plan_name
ORDER BY customer_count DESC;
```

## Benefits of Simplified Approach

1. **Easier to Understand**: Clear relationship between tables
2. **Faster Development**: Less complex joins and queries
3. **Better Performance**: Fewer tables to join for most queries
4. **Simpler Maintenance**: Easier to modify and extend
5. **Clear Data Flow**: Obvious fact table (interactions) and dimension tables (reference data)

## Migration from Complex Schema

If you have data in the previous complex schema, you can migrate it by:

1. Running the new simplified schema creation
2. Writing migration scripts to map data from old tables to new structure
3. The main mapping would be consolidating interaction steps and journey sessions into the single `customer_interactions` table

This simplified approach maintains all the essential analytics capabilities while significantly reducing complexity.
