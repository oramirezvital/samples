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

// KPI-specific queries for wireless carrier data model
export const kpiQueries = {
  dailyUsage: `
    SELECT 
      DATE(usage_date) as date,
      ROUND(SUM(data_mb + data_mb_roaming) / 1024.0, 2) as total_gb
    FROM daily_usage 
    WHERE usage_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(usage_date)
    ORDER BY date DESC
    LIMIT 7;
  `,
  
  enterpriseCount: `
    SELECT COUNT(*) as total_enterprises
    FROM enterprises 
    WHERE status = 'ACTIVE';
  `,
  
  enterprisesByIndustry: `
    SELECT 
      industry,
      COUNT(*) as count
    FROM enterprises 
    WHERE status = 'ACTIVE'
    GROUP BY industry
    ORDER BY count DESC
    LIMIT 5;
  `,
  
  lineSubscriptions: `
    SELECT COUNT(*) as total_active_lines
    FROM lines 
    WHERE status = 'ACTIVE';
  `,
  
  lineSubscriptionsTrend: `
    SELECT 
      DATE(activation_date) as date,
      COUNT(*) as daily_activations,
      SUM(COUNT(*)) OVER (ORDER BY DATE(activation_date)) as cumulative_lines
    FROM lines 
    WHERE status = 'ACTIVE' 
      AND activation_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(activation_date)
    ORDER BY date ASC
    LIMIT 7;
  `,
  
  devices: `
    SELECT 
      device_type,
      COUNT(*) as count
    FROM devices 
    WHERE status IN ('ACTIVE', 'INACTIVE')
    GROUP BY device_type
    ORDER BY count DESC;
  `,
  
  totalDevices: `
    SELECT COUNT(*) as total_devices
    FROM devices 
    WHERE status IN ('ACTIVE', 'INACTIVE');
  `,
  
  todayUsage: `
    SELECT 
      ROUND(SUM(data_mb + data_mb_roaming) / 1024.0 / 1024.0, 2) as total_tb
    FROM daily_usage 
    WHERE usage_date = CURRENT_DATE;
  `,
  
  usageTotals: `
    SELECT 
      ROUND(SUM(data_mb + data_mb_roaming) / 1024.0, 2) as total_data_gb,
      ROUND(SUM(voice_minutes + voice_minutes_roaming), 0) as total_voice_minutes,
      SUM(sms_count + sms_count_roaming) as total_sms_count
    FROM daily_usage 
    WHERE usage_date >= CURRENT_DATE - INTERVAL '30 days';
  `,
  
  usageTotalsDaily: `
    SELECT 
      DATE(usage_date) as date,
      ROUND(SUM(data_mb + data_mb_roaming) / 1024.0, 2) as daily_data_gb,
      ROUND(SUM(voice_minutes + voice_minutes_roaming), 0) as daily_voice_minutes,
      SUM(sms_count + sms_count_roaming) as daily_sms_count
    FROM daily_usage 
    WHERE usage_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(usage_date)
    ORDER BY date DESC
    LIMIT 7;
  `,
  
  billingOverview: `
    SELECT 
      COUNT(*) as total_bills,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_bill_amount,
      COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) as overdue_bills
    FROM bills 
    WHERE billing_period_start >= CURRENT_DATE - INTERVAL '6 months';
  `,
  
  monthlyRevenue: `
    SELECT 
      DATE_TRUNC('month', billing_period_start) as month,
      SUM(total_amount) as monthly_revenue
    FROM bills 
    WHERE billing_period_start >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', billing_period_start)
    ORDER BY month DESC
    LIMIT 6;
  `
};

// Parse query results from actual database responses
export const parseQueryResult = (result, queryType) => {
  try {
    console.log(`Parsing ${queryType} result:`, result);
    
    // First, try to extract JSON from the response
    let parsedData = extractJSONFromResponse(result);
    if (parsedData) {
      console.log(`Successfully parsed JSON for ${queryType}:`, parsedData);
      return Array.isArray(parsedData) ? parsedData : [parsedData];
    }
    
    // If no JSON found, parse as table format
    console.log(`No JSON found for ${queryType}, trying table parsing...`);
    const tableResult = parseTableResponse(result, queryType);
    console.log(`Table parsing result for ${queryType}:`, tableResult);
    return tableResult;
    
  } catch (error) {
    console.error(`Error parsing ${queryType} query result:`, error);
    return [];
  }
};

// Helper function to extract JSON from various response formats
const extractJSONFromResponse = (result) => {
  try {
    // Look for JSON wrapped in code blocks
    const codeBlockMatch = result.match(/```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```/s);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    
    // Look for JSON arrays or objects in the text
    const jsonArrayMatch = result.match(/\[[\s\S]*?\]/);
    if (jsonArrayMatch) {
      return JSON.parse(jsonArrayMatch[0]);
    }
    
    const jsonObjectMatch = result.match(/\{[\s\S]*?\}/);
    if (jsonObjectMatch) {
      return JSON.parse(jsonObjectMatch[0]);
    }
    
    // Look for multiple JSON objects on separate lines
    const lines = result.split('\n');
    const jsonObjects = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          jsonObjects.push(JSON.parse(trimmed));
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
    if (jsonObjects.length > 0) {
      return jsonObjects;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Helper function to parse table-formatted responses
const parseTableResponse = (result, queryType) => {
  try {
    const lines = result.split('\n').map(line => line.trim()).filter(line => line);
    
    // Find table data (lines with | separators or data rows)
    let dataLines = [];
    let headerLine = null;
    let inTable = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip SQL queries, explanatory text, and markdown
      if (line.includes('SELECT') || line.includes('FROM') || line.includes('WHERE') || 
          line.includes('I\'ll execute') || line.includes('Query to') || 
          line.includes('Raw results') || line.includes('Getting') ||
          line.includes('Counting') || line.includes('Executing') ||
          line.startsWith('```')) {
        continue;
      }
      
      // Look for table separator lines (like ------------)
      if (line.match(/^[-|]+$/)) {
        inTable = true;
        continue;
      }
      
      // Look for table headers or data with | separators
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          if (!headerLine && cells.some(cell => 
            cell.includes('_') || cell.toLowerCase().includes('date') || 
            cell.toLowerCase().includes('count') || cell.toLowerCase().includes('total') ||
            cell.toLowerCase().includes('industry') || cell.toLowerCase().includes('device')
          )) {
            headerLine = cells;
          } else if (headerLine || inTable) {
            dataLines.push(cells);
          }
        }
      } 
      // Look for single column data (like the total_active_lines example)
      else if (inTable || (i > 0 && lines[i-1].match(/^[-]+$/))) {
        // This is likely data under a header
        const trimmed = line.trim();
        if (trimmed && !trimmed.match(/^[-]+$/) && trimmed.match(/^\d/)) {
          // Find the header from previous lines
          for (let j = i - 1; j >= 0; j--) {
            const prevLine = lines[j].trim();
            if (prevLine && !prevLine.match(/^[-]+$/) && !prevLine.includes('SELECT')) {
              // This might be our header
              dataLines.push([prevLine, trimmed]);
              break;
            }
          }
        }
      }
      // Look for space-separated data
      else if (line.match(/^\w+\s+\d/) || line.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = line.split(/\s{2,}|\t/).filter(part => part.trim());
        if (parts.length > 1) {
          dataLines.push(parts);
        }
      }
    }
    
    // If no table format found, try to extract single values
    if (dataLines.length === 0) {
      console.log(`No table data found for ${queryType}, trying single value parsing...`);
      return parseSingleValueResponse(result, queryType);
    }
    
    // Convert table data to objects based on query type
    const objects = convertTableToObjects(dataLines, queryType, headerLine);
    console.log(`Converted table to objects for ${queryType}:`, objects);
    return objects;
    
  } catch (error) {
    console.error(`Error parsing table response for ${queryType}:`, error);
    return [];
  }
};

// Helper function to parse single value responses
const parseSingleValueResponse = (result, queryType) => {
  const lines = result.split('\n').map(line => line.trim()).filter(line => line);
  
  for (const line of lines) {
    // Skip explanatory text
    if (line.includes('SELECT') || line.includes('I\'ll execute') || line.includes('Query') || 
        line.includes('Raw results') || line.includes('Count') || line.includes('Getting') ||
        line.includes('Counting') || line.includes('Calculating') || line.includes('---')) {
      continue;
    }
    
    // Look for numeric values
    const numberMatch = line.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1]);
      
      switch (queryType) {
        case 'enterpriseCount':
          return [{ total_enterprises: value }];
        case 'lineSubscriptions':
          return [{ total_active_lines: value }];
        case 'totalDevices':
          return [{ total_devices: value }];
        case 'todayUsage':
          return [{ total_tb: value }];
        default:
          return [{ value: value }];
      }
    }
  }
  
  // If no number found, try to parse table-like single column data
  const headerLine = lines.find(line => 
    line.includes('total_') || line.includes('count') || line.includes('enterprises') || 
    line.includes('devices') || line.includes('lines') || line.includes('tb')
  );
  
  if (headerLine) {
    const headerIndex = lines.indexOf(headerLine);
    // Look for the value in subsequent lines
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^\d+(\.\d+)?$/) || line.match(/^-+$/)) {
        if (!line.match(/^-+$/)) {
          const value = parseFloat(line);
          
          if (headerLine.includes('total_enterprises')) {
            return [{ total_enterprises: value }];
          } else if (headerLine.includes('total_active_lines')) {
            return [{ total_active_lines: value }];
          } else if (headerLine.includes('total_devices')) {
            return [{ total_devices: value }];
          } else if (headerLine.includes('total_tb')) {
            return [{ total_tb: value }];
          } else {
            return [{ value: value }];
          }
        }
      }
    }
  }
  
  return [];
};

// Helper function to convert table data to objects
const convertTableToObjects = (dataLines, queryType, headerLine = null) => {
  if (dataLines.length === 0) return [];
  
  let headers = [];
  let dataRows = [];
  
  if (headerLine) {
    headers = headerLine;
    dataRows = dataLines;
  } else {
    // Try to identify headers vs data from the first row
    const firstRow = dataLines[0];
    const hasHeaders = firstRow.some(cell => 
      cell.includes('_') || 
      cell.toLowerCase().includes('date') || 
      cell.toLowerCase().includes('count') ||
      cell.toLowerCase().includes('total') ||
      cell.toLowerCase().includes('industry') ||
      cell.toLowerCase().includes('device') ||
      cell.toLowerCase().includes('month')
    );
    
    if (hasHeaders && dataLines.length > 1) {
      headers = firstRow;
      dataRows = dataLines.slice(1);
    } else {
      // Infer headers based on query type
      headers = inferHeaders(queryType, firstRow.length);
      dataRows = dataLines;
    }
  }
  
  console.log(`Using headers for ${queryType}:`, headers);
  console.log(`Processing data rows for ${queryType}:`, dataRows);
  
  // Convert rows to objects
  return dataRows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (index < row.length) {
        let value = row[index];
        
        // Clean up the value
        value = value.replace(/['"]/g, '').trim();
        
        // Try to parse as number if it looks like one
        if (value.match(/^\d+(\.\d+)?$/)) {
          obj[header] = parseFloat(value);
        } else if (value.match(/^\d+$/)) {
          obj[header] = parseInt(value);
        } else {
          obj[header] = value;
        }
      }
    });
    return obj;
  });
};

// Helper function to infer headers based on query type
const inferHeaders = (queryType, columnCount) => {
  switch (queryType) {
    case 'dailyUsage':
      return ['date', 'total_gb'];
    case 'enterprisesByIndustry':
      return ['industry', 'count'];
    case 'lineSubscriptionsTrend':
      return ['week', 'weekly_count'];
    case 'devices':
      return ['device_type', 'count'];
    case 'usageTotalsDaily':
      return ['date', 'daily_data_gb', 'daily_voice_minutes', 'daily_sms_count'];
    case 'usageTotals':
      return ['total_data_gb', 'total_voice_minutes', 'total_sms_count'];
    case 'billingOverview':
      return ['total_bills', 'total_revenue', 'avg_bill_amount', 'paid_bills', 'overdue_bills'];
    case 'monthlyRevenue':
      return ['month', 'monthly_revenue'];
    default:
      // Generic headers
      const headers = [];
      for (let i = 0; i < columnCount; i++) {
        headers.push(`column_${i}`);
      }
      return headers;
  }
};
