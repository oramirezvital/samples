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

// Customer Care Analytics KPI Queries
export const kpiQueries = {
  // Total interactions trend (7 days)
  totalInteractions: `
    SELECT COUNT(*) as total_interactions,
           DATE(start_timestamp) as interaction_date
    FROM customer_interactions 
    WHERE start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(start_timestamp)
    ORDER BY interaction_date DESC
    LIMIT 7;
  `,
  
  // Average satisfaction trend (7 days)
  avgSatisfaction: `
    SELECT AVG(satisfaction_score) as avg_satisfaction,
           DATE(start_timestamp) as interaction_date
    FROM customer_interactions 
    WHERE satisfaction_score IS NOT NULL 
      AND start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(start_timestamp)
    ORDER BY interaction_date DESC
    LIMIT 7;
  `,
  
  // Channel performance (30 days)
  channelPerformance: `
    SELECT c.channel_name,
           COUNT(*) as interaction_count,
           AVG(ci.satisfaction_score) as avg_satisfaction,
           AVG(ci.duration_seconds) as avg_duration
    FROM customer_interactions ci
    JOIN channels c ON ci.channel_id = c.channel_id
    WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY c.channel_id, c.channel_name
    ORDER BY interaction_count DESC
    LIMIT 8;
  `,
  
  // Agent productivity (30 days)
  agentProductivity: `
    SELECT a.agent_name,
           a.department,
           COUNT(*) as interactions_handled,
           AVG(ci.satisfaction_score) as avg_satisfaction,
           AVG(ci.duration_seconds) as avg_duration
    FROM customer_interactions ci
    JOIN agents a ON ci.agent_id = a.agent_id
    WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
      AND ci.agent_id IS NOT NULL
    GROUP BY a.agent_id, a.agent_name, a.department
    ORDER BY interactions_handled DESC
    LIMIT 10;
  `,
  
  // Resolution rate trend (7 days)
  resolutionRate: `
    SELECT resolution_status,
           COUNT(*) as count,
           DATE(start_timestamp) as interaction_date
    FROM customer_interactions
    WHERE start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY resolution_status, DATE(start_timestamp)
    ORDER BY interaction_date DESC;
  `,
  
  // Today's statistics
  todayStats: `
    SELECT COUNT(*) as today_interactions,
           AVG(satisfaction_score) as today_satisfaction,
           COUNT(CASE WHEN resolution_status = 'Resolved' THEN 1 END) * 100.0 / COUNT(*) as today_resolution_rate
    FROM customer_interactions
    WHERE DATE(start_timestamp) = CURRENT_DATE;
  `,
  
  // Customer segment analysis
  customerSegments: `
    SELECT c.customer_segment,
           COUNT(DISTINCT ci.customer_id) as unique_customers,
           COUNT(*) as total_interactions,
           AVG(ci.satisfaction_score) as avg_satisfaction
    FROM customer_interactions ci
    JOIN customers c ON ci.customer_id = c.customer_id
    WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY c.customer_segment
    ORDER BY total_interactions DESC;
  `,
  
  // Interaction types analysis
  interactionTypes: `
    SELECT it.interaction_name,
           it.category,
           COUNT(*) as interaction_count,
           AVG(ci.duration_seconds) as avg_duration,
           AVG(ci.satisfaction_score) as avg_satisfaction
    FROM customer_interactions ci
    JOIN interaction_types it ON ci.interaction_type_id = it.interaction_type_id
    WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY it.interaction_type_id, it.interaction_name, it.category
    ORDER BY interaction_count DESC
    LIMIT 10;
  `,
  
  // Service plan performance
  servicePlans: `
    SELECT sp.plan_name,
           sp.plan_type,
           COUNT(DISTINCT csp.customer_id) as customer_count,
           COUNT(ci.interaction_id) as total_interactions,
           AVG(ci.satisfaction_score) as avg_satisfaction
    FROM service_plans sp
    JOIN customer_service_plans csp ON sp.service_plan_id = csp.service_plan_id
    LEFT JOIN customer_interactions ci ON csp.customer_id = ci.customer_id
    WHERE csp.is_active = TRUE
      AND (ci.start_timestamp IS NULL OR ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days')
    GROUP BY sp.service_plan_id, sp.plan_name, sp.plan_type
    ORDER BY customer_count DESC
    LIMIT 10;
  `
};

// Parse query results based on the response format from your agent
export const parseQueryResult = (result, queryType) => {
  try {
    // This parser should be adapted based on your agent's actual response format
    // For now, providing mock data that matches the expected structure
    
    switch (queryType) {
      case 'totalInteractions':
        return [
          { total_interactions: 1247, interaction_date: '2025-08-05' },
          { total_interactions: 1220, interaction_date: '2025-08-04' },
          { total_interactions: 1250, interaction_date: '2025-08-03' },
          { total_interactions: 1300, interaction_date: '2025-08-02' },
          { total_interactions: 1180, interaction_date: '2025-08-01' },
          { total_interactions: 1200, interaction_date: '2025-07-31' },
          { total_interactions: 1150, interaction_date: '2025-07-30' }
        ];
      
      case 'avgSatisfaction':
        return [
          { avg_satisfaction: 0.72, interaction_date: '2025-08-05' },
          { avg_satisfaction: 0.70, interaction_date: '2025-08-04' },
          { avg_satisfaction: 0.73, interaction_date: '2025-08-03' },
          { avg_satisfaction: 0.74, interaction_date: '2025-08-02' },
          { avg_satisfaction: 0.69, interaction_date: '2025-08-01' },
          { avg_satisfaction: 0.71, interaction_date: '2025-07-31' },
          { avg_satisfaction: 0.68, interaction_date: '2025-07-30' }
        ];
      
      case 'channelPerformance':
        return [
          { channel_name: 'Phone', interaction_count: 450, avg_satisfaction: 0.75, avg_duration: 420 },
          { channel_name: 'Web Chat', interaction_count: 320, avg_satisfaction: 0.78, avg_duration: 280 },
          { channel_name: 'Email', interaction_count: 280, avg_satisfaction: 0.65, avg_duration: null },
          { channel_name: 'Mobile App', interaction_count: 150, avg_satisfaction: 0.82, avg_duration: 180 },
          { channel_name: 'WhatsApp', interaction_count: 120, avg_satisfaction: 0.80, avg_duration: 240 },
          { channel_name: 'In-Store', interaction_count: 80, avg_satisfaction: 0.85, avg_duration: 900 },
          { channel_name: 'Social Media', interaction_count: 60, avg_satisfaction: 0.70, avg_duration: null },
          { channel_name: 'SMS', interaction_count: 40, avg_satisfaction: 0.60, avg_duration: null }
        ];
      
      case 'agentProductivity':
        return [
          { agent_name: 'María González', department: 'Customer Service', interactions_handled: 145, avg_satisfaction: 0.78, avg_duration: 380 },
          { agent_name: 'Carlos Rodríguez', department: 'Technical Support', interactions_handled: 132, avg_satisfaction: 0.75, avg_duration: 520 },
          { agent_name: 'Ana Martínez', department: 'Billing', interactions_handled: 128, avg_satisfaction: 0.72, avg_duration: 340 },
          { agent_name: 'Luis Hernández', department: 'Customer Service', interactions_handled: 115, avg_satisfaction: 0.70, avg_duration: 420 },
          { agent_name: 'Carmen López', department: 'Technical Support', interactions_handled: 108, avg_satisfaction: 0.76, avg_duration: 480 },
          { agent_name: 'Roberto Silva', department: 'Sales', interactions_handled: 95, avg_satisfaction: 0.80, avg_duration: 360 },
          { agent_name: 'Patricia Morales', department: 'Customer Service', interactions_handled: 87, avg_satisfaction: 0.74, avg_duration: 400 },
          { agent_name: 'Diego Vargas', department: 'Technical Support', interactions_handled: 82, avg_satisfaction: 0.68, avg_duration: 540 }
        ];
      
      case 'resolutionRate':
        return [
          { resolution_status: 'Resolved', count: 980, interaction_date: '2025-08-05' },
          { resolution_status: 'Pending', count: 187, interaction_date: '2025-08-05' },
          { resolution_status: 'Escalated', count: 62, interaction_date: '2025-08-05' },
          { resolution_status: 'Cancelled', count: 18, interaction_date: '2025-08-05' },
          { resolution_status: 'Resolved', count: 945, interaction_date: '2025-08-04' },
          { resolution_status: 'Pending', count: 195, interaction_date: '2025-08-04' },
          { resolution_status: 'Escalated', count: 65, interaction_date: '2025-08-04' },
          { resolution_status: 'Cancelled', count: 15, interaction_date: '2025-08-04' }
        ];
      
      case 'todayStats':
        return [{ 
          today_interactions: 1247, 
          today_satisfaction: 0.72, 
          today_resolution_rate: 78.5 
        }];
      
      case 'customerSegments':
        return [
          { customer_segment: 'Standard', unique_customers: 6, total_interactions: 3200, avg_satisfaction: 0.71 },
          { customer_segment: 'Premium', unique_customers: 3, total_interactions: 2800, avg_satisfaction: 0.78 },
          { customer_segment: 'Basic', unique_customers: 1, total_interactions: 1500, avg_satisfaction: 0.68 }
        ];
      
      case 'interactionTypes':
        return [
          { interaction_name: 'Billing Inquiry', category: 'Billing', interaction_count: 1200, avg_duration: 320, avg_satisfaction: 0.70 },
          { interaction_name: 'Technical Support', category: 'Technical', interaction_count: 980, avg_duration: 480, avg_satisfaction: 0.72 },
          { interaction_name: 'General Information', category: 'Support', interaction_count: 850, avg_duration: 180, avg_satisfaction: 0.75 },
          { interaction_name: 'Plan Change Request', category: 'Account', interaction_count: 650, avg_duration: 420, avg_satisfaction: 0.74 },
          { interaction_name: 'Service Complaint', category: 'Support', interaction_count: 580, avg_duration: 720, avg_satisfaction: 0.65 }
        ];
      
      case 'servicePlans':
        return [
          { plan_name: 'Standard Mobile', plan_type: 'Postpaid', customer_count: 3, total_interactions: 1200, avg_satisfaction: 0.72 },
          { plan_name: 'Premium Mobile', plan_type: 'Postpaid', customer_count: 2, total_interactions: 980, avg_satisfaction: 0.78 },
          { plan_name: 'Unlimited Pro', plan_type: 'Postpaid', customer_count: 2, total_interactions: 850, avg_satisfaction: 0.80 },
          { plan_name: 'Basic Mobile', plan_type: 'Prepaid', customer_count: 2, total_interactions: 650, avg_satisfaction: 0.68 },
          { plan_name: 'Family Plan', plan_type: 'Postpaid', customer_count: 1, total_interactions: 420, avg_satisfaction: 0.75 }
        ];
      
      default:
        return [];
    }
  } catch (error) {
    console.error('Error parsing query result:', error);
    return [];
  }
};
