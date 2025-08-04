#!/usr/bin/env python3
"""
Synthetic Data Generator for Customer Care Interactions
Generates realistic customer interaction data for 2025
Can be run multiple times to add more data to the database
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json
import argparse

class SyntheticDataGenerator:
    def __init__(self, num_customers: int = 1000, num_interactions: int = 10000):
        self.num_customers = num_customers
        self.num_interactions = num_interactions
        self.start_date = datetime(2025, 1, 1)
        self.end_date = datetime(2025, 12, 31)
        
        # Customer segments distribution
        self.customer_segments = {
            'Basic': 0.40,
            'Standard': 0.35,
            'Premium': 0.20,
            'VIP': 0.05
        }
        
        # Regional distribution
        self.regions = {'R9': 0.70, 'DEUR': 0.30}
        
        # Customer types distribution
        self.customer_types = {
            'prepaid': 0.60,
            'postpaid': 0.35,
            'hybrid': 0.05
        }
        
        # Channel usage patterns (realistic distribution)
        self.channel_patterns = {
            'Mobile App': 0.35,
            'Web Portal': 0.20,
            'WhatsApp Bot': 0.15,
            'Voice Call Center': 0.12,
            'IVR System': 0.08,
            'Facebook Messenger': 0.05,
            'SMS Service': 0.03,
            'Video Support': 0.01,
            'Email Support': 0.01
        }
        
        # Interaction type patterns by channel
        self.interaction_patterns = {
            'Mobile App': {
                'BALANCE_QUERY': 0.25, 'TOP_UP': 0.20, 'DATA_USAGE': 0.15,
                'PAYMENT_PROCESS': 0.12, 'ADDON_PURCHASE': 0.10, 'PLAN_INFO': 0.08,
                'TECHNICAL_SUPPORT': 0.05, 'HISTORY_QUERY': 0.05
            },
            'Web Portal': {
                'INVOICE_DOWNLOAD': 0.20, 'PAYMENT_PROCESS': 0.18, 'PLAN_CHANGE': 0.15,
                'ACCOUNT_UPDATE': 0.12, 'BILLING_DISPUTE': 0.10, 'ADDON_PURCHASE': 0.10,
                'TECHNICAL_SUPPORT': 0.08, 'BALANCE_QUERY': 0.07
            },
            'WhatsApp Bot': {
                'BALANCE_QUERY': 0.30, 'TOP_UP': 0.25, 'DATA_USAGE': 0.15,
                'PLAN_INFO': 0.10, 'ROAMING_INFO': 0.08, 'GENERAL_INQUIRY': 0.07,
                'STORE_LOCATOR': 0.05
            },
            'Voice Call Center': {
                'TECHNICAL_SUPPORT': 0.25, 'BILLING_DISPUTE': 0.20, 'COMPLAINT_FILING': 0.15,
                'PLAN_CHANGE': 0.12, 'SIM_REPLACEMENT': 0.10, 'ACCOUNT_CLOSURE': 0.08,
                'ESCALATION': 0.10
            },
            'IVR System': {
                'BALANCE_QUERY': 0.40, 'PAYMENT_INQUIRY': 0.20, 'TOP_UP': 0.15,
                'HOURS_INFO': 0.10, 'GENERAL_INQUIRY': 0.10, 'STORE_LOCATOR': 0.05
            }
        }
        
        # Bot vs Human patterns by interaction complexity
        self.bot_success_rates = {
            'low': 0.85,      # 85% bot success for low complexity
            'medium': 0.65,   # 65% bot success for medium complexity  
            'high': 0.35,     # 35% bot success for high complexity
            'critical': 0.10  # 10% bot success for critical complexity
        }
        
        # Device and client distributions
        self.devices = {
            'android': 0.55, 'ios': 0.35, 'web': 0.08, 'other': 0.02
        }
        
        self.browsers = {
            'chrome': 0.45, 'safari': 0.25, 'firefox': 0.15, 'edge': 0.10, 'other': 0.05
        }
        
        # Satisfaction patterns
        self.satisfaction_patterns = {
            'bot_success': [4, 5],      # High satisfaction for successful bot interactions
            'bot_escalated': [2, 3, 4], # Mixed satisfaction for escalated interactions
            'human_success': [4, 5],     # High satisfaction for successful human interactions
            'failed': [1, 2]            # Low satisfaction for failed interactions
        }

    def weighted_choice(self, choices: Dict[str, float]) -> str:
        """Select item based on weighted probabilities"""
        items = list(choices.keys())
        weights = list(choices.values())
        return random.choices(items, weights=weights)[0]

    def generate_customers(self) -> List[Dict]:
        """Generate synthetic customer data"""
        customers = []
        spanish_names = [
            'María García', 'José Rodríguez', 'Ana Martínez', 'Carlos López', 'Laura González',
            'Miguel Hernández', 'Carmen Pérez', 'Francisco Sánchez', 'Isabel Ramírez', 'Antonio Torres',
            'Pilar Flores', 'Manuel Morales', 'Rosa Jiménez', 'Juan Ruiz', 'Dolores Moreno',
            'Pedro Muñoz', 'Josefa Álvarez', 'Alejandro Romero', 'Teresa Gutiérrez', 'Ángel Navarro'
        ]
        
        for i in range(self.num_customers):
            customer_type = self.weighted_choice(self.customer_types)
            region = self.weighted_choice(self.regions)
            segment = self.weighted_choice(self.customer_segments)
            
            # Generate MSISDN based on region
            if region == 'R9':
                msisdn = f"504{random.randint(10000000, 99999999)}"
            else:  # DEUR
                msisdn = f"349{random.randint(10000000, 99999999)}"
            
            # Generate customer data based on segment
            if segment == 'VIP':
                clv = random.uniform(2000, 5000)
                churn_risk = random.uniform(0.05, 0.15)
                nps_score = random.randint(8, 10)
            elif segment == 'Premium':
                clv = random.uniform(800, 2000)
                churn_risk = random.uniform(0.10, 0.25)
                nps_score = random.randint(6, 9)
            elif segment == 'Standard':
                clv = random.uniform(300, 800)
                churn_risk = random.uniform(0.20, 0.40)
                nps_score = random.randint(4, 8)
            else:  # Basic
                clv = random.uniform(100, 300)
                churn_risk = random.uniform(0.30, 0.60)
                nps_score = random.randint(2, 7)
            
            customer = {
                'customer_id': str(uuid.uuid4()),
                'msisdn': msisdn,
                'customer_name': random.choice(spanish_names),
                'customer_type': customer_type,
                'region': region,
                'account_status': random.choices(['active', 'suspended'], weights=[0.95, 0.05])[0],
                'registration_date': (datetime.now() - timedelta(days=random.randint(30, 1095))).date(),
                'customer_segment': segment,
                'customer_lifetime_value': round(clv, 2),
                'churn_risk_score': round(churn_risk, 2),
                'nps_score': nps_score,
                'current_balance': round(random.uniform(0, 100), 2) if customer_type in ['prepaid', 'hybrid'] else None,
                'credit_limit': round(random.uniform(100, 1000), 2) if customer_type in ['postpaid', 'hybrid'] else None,
                'preferred_contact_time': random.choice(['morning', 'afternoon', 'evening']),
                'communication_preferences': json.dumps({
                    'email': random.choice([True, False]),
                    'sms': random.choice([True, False]),
                    'push_notifications': random.choice([True, False])
                })
            }
            customers.append(customer)
        
        return customers

    def generate_interactions(self, customers: List[Dict]) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """Generate synthetic interaction data"""
        interactions = []
        steps = []
        journeys = []
        
        # Get channel and interaction type mappings
        channels = list(self.channel_patterns.keys())
        
        for i in range(self.num_interactions):
            # Select customer and channel
            customer = random.choice(customers)
            channel = self.weighted_choice(self.channel_patterns)
            
            # Select interaction type based on channel
            if channel in self.interaction_patterns:
                interaction_code = self.weighted_choice(self.interaction_patterns[channel])
            else:
                interaction_code = 'GENERAL_INQUIRY'
            
            # Generate timing
            interaction_start = self.start_date + timedelta(
                seconds=random.randint(0, int((self.end_date - self.start_date).total_seconds()))
            )
            
            # Determine interaction complexity and bot success
            complexity = random.choices(['low', 'medium', 'high', 'critical'], weights=[0.5, 0.3, 0.15, 0.05])[0]
            bot_succeeds = random.random() < self.bot_success_rates[complexity]
            
            # Generate interaction details
            interaction_id = str(uuid.uuid4())
            session_id = f"session_{random.randint(100000, 999999)}"
            
            # Determine interaction mode and durations
            if channel in ['Voice Call Center', 'Video Support']:
                interaction_mode = 'live_chat'
                bot_duration = 0
                human_duration = random.randint(120, 600)
                escalated = False
            elif channel == 'IVR System':
                interaction_mode = 'ivr'
                bot_duration = random.randint(30, 180)
                human_duration = 0
                escalated = False
            elif channel == 'SMS Service':
                interaction_mode = 'self_service'
                bot_duration = 0
                human_duration = 0
                escalated = False
            else:
                # Digital channels with bot capability
                if bot_succeeds:
                    interaction_mode = 'bot'
                    bot_duration = random.randint(30, 300)
                    human_duration = 0
                    escalated = False
                else:
                    interaction_mode = 'live_chat'
                    bot_duration = random.randint(60, 180)  # Time before escalation
                    human_duration = random.randint(120, 600)
                    escalated = True
            
            total_duration = bot_duration + human_duration
            queue_time = random.randint(0, 120) if interaction_mode == 'live_chat' else 0
            
            # Determine interaction outcome
            if interaction_mode == 'bot' and bot_succeeds:
                status = 'completed'
                resolution_status = 'resolved'
                satisfaction_pool = self.satisfaction_patterns['bot_success']
            elif escalated:
                status = random.choices(['completed', 'failed'], weights=[0.85, 0.15])[0]
                resolution_status = 'resolved' if status == 'completed' else 'unresolved'
                satisfaction_pool = self.satisfaction_patterns['bot_escalated']
            elif interaction_mode == 'live_chat':
                status = random.choices(['completed', 'failed'], weights=[0.90, 0.10])[0]
                resolution_status = 'resolved' if status == 'completed' else 'partially_resolved'
                satisfaction_pool = self.satisfaction_patterns['human_success']
            else:
                status = random.choices(['completed', 'failed', 'abandoned'], weights=[0.70, 0.20, 0.10])[0]
                resolution_status = 'resolved' if status == 'completed' else 'unresolved'
                satisfaction_pool = self.satisfaction_patterns['failed'] if status == 'failed' else [3, 4]
            
            # Generate device and client info
            device_type = self.weighted_choice(self.devices)
            if device_type == 'web':
                client_type = self.weighted_choice(self.browsers)
                operating_system = random.choice(['Windows 10', 'Windows 11', 'macOS', 'Linux'])
            elif device_type == 'android':
                client_type = 'mobile_app'
                operating_system = f"Android {random.randint(9, 14)}"
            elif device_type == 'ios':
                client_type = 'mobile_app'
                operating_system = f"iOS {random.randint(14, 17)}"
            else:
                client_type = 'other'
                operating_system = 'Unknown'
            
            interaction = {
                'interaction_id': interaction_id,
                'customer_id': customer['customer_id'],
                'channel_name': channel,
                'interaction_code': interaction_code,
                'session_id': session_id,
                'start_timestamp': interaction_start,
                'end_timestamp': interaction_start + timedelta(seconds=total_duration),
                'duration_seconds': total_duration,
                'queue_time_seconds': queue_time,
                'interaction_status': status,
                'resolution_status': resolution_status,
                'interaction_mode': interaction_mode,
                'bot_duration_seconds': bot_duration,
                'human_duration_seconds': human_duration,
                'escalated_to_human': escalated,
                'escalation_reason': 'Complex issue requiring human expertise' if escalated else None,
                'escalation_timestamp': interaction_start + timedelta(seconds=bot_duration) if escalated else None,
                'device_type': device_type,
                'client_type': client_type,
                'operating_system': operating_system,
                'connection_type': random.choice(['wifi', '4g', '5g', '3g']),
                'customer_satisfaction_score': random.choice(satisfaction_pool),
                'customer_effort_score': random.randint(1, 7),
                'net_promoter_score': random.randint(0, 10),
                'resolution_on_first_contact': status == 'completed' and not escalated,
                'number_of_attempts': 1,
                'interaction_value': round(random.uniform(0, 100), 2) if interaction_code in ['ADDON_PURCHASE', 'PLAN_CHANGE', 'TOP_UP'] else 0,
                'cost_to_serve': round(0.25 if interaction_mode == 'bot' else 2.50, 2),
                'customer_intent': f"Resolve {interaction_code.lower().replace('_', ' ')}",
                'sentiment_score': round(random.uniform(-0.5, 1.0), 2),
                'language_used': 'es'
            }
            
            interactions.append(interaction)
            
            # Generate interaction steps
            step_count = random.randint(2, 6)
            for step_num in range(1, step_count + 1):
                step_duration = random.randint(10, 60)
                step_start = interaction_start + timedelta(seconds=sum(range(step_num * 20)))
                
                step = {
                    'step_id': str(uuid.uuid4()),
                    'interaction_id': interaction_id,
                    'step_sequence': step_num,
                    'step_type': random.choice(['authentication', 'menu_selection', 'data_input', 'processing', 'result']),
                    'step_name': f"Step {step_num}",
                    'step_status': 'completed' if step_num < step_count else ('failed' if status == 'failed' else 'completed'),
                    'start_timestamp': step_start,
                    'end_timestamp': step_start + timedelta(seconds=step_duration),
                    'duration_seconds': step_duration
                }
                steps.append(step)
        
        # Generate journey sessions (group related interactions)
        journey_sessions = {}
        for interaction in interactions:
            session_key = f"{interaction['customer_id']}_{interaction['start_timestamp'].date()}"
            if session_key not in journey_sessions:
                journey_sessions[session_key] = {
                    'session_id': str(uuid.uuid4()),
                    'customer_id': interaction['customer_id'],
                    'interactions': [],
                    'session_start': interaction['start_timestamp'],
                    'session_end': interaction['end_timestamp'],
                    'channels_used': set()
                }
            
            journey_sessions[session_key]['interactions'].append(interaction)
            journey_sessions[session_key]['channels_used'].add(interaction['channel_name'])
            if interaction['end_timestamp'] > journey_sessions[session_key]['session_end']:
                journey_sessions[session_key]['session_end'] = interaction['end_timestamp']
        
        # Convert journey sessions to list
        for session_data in journey_sessions.values():
            total_duration = int((session_data['session_end'] - session_data['session_start']).total_seconds())
            goal_achieved = all(i['interaction_status'] == 'completed' for i in session_data['interactions'])
            
            journey = {
                'session_id': session_data['session_id'],
                'customer_id': session_data['customer_id'],
                'session_start': session_data['session_start'],
                'session_end': session_data['session_end'],
                'total_duration_seconds': total_duration,
                'total_interactions': len(session_data['interactions']),
                'journey_outcome': 'completed' if goal_achieved else 'partially_completed',
                'goal_achieved': goal_achieved,
                'cross_channel_journey': len(session_data['channels_used']) > 1,
                'touchpoints_count': len(session_data['interactions'])
            }
            journeys.append(journey)
        
        return interactions, steps, journeys

    def generate_sql_file(self, filename: str):
        """Generate SQL file with synthetic data"""
        print(f"Generating {self.num_customers} customers and {self.num_interactions} interactions...")
        
        customers = self.generate_customers()
        interactions, steps, journeys = self.generate_interactions(customers)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("-- Synthetic Customer Care Data\n")
            f.write(f"-- Generated on: {datetime.now()}\n")
            f.write(f"-- Customers: {len(customers)}, Interactions: {len(interactions)}\n\n")
            
            # Insert customers
            f.write("-- Insert Customers\n")
            for customer in customers:
                f.write(f"""INSERT INTO customers (
                    customer_id, msisdn, customer_name, customer_type, region, account_status,
                    registration_date, customer_segment, customer_lifetime_value, churn_risk_score,
                    nps_score, current_balance, credit_limit, preferred_contact_time, communication_preferences
                ) VALUES (
                    '{customer['customer_id']}', '{customer['msisdn']}', '{customer['customer_name']}',
                    '{customer['customer_type']}', '{customer['region']}', '{customer['account_status']}',
                    '{customer['registration_date']}', '{customer['customer_segment']}',
                    {customer['customer_lifetime_value']}, {customer['churn_risk_score']},
                    {customer['nps_score']}, {customer['current_balance'] or 'NULL'},
                    {customer['credit_limit'] or 'NULL'}, '{customer['preferred_contact_time']}',
                    '{customer['communication_preferences']}'::jsonb
                ) ON CONFLICT (msisdn) DO NOTHING;\n""")
            
            f.write("\n-- Insert Journey Sessions\n")
            for journey in journeys:
                f.write(f"""INSERT INTO customer_journey_sessions (
                    session_id, customer_id, session_start, session_end, total_duration_seconds,
                    total_interactions, journey_outcome, goal_achieved, cross_channel_journey, touchpoints_count
                ) VALUES (
                    '{journey['session_id']}', '{journey['customer_id']}',
                    '{journey['session_start']}', '{journey['session_end']}',
                    {journey['total_duration_seconds']}, {journey['total_interactions']},
                    '{journey['journey_outcome']}', {journey['goal_achieved']},
                    {journey['cross_channel_journey']}, {journey['touchpoints_count']}
                ) ON CONFLICT (session_id) DO NOTHING;\n""")
            
            f.write("\n-- Insert Interactions\n")
            for interaction in interactions:
                escalation_ts = f"'{interaction['escalation_timestamp']}'" if interaction['escalation_timestamp'] else 'NULL'
                escalation_reason = f"'{interaction['escalation_reason']}'" if interaction['escalation_reason'] else 'NULL'
                
                f.write(f"""INSERT INTO customer_interactions (
                    interaction_id, customer_id, channel_id, interaction_type_id, session_id,
                    start_timestamp, end_timestamp, duration_seconds, queue_time_seconds,
                    interaction_status, resolution_status, interaction_mode,
                    bot_duration_seconds, human_duration_seconds, escalated_to_human,
                    escalation_reason, escalation_timestamp, device_type, client_type,
                    operating_system, connection_type, customer_satisfaction_score,
                    customer_effort_score, net_promoter_score, resolution_on_first_contact,
                    number_of_attempts, interaction_value, cost_to_serve, customer_intent,
                    sentiment_score, language_used
                ) VALUES (
                    '{interaction['interaction_id']}', '{interaction['customer_id']}',
                    (SELECT channel_id FROM channels WHERE channel_name = '{interaction['channel_name']}'),
                    (SELECT interaction_type_id FROM interaction_types WHERE interaction_code = '{interaction['interaction_code']}'),
                    '{interaction['session_id']}', '{interaction['start_timestamp']}',
                    '{interaction['end_timestamp']}', {interaction['duration_seconds']},
                    {interaction['queue_time_seconds']}, '{interaction['interaction_status']}',
                    '{interaction['resolution_status']}', '{interaction['interaction_mode']}',
                    {interaction['bot_duration_seconds']}, {interaction['human_duration_seconds']},
                    {interaction['escalated_to_human']}, {escalation_reason}, {escalation_ts},
                    '{interaction['device_type']}', '{interaction['client_type']}',
                    '{interaction['operating_system']}', '{interaction['connection_type']}',
                    {interaction['customer_satisfaction_score']}, {interaction['customer_effort_score']},
                    {interaction['net_promoter_score']}, {interaction['resolution_on_first_contact']},
                    {interaction['number_of_attempts']}, {interaction['interaction_value']},
                    {interaction['cost_to_serve']}, '{interaction['customer_intent']}',
                    {interaction['sentiment_score']}, '{interaction['language_used']}'
                );\n""")
            
            f.write("\n-- Insert Interaction Steps\n")
            for step in steps:
                f.write(f"""INSERT INTO interaction_steps (
                    step_id, interaction_id, step_sequence, step_type, step_name,
                    step_status, start_timestamp, end_timestamp, duration_seconds
                ) VALUES (
                    '{step['step_id']}', '{step['interaction_id']}', {step['step_sequence']},
                    '{step['step_type']}', '{step['step_name']}', '{step['step_status']}',
                    '{step['start_timestamp']}', '{step['end_timestamp']}', {step['duration_seconds']}
                );\n""")
            
            f.write("\n-- Summary\n")
            f.write(f"-- Generated {len(customers)} customers\n")
            f.write(f"-- Generated {len(interactions)} interactions\n")
            f.write(f"-- Generated {len(steps)} interaction steps\n")
            f.write(f"-- Generated {len(journeys)} journey sessions\n")
        
        print(f"✅ SQL file generated: {filename}")
        print(f"📊 Summary:")
        print(f"   - Customers: {len(customers)}")
        print(f"   - Interactions: {len(interactions)}")
        print(f"   - Interaction Steps: {len(steps)}")
        print(f"   - Journey Sessions: {len(journeys)}")

def main():
    parser = argparse.ArgumentParser(description='Generate synthetic customer care interaction data')
    parser.add_argument('--customers', type=int, default=1000, help='Number of customers to generate')
    parser.add_argument('--interactions', type=int, default=10000, help='Number of interactions to generate')
    parser.add_argument('--output', type=str, default='synthetic_interactions.sql', help='Output SQL file name')
    
    args = parser.parse_args()
    
    generator = SyntheticDataGenerator(args.customers, args.interactions)
    generator.generate_sql_file(args.output)

if __name__ == "__main__":
    main()
