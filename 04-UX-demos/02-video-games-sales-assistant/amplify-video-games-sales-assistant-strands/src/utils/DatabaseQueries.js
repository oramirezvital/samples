import { AGENT_ENDPOINT_URL } from '../env';

// Utility function to execute SQL queries through the agent
export const executeDirectQuery = async (sqlQuery, description = '') => {
  try {
    const response = await fetch(AGENT_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bedrock_model_id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
        prompt: `Please execute this SQL query directly and return only the raw results: ${sqlQuery}`,
        prompt_uuid: `direct-query-${Date.now()}`,
        user_timezone: 'America/Mexico_City',
        session_id: `kpi-${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read the streaming response
    const reader = response.body.getReader();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
    }

    return result;
  } catch (error) {
    console.error('Error executing direct query:', error);
    throw error;
  }
};

// KPI-specific queries
export const kpiQueries = {
  dailyUsage: `
    SELECT 
      DATE(usage_date) as date,
      ROUND(SUM(data_usage_mb + data_usage_roaming_mb) / 1024.0, 2) as total_gb
    FROM daily_usage 
    WHERE usage_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(usage_date)
    ORDER BY date DESC
    LIMIT 7;
  `,
  
  simInventory: `
    SELECT 
      sim_status,
      COUNT(*) as count
    FROM sim_inventory 
    GROUP BY sim_status
    ORDER BY count DESC;
  `,
  
  lineSubscriptions: `
    SELECT COUNT(*) as total_active_lines
    FROM line_subscriptions 
    WHERE status = 'ACTIVE';
  `,
  
  lineSubscriptionsTrend: `
    SELECT 
      DATE_TRUNC('week', created_at) as week,
      COUNT(*) as weekly_count
    FROM line_subscriptions 
    WHERE status = 'ACTIVE' 
      AND created_at >= CURRENT_DATE - INTERVAL '7 weeks'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week ASC
    LIMIT 7;
  `,
  
  devices: `
    SELECT 
      device_type,
      COUNT(*) as count
    FROM devices 
    WHERE status = 'ACTIVE'
    GROUP BY device_type
    ORDER BY count DESC;
  `,
  
  totalDevices: `
    SELECT COUNT(*) as total_devices
    FROM devices 
    WHERE status = 'ACTIVE';
  `,
  
  todayUsage: `
    SELECT 
      ROUND(SUM(data_usage_mb + data_usage_roaming_mb) / 1024.0 / 1024.0, 2) as total_tb
    FROM daily_usage 
    WHERE usage_date = CURRENT_DATE;
  `
};

// Parse query results (simplified - you might need more robust parsing)
export const parseQueryResult = (result, queryType) => {
  try {
    // This is a simplified parser - in production you'd want more robust parsing
    // The actual result format depends on how your agent returns data
    
    // For now, return mock data structure
    // You would implement actual parsing based on your agent's response format
    
    switch (queryType) {
      case 'dailyUsage':
        return [
          { date: '2025-08-02', total_gb: 68.2 },
          { date: '2025-08-01', total_gb: 75.1 },
          { date: '2025-07-31', total_gb: 49.8 },
          { date: '2025-07-30', total_gb: 65.3 },
          { date: '2025-07-29', total_gb: 38.7 },
          { date: '2025-07-28', total_gb: 52.4 },
          { date: '2025-07-27', total_gb: 45.9 }
        ];
      
      case 'simInventory':
        return [
          { sim_status: 'ACTIVE', count: 8450 },
          { sim_status: 'INVENTORY', count: 1200 },
          { sim_status: 'SUSPENDED', count: 350 }
        ];
      
      case 'devices':
        return [
          { device_type: 'SMARTPHONE', count: 5200 },
          { device_type: 'TABLET', count: 3800 },
          { device_type: 'IOT_DEVICE', count: 1500 },
          { device_type: 'HOTSPOT', count: 800 },
          { device_type: 'OTHER', count: 200 }
        ];
      
      case 'lineSubscriptions':
        return [{ total_active_lines: 13005 }];
      
      case 'totalDevices':
        return [{ total_devices: 11500 }];
      
      case 'todayUsage':
        return [{ total_tb: 68.2 }];
      
      default:
        return [];
    }
  } catch (error) {
    console.error('Error parsing query result:', error);
    return [];
  }
};
