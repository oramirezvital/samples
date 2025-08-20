import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { createAwsClient } from "./AwsAuth";
import { extractBetweenTags, removeCharFromStartAndEnd, handleFormatter } from "./Utils.js";
import {
  QUESTION_ANSWERS_TABLE_NAME,
  MODEL_ID_FOR_CHART,
  CHART_PROMPT,
  AGENT_ENDPOINT_URL
} from "../env.js";

// Generate unique UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate session ID (persistent for the page session)
let sessionId = null;
const getSessionId = () => {
  if (!sessionId) {
    sessionId = `mpn-kpi-session-${generateUUID()}`;
  }
  return sessionId;
};

/**
 * Execute a database query against PostgreSQL RDS through agent endpoint
 * @param {string} query - SQL query to execute
 * @returns {Promise<Array>} - Query results
 */
export const executeQuery = async (query) => {
  try {
    console.log('Executing query:', query);
    
    const uniquePromptId = `mpn-query-${generateUUID()}`;
    const currentSessionId = getSessionId();
    
    const response = await fetch(AGENT_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bedrock_model_id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
        prompt: `Please execute this SQL query directly and return only the raw results: ${query}`,
        prompt_uuid: uniquePromptId,
        user_timezone: 'America/Mexico_City',
        session_id: currentSessionId
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

    // Parse the result
    const parsedResult = parseQueryResult(result, query);
    console.log('Query result:', parsedResult);
    return parsedResult;
    
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
};

// Parse query results from agent responses
const parseQueryResult = (result, query) => {
  try {
    // First, try to extract JSON from the response
    let parsedData = extractJSONFromResponse(result);
    if (parsedData) {
      return Array.isArray(parsedData) ? parsedData : [parsedData];
    }
    
    // If no JSON found, parse as table format
    return parseTableResponse(result, query);
    
  } catch (error) {
    console.error('Error parsing query result:', error);
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
    
    return null;
  } catch (error) {
    return null;
  }
};

// Helper function to parse table-formatted responses
const parseTableResponse = (result, query) => {
  try {
    const lines = result.split('\n').map(line => line.trim()).filter(line => line);
    
    // For simple count queries, look for single numeric values
    if (query.includes('COUNT(*)')) {
      for (const line of lines) {
        const numberMatch = line.match(/(\d+)/);
        if (numberMatch) {
          const value = parseInt(numberMatch[1]);
          if (query.includes('total_networks')) {
            return [{ total_networks: value }];
          } else if (query.includes('total_devices')) {
            return [{ total_devices: value }];
          }
        }
      }
    }
    
    // For GROUP BY queries, parse table format
    let dataLines = [];
    for (const line of lines) {
      if (line.includes('|') || line.match(/^\w+\s+\d/)) {
        const parts = line.split(/\||\s{2,}/).map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          // Skip headers and separator lines
          if (!parts[0].includes('Client') && 
              !parts[0].includes('Enterprise') && 
              !parts[0].includes('network_count') &&
              !parts[0].includes('device_type') &&
              !parts[0].includes('network_name') &&
              !parts[0].includes('availability') &&
              !parts[0].includes('latency') &&
              !parts[0].match(/^-+$/)) {
            dataLines.push(parts);
          }
        }
      }
    }
    
    console.log(`Raw data lines for query:`, dataLines);
    
    const parsedResults = dataLines.map(row => {
      const obj = {};
      if (query.includes('enterprise_client')) {
        obj.enterprise_client = row[0];
        obj.network_count = parseInt(row[1]) || 0;
      } else if (query.includes('device_type')) {
        obj.device_type = row[0];
        obj.device_count = parseInt(row[1]) || 0;
      } else if (query.includes('time_hour') && query.includes('network_name')) {
        obj.time_hour = row[0];
        obj.network_name = row[1];
        obj.avg_latency_ms = parseFloat(row[2]) || 0;
      } else if (query.includes('time_hour')) {
        obj.time_hour = row[0];
        obj.avg_availability = parseFloat(row[1]) || 0;
      } else if (query.includes('network_name') && query.includes('availability')) {
        obj.network_name = row[0];
        obj.avg_availability = parseFloat(row[1]) || 0;
      } else if (query.includes('network_name') && query.includes('rtt_ms')) {
        obj.network_name = row[0];
        obj.avg_latency_ms = parseFloat(row[1]) || 0;
      }
      return obj;
    }).filter(obj => Object.keys(obj).length > 0);
    
    // Apply LIMIT from query if specified
    if (query.includes('LIMIT')) {
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        console.log(`Applying LIMIT ${limit} to ${parsedResults.length} results`);
        return parsedResults.slice(0, limit);
      }
    }
    
    console.log(`Final parsed results:`, parsedResults);
    return parsedResults;
    
  } catch (error) {
    console.error('Error parsing table response:', error);
    return [];
  }
};

/**
 * Query data from DynamoDB
 *
 * @param {string} id - The ID to query
 * @returns {Promise<Object>} - The query response
 */
export const getQueryResults = async (queryUuid = "") => {
  let queryResults = [];
  try {
    const dynamodb = await createAwsClient(DynamoDBClient);

    const input = {
      TableName: QUESTION_ANSWERS_TABLE_NAME,
      KeyConditionExpression: "id = :queryUuid",
      ExpressionAttributeValues: {
        ":queryUuid": {
          S: queryUuid,
        },
      },
      ConsistentRead: true,
    };

    console.log("------- Get Query Results -------");
    console.log(input);

    const command = new QueryCommand(input);
    const response = await dynamodb.send(command);

    if (response.hasOwnProperty("Items")) {
      for (let i = 0; i < response.Items.length; i++) {
        queryResults.push({
          query: response.Items[i].sql_query.S,
          query_results: JSON.parse(response.Items[i].data.S).result,
          query_description: response.Items[i].sql_query_description.S,
        });
      }
    }

    return queryResults;
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error;
  }
};

/**
 * Generates a chart based on answer and data
 * @param {Object} answer - Answer object containing text
 * @returns {Object} Chart configuration or rationale for no chart
 */
export const generateChart = async (
  answer
) => {
  const bedrock = await createAwsClient(BedrockRuntimeClient);
  let query_results = "";
  for (let i = 0; i < answer.queryResults.length; i++) {
    query_results += JSON.stringify(answer.queryResults[i].query_results) + "\n";
  }

  // Prepare the prompt
  let new_chart_prompt = CHART_PROMPT.replace(
    /<<answer>>/i,
    answer.text
  ).replace(/<<data_sources>>/i, query_results);

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2000,
    temperature: 1,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: new_chart_prompt }],
      },
    ],
  };

  try {
    // Send the request to Bedrock
    console.log("------- Request chart -------");
    console.log(payload);

    const command = new InvokeModelCommand({
      contentType: "application/json",
      body: JSON.stringify(payload),
      modelId: MODEL_ID_FOR_CHART,
    });

    const apiResponse = await bedrock.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody).content[0].text;

    console.log("------- Response chart generation -------");
    console.log(responseBody);

    // Process the response
    const has_chart = parseInt(extractBetweenTags(responseBody, "has_chart"));

    if (has_chart) {
      const chartConfig = JSON.parse(
        extractBetweenTags(responseBody, "chart_configuration")
      );
      const chart = {
        chart_type: removeCharFromStartAndEnd(
          extractBetweenTags(responseBody, "chart_type"),
          "\n"
        ),
        chart_configuration: handleFormatter(chartConfig),
        caption: removeCharFromStartAndEnd(
          extractBetweenTags(responseBody, "caption"),
          "\n"
        ),
      };

      console.log("------- Final chart generation -------");
      console.log(chart);
      
      return chart;
    } else {
      return {
        rationale: removeCharFromStartAndEnd(
          extractBetweenTags(responseBody, "rationale"),
          "\n"
        ),
      };
    }
  } catch (error) {
    console.error("Chart generation failed:", error);
    return {
      rationale: "Error generating or parsing chart data.",
    };
  }
};


