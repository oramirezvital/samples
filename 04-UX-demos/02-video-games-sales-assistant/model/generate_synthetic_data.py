#!/usr/bin/env python3
import random
import datetime
import argparse
from faker import Faker
import uuid

fake = Faker()

# Configuration
NUM_NETWORKS = 3
NUM_CELLS_PER_NETWORK = 5
NUM_UES_PER_NETWORK = 20
DAYS_OF_DATA = 7
RECORDS_PER_HOUR = 12  # 5-minute intervals

def generate_timestamp(days_back=0, hours_back=0, minutes_back=0):
    base = datetime.datetime.now() - datetime.timedelta(days=days_back, hours=hours_back, minutes=minutes_back)
    return base.strftime('%Y-%m-%d %H:%M:%S')

def generate_networks():
    mexican_companies = [
        'Grupo Bimbo', 'FEMSA', 'Grupo México',
        'Cemex', 'Walmart de México',  'Televisa', 
        'Grupo Alfa', 'Banorte', 'BBVA México', 'Santander México', 'Grupo Lala'
    ]
    networks = []
    for i in range(NUM_NETWORKS):
        networks.append({
            'network_id': f'MPN-{i+1:03d}',
            'network_name': f'Enterprise Network {i+1}',
            'enterprise_client': mexican_companies[i % len(mexican_companies)],
            'location': fake.city(),
            'created_at': generate_timestamp(days_back=random.randint(30, 365))
        })
    return networks

def generate_cells(networks):
    cells = []
    for network in networks:
        for i in range(NUM_CELLS_PER_NETWORK):
            cells.append({
                'cell_id': f'{network["network_id"]}-CELL-{i+1:02d}',
                'network_id': network['network_id'],
                'cell_name': f'Cell {i+1}',
                'sector': random.choice(['A', 'B', 'C']),
                'latitude': round(random.uniform(25.0, 49.0), 6),
                'longitude': round(random.uniform(-125.0, -66.0), 6)
            })
    return cells

def generate_user_equipment(networks):
    ues = []
    for network in networks:
        for i in range(NUM_UES_PER_NETWORK):
            ues.append({
                'ue_id': f'{network["network_id"]}-UE-{i+1:03d}',
                'device_type': random.choice(['smartphone', 'tablet', 'iot_sensor', 'laptop', 'industrial_device']),
                'imei': ''.join([str(random.randint(0, 9)) for _ in range(15)]),
                'network_id': network['network_id']
            })
    return ues

def generate_availability_metrics(networks):
    metrics = []
    for network in networks:
        for day in range(DAYS_OF_DATA):
            for hour in range(24):
                uptime = random.randint(3580, 3600)  # 99.4% - 100% availability
                metrics.append({
                    'network_id': network['network_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                    'uptime_seconds': uptime,
                    'total_seconds': 3600,
                    'availability_percentage': round((uptime/3600)*100, 2)
                })
    return metrics

def generate_latency_metrics(networks, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for _ in range(RECORDS_PER_HOUR):
                ue = random.choice(ues)
                metrics.append({
                    'network_id': ue['network_id'],
                    'ue_id': ue['ue_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour, minutes_back=random.randint(0, 59)),
                    'rtt_ms': round(random.uniform(1.0, 50.0), 3)
                })
    return metrics

def generate_throughput_metrics(networks, cells, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for _ in range(RECORDS_PER_HOUR):
                ue = random.choice(ues)
                cell = random.choice([c for c in cells if c['network_id'] == ue['network_id']])
                metrics.append({
                    'network_id': ue['network_id'],
                    'cell_id': cell['cell_id'],
                    'ue_id': ue['ue_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour, minutes_back=random.randint(0, 59)),
                    'uplink_mbps': round(random.uniform(10.0, 100.0), 3),
                    'downlink_mbps': round(random.uniform(50.0, 500.0), 3)
                })
    return metrics

def generate_packet_loss_metrics(networks, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for _ in range(RECORDS_PER_HOUR):
                ue = random.choice(ues)
                packets_sent = random.randint(1000, 10000)
                packets_lost = random.randint(0, int(packets_sent * 0.05))  # Max 5% loss
                metrics.append({
                    'network_id': ue['network_id'],
                    'ue_id': ue['ue_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour, minutes_back=random.randint(0, 59)),
                    'packets_sent': packets_sent,
                    'packets_lost': packets_lost,
                    'loss_percentage': round((packets_lost/packets_sent)*100, 2)
                })
    return metrics

def generate_radio_signal_metrics(networks, cells, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for _ in range(RECORDS_PER_HOUR):
                ue = random.choice(ues)
                cell = random.choice([c for c in cells if c['network_id'] == ue['network_id']])
                metrics.append({
                    'network_id': ue['network_id'],
                    'cell_id': cell['cell_id'],
                    'ue_id': ue['ue_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour, minutes_back=random.randint(0, 59)),
                    'rsrp_dbm': round(random.uniform(-120.0, -70.0), 2),
                    'rsrq_db': round(random.uniform(-20.0, -3.0), 2),
                    'sinr_db': round(random.uniform(-5.0, 30.0), 2)
                })
    return metrics

def generate_handover_metrics(networks, cells, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for _ in range(random.randint(50, 200)):  # Random handovers per day
            ue = random.choice(ues)
            network_cells = [c for c in cells if c['network_id'] == ue['network_id']]
            source_cell = random.choice(network_cells)
            target_cell = random.choice([c for c in network_cells if c['cell_id'] != source_cell['cell_id']])
            metrics.append({
                'network_id': ue['network_id'],
                'ue_id': ue['ue_id'],
                'source_cell_id': source_cell['cell_id'],
                'target_cell_id': target_cell['cell_id'],
                'timestamp': generate_timestamp(days_back=day, hours_back=random.randint(0, 23), minutes_back=random.randint(0, 59)),
                'handover_successful': random.choice([True] * 95 + [False] * 5)  # 95% success rate
            })
    return metrics

def generate_session_setup_metrics(networks, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for _ in range(random.randint(100, 500)):  # Random sessions per day
            ue = random.choice(ues)
            metrics.append({
                'network_id': ue['network_id'],
                'ue_id': ue['ue_id'],
                'timestamp': generate_timestamp(days_back=day, hours_back=random.randint(0, 23), minutes_back=random.randint(0, 59)),
                'session_type': random.choice(['voice', 'data', 'video']),
                'setup_successful': random.choice([True] * 98 + [False] * 2),  # 98% success rate
                'setup_time_ms': random.randint(100, 2000)
            })
    return metrics

def generate_resource_utilization_metrics(networks, cells):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for cell in cells:
                metrics.append({
                    'network_id': cell['network_id'],
                    'cell_id': cell['cell_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                    'prb_utilization_percentage': round(random.uniform(20.0, 85.0), 2),
                    'cpu_utilization_percentage': round(random.uniform(30.0, 90.0), 2),
                    'spectrum_utilization_percentage': round(random.uniform(40.0, 95.0), 2),
                    'memory_utilization_percentage': round(random.uniform(25.0, 80.0), 2)
                })
    return metrics

def generate_ue_attach_metrics(networks, ues):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for _ in range(random.randint(50, 200)):  # Random attach attempts per day
            ue = random.choice(ues)
            success = random.choice([True] * 97 + [False] * 3)  # 97% success rate
            metrics.append({
                'network_id': ue['network_id'],
                'ue_id': ue['ue_id'],
                'timestamp': generate_timestamp(days_back=day, hours_back=random.randint(0, 23), minutes_back=random.randint(0, 59)),
                'attach_successful': success,
                'attach_time_ms': random.randint(500, 3000) if success else None,
                'failure_reason': None if success else random.choice(['Authentication Failed', 'Network Congestion', 'Invalid Credentials'])
            })
    return metrics

def generate_slice_metrics(networks):
    metrics = []
    slice_types = ['eMBB', 'URLLC', 'mMTC']
    for network in networks:
        for slice_type in slice_types:
            for day in range(DAYS_OF_DATA):
                for hour in range(24):
                    allocated_bw = random.uniform(100.0, 1000.0)
                    used_bw = random.uniform(allocated_bw * 0.3, allocated_bw * 0.9)
                    metrics.append({
                        'network_id': network['network_id'],
                        'slice_id': f'{network["network_id"]}-{slice_type}',
                        'slice_type': slice_type,
                        'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                        'allocated_bandwidth_mbps': round(allocated_bw, 3),
                        'used_bandwidth_mbps': round(used_bw, 3),
                        'guaranteed_latency_ms': 1 if slice_type == 'URLLC' else (10 if slice_type == 'eMBB' else 100),
                        'actual_latency_ms': round(random.uniform(0.5, 2.0) if slice_type == 'URLLC' else random.uniform(5.0, 15.0), 3),
                        'active_ues': random.randint(5, 50)
                    })
    return metrics

def generate_security_metrics(networks):
    metrics = []
    for network in networks:
        for day in range(DAYS_OF_DATA):
            for hour in range(0, 24, 4):  # Every 4 hours
                auth_attempts = random.randint(100, 1000)
                auth_failures = random.randint(0, int(auth_attempts * 0.05))
                metrics.append({
                    'network_id': network['network_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                    'authentication_attempts': auth_attempts,
                    'authentication_failures': auth_failures,
                    'unauthorized_access_attempts': random.randint(0, 5),
                    'encryption_failures': random.randint(0, 2),
                    'certificate_expiry_alerts': random.randint(0, 1)
                })
    return metrics

def generate_sla_metrics(networks):
    metrics = []
    sla_types = ['availability', 'latency', 'throughput', 'packet_loss']
    targets = {'availability': 99.9, 'latency': 10.0, 'throughput': 100.0, 'packet_loss': 0.1}
    
    for network in networks:
        for sla_type in sla_types:
            for day in range(DAYS_OF_DATA):
                for hour in range(24):
                    target = targets[sla_type]
                    if sla_type == 'availability':
                        actual = random.uniform(99.5, 100.0)
                    elif sla_type == 'latency':
                        actual = random.uniform(5.0, 15.0)
                    elif sla_type == 'throughput':
                        actual = random.uniform(80.0, 120.0)
                    else:  # packet_loss
                        actual = random.uniform(0.0, 0.3)
                    
                    compliance = (actual >= target) if sla_type in ['availability', 'throughput'] else (actual <= target)
                    
                    metrics.append({
                        'network_id': network['network_id'],
                        'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                        'sla_type': sla_type,
                        'target_value': target,
                        'actual_value': round(actual, 3),
                        'compliance_status': compliance,
                        'breach_duration_minutes': 0 if compliance else random.randint(1, 60)
                    })
    return metrics

def generate_edge_metrics(networks):
    metrics = []
    for network in networks:
        for i in range(2):  # 2 edge nodes per network
            edge_node_id = f'{network["network_id"]}-EDGE-{i+1:02d}'
            for day in range(DAYS_OF_DATA):
                for hour in range(24):
                    metrics.append({
                        'network_id': network['network_id'],
                        'edge_node_id': edge_node_id,
                        'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                        'cpu_usage_percentage': round(random.uniform(20.0, 85.0), 2),
                        'memory_usage_percentage': round(random.uniform(30.0, 80.0), 2),
                        'storage_usage_percentage': round(random.uniform(40.0, 90.0), 2),
                        'active_applications': random.randint(5, 25),
                        'response_time_ms': round(random.uniform(1.0, 10.0), 3)
                    })
    return metrics

def generate_interference_metrics(networks, cells):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(0, 24, 2):  # Every 2 hours
            for cell in cells:
                metrics.append({
                    'network_id': cell['network_id'],
                    'cell_id': cell['cell_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                    'interference_level_dbm': round(random.uniform(-110.0, -80.0), 2),
                    'noise_floor_dbm': round(random.uniform(-120.0, -100.0), 2),
                    'spectrum_efficiency_bps_hz': round(random.uniform(2.0, 8.0), 3),
                    'adjacent_channel_interference': round(random.uniform(-60.0, -40.0), 2)
                })
    return metrics

def generate_qoe_metrics(networks, ues):
    metrics = []
    apps = ['video_streaming', 'voice_call', 'web_browsing', 'file_download', 'gaming']
    
    for day in range(DAYS_OF_DATA):
        for _ in range(random.randint(200, 800)):  # Random QoE measurements per day
            ue = random.choice(ues)
            app = random.choice(apps)
            metrics.append({
                'network_id': ue['network_id'],
                'ue_id': ue['ue_id'],
                'timestamp': generate_timestamp(days_back=day, hours_back=random.randint(0, 23), minutes_back=random.randint(0, 59)),
                'application_type': app,
                'mos_score': round(random.uniform(3.5, 5.0), 2),
                'video_quality_score': round(random.uniform(3.0, 5.0), 2) if 'video' in app else None,
                'audio_quality_score': round(random.uniform(3.5, 5.0), 2) if 'voice' in app or 'video' in app else None,
                'session_duration_seconds': random.randint(30, 3600),
                'rebuffering_events': random.randint(0, 5) if 'video' in app else 0
            })
    return metrics

def generate_capacity_metrics(networks, cells):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for cell in cells:
                max_cap = random.uniform(500.0, 2000.0)
                current_load = random.uniform(max_cap * 0.2, max_cap * 0.9)
                utilization = current_load / max_cap
                
                if utilization < 0.5:
                    congestion = 'low'
                elif utilization < 0.7:
                    congestion = 'medium'
                elif utilization < 0.9:
                    congestion = 'high'
                else:
                    congestion = 'critical'
                
                metrics.append({
                    'network_id': cell['network_id'],
                    'cell_id': cell['cell_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                    'max_capacity_mbps': round(max_cap, 3),
                    'current_load_mbps': round(current_load, 3),
                    'congestion_level': congestion,
                    'active_bearers': random.randint(10, 200),
                    'rejected_connections': random.randint(0, 10) if congestion == 'critical' else 0
                })
    return metrics

def generate_energy_metrics(networks, cells):
    metrics = []
    for day in range(DAYS_OF_DATA):
        for hour in range(24):
            for cell in cells:
                power_consumption = random.uniform(2000.0, 8000.0)  # Watts
                metrics.append({
                    'network_id': cell['network_id'],
                    'cell_id': cell['cell_id'],
                    'timestamp': generate_timestamp(days_back=day, hours_back=23-hour),
                    'power_consumption_watts': round(power_consumption, 2),
                    'energy_per_bit_joules': round(random.uniform(0.000001, 0.00001), 6),
                    'sleep_mode_percentage': round(random.uniform(10.0, 40.0), 2),
                    'renewable_energy_percentage': round(random.uniform(0.0, 30.0), 2)
                })
    return metrics

def write_sql_inserts(filename, table_name, data):
    with open(filename, 'a') as f:
        for record in data:
            columns = ', '.join(record.keys())
            values = []
            for value in record.values():
                if value is None:
                    values.append('NULL')
                elif isinstance(value, bool):
                    values.append('true' if value else 'false')
                elif isinstance(value, str):
                    values.append(f"'{value.replace("'", "''")}'")
                else:
                    values.append(str(value))
            
            values_str = ', '.join(values)
            f.write(f"INSERT INTO {table_name} ({columns}) VALUES ({values_str});\n")

def main():
    parser = argparse.ArgumentParser(description='Generate synthetic MPN KPI data')
    parser.add_argument('--truncate', action='store_true', 
                       help='Truncate existing tables before inserting new data')
    args = parser.parse_args()
    
    print("Generating synthetic MPN data...")
    
    # Generate base data
    networks = generate_networks()
    cells = generate_cells(networks)
    ues = generate_user_equipment(networks)
    
    # Clear output file and add header
    with open('synthetic_data.sql', 'w') as f:
        f.write("-- Synthetic MPN KPI Data\n-- Generated on " + datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n\n")
        
        # Add truncate statements if requested
        if args.truncate:
            f.write("-- Truncating existing tables\n")
            tables = [
                'energy_metrics', 'capacity_metrics', 'qoe_metrics', 'interference_metrics',
                'edge_metrics', 'sla_metrics', 'security_metrics', 'slice_metrics',
                'ue_attach_metrics', 'resource_utilization_metrics', 'session_setup_metrics',
                'handover_metrics', 'radio_signal_metrics', 'packet_loss_metrics',
                'throughput_metrics', 'latency_metrics', 'availability_metrics',
                'user_equipment', 'cells', 'networks'
            ]
            for table in tables:
                f.write(f"TRUNCATE TABLE {table} CASCADE;\n")
            f.write("\n")
    
    # Generate and write all metrics
    datasets = [
        ('networks', networks),
        ('cells', cells),
        ('user_equipment', ues),
        ('availability_metrics', generate_availability_metrics(networks)),
        ('latency_metrics', generate_latency_metrics(networks, ues)),
        ('throughput_metrics', generate_throughput_metrics(networks, cells, ues)),
        ('packet_loss_metrics', generate_packet_loss_metrics(networks, ues)),
        ('radio_signal_metrics', generate_radio_signal_metrics(networks, cells, ues)),
        ('handover_metrics', generate_handover_metrics(networks, cells, ues)),
        ('session_setup_metrics', generate_session_setup_metrics(networks, ues)),
        ('resource_utilization_metrics', generate_resource_utilization_metrics(networks, cells)),
        ('ue_attach_metrics', generate_ue_attach_metrics(networks, ues)),
        ('slice_metrics', generate_slice_metrics(networks)),
        ('security_metrics', generate_security_metrics(networks)),
        ('sla_metrics', generate_sla_metrics(networks)),
        ('edge_metrics', generate_edge_metrics(networks)),
        ('interference_metrics', generate_interference_metrics(networks, cells)),
        ('qoe_metrics', generate_qoe_metrics(networks, ues)),
        ('capacity_metrics', generate_capacity_metrics(networks, cells)),
        ('energy_metrics', generate_energy_metrics(networks, cells))
    ]
    
    for table_name, data in datasets:
        print(f"Writing {len(data)} records for {table_name}...")
        write_sql_inserts('synthetic_data.sql', table_name, data)
    
    truncate_msg = " with table truncation" if args.truncate else ""
    print(f"Synthetic data generation complete{truncate_msg}! Check synthetic_data.sql")

if __name__ == "__main__":
    main()
