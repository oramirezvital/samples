#!/bin/bash

# Simplified Customer Care Analytics Data Generator
# Generates synthetic data for the simplified schema

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR"

# Function to get number of interactions for size
get_interactions() {
    case $1 in
        "small") echo "1000" ;;
        "medium") echo "5000" ;;
        "large") echo "20000" ;;
        "xlarge") echo "50000" ;;
        *) echo "" ;;
    esac
}

# Function to display usage
usage() {
    echo "Usage: $0 <size>"
    echo "Available sizes:"
    echo "  small: 1000 interactions"
    echo "  medium: 5000 interactions"
    echo "  large: 20000 interactions"
    echo "  xlarge: 50000 interactions"
    echo ""
    echo "Example: $0 small"
    exit 1
}

# Function to generate data
generate_data() {
    local size=$1
    local num_interactions=$(get_interactions "$size")
    local output_file="$OUTPUT_DIR/simplified_synthetic_data_${size}.sql"
    
    echo "=== Simplified Customer Care Analytics Data Generator ==="
    echo "Size: $size"
    echo "Interactions: $num_interactions"
    echo "Output file: $output_file"
    echo ""
    
    # Check if Python script exists
    if [[ ! -f "$SCRIPT_DIR/02_simplified_generate_synthetic_interactions.py" ]]; then
        echo "Error: Python generator script not found!"
        echo "Expected: $SCRIPT_DIR/02_simplified_generate_synthetic_interactions.py"
        exit 1
    fi
    
    # Make Python script executable
    chmod +x "$SCRIPT_DIR/02_simplified_generate_synthetic_interactions.py"
    
    echo "Generating synthetic data..."
    start_time=$(date +%s)
    
    # Generate the data
    python3 "$SCRIPT_DIR/02_simplified_generate_synthetic_interactions.py" "$num_interactions" > "$output_file"
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    # Get file size
    if command -v du >/dev/null 2>&1; then
        file_size=$(du -h "$output_file" | cut -f1)
    else
        file_size="unknown"
    fi
    
    echo ""
    echo "=== Generation Complete ==="
    echo "File: $output_file"
    echo "Size: $file_size"
    echo "Duration: ${duration}s"
    echo "Interactions: $num_interactions"
    
    # Show sample of generated data
    echo ""
    echo "=== Sample Data (first 10 lines) ==="
    head -n 10 "$output_file"
    echo "..."
    echo ""
    
    # Show statistics
    echo "=== Statistics ==="
    echo "Total lines: $(wc -l < "$output_file")"
    echo "INSERT statements: $(grep -c "INSERT INTO customer_interactions" "$output_file" || echo "0")"
    
    echo ""
    echo "Data generation completed successfully!"
    echo "To load this data:"
    echo "1. First run: psql -d your_database -f 00_simplified_schema.sql"
    echo "2. Then run: psql -d your_database -f 01_simplified_baseline_data.sql"
    echo "3. Finally run: psql -d your_database -f $output_file"
}

# Main script
main() {
    # Check arguments
    if [[ $# -ne 1 ]]; then
        usage
    fi
    
    local size=$1
    local num_interactions=$(get_interactions "$size")
    
    # Validate size
    if [[ -z "$num_interactions" ]]; then
        echo "Error: Invalid size '$size'"
        echo ""
        usage
    fi
    
    # Check Python availability
    if ! command -v python3 >/dev/null 2>&1; then
        echo "Error: Python 3 is required but not installed."
        exit 1
    fi
    
    # Generate data
    generate_data "$size"
}

# Run main function
main "$@"
