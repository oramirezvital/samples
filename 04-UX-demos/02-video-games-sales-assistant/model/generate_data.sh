#!/bin/bash

# Data Generation Script for Customer Care Performance Platform
# This script helps generate synthetic data with different parameters

echo "🎯 Customer Care Synthetic Data Generator"
echo "=========================================="

# Default values
CUSTOMERS=1000
INTERACTIONS=10000
OUTPUT_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--customers)
            CUSTOMERS="$2"
            shift 2
            ;;
        -i|--interactions)
            INTERACTIONS="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -c, --customers NUM     Number of customers to generate (default: 1000)"
            echo "  -i, --interactions NUM  Number of interactions to generate (default: 10000)"
            echo "  -o, --output FILE       Output SQL file name (default: auto-generated)"
            echo "  -h, --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Generate 1000 customers, 10000 interactions"
            echo "  $0 -c 500 -i 5000                   # Generate 500 customers, 5000 interactions"
            echo "  $0 -c 2000 -i 20000 -o large_dataset.sql  # Custom output file"
            echo ""
            echo "Predefined scenarios:"
            echo "  $0 small     # 500 customers, 5000 interactions"
            echo "  $0 medium    # 1000 customers, 10000 interactions"
            echo "  $0 large     # 2000 customers, 25000 interactions"
            echo "  $0 xlarge    # 5000 customers, 50000 interactions"
            exit 0
            ;;
        small)
            CUSTOMERS=500
            INTERACTIONS=5000
            OUTPUT_FILE="synthetic_data_small.sql"
            shift
            ;;
        medium)
            CUSTOMERS=1000
            INTERACTIONS=10000
            OUTPUT_FILE="synthetic_data_medium.sql"
            shift
            ;;
        large)
            CUSTOMERS=2000
            INTERACTIONS=25000
            OUTPUT_FILE="synthetic_data_large.sql"
            shift
            ;;
        xlarge)
            CUSTOMERS=5000
            INTERACTIONS=50000
            OUTPUT_FILE="synthetic_data_xlarge.sql"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Generate output filename if not provided
if [ -z "$OUTPUT_FILE" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    OUTPUT_FILE="synthetic_data_${CUSTOMERS}c_${INTERACTIONS}i_${TIMESTAMP}.sql"
fi

echo "📋 Configuration:"
echo "   Customers: $CUSTOMERS"
echo "   Interactions: $INTERACTIONS"
echo "   Output file: $OUTPUT_FILE"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if the generator script exists
if [ ! -f "02_generate_synthetic_interactions.py" ]; then
    echo "❌ Generator script not found: 02_generate_synthetic_interactions.py"
    echo "Please ensure you're running this script from the correct directory."
    exit 1
fi

# Generate the data
echo "🚀 Generating synthetic data..."
echo "This may take a few minutes for large datasets..."
echo ""

python3 02_generate_synthetic_interactions.py \
    --customers $CUSTOMERS \
    --interactions $INTERACTIONS \
    --output $OUTPUT_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Data generation completed successfully!"
    echo ""
    echo "📁 Generated file: $OUTPUT_FILE"
    echo "📊 File size: $(du -h $OUTPUT_FILE | cut -f1)"
    echo ""
    echo "🔗 To load this data into your database:"
    echo "   psql -h your-rds-endpoint -U postgres -d customer_care_db -f $OUTPUT_FILE"
    echo ""
    echo "💡 You can run this script multiple times to add more data to your database."
    echo "   Each run will generate new customers and interactions."
else
    echo "❌ Data generation failed!"
    exit 1
fi
