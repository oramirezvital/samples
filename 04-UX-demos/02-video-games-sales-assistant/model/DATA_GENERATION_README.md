# Synthetic Data Generation for Customer Care Platform

This directory contains scripts to generate realistic synthetic data for testing and development of the Customer Care Performance Measurement Platform.

## 📁 Files Overview

```
model/
├── 01_baseline_data.sql                    # Foundational reference data (run once)
├── 02_generate_synthetic_interactions.py   # Python script for generating interactions
├── generate_data.sh                        # Shell script wrapper for easy usage
├── DATA_GENERATION_README.md              # This file
└── customer_care_data_model.sql           # Database schema (run first)
```

## 🚀 Quick Start

### 1. Set Up Database Schema
```bash
# First, create the database schema
psql -h your-rds-endpoint -U postgres -d customer_care_db -f customer_care_data_model.sql
```

### 2. Load Baseline Data
```bash
# Load foundational reference data (channels, interaction types, agents, etc.)
psql -h your-rds-endpoint -U postgres -d customer_care_db -f 01_baseline_data.sql
```

### 3. Generate Synthetic Interactions
```bash
# Generate default dataset (1000 customers, 10000 interactions)
./generate_data.sh

# Or use predefined scenarios
./generate_data.sh small    # 500 customers, 5000 interactions
./generate_data.sh medium   # 1000 customers, 10000 interactions  
./generate_data.sh large    # 2000 customers, 25000 interactions
./generate_data.sh xlarge   # 5000 customers, 50000 interactions
```

### 4. Load Generated Data
```bash
# Load the generated SQL file into your database
psql -h your-rds-endpoint -U postgres -d customer_care_db -f synthetic_data_medium.sql
```

## 📊 Data Generation Details

### Baseline Data (01_baseline_data.sql)
Contains foundational reference data that should be loaded once:

- **10 Channels**: Mobile App, Web Portal, WhatsApp Bot, Voice Call Center, etc.
- **32 Interaction Types**: Balance queries, payments, technical support, etc.
- **18 Service Plans**: Prepaid, postpaid, and add-on plans
- **16 Agents**: Mix of bots, humans, and supervisors across regions
- **10 Knowledge Base Articles**: Common support topics in Spanish/English
- **4 Survey Templates**: CSAT, NPS, CES surveys
- **8 Performance Thresholds**: Configurable monitoring thresholds

### Synthetic Interaction Data
The Python generator creates realistic data with the following characteristics:

#### Customer Distribution
- **Segments**: Basic (40%), Standard (35%), Premium (20%), VIP (5%)
- **Regions**: R9 (70%), DEUR (30%)
- **Types**: Prepaid (60%), Postpaid (35%), Hybrid (5%)
- **Realistic CLV and churn risk based on segment**

#### Channel Usage Patterns
- **Mobile App**: 35% (most popular)
- **Web Portal**: 20%
- **WhatsApp Bot**: 15%
- **Voice Call Center**: 12%
- **IVR System**: 8%
- **Other channels**: 10%

#### Bot vs Human Interaction Logic
- **Low complexity**: 85% bot success rate
- **Medium complexity**: 65% bot success rate
- **High complexity**: 35% bot success rate
- **Critical complexity**: 10% bot success rate

#### Realistic Timing
- **All interactions in 2025**: January 1 - December 31
- **Business hours weighting**: More interactions during business hours
- **Seasonal patterns**: Can be enhanced for holidays/peak periods

## 🛠️ Advanced Usage

### Custom Data Generation
```bash
# Generate specific amounts of data
./generate_data.sh -c 1500 -i 15000 -o custom_dataset.sql

# Generate large dataset for performance testing
./generate_data.sh -c 10000 -i 100000 -o performance_test.sql
```

### Python Script Direct Usage
```bash
# Use the Python script directly for more control
python3 02_generate_synthetic_interactions.py --customers 2000 --interactions 20000 --output my_data.sql
```

### Multiple Data Loads
```bash
# Generate and load multiple batches (script can be run multiple times)
./generate_data.sh small
psql -h your-rds-endpoint -U postgres -d customer_care_db -f synthetic_data_small.sql

./generate_data.sh medium  
psql -h your-rds-endpoint -U postgres -d customer_care_db -f synthetic_data_medium.sql
```

## 📈 Data Characteristics

### Customer Profiles
- **Realistic Spanish names** for authenticity
- **Region-specific MSISDNs**: 504 prefix for R9, 349 for DEUR
- **Segment-based attributes**: CLV, churn risk, NPS scores
- **Communication preferences** and contact time preferences

### Interaction Realism
- **Channel-specific interaction patterns**: Different interaction types per channel
- **Complexity-based escalation**: Higher complexity = more escalations
- **Realistic durations**: Based on interaction type and complexity
- **Device/browser distribution**: Realistic mobile vs web usage
- **Satisfaction correlation**: Failed interactions = lower satisfaction

### Journey Mapping
- **Session grouping**: Related interactions grouped by customer and date
- **Cross-channel journeys**: Customers using multiple channels
- **Outcome tracking**: Journey success based on interaction outcomes

## 🔍 Data Validation

After loading data, validate with these queries:

```sql
-- Check data distribution
SELECT 'Customers' as table_name, COUNT(*) as records FROM customers
UNION ALL
SELECT 'Interactions', COUNT(*) FROM customer_interactions
UNION ALL
SELECT 'Journey Sessions', COUNT(*) FROM customer_journey_sessions;

-- Bot vs Human distribution
SELECT 
    interaction_mode,
    COUNT(*) as interactions,
    ROUND(AVG(duration_seconds), 2) as avg_duration,
    ROUND(AVG(customer_satisfaction_score), 2) as avg_satisfaction
FROM customer_interactions
GROUP BY interaction_mode;

-- Channel performance
SELECT 
    c.channel_name,
    COUNT(ci.interaction_id) as total_interactions,
    COUNT(CASE WHEN ci.escalated_to_human THEN 1 END) as escalations,
    ROUND(AVG(ci.customer_satisfaction_score), 2) as avg_satisfaction
FROM channels c
LEFT JOIN customer_interactions ci ON c.channel_id = ci.channel_id
GROUP BY c.channel_name
ORDER BY total_interactions DESC;
```

## 🎯 Use Cases

### Development & Testing
- **Small dataset** (500 customers, 5K interactions): Quick development testing
- **Medium dataset** (1K customers, 10K interactions): Feature development
- **Large dataset** (2K customers, 25K interactions): Integration testing

### Performance Testing
- **XLarge dataset** (5K customers, 50K interactions): Performance benchmarking
- **Custom large datasets**: Database optimization and query performance testing

### Demo & Training
- **Realistic data patterns**: Authentic-looking data for demos
- **Multiple scenarios**: Different customer segments and interaction patterns
- **Comprehensive coverage**: All interaction types and channels represented

## 🔧 Customization

### Modify Distribution Patterns
Edit `02_generate_synthetic_interactions.py` to adjust:
- **Channel usage patterns**: Change `self.channel_patterns`
- **Interaction type distribution**: Modify `self.interaction_patterns`
- **Bot success rates**: Adjust `self.bot_success_rates`
- **Customer segments**: Update `self.customer_segments`

### Add New Interaction Types
1. Add to `01_baseline_data.sql` in the interaction_types INSERT
2. Update interaction patterns in the Python script
3. Regenerate data

### Regional Customization
- **Phone number patterns**: Modify MSISDN generation logic
- **Names and languages**: Update name lists and language preferences
- **Time zones**: Adjust timing patterns for different regions

## 📋 Troubleshooting

### Common Issues

**Python not found**
```bash
# Install Python 3
brew install python3  # macOS
sudo apt install python3  # Ubuntu
```

**Permission denied**
```bash
# Make scripts executable
chmod +x generate_data.sh 02_generate_synthetic_interactions.py
```

**Database connection issues**
```bash
# Test database connection
psql -h your-rds-endpoint -U postgres -d customer_care_db -c "SELECT version();"
```

**Large dataset memory issues**
- Generate data in smaller batches
- Use the script multiple times instead of one large generation
- Monitor system memory during generation

### Performance Tips

- **Batch loading**: Load data in smaller batches for better performance
- **Index management**: Consider dropping indexes during bulk load, recreate after
- **Connection pooling**: Use connection pooling for large datasets
- **Parallel loading**: Split large files and load in parallel

## 📊 Expected File Sizes

| Dataset | Customers | Interactions | File Size | Load Time |
|---------|-----------|--------------|-----------|-----------|
| Small   | 500       | 5,000        | ~2 MB     | 30 sec    |
| Medium  | 1,000     | 10,000       | ~4 MB     | 1 min     |
| Large   | 2,000     | 25,000       | ~10 MB    | 3 min     |
| XLarge  | 5,000     | 50,000       | ~20 MB    | 6 min     |

*Load times are approximate and depend on database performance and network speed.*
