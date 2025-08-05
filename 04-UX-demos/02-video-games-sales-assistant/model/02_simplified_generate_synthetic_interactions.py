#!/usr/bin/env python3
"""
Simplified Synthetic Customer Interactions Generator
Generates realistic customer interaction data for the simplified schema
"""

import random
import sys
from datetime import datetime, timedelta
from typing import List, Tuple
import uuid

class SimplifiedSyntheticDataGenerator:
    def __init__(self):
        # Reference data ranges (matching baseline data)
        self.customer_ids = list(range(1, 11))  # 10 sample customers
        self.channel_ids = list(range(1, 9))    # 8 channels
        self.interaction_type_ids = list(range(1, 13))  # 12 interaction types
        self.agent_ids = list(range(1, 13))     # 12 agents
        
        # Interaction type weights (some are more common)
        self.interaction_weights = {
            1: 0.20,   # BILLING
            2: 0.15,   # TECH_SUPPORT
            3: 0.10,   # PLAN_CHANGE
            4: 0.12,   # COMPLAINT
            5: 0.08,   # NEW_SERVICE
            6: 0.10,   # PAYMENT
            7: 0.03,   # CANCELLATION
            8: 0.15,   # INFO_REQUEST
            9: 0.05,   # ROAMING
            10: 0.08,  # DATA_ISSUE
            11: 0.06,  # DEVICE_SUPPORT
            12: 0.08   # PROMOTION
        }
        
        # Channel weights (phone and web chat are most common)
        self.channel_weights = {
            1: 0.35,   # Phone
            2: 0.15,   # Email
            3: 0.25,   # Web Chat
            4: 0.10,   # Mobile App
            5: 0.08,   # WhatsApp
            6: 0.03,   # In-Store
            7: 0.02,   # Social Media
            8: 0.02    # SMS
        }
        
        # Resolution status weights
        self.resolution_statuses = ['Resolved', 'Pending', 'Escalated', 'Cancelled']
        self.resolution_weights = [0.70, 0.15, 0.10, 0.05]
        
    def weighted_choice(self, choices: List[int], weights: dict) -> int:
        """Select a choice based on weights"""
        weight_list = [weights.get(choice, 0.1) for choice in choices]
        return random.choices(choices, weights=weight_list)[0]
    
    def generate_duration(self, channel_id: int, interaction_type_id: int) -> Tuple[int, int]:
        """Generate realistic duration and queue time based on channel and interaction type"""
        # Base durations by channel (in seconds)
        base_durations = {
            1: (300, 1800),   # Phone: 5-30 minutes
            2: (0, 0),        # Email: no real-time duration
            3: (180, 900),    # Web Chat: 3-15 minutes
            4: (60, 300),     # Mobile App: 1-5 minutes
            5: (120, 600),    # WhatsApp: 2-10 minutes
            6: (600, 2400),   # In-Store: 10-40 minutes
            7: (0, 0),        # Social Media: no real-time duration
            8: (0, 0)         # SMS: no real-time duration
        }
        
        # Queue times by channel (in seconds)
        queue_times = {
            1: (30, 300),     # Phone: 30s-5min wait
            2: (0, 0),        # Email: no queue
            3: (10, 120),     # Web Chat: 10s-2min wait
            4: (0, 30),       # Mobile App: 0-30s wait
            5: (5, 60),       # WhatsApp: 5s-1min wait
            6: (300, 1800),   # In-Store: 5-30min wait
            7: (0, 0),        # Social Media: no queue
            8: (0, 0)         # SMS: no queue
        }
        
        min_dur, max_dur = base_durations.get(channel_id, (60, 300))
        min_queue, max_queue = queue_times.get(channel_id, (0, 60))
        
        # Adjust for interaction type complexity
        complexity_multipliers = {
            1: 1.0,   # BILLING
            2: 1.5,   # TECH_SUPPORT (longer)
            3: 1.2,   # PLAN_CHANGE
            4: 1.8,   # COMPLAINT (much longer)
            5: 1.3,   # NEW_SERVICE
            6: 1.1,   # PAYMENT
            7: 2.0,   # CANCELLATION (longest)
            8: 0.7,   # INFO_REQUEST (shorter)
            9: 1.4,   # ROAMING
            10: 1.6,  # DATA_ISSUE
            11: 1.3,  # DEVICE_SUPPORT
            12: 0.8   # PROMOTION (shorter)
        }
        
        multiplier = complexity_multipliers.get(interaction_type_id, 1.0)
        
        duration = 0 if max_dur == 0 else int(random.uniform(min_dur, max_dur) * multiplier)
        queue_time = 0 if max_queue == 0 else random.randint(min_queue, max_queue)
        
        return duration, queue_time
    
    def generate_satisfaction_score(self, resolution_status: str, duration: int) -> float:
        """Generate satisfaction score based on resolution and duration"""
        base_scores = {
            'Resolved': random.uniform(0.3, 1.0),
            'Pending': random.uniform(-0.2, 0.4),
            'Escalated': random.uniform(-0.5, 0.2),
            'Cancelled': random.uniform(-0.8, -0.2)
        }
        
        score = base_scores.get(resolution_status, 0.0)
        
        # Adjust for duration (longer interactions tend to have lower satisfaction)
        if duration > 1800:  # > 30 minutes
            score -= random.uniform(0.1, 0.3)
        elif duration > 900:  # > 15 minutes
            score -= random.uniform(0.05, 0.15)
        
        # Ensure score stays within bounds
        return max(-1.0, min(1.0, round(score, 2)))
    
    def generate_interaction(self, interaction_id: int, base_date: datetime) -> str:
        """Generate a single customer interaction"""
        customer_id = random.choice(self.customer_ids)
        channel_id = self.weighted_choice(self.channel_ids, self.channel_weights)
        interaction_type_id = self.weighted_choice(self.interaction_type_ids, self.interaction_weights)
        
        # 80% of interactions have an assigned agent
        agent_id = random.choice(self.agent_ids) if random.random() < 0.8 else None
        
        # Generate session ID
        session_id = f"SES_{uuid.uuid4().hex[:8].upper()}"
        
        # Generate timestamps
        start_offset = random.randint(0, 86400 * 30)  # Within 30 days
        start_timestamp = base_date + timedelta(seconds=start_offset)
        
        duration, queue_time = self.generate_duration(channel_id, interaction_type_id)
        end_timestamp = start_timestamp + timedelta(seconds=duration) if duration > 0 else None
        
        # Generate resolution status and satisfaction
        resolution_status = random.choices(self.resolution_statuses, weights=self.resolution_weights)[0]
        satisfaction_score = self.generate_satisfaction_score(resolution_status, duration)
        
        # Generate SQL INSERT statement
        agent_value = f"{agent_id}" if agent_id else "NULL"
        end_timestamp_value = f"'{end_timestamp}'" if end_timestamp else "NULL"
        duration_value = duration if duration > 0 else "NULL"
        
        sql = f"""INSERT INTO customer_interactions (
                    interaction_id, customer_id, channel_id, interaction_type_id, agent_id,
                    session_id, start_timestamp, end_timestamp, duration_seconds, queue_time_seconds,
                    resolution_status, satisfaction_score, language
                ) VALUES (
                    {interaction_id}, {customer_id}, {channel_id}, {interaction_type_id}, {agent_value},
                    '{session_id}', '{start_timestamp}', {end_timestamp_value}, {duration_value}, {queue_time},
                    '{resolution_status}', {satisfaction_score}, 'es'
                );"""
        
        return sql
    
    def generate_data(self, num_interactions: int) -> str:
        """Generate the complete synthetic dataset"""
        print(f"Generating {num_interactions} customer interactions...", file=sys.stderr)
        
        base_date = datetime.now() - timedelta(days=30)
        
        sql_statements = [
            "-- Simplified Synthetic Customer Interactions Data",
            f"-- Generated on: {datetime.now()}",
            f"-- Total interactions: {num_interactions}",
            "",
            "-- Insert Customer Interactions"
        ]
        
        for i in range(1, num_interactions + 1):
            sql_statements.append(self.generate_interaction(i, base_date))
            
            if i % 1000 == 0:
                print(f"Generated {i} interactions...", file=sys.stderr)
        
        print(f"Generation complete! Total interactions: {num_interactions}", file=sys.stderr)
        
        return "\n".join(sql_statements)

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 02_simplified_generate_synthetic_interactions.py <num_interactions>")
        sys.exit(1)
    
    try:
        num_interactions = int(sys.argv[1])
        if num_interactions <= 0:
            raise ValueError("Number of interactions must be positive")
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    generator = SimplifiedSyntheticDataGenerator()
    sql_output = generator.generate_data(num_interactions)
    
    print(sql_output)

if __name__ == "__main__":
    main()
