import { executeQuery } from './AwsCalls';

// KPI Queries for Mobile Private Network (MPN) metrics
export const kpiQueries = {
  // Network overview
  networkCount: `
    SELECT COUNT(*) as total_networks
    FROM networks
  `,
  
  networksByClient: `
    SELECT enterprise_client, COUNT(*) as network_count
    FROM networks
    GROUP BY enterprise_client
    ORDER BY network_count DESC
  `,
  
  // Cell infrastructure
  cellCount: `
    SELECT COUNT(*) as total_cells
    FROM cells
  `,
  
  cellsByNetwork: `
    SELECT n.network_name, COUNT(c.cell_id) as cell_count
    FROM networks n
    LEFT JOIN cells c ON n.network_id = c.network_id
    GROUP BY n.network_id, n.network_name
    ORDER BY cell_count DESC
    LIMIT 10
  `,
  
  // User equipment
  ueCount: `
    SELECT COUNT(*) as total_devices
    FROM user_equipment
  `,
  
  ueByType: `
    SELECT device_type, COUNT(*) as device_count
    FROM user_equipment
    GROUP BY device_type
    ORDER BY device_count DESC
  `,
  
  // Network availability (last 24 hours)
  networkAvailability: `
    SELECT 
      DATE_TRUNC('hour', am.timestamp) as time_hour,
      ROUND(AVG(am.availability_percentage), 2) as avg_availability
    FROM availability_metrics am
    WHERE am.timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('hour', am.timestamp)
    ORDER BY time_hour DESC
    LIMIT 50
  `,
  
  // Average latency (last 24 hours)
  averageLatency: `
    SELECT 
      DATE_TRUNC('hour', lm.timestamp) as time_hour,
      n.network_name,
      ROUND(AVG(lm.rtt_ms), 2) as avg_latency_ms
    FROM networks n
    JOIN latency_metrics lm ON n.network_id = lm.network_id
    WHERE lm.timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('hour', lm.timestamp), n.network_id, n.network_name
    ORDER BY time_hour DESC, n.network_name
    LIMIT 150
  `,
  
  // Throughput performance (last 24 hours)
  averageThroughput: `
    SELECT 
      n.network_name,
      AVG(tm.downlink_mbps) as avg_downlink_mbps,
      AVG(tm.uplink_mbps) as avg_uplink_mbps
    FROM networks n
    JOIN throughput_metrics tm ON n.network_id = tm.network_id
    WHERE tm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name
    ORDER BY avg_downlink_mbps DESC
    LIMIT 10
  `,
  
  // Packet loss (last 24 hours)
  packetLoss: `
    SELECT 
      n.network_name,
      AVG(plm.loss_percentage) as avg_packet_loss
    FROM networks n
    JOIN packet_loss_metrics plm ON n.network_id = plm.network_id
    WHERE plm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name
    ORDER BY avg_packet_loss ASC
    LIMIT 10
  `,
  
  // Handover success rate (last 24 hours)
  handoverSuccess: `
    SELECT 
      n.network_name,
      COUNT(*) as total_handovers,
      SUM(CASE WHEN hm.handover_successful THEN 1 ELSE 0 END) as successful_handovers,
      ROUND(
        (SUM(CASE WHEN hm.handover_successful THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2
      ) as success_rate_percentage
    FROM networks n
    JOIN handover_metrics hm ON n.network_id = hm.network_id
    WHERE hm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name
    HAVING COUNT(*) > 0
    ORDER BY success_rate_percentage DESC
    LIMIT 10
  `,
  
  // Security incidents (last 24 hours)
  securityMetrics: `
    SELECT 
      n.network_name,
      SUM(sm.authentication_failures) as total_auth_failures,
      SUM(sm.unauthorized_access_attempts) as total_unauthorized_attempts,
      SUM(sm.encryption_failures) as total_encryption_failures
    FROM networks n
    JOIN security_metrics sm ON n.network_id = sm.network_id
    WHERE sm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name
    ORDER BY total_auth_failures DESC
    LIMIT 10
  `,
  
  // SLA compliance (last 24 hours)
  slaCompliance: `
    SELECT 
      n.network_name,
      sm.sla_type,
      COUNT(*) as total_measurements,
      SUM(CASE WHEN sm.compliance_status THEN 1 ELSE 0 END) as compliant_measurements,
      ROUND(
        (SUM(CASE WHEN sm.compliance_status THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2
      ) as compliance_percentage
    FROM networks n
    JOIN sla_metrics sm ON n.network_id = sm.network_id
    WHERE sm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name, sm.sla_type
    ORDER BY n.network_name, sm.sla_type
  `,
  
  // Network slice performance (last 24 hours)
  slicePerformance: `
    SELECT 
      n.network_name,
      sm.slice_type,
      AVG(sm.used_bandwidth_mbps) as avg_used_bandwidth,
      AVG(sm.actual_latency_ms) as avg_latency,
      AVG(sm.active_ues) as avg_active_ues
    FROM networks n
    JOIN slice_metrics sm ON n.network_id = sm.network_id
    WHERE sm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name, sm.slice_type
    ORDER BY n.network_name, sm.slice_type
  `,
  
  // Resource utilization (last 24 hours)
  resourceUtilization: `
    SELECT 
      n.network_name,
      AVG(rum.cpu_utilization_percentage) as avg_cpu_utilization,
      AVG(rum.memory_utilization_percentage) as avg_memory_utilization,
      AVG(rum.spectrum_utilization_percentage) as avg_spectrum_utilization
    FROM networks n
    JOIN resource_utilization_metrics rum ON n.network_id = rum.network_id
    WHERE rum.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name
    ORDER BY avg_cpu_utilization DESC
    LIMIT 10
  `,
  
  // Quality of Experience (last 24 hours)
  qualityOfExperience: `
    SELECT 
      n.network_name,
      qm.application_type,
      AVG(qm.mos_score) as avg_mos_score,
      COUNT(*) as total_sessions
    FROM networks n
    JOIN qoe_metrics qm ON n.network_id = qm.network_id
    WHERE qm.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name, qm.application_type
    ORDER BY n.network_name, avg_mos_score DESC
  `,
  
  // Energy efficiency (last 24 hours)
  energyEfficiency: `
    SELECT 
      n.network_name,
      AVG(em.power_consumption_watts) as avg_power_consumption,
      AVG(em.renewable_energy_percentage) as avg_renewable_percentage
    FROM networks n
    JOIN energy_metrics em ON n.network_id = em.network_id
    WHERE em.timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY n.network_id, n.network_name
    ORDER BY avg_power_consumption ASC
    LIMIT 10
  `
};

// Execute direct query function
export const executeDirectQuery = async (query, description = '') => {
  try {
    console.log(`Executing query: ${description}`);
    const result = await executeQuery(query);
    console.log(`Query result for ${description}:`, result);
    return result;
  } catch (error) {
    console.error(`Error executing query ${description}:`, error);
    throw error;
  }
};

// Parse query results for different KPI types
export const parseQueryResult = (result, type) => {
  if (!result || !result.data || result.data.length === 0) {
    console.warn(`No data found for ${type}`);
    return { value: '0', chartData: null };
  }

  const data = result.data;

  switch (type) {
    case 'networkCount':
      return {
        value: data[0]?.total_networks?.toString() || '0',
        chartData: null
      };

    case 'cellCount':
      return {
        value: data[0]?.total_cells?.toString() || '0',
        chartData: null
      };

    case 'ueCount':
      return {
        value: data[0]?.total_devices?.toString() || '0',
        chartData: null
      };

    case 'networksByClient':
      return {
        value: data.length.toString(),
        chartData: {
          series: data.map(item => item.network_count),
          labels: data.map(item => item.enterprise_client),
          type: 'pie'
        }
      };

    case 'ueByType':
      return {
        value: data.reduce((sum, item) => sum + item.device_count, 0).toString(),
        chartData: {
          series: data.map(item => item.device_count),
          labels: data.map(item => item.device_type),
          type: 'donut'
        }
      };

    case 'networkAvailability':
      return {
        value: data.length > 0 ? `${data[0]?.avg_availability?.toFixed(2) || '0'}%` : '0%',
        chartData: {
          series: [{
            name: 'Availability %',
            data: data.map(item => parseFloat(item.avg_availability || 0).toFixed(2))
          }],
          categories: data.map(item => item.network_name),
          type: 'bar'
        }
      };

    case 'averageLatency':
      return {
        value: data.length > 0 ? `${data[0]?.avg_latency_ms?.toFixed(2) || '0'}ms` : '0ms',
        chartData: {
          series: [{
            name: 'Latency (ms)',
            data: data.map(item => parseFloat(item.avg_latency_ms || 0).toFixed(2))
          }],
          categories: data.map(item => item.network_name),
          type: 'line'
        }
      };

    case 'averageThroughput':
      return {
        value: data.length > 0 ? `${data[0]?.avg_downlink_mbps?.toFixed(2) || '0'} Mbps` : '0 Mbps',
        chartData: {
          series: [
            {
              name: 'Downlink (Mbps)',
              data: data.map(item => parseFloat(item.avg_downlink_mbps || 0).toFixed(2))
            },
            {
              name: 'Uplink (Mbps)',
              data: data.map(item => parseFloat(item.avg_uplink_mbps || 0).toFixed(2))
            }
          ],
          categories: data.map(item => item.network_name),
          type: 'bar'
        }
      };

    case 'handoverSuccess':
      return {
        value: data.length > 0 ? `${data[0]?.success_rate_percentage || '0'}%` : '0%',
        chartData: {
          series: [{
            name: 'Success Rate %',
            data: data.map(item => parseFloat(item.success_rate_percentage || 0))
          }],
          categories: data.map(item => item.network_name),
          type: 'bar'
        }
      };

    case 'slaCompliance':
      const slaData = data.reduce((acc, item) => {
        if (!acc[item.network_name]) {
          acc[item.network_name] = {};
        }
        acc[item.network_name][item.sla_type] = parseFloat(item.compliance_percentage || 0);
        return acc;
      }, {});

      return {
        value: data.length > 0 ? `${Object.keys(slaData).length} Networks` : '0 Networks',
        chartData: {
          series: Object.keys(slaData).map(networkName => ({
            name: networkName,
            data: Object.values(slaData[networkName])
          })),
          categories: ['Availability', 'Latency', 'Throughput', 'Packet Loss'],
          type: 'radar'
        }
      };

    default:
      return {
        value: '0',
        chartData: null
      };
  }
};
