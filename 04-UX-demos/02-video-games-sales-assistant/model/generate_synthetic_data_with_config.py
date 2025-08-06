#!/usr/bin/env python3
"""
Telcel Customer Care Analytics - Synthetic Data Generator (with config file)
Generates realistic synthetic data based on telecommunications industry patterns
Uses external configuration file for database settings
"""

import psycopg2
import random
import string
from datetime import datetime, timedelta
from faker import Faker
import uuid
import sys
import os

# Import database configuration
try:
    from db_config import DB_CONFIG, DB_CONFIGS
except ImportError:
    print("❌ Error: db_config.py not found. Please create it with your database configuration.")
    print("See db_config.py template for reference.")
    sys.exit(1)

# Initialize Faker for Spanish/Mexico locale
fake = Faker('es_MX')

class TelcelDataGenerator:
    def __init__(self, db_config, environment='default'):
        """Initialize the data generator with database configuration"""
        if environment != 'default' and environment in DB_CONFIGS:
            self.db_config = DB_CONFIGS[environment]
            print(f"Using {environment} environment configuration")
        else:
            self.db_config = db_config
            print("Using default database configuration")
            
        self.conn = None
        self.cursor = None
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            print(f"✓ Connected to database '{self.db_config['database']}' successfully")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            print(f"Database config: {self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✓ Database connection closed")
    
    def generate_mexican_msisdn(self):
        """Generate a valid Mexican mobile number (MSISDN format)"""
        # Mexican mobile numbers: +52 1 XXX XXX XXXX
        # Common area codes for mobile: 55, 33, 81, 222, 229, 998, etc.
        area_codes = ['55', '33', '81', '222', '229', '998', '664', '686', '662', '618']
        area_code = random.choice(area_codes)
        number = ''.join([str(random.randint(0, 9)) for _ in range(7)])
        return f"+521{area_code}{number}"
    
    def populate_channels(self):
        """Populate channels table with predefined Telcel channels"""
        print("Populating channels table...")
        
        channels_data = [
            ('Mi Telcel', 'MobileApp'),
            ('Telcel.com', 'WebApp'),
            ('Contenedor', 'WebApp'),
            ('Menu de Atención Telcel', 'MobileApp'),
            ('WhatsApp', 'MobileApp'),
            ('Hol@ Telcel', 'WebApp'),
            ('Factura Electrónica', 'WebApp'),
            ('Portal Internet en tu Casa', 'WebApp'),
            ('Apple Chat', 'MobileApp')
        ]
        
        insert_query = """
        INSERT INTO channels (channel_name, channel_type, is_active, created_at)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (channel_name) DO NOTHING
        """
        
        inserted_count = 0
        for channel_name, channel_type in channels_data:
            self.cursor.execute(insert_query, (
                channel_name,
                channel_type,
                True,
                datetime.now()
            ))
            if self.cursor.rowcount > 0:
                inserted_count += 1
        
        self.conn.commit()
        print(f"✓ Inserted {inserted_count} new channels (total: {len(channels_data)} defined)")
    
    def populate_transaction_types(self):
        """Populate transaction_types table with predefined Telcel transaction types"""
        print("Populating transaction_types table...")
        
        transaction_names = [
            'Consulta de Saldo',
            'Descarga de Factura',
            'Alta de Factura electrónica',
            'Pago de Factura',
            'Compra de Paquetes',
            'Recarga de Saldo',
            'Monto de Penalizacion',
            'Que incluye Mi Plan',
            'Consulta de Estado de cuenta interactivo',
            'Historial de Recargas',
            'Suspension por Robo o Extravio',
            'Factura Inteligente'
        ]
        
        insert_query = """
        INSERT INTO transaction_types (transaction_name, is_active, created_at)
        VALUES (%s, %s, %s)
        """
        
        # Clear existing transaction types first
        self.cursor.execute("DELETE FROM transaction_types")
        
        for transaction_name in transaction_names:
            self.cursor.execute(insert_query, (
                transaction_name,
                True,
                datetime.now()
            ))
        
        self.conn.commit()
        print(f"✓ Inserted {len(transaction_names)} transaction types")
    
    def clear_all_data(self):
        """Clear all existing data from tables efficiently"""
        print("🧹 Clearing all existing data...")
        
        # Use TRUNCATE for faster clearing and reset sequences automatically
        tables_to_clear = [
            'subscriber_interactions',
            'conversations', 
            'agents',
            'subscribers',
            'transaction_types',
            'channels'
        ]
        
        try:
            # Disable foreign key checks temporarily for faster clearing
            for table in tables_to_clear:
                self.cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
            
            self.conn.commit()
            print("✓ All data cleared successfully")
        except Exception as e:
            print(f"⚠️  Warning during data clearing: {e}")
            self.conn.rollback()
    
    def populate_subscribers(self, count=1000):
        """Generate 1K subscribers with specified distributions"""
        print(f"Generating {count} subscribers...")
        
        insert_query = """
        INSERT INTO subscribers (customer_name, email, msisdn, registration_date, 
                               subscriber_type, region, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # Calculate distributions
        prepaid_count = int(count * 0.8)  # 80% prepaid
        r9_count = int(count * 0.6)       # 60% R9 region
        
        subscribers_data = []
        
        for i in range(count):
            # Determine subscriber type (80% prepaid, 20% postpaid)
            subscriber_type = 'prepaid' if i < prepaid_count else 'postpaid'
            
            # Determine region (60% R9, 40% DEUR)
            region = 'R9' if i < r9_count else 'DEUR'
            
            # Generate registration date (last 2 years)
            registration_date = fake.date_between(start_date='-2y', end_date='today')
            
            # Generate guaranteed unique email using index
            email = f"subscriber_{i+1:06d}_{fake.user_name()}@telcel.com"
            
            # Generate guaranteed unique MSISDN using index
            # Mexican mobile format: +521 + area_code + 7_digits
            area_codes = ['55', '33', '81', '222', '229', '998', '664', '686', '662', '618']
            area_code = area_codes[i % len(area_codes)]
            # Use index to ensure uniqueness in the 7-digit number
            unique_number = f"{(1000000 + i):07d}"
            msisdn = f"+521{area_code}{unique_number}"
            
            subscriber_data = (
                fake.name(),                    # customer_name
                email,                          # email (guaranteed unique)
                msisdn,                         # msisdn (guaranteed unique)
                registration_date,              # registration_date
                subscriber_type,                # subscriber_type
                region,                         # region
                'Active',                       # status (all active as specified)
                datetime.now()                  # created_at
            )
            
            subscribers_data.append(subscriber_data)
        
        # Single batch insert for maximum performance
        self.cursor.executemany(insert_query, subscribers_data)
        self.conn.commit()
        print(f"✓ Inserted {count} subscribers (80% prepaid, 60% R9 region)")
    
    def populate_agents(self, count=100):
        """Generate 100 agents with synthetic data"""
        print(f"Generating {count} agents...")
        
        insert_query = """
        INSERT INTO agents (agent_name, employee_id, department, skill_level, 
                          is_active, hire_date, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        departments = [
            'Atención al Cliente', 'Soporte Técnico', 'Ventas', 'Facturación',
            'Retención', 'Cobranza', 'Activaciones', 'Reparaciones'
        ]
        
        skill_levels = ['Junior', 'Senior', 'Expert']
        skill_weights = [0.5, 0.35, 0.15]  # 50% Junior, 35% Senior, 15% Expert
        
        agents_data = []
        
        for i in range(count):
            # Generate guaranteed unique employee ID
            employee_id = f"EMP{str(i+1).zfill(5)}"
            
            # Weighted random skill level
            skill_level = random.choices(skill_levels, weights=skill_weights)[0]
            
            # Hire date (last 5 years)
            hire_date = fake.date_between(start_date='-5y', end_date='today')
            
            agent_data = (
                fake.name(),                    # agent_name
                employee_id,                    # employee_id (guaranteed unique)
                random.choice(departments),     # department
                skill_level,                    # skill_level
                True,                          # is_active
                hire_date,                     # hire_date
                datetime.now()                 # created_at
            )
            
            agents_data.append(agent_data)
        
        # Single batch insert
        self.cursor.executemany(insert_query, agents_data)
        self.conn.commit()
        print(f"✓ Inserted {count} agents")
    
    def populate_conversations(self, count=5000):
        """Generate realistic conversations data"""
        print(f"Generating {count} conversations...")
        
        # Get available IDs
        self.cursor.execute("SELECT subscriber_id FROM subscribers")
        subscriber_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT channel_id FROM channels")
        channel_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT agent_id FROM agents")
        agent_ids = [row[0] for row in self.cursor.fetchall()]
        
        if not subscriber_ids or not channel_ids:
            print("❌ Error: No subscribers or channels found. Please populate them first.")
            return
        
        conversation_types = ['Conversaciones reales', 'BOT', 'LiveChat']
        conversation_weights = [0.4, 0.4, 0.2]  # 40% real, 40% bot, 20% live chat
        
        statuses = ['Completed', 'Active', 'Abandoned', 'Escalated']
        status_weights = [0.7, 0.1, 0.15, 0.05]
        
        insert_query = """
        INSERT INTO conversations (subscriber_id, channel_id, conversation_type, agent_id,
                                 session_id, start_timestamp, end_timestamp, duration_seconds,
                                 status, satisfaction_score, conversation_summary, language, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        conversations_data = []
        
        for i in range(count):
            conversation_type = random.choices(conversation_types, weights=conversation_weights)[0]
            
            # BOT conversations don't need agents
            agent_id = None if conversation_type == 'BOT' or not agent_ids else random.choice(agent_ids)
            
            # Generate timestamps
            start_time = fake.date_time_between(start_date='-6m', end_date='now')
            
            # Duration varies by conversation type
            if conversation_type == 'BOT':
                duration = random.randint(30, 300)  # 30 seconds to 5 minutes
            elif conversation_type == 'LiveChat':
                duration = random.randint(300, 1800)  # 5 to 30 minutes
            else:  # Conversaciones reales
                duration = random.randint(180, 3600)  # 3 to 60 minutes
            
            end_time = start_time + timedelta(seconds=duration)
            
            # Status and satisfaction
            status = random.choices(statuses, weights=status_weights)[0]
            satisfaction_score = None
            if status == 'Completed':
                satisfaction_score = round(random.uniform(0.3, 1.0), 2)  # Positive bias
            elif status == 'Abandoned':
                satisfaction_score = round(random.uniform(-1.0, 0.2), 2)  # Negative bias
            
            conversation_data = (
                random.choice(subscriber_ids),      # subscriber_id
                random.choice(channel_ids),         # channel_id
                conversation_type,                  # conversation_type
                agent_id,                          # agent_id
                str(uuid.uuid4()),                 # session_id
                start_time,                        # start_timestamp
                end_time if status != 'Active' else None,  # end_timestamp
                duration if status != 'Active' else None,  # duration_seconds
                status,                            # status
                satisfaction_score,                # satisfaction_score
                fake.text(max_nb_chars=200),      # conversation_summary
                'es',                             # language
                datetime.now()                    # created_at
            )
            
            conversations_data.append(conversation_data)
        
        # Batch insert
        self.cursor.executemany(insert_query, conversations_data)
        self.conn.commit()
        print(f"✓ Inserted {count} conversations")
    
    def populate_subscriber_interactions(self, count=10000):
        """Generate subscriber interactions data"""
        print(f"Generating {count} subscriber interactions...")
        
        # Get available IDs
        self.cursor.execute("SELECT subscriber_id FROM subscribers")
        subscriber_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT channel_id FROM channels")
        channel_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT transaction_type_id FROM transaction_types")
        transaction_type_ids = [row[0] for row in self.cursor.fetchall()]
        
        self.cursor.execute("SELECT agent_id FROM agents")
        agent_ids = [row[0] for row in self.cursor.fetchall()]
        
        if not subscriber_ids or not channel_ids or not transaction_type_ids:
            print("❌ Error: Missing required data. Please populate subscribers, channels, and transaction_types first.")
            return
        
        device_types = ['android', 'iphone', 'other']
        device_weights = [0.6, 0.35, 0.05]
        
        resolution_statuses = ['Resolved', 'Pending', 'Escalated', 'Cancelled']
        resolution_weights = [0.75, 0.15, 0.05, 0.05]
        
        insert_query = """
        INSERT INTO subscriber_interactions (subscriber_id, channel_id, transaction_type_id, agent_id,
                                           session_id, device_type, start_timestamp, end_timestamp,
                                           duration_seconds, queue_time_seconds, resolution_status,
                                           satisfaction_score, interaction_summary, language, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        interactions_data = []
        
        for i in range(count):
            # Some interactions don't require agents (self-service)
            agent_id = random.choice(agent_ids) if agent_ids and random.random() > 0.3 else None
            
            # Generate timestamps
            start_time = fake.date_time_between(start_date='-6m', end_date='now')
            
            # Duration varies by transaction type and channel
            duration = random.randint(60, 1200)  # 1 to 20 minutes
            queue_time = random.randint(0, 600) if agent_id else 0  # Queue time only with agents
            
            end_time = start_time + timedelta(seconds=duration)
            
            resolution_status = random.choices(resolution_statuses, weights=resolution_weights)[0]
            
            # Satisfaction score based on resolution
            satisfaction_score = None
            if resolution_status == 'Resolved':
                satisfaction_score = round(random.uniform(0.5, 1.0), 2)
            elif resolution_status == 'Cancelled':
                satisfaction_score = round(random.uniform(-1.0, 0.0), 2)
            elif resolution_status == 'Escalated':
                satisfaction_score = round(random.uniform(-0.5, 0.5), 2)
            
            interaction_data = (
                random.choice(subscriber_ids),          # subscriber_id
                random.choice(channel_ids),             # channel_id
                random.choice(transaction_type_ids),    # transaction_type_id
                agent_id,                              # agent_id
                str(uuid.uuid4()),                     # session_id
                random.choices(device_types, weights=device_weights)[0],  # device_type
                start_time,                            # start_timestamp
                end_time if resolution_status != 'Pending' else None,  # end_timestamp
                duration if resolution_status != 'Pending' else None,  # duration_seconds
                queue_time,                            # queue_time_seconds
                resolution_status,                     # resolution_status
                satisfaction_score,                    # satisfaction_score
                fake.text(max_nb_chars=150),          # interaction_summary
                'es',                                 # language
                datetime.now()                        # created_at
            )
            
            interactions_data.append(interaction_data)
        
        # Batch insert
        self.cursor.executemany(insert_query, interactions_data)
        self.conn.commit()
        print(f"✓ Inserted {count} subscriber interactions")
    
    def generate_all_data(self, subscribers_count=1000, agents_count=100, 
                         conversations_count=5000, interactions_count=10000, 
                         clear_existing=True):
        """Generate all synthetic data with customizable counts"""
        print("🚀 Starting synthetic data generation for Telcel Customer Care Analytics...")
        print("=" * 70)
        
        try:
            self.connect_db()
            
            # Clear existing data efficiently if requested
            if clear_existing:
                self.clear_all_data()
            
            # Populate reference tables first
            self.populate_channels()
            self.populate_transaction_types()
            
            # Populate main entities
            self.populate_subscribers(subscribers_count)
            self.populate_agents(agents_count)
            
            # Populate interaction data
            self.populate_conversations(conversations_count)
            self.populate_subscriber_interactions(interactions_count)
            
            print("=" * 70)
            print("✅ Synthetic data generation completed successfully!")
            self.print_summary()
            
        except Exception as e:
            print(f"❌ Error during data generation: {e}")
            if self.conn:
                self.conn.rollback()
            raise
        finally:
            self.close_db()
    
    def print_summary(self):
        """Print data generation summary"""
        print("\n📊 DATA GENERATION SUMMARY:")
        print("-" * 40)
        
        tables = [
            'subscribers', 'channels', 'agents', 
            'transaction_types', 'conversations', 'subscriber_interactions'
        ]
        
        for table in tables:
            self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = self.cursor.fetchone()[0]
            print(f"{table.upper():<25}: {count:>6,} records")
        
        # Print distribution summary for subscribers
        print("\n📈 SUBSCRIBER DISTRIBUTIONS:")
        print("-" * 40)
        
        self.cursor.execute("""
            SELECT subscriber_type, COUNT(*) as count, 
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
            FROM subscribers 
            GROUP BY subscriber_type
        """)
        
        for row in self.cursor.fetchall():
            print(f"{row[0].upper():<15}: {row[1]:>4} ({row[2]:>5.1f}%)")
        
        self.cursor.execute("""
            SELECT region, COUNT(*) as count, 
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
            FROM subscribers 
            GROUP BY region
        """)
        
        print()
        for row in self.cursor.fetchall():
            print(f"{row[0]:<15}: {row[1]:>4} ({row[2]:>5.1f}%)")


def main():
    """Main function to run the data generator"""
    
    # Parse command line arguments
    environment = 'default'
    clear_existing = True
    
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if arg in ['development', 'testing', 'production', 'default']:
                environment = arg
            elif arg == '--no-clear':
                clear_existing = False
            elif arg == '--help':
                print("Usage: python generate_synthetic_data_with_config.py [environment] [--no-clear] [--help]")
                print("Environments: default, development, testing, production")
                print("--no-clear: Don't clear existing data before generating new data")
                print("--help: Show this help message")
                return
            else:
                print(f"❌ Invalid argument: {arg}")
                print("Use --help for usage information")
                sys.exit(1)
    
    print(f"Environment: {environment}")
    print(f"Clear existing data: {clear_existing}")
    print()
    
    # Create and run the data generator
    generator = TelcelDataGenerator(DB_CONFIG, environment)
    
    # You can customize the data volumes here
    generator.generate_all_data(
        subscribers_count=1000,    # As specified in requirements
        agents_count=100,          # As specified in requirements
        conversations_count=5000,  # Reasonable amount for testing
        interactions_count=10000,  # Reasonable amount for testing
        clear_existing=clear_existing
    )


if __name__ == "__main__":
    main()
