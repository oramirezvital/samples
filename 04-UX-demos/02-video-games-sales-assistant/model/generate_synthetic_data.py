#!/usr/bin/env python3
"""
Synthetic Data Generator for Subscriber Care Analytics
Generates synthetic data for conversations and subscriber_interactions tables
Based on existing subscribers, channels, agents, and transaction types
"""

import random
import uuid
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'subscriber_care'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': os.getenv('DB_PORT', '5432')
}

# Default parameters
DEFAULT_MAX_RECORDS = 200
DATE_START = datetime(2025, 1, 1)
DATE_END = datetime(2025, 7, 31)

# Conversation types and their probabilities
CONVERSATION_TYPES = {
    'BOT': 0.6,  # 60% BOT conversations
    'Conversaciones reales': 0.25,  # 25% real conversations
    'LiveChat': 0.15  # 15% live chat
}

# Status distributions
CONVERSATION_STATUS = {
    'Completed': 0.7,
    'Active': 0.1,
    'Abandoned': 0.15,
    'Escalated': 0.05
}

RESOLUTION_STATUS = {
    'Resolved': 0.65,
    'Pending': 0.20,
    'Escalated': 0.10,
    'Cancelled': 0.05
}

# Device types
DEVICE_TYPES = {
    'android': 0.45,
    'iphone': 0.35,
    'other': 0.20
}

class SyntheticDataGenerator:
    def __init__(self, max_records: int = DEFAULT_MAX_RECORDS):
        self.conn = None
        self.max_records = max_records
        self.subscribers = []
        self.channels = []
        self.agents = []
        self.transaction_types = []
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            print("✅ Connected to database successfully")
        except Exception as e:
            print(f"❌ Error connecting to database: {e}")
            raise
    
    def load_reference_data(self):
        """Load existing reference data from database"""
        cursor = self.conn.cursor()
        
        # Load subscribers
        cursor.execute("SELECT subscriber_id, customer_name, region FROM subscribers WHERE status = 'Active'")
        self.subscribers = cursor.fetchall()
        print(f"📊 Loaded {len(self.subscribers)} active subscribers")
        
        # Load channels
        cursor.execute("SELECT channel_id, channel_name, channel_type FROM channels WHERE is_active = TRUE")
        self.channels = cursor.fetchall()
        print(f"📊 Loaded {len(self.channels)} active channels")
        
        # Load agents
        cursor.execute("SELECT agent_id, agent_name, department FROM agents WHERE is_active = TRUE")
        self.agents = cursor.fetchall()
        print(f"📊 Loaded {len(self.agents)} active agents")
        
        # Load transaction types
        cursor.execute("SELECT transaction_type_id, transaction_name FROM transaction_types WHERE is_active = TRUE")
        self.transaction_types = cursor.fetchall()
        print(f"📊 Loaded {len(self.transaction_types)} transaction types")
        
        cursor.close()
    
    def random_datetime(self) -> datetime:
        """Generate random datetime between DATE_START and DATE_END"""
        time_between = DATE_END - DATE_START
        days_between = time_between.days
        random_days = random.randrange(days_between)
        random_hours = random.randrange(24)
        random_minutes = random.randrange(60)
        random_seconds = random.randrange(60)
        
        return DATE_START + timedelta(
            days=random_days,
            hours=random_hours,
            minutes=random_minutes,
            seconds=random_seconds
        )
    
    def weighted_choice(self, choices: Dict[str, float]) -> str:
        """Make weighted random choice from dictionary"""
        items = list(choices.keys())
        weights = list(choices.values())
        return random.choices(items, weights=weights)[0]
    
    def generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"sess_{uuid.uuid4().hex[:12]}"
    
    def generate_satisfaction_score(self, conversation_type: str = None) -> float:
        """Generate realistic satisfaction score based on conversation type"""
        if conversation_type == 'BOT':
            # BOT conversations tend to have lower satisfaction
            return round(random.uniform(-0.5, 0.5), 2)
        elif conversation_type == 'LiveChat':
            # LiveChat tends to have higher satisfaction
            return round(random.uniform(0.2, 1.0), 2)
        else:
            # Real conversations have mixed satisfaction
            return round(random.uniform(-0.8, 0.9), 2)
    
    def generate_duration(self, conversation_type: str = None) -> int:
        """Generate realistic duration in seconds based on type"""
        if conversation_type == 'BOT':
            # BOT conversations are typically shorter
            return random.randint(30, 300)  # 30 seconds to 5 minutes
        elif conversation_type == 'LiveChat':
            # LiveChat can be longer
            return random.randint(180, 1800)  # 3 to 30 minutes
        else:
            # Real conversations vary widely
            return random.randint(120, 2400)  # 2 to 40 minutes
    
    def generate_conversations(self, count: int) -> List[Dict[str, Any]]:
        """Generate synthetic conversation records"""
        conversations = []
        
        for _ in range(count):
            subscriber = random.choice(self.subscribers)
            channel = random.choice(self.channels)
            conversation_type = self.weighted_choice(CONVERSATION_TYPES)
            
            # BOT conversations don't need agents
            agent = None if conversation_type == 'BOT' else random.choice(self.agents)
            
            start_time = self.random_datetime()
            duration = self.generate_duration(conversation_type)
            end_time = start_time + timedelta(seconds=duration)
            
            conversation = {
                'subscriber_id': subscriber[0],
                'channel_id': channel[0],
                'conversation_type': conversation_type,
                'agent_id': agent[0] if agent else None,
                'session_id': self.generate_session_id(),
                'start_timestamp': start_time,
                'end_timestamp': end_time,
                'duration_seconds': duration,
                'status': self.weighted_choice(CONVERSATION_STATUS),
                'satisfaction_score': self.generate_satisfaction_score(conversation_type),
                'conversation_summary': f"Conversation with {subscriber[1]} via {channel[1]}",
                'language': 'es',
                'created_at': start_time
            }
            
            conversations.append(conversation)
        
        return conversations
    
    def generate_subscriber_interactions(self, count: int) -> List[Dict[str, Any]]:
        """Generate synthetic subscriber interaction records"""
        interactions = []
        
        for _ in range(count):
            subscriber = random.choice(self.subscribers)
            channel = random.choice(self.channels)
            transaction_type = random.choice(self.transaction_types)
            agent = random.choice(self.agents) if random.random() > 0.3 else None  # 70% have agents
            
            start_time = self.random_datetime()
            duration = random.randint(60, 1800)  # 1 to 30 minutes
            end_time = start_time + timedelta(seconds=duration)
            queue_time = random.randint(0, 300)  # 0 to 5 minutes queue time
            
            interaction = {
                'subscriber_id': subscriber[0],
                'channel_id': channel[0],
                'transaction_type_id': transaction_type[0],
                'agent_id': agent[0] if agent else None,
                'session_id': self.generate_session_id(),
                'device_type': self.weighted_choice(DEVICE_TYPES),
                'start_timestamp': start_time,
                'end_timestamp': end_time,
                'duration_seconds': duration,
                'queue_time_seconds': queue_time,
                'resolution_status': self.weighted_choice(RESOLUTION_STATUS),
                'satisfaction_score': self.generate_satisfaction_score(),
                'interaction_summary': f"Transaction: {transaction_type[1]} for {subscriber[1]}",
                'language': 'es',
                'created_at': start_time
            }
            
            interactions.append(interaction)
        
        return interactions
    
    def insert_conversations(self, conversations: List[Dict[str, Any]]):
        """Insert conversations into database"""
        cursor = self.conn.cursor()
        
        insert_query = """
        INSERT INTO conversations (
            subscriber_id, channel_id, conversation_type, agent_id, session_id,
            start_timestamp, end_timestamp, duration_seconds, status,
            satisfaction_score, conversation_summary, language, created_at
        ) VALUES %s
        """
        
        values = [
            (
                conv['subscriber_id'], conv['channel_id'], conv['conversation_type'],
                conv['agent_id'], conv['session_id'], conv['start_timestamp'],
                conv['end_timestamp'], conv['duration_seconds'], conv['status'],
                conv['satisfaction_score'], conv['conversation_summary'],
                conv['language'], conv['created_at']
            )
            for conv in conversations
        ]
        
        execute_values(cursor, insert_query, values)
        self.conn.commit()
        cursor.close()
        print(f"✅ Inserted {len(conversations)} conversations")
    
    def insert_subscriber_interactions(self, interactions: List[Dict[str, Any]]):
        """Insert subscriber interactions into database"""
        cursor = self.conn.cursor()
        
        insert_query = """
        INSERT INTO subscriber_interactions (
            subscriber_id, channel_id, transaction_type_id, agent_id, session_id,
            device_type, start_timestamp, end_timestamp, duration_seconds,
            queue_time_seconds, resolution_status, satisfaction_score,
            interaction_summary, language, created_at
        ) VALUES %s
        """
        
        values = [
            (
                inter['subscriber_id'], inter['channel_id'], inter['transaction_type_id'],
                inter['agent_id'], inter['session_id'], inter['device_type'],
                inter['start_timestamp'], inter['end_timestamp'], inter['duration_seconds'],
                inter['queue_time_seconds'], inter['resolution_status'],
                inter['satisfaction_score'], inter['interaction_summary'],
                inter['language'], inter['created_at']
            )
            for inter in interactions
        ]
        
        execute_values(cursor, insert_query, values)
        self.conn.commit()
        cursor.close()
        print(f"✅ Inserted {len(interactions)} subscriber interactions")
    
    def generate_and_insert_data(self):
        """Main method to generate and insert all synthetic data"""
        print("🚀 Starting synthetic data generation...")
        print(f"📊 Maximum records to generate: {self.max_records}")
        
        # Connect to database
        self.connect_db()
        
        # Load reference data
        self.load_reference_data()
        
        # Validate we have required data
        if not all([self.subscribers, self.channels, self.agents, self.transaction_types]):
            print("❌ Missing required reference data. Please ensure subscribers, channels, agents, and transaction_types exist.")
            return
        
        # Calculate minimum records (at least 5 of each type, or proportional if max_records is small)
        min_each = min(5, self.max_records // 4)  # Ensure we don't exceed max_records
        min_conversations = min_each
        min_interactions = min_each
        
        # Ensure we don't exceed max_records with minimums
        if min_conversations + min_interactions > self.max_records:
            min_conversations = self.max_records // 2
            min_interactions = self.max_records - min_conversations
        
        remaining_after_minimums = self.max_records - min_conversations - min_interactions
        
        # Randomly distribute the remaining records
        if remaining_after_minimums > 0:
            extra_conversations = random.randint(0, remaining_after_minimums)
            extra_interactions = remaining_after_minimums - extra_conversations
        else:
            extra_conversations = 0
            extra_interactions = 0
        
        conv_count = min_conversations + extra_conversations
        inter_count = min_interactions + extra_interactions
        
        print(f"📊 Planning to generate:")
        print(f"   • {conv_count} conversations")
        print(f"   • {inter_count} subscriber interactions")
        print(f"   • Total: {conv_count + inter_count} records")
        
        # Generate conversations
        if conv_count > 0:
            print(f"📝 Generating {conv_count} conversations...")
            conversations = self.generate_conversations(conv_count)
            self.insert_conversations(conversations)
        
        # Generate subscriber interactions
        if inter_count > 0:
            print(f"📝 Generating {inter_count} subscriber interactions...")
            interactions = self.generate_subscriber_interactions(inter_count)
            self.insert_subscriber_interactions(interactions)
        
        # Close connection
        self.conn.close()
        print("🎉 Synthetic data generation completed successfully!")
        print(f"📊 Total records created: {conv_count + inter_count}")
        print(f"   • Conversations: {conv_count}")
        print(f"   • Subscriber Interactions: {inter_count}")

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(
        description='Generate synthetic data for subscriber care analytics',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 generate_synthetic_data.py                    # Generate up to 200 records (default)
  python3 generate_synthetic_data.py --max-records 100  # Generate up to 100 records
  python3 generate_synthetic_data.py -n 50              # Generate up to 50 records
        """
    )
    
    parser.add_argument(
        '--max-records', '-n',
        type=int,
        default=DEFAULT_MAX_RECORDS,
        help=f'Maximum number of records to generate (default: {DEFAULT_MAX_RECORDS})'
    )
    
    parser.add_argument(
        '--version', '-v',
        action='version',
        version='Synthetic Data Generator v1.1.0'
    )
    
    return parser.parse_args()

def main():
    """Main execution function"""
    try:
        # Parse command-line arguments
        args = parse_arguments()
        
        # Validate max_records
        if args.max_records <= 0:
            print("❌ Error: max-records must be a positive integer")
            return 1
        
        if args.max_records > 10000:
            print("⚠️  Warning: Generating more than 10,000 records may take a while...")
            response = input("Do you want to continue? (y/N): ")
            if response.lower() not in ['y', 'yes']:
                print("Operation cancelled.")
                return 0
        
        # Create generator with specified max records
        generator = SyntheticDataGenerator(max_records=args.max_records)
        generator.generate_and_insert_data()
        
        return 0
        
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled by user")
        return 1
    except Exception as e:
        print(f"❌ Error during data generation: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
