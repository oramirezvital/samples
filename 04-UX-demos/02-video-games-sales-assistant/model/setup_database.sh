#!/bin/bash

# Database setup script for Customer Care Performance Measurement Platform
# This script will connect to the RDS instance and set up the data model

echo "🗄️  Customer Care Database Setup"
echo "=================================="

# Get RDS endpoint
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier customer-care-db \
    --region us-west-2 \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

if [ "$ENDPOINT" = "None" ] || [ -z "$ENDPOINT" ]; then
    echo "❌ RDS instance is not ready yet. Please wait for it to be available."
    exit 1
fi

echo "📡 RDS Endpoint: $ENDPOINT"
echo "🔐 Database: customer_care_db"
echo "👤 Username: postgres"
echo ""

# Database connection details
DB_HOST=$ENDPOINT
DB_PORT=5432
DB_NAME="customer_care_db"
DB_USER="postgres"
DB_PASSWORD="CustomerCare2024!"

echo "🚀 Setting up the database schema..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client:"
    echo "   brew install postgresql"
    exit 1
fi

# Test connection
echo "🔍 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    
    echo "📋 Creating database schema..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f customer_care_data_model.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema created successfully!"
        
        echo "📊 Inserting sample data..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f sample_data_insert.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Sample data inserted successfully!"
            
            echo ""
            echo "🎉 Database setup complete!"
            echo ""
            echo "📋 Connection Information:"
            echo "   Host: $DB_HOST"
            echo "   Port: $DB_PORT"
            echo "   Database: $DB_NAME"
            echo "   Username: $DB_USER"
            echo ""
            echo "🔗 Connect using:"
            echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
            echo ""
            echo "📊 Verify installation:"
            echo "   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
            
        else
            echo "❌ Failed to insert sample data"
        fi
    else
        echo "❌ Failed to create database schema"
    fi
else
    echo "❌ Cannot connect to database. Please check:"
    echo "   1. RDS instance is in 'available' status"
    echo "   2. Security group allows connections from your IP"
    echo "   3. Database credentials are correct"
fi

unset PGPASSWORD
