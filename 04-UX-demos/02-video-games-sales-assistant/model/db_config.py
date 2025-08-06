"""
Database configuration for Telcel Customer Care Analytics
Update these values according to your PostgreSQL setup
"""

DB_CONFIG = {
    'host': 'customer-care-db.c2lz7w2tx92t.us-west-2.rds.amazonaws.com',
    'database': 'customer_care_db',
    'user': 'postgres',
    'password': 'CustomerCare2024!',
    'port': 5432
}

# Alternative configuration for different environments
DB_CONFIGS = {
    'development': {
        'host': 'localhost',
        'database': 'telcel_analytics_dev',
        'user': 'postgres',
        'password': 'dev_password',
        'port': 5432
    },
    'testing': {
        'host': 'localhost',
        'database': 'telcel_analytics_test',
        'user': 'postgres',
        'password': 'test_password',
        'port': 5432
    },
    'production': {
        'host': 'your_prod_host',
        'database': 'telcel_analytics_prod',
        'user': 'prod_user',
        'password': 'prod_password',
        'port': 5432
    }
}
