#!/bin/bash

# Script to upgrade RDS instance for better performance with thousands of records
# Run this after the RDS instance is in 'available' status

echo "🔍 Checking RDS instance status..."

# Check current status
STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier customer-care-db \
    --region us-west-2 \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text)

echo "Current status: $STATUS"

if [ "$STATUS" = "available" ]; then
    echo "✅ Instance is available. Proceeding with upgrade..."
    
    # Upgrade instance class and storage
    aws rds modify-db-instance \
        --db-instance-identifier customer-care-db \
        --region us-west-2 \
        --db-instance-class db.m5.large \
        --allocated-storage 100 \
        --max-allocated-storage 500 \
        --storage-type gp3 \
        --apply-immediately
    
    echo "🚀 Upgrade initiated! This will take a few minutes..."
    echo "📊 New configuration:"
    echo "   - Instance Class: db.m5.large (2 vCPUs, 8 GB RAM)"
    echo "   - Storage: 100 GB GP3 (auto-scaling up to 500 GB)"
    echo "   - Better performance for thousands of records"
    
elif [ "$STATUS" = "creating" ]; then
    echo "⏳ Instance is still being created. Please wait and run this script again."
    echo "💡 You can check status with:"
    echo "   aws rds describe-db-instances --db-instance-identifier customer-care-db --region us-west-2 --query 'DBInstances[0].DBInstanceStatus'"
    
else
    echo "❌ Instance status is: $STATUS"
    echo "Please wait for the instance to be in 'available' status before upgrading."
fi

# Get connection information
echo ""
echo "📋 Connection Information:"
aws rds describe-db-instances \
    --db-instance-identifier customer-care-db \
    --region us-west-2 \
    --query 'DBInstances[0].{Endpoint:Endpoint.Address,Port:Endpoint.Port,Database:DBName,Username:MasterUsername}' \
    --output table
