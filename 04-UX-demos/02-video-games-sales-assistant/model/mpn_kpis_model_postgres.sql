-- Mobile Private Network (MPN) KPIs Data Model - PostgreSQL Version

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS energy_metrics CASCADE;
DROP TABLE IF EXISTS capacity_metrics CASCADE;
DROP TABLE IF EXISTS qoe_metrics CASCADE;
DROP TABLE IF EXISTS interference_metrics CASCADE;
DROP TABLE IF EXISTS edge_metrics CASCADE;
DROP TABLE IF EXISTS sla_metrics CASCADE;
DROP TABLE IF EXISTS security_metrics CASCADE;
DROP TABLE IF EXISTS slice_metrics CASCADE;
DROP TABLE IF EXISTS ue_attach_metrics CASCADE;
DROP TABLE IF EXISTS resource_utilization_metrics CASCADE;
DROP TABLE IF EXISTS session_setup_metrics CASCADE;
DROP TABLE IF EXISTS handover_metrics CASCADE;
DROP TABLE IF EXISTS radio_signal_metrics CASCADE;
DROP TABLE IF EXISTS packet_loss_metrics CASCADE;
DROP TABLE IF EXISTS throughput_metrics CASCADE;
DROP TABLE IF EXISTS latency_metrics CASCADE;
DROP TABLE IF EXISTS availability_metrics CASCADE;
DROP TABLE IF EXISTS user_equipment CASCADE;
DROP TABLE IF EXISTS cells CASCADE;
DROP TABLE IF EXISTS networks CASCADE;

-- Core network infrastructure table
CREATE TABLE networks (
    network_id VARCHAR(50) PRIMARY KEY,
    network_name VARCHAR(100) NOT NULL,
    enterprise_client VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Base stations/cells table
CREATE TABLE cells (
    cell_id VARCHAR(50) PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_name VARCHAR(100),
    sector VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);

-- User Equipment (UE) devices table
CREATE TABLE user_equipment (
    ue_id VARCHAR(50) PRIMARY KEY,
    device_type VARCHAR(50),
    imei VARCHAR(20),
    network_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);

-- Network availability metrics
CREATE TABLE availability_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    uptime_seconds INT NOT NULL,
    total_seconds INT NOT NULL,
    availability_percentage DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);
CREATE INDEX idx_availability_network_timestamp ON availability_metrics(network_id, timestamp);

-- Latency measurements
CREATE TABLE latency_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    rtt_ms DECIMAL(8,3) NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_latency_network_timestamp ON latency_metrics(network_id, timestamp);

-- Throughput measurements
CREATE TABLE throughput_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_id VARCHAR(50),
    ue_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    uplink_mbps DECIMAL(10,3),
    downlink_mbps DECIMAL(10,3),
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_throughput_network_timestamp ON throughput_metrics(network_id, timestamp);

-- Packet loss measurements
CREATE TABLE packet_loss_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    packets_sent INT NOT NULL,
    packets_lost INT NOT NULL,
    loss_percentage DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_packet_loss_network_timestamp ON packet_loss_metrics(network_id, timestamp);

-- Radio signal quality measurements
CREATE TABLE radio_signal_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    rsrp_dbm DECIMAL(6,2),
    rsrq_db DECIMAL(6,2),
    sinr_db DECIMAL(6,2),
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_radio_signal_network_timestamp ON radio_signal_metrics(network_id, timestamp);

-- Handover events and success tracking
CREATE TABLE handover_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50) NOT NULL,
    source_cell_id VARCHAR(50) NOT NULL,
    target_cell_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    handover_successful BOOLEAN NOT NULL,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id),
    FOREIGN KEY (source_cell_id) REFERENCES cells(cell_id),
    FOREIGN KEY (target_cell_id) REFERENCES cells(cell_id)
);
CREATE INDEX idx_handover_network_timestamp ON handover_metrics(network_id, timestamp);

-- Call/Session setup attempts and success
CREATE TABLE session_setup_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    session_type VARCHAR(10) CHECK (session_type IN ('voice', 'data', 'video')) NOT NULL,
    setup_successful BOOLEAN NOT NULL,
    setup_time_ms INT,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_session_setup_network_timestamp ON session_setup_metrics(network_id, timestamp);

-- Resource utilization metrics
CREATE TABLE resource_utilization_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    prb_utilization_percentage DECIMAL(5,2),
    cpu_utilization_percentage DECIMAL(5,2),
    spectrum_utilization_percentage DECIMAL(5,2),
    memory_utilization_percentage DECIMAL(5,2),
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id)
);
CREATE INDEX idx_resource_util_network_timestamp ON resource_utilization_metrics(network_id, timestamp);

-- UE attach attempts and success
CREATE TABLE ue_attach_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    attach_successful BOOLEAN NOT NULL,
    attach_time_ms INT,
    failure_reason VARCHAR(100),
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_ue_attach_network_timestamp ON ue_attach_metrics(network_id, timestamp);

-- Network slice performance (critical for enterprise MPN)
CREATE TABLE slice_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    slice_id VARCHAR(50) NOT NULL,
    slice_type VARCHAR(10) CHECK (slice_type IN ('eMBB', 'URLLC', 'mMTC')) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    allocated_bandwidth_mbps DECIMAL(10,3),
    used_bandwidth_mbps DECIMAL(10,3),
    guaranteed_latency_ms INT,
    actual_latency_ms DECIMAL(8,3),
    active_ues INT,
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);
CREATE INDEX idx_slice_network_timestamp ON slice_metrics(network_id, timestamp);

-- Security and authentication metrics
CREATE TABLE security_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    authentication_attempts INT NOT NULL,
    authentication_failures INT NOT NULL,
    unauthorized_access_attempts INT DEFAULT 0,
    encryption_failures INT DEFAULT 0,
    certificate_expiry_alerts INT DEFAULT 0,
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);
CREATE INDEX idx_security_network_timestamp ON security_metrics(network_id, timestamp);

-- Service Level Agreement (SLA) compliance
CREATE TABLE sla_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    sla_type VARCHAR(20) CHECK (sla_type IN ('availability', 'latency', 'throughput', 'packet_loss')) NOT NULL,
    target_value DECIMAL(10,3) NOT NULL,
    actual_value DECIMAL(10,3) NOT NULL,
    compliance_status BOOLEAN NOT NULL,
    breach_duration_minutes INT DEFAULT 0,
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);
CREATE INDEX idx_sla_network_timestamp ON sla_metrics(network_id, timestamp);

-- Edge computing and MEC performance
CREATE TABLE edge_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    edge_node_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    cpu_usage_percentage DECIMAL(5,2),
    memory_usage_percentage DECIMAL(5,2),
    storage_usage_percentage DECIMAL(5,2),
    active_applications INT,
    response_time_ms DECIMAL(8,3),
    FOREIGN KEY (network_id) REFERENCES networks(network_id)
);
CREATE INDEX idx_edge_network_timestamp ON edge_metrics(network_id, timestamp);

-- Interference and spectrum efficiency
CREATE TABLE interference_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    interference_level_dbm DECIMAL(6,2),
    noise_floor_dbm DECIMAL(6,2),
    spectrum_efficiency_bps_hz DECIMAL(8,3),
    adjacent_channel_interference DECIMAL(6,2),
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id)
);
CREATE INDEX idx_interference_network_timestamp ON interference_metrics(network_id, timestamp);

-- Quality of Experience (QoE) metrics
CREATE TABLE qoe_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    ue_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    application_type VARCHAR(50) NOT NULL,
    mos_score DECIMAL(3,2), -- Mean Opinion Score (1-5)
    video_quality_score DECIMAL(3,2),
    audio_quality_score DECIMAL(3,2),
    session_duration_seconds INT,
    rebuffering_events INT DEFAULT 0,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (ue_id) REFERENCES user_equipment(ue_id)
);
CREATE INDEX idx_qoe_network_timestamp ON qoe_metrics(network_id, timestamp);

-- Network capacity and congestion
CREATE TABLE capacity_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    max_capacity_mbps DECIMAL(10,3) NOT NULL,
    current_load_mbps DECIMAL(10,3) NOT NULL,
    congestion_level VARCHAR(10) CHECK (congestion_level IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    active_bearers INT,
    rejected_connections INT DEFAULT 0,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id)
);
CREATE INDEX idx_capacity_network_timestamp ON capacity_metrics(network_id, timestamp);

-- Energy efficiency metrics (critical for sustainability)
CREATE TABLE energy_metrics (
    id BIGSERIAL PRIMARY KEY,
    network_id VARCHAR(50) NOT NULL,
    cell_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    power_consumption_watts DECIMAL(10,2) NOT NULL,
    energy_per_bit_joules DECIMAL(12,6),
    sleep_mode_percentage DECIMAL(5,2),
    renewable_energy_percentage DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (network_id) REFERENCES networks(network_id),
    FOREIGN KEY (cell_id) REFERENCES cells(cell_id)
);
CREATE INDEX idx_energy_network_timestamp ON energy_metrics(network_id, timestamp);
