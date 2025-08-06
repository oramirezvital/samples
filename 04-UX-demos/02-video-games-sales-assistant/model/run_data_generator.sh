#!/bin/bash

# Synthetic Data Generator Runner
# This script sets up the environment and runs the data generator
# Usage: ./run_data_generator.sh [max_records]
# Example: ./run_data_generator.sh 150

# Default max records if not provided
MAX_RECORDS=${1:-200}

echo "🚀 Setting up Synthetic Data Generator..."
echo "📊 Max records to generate: $MAX_RECORDS"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one based on .env.example"
    echo "📝 Copy .env.example to .env and update with your database credentials"
    cp .env.example .env
    echo "✅ Created .env file from template. Please update it with your database credentials."
    exit 1
fi

# Run the data generator with max records parameter
echo "🎯 Running synthetic data generator with max records: $MAX_RECORDS..."
python3 generate_synthetic_data.py --max-records "$MAX_RECORDS"

# Capture exit code
EXIT_CODE=$?

# Deactivate virtual environment
deactivate

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Data generation process completed successfully!"
else
    echo "❌ Data generation process failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
