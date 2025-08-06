import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';
import { executeDirectQuery, kpiQueries, parseQueryResult } from '../utils/DatabaseQueries';

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    totalInteractions: { loading: true, data: null, value: '0' },
    channelPerformance: { loading: true, data: null, value: '0' },
    conversationTypes: { loading: true, data: null, value: '0' },
    transactionTypes: { loading: true, data: null, value: '0' }
  });

  const [refreshInterval, setRefreshInterval] = useState(null);

  // Customer Care KPI Queries - Updated for new schema
  const customerCareQueries = {
    totalInteractions: `
      SELECT COUNT(*) as total_interactions,
             DATE(start_timestamp) as interaction_date
      FROM subscriber_interactions 
      WHERE start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(start_timestamp)
      ORDER BY interaction_date DESC
      LIMIT 7
    `,
    channelPerformance: `
      SELECT c.channel_name,
             COUNT(*) as interaction_count,
             AVG(si.satisfaction_score) as avg_satisfaction
      FROM subscriber_interactions si
      JOIN channels c ON si.channel_id = c.channel_id
      WHERE si.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.channel_id, c.channel_name
      ORDER BY interaction_count DESC
      LIMIT 8
    `,
    conversationStats: `
      SELECT conversation_type,
             COUNT(*) as conversation_count,
             AVG(satisfaction_score) as avg_satisfaction
      FROM conversations
      WHERE start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY conversation_type
      ORDER BY conversation_count DESC
    `,
    transactionTypes: `
      SELECT tt.transaction_name,
             COUNT(*) as transaction_count
      FROM subscriber_interactions si
      JOIN transaction_types tt ON si.transaction_type_id = tt.transaction_type_id
      WHERE si.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY tt.transaction_type_id, tt.transaction_name
      ORDER BY transaction_count DESC
      LIMIT 8
    `
  };

  // Function to fetch real data from database
  const fetchRealData = async () => {
    try {
      console.log('Fetching subscriber care KPI data from database...');

      // Execute all queries in parallel
      const [
        totalInteractionsResult,
        channelPerformanceResult,
        totalStatsResult,
        conversationStatsResult,
        transactionTypesResult
      ] = await Promise.all([
        executeDirectQuery(customerCareQueries.totalInteractions, 'Total interactions trend'),
        executeDirectQuery(customerCareQueries.channelPerformance, 'Channel performance'),
        executeDirectQuery(kpiQueries.totalStats, 'Total statistics'),
        executeDirectQuery(customerCareQueries.conversationStats, 'Conversation types statistics'),
        executeDirectQuery(customerCareQueries.transactionTypes, 'Transaction types statistics')
      ]);

      // Parse results
      const totalInteractionsData = parseQueryResult(totalInteractionsResult, 'totalInteractions');
      const channelPerformanceData = parseQueryResult(channelPerformanceResult, 'channelPerformance');
      const totalStatsData = parseQueryResult(totalStatsResult, 'totalStats');
      const conversationStatsData = parseQueryResult(conversationStatsResult, 'conversationStats');
      const transactionTypesData = parseQueryResult(transactionTypesResult, 'transactionTypes');

      // Debug logging
      console.log('Raw totalStatsResult:', totalStatsResult);
      console.log('Parsed totalStatsData:', totalStatsData);
      console.log('Total interactions from parsed data:', totalStatsData[0]?.total_interactions);

      // Process and update state with real data
      updateKPIData(
        totalInteractionsData, 
        channelPerformanceData, 
        totalStatsData,
        conversationStatsData,
        transactionTypesData
      );

    } catch (error) {
      console.error('Error fetching subscriber care data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Keep loading state if database query fails
      console.log('Database query failed, keeping loading state');
    }
  };

  const updateKPIData = (totalInteractionsData, channelPerformanceData, totalStatsData, conversationStatsData, transactionTypesData) => {
    // Process total interactions data
    const interactionValues = totalInteractionsData.map(item => parseInt(item.total_interactions));
    const interactionDates = totalInteractionsData.map(item => {
      const date = new Date(item.interaction_date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const totalInteractions = totalStatsData[0]?.total_interactions || 0;

    // Process channel performance data
    const channelValues = channelPerformanceData.map(item => parseInt(item.interaction_count));
    const channelLabels = channelPerformanceData.map(item => item.channel_name);
    const topChannel = channelPerformanceData[0]?.channel_name || 'N/A';

    // Process conversation types data
    const conversationValues = conversationStatsData.map(item => parseInt(item.conversation_count));
    const conversationLabels = conversationStatsData.map(item => item.conversation_type);
    const topConversationType = conversationStatsData[0]?.conversation_type || 'N/A';

    // Process transaction types data
    const transactionValues = transactionTypesData.map(item => parseInt(item.transaction_count));
    const transactionLabels = transactionTypesData.map(item => item.transaction_name);
    const topTransactionType = transactionTypesData[0]?.transaction_name || 'N/A';

    // Update state with processed data
    setKpiData({
      totalInteractions: {
        loading: false,
        value: totalInteractions.toLocaleString(),
        data: {
          series: [
            {
              name: 'Daily Interactions',
              data: interactionValues.reverse()
            }
          ],
          options: {
            chart: {
              type: 'line',
              height: 180,
              toolbar: { show: false },
              sparkline: { enabled: true }
            },
            stroke: {
              curve: 'smooth',
              colors: ['#0066CC'],
              width: 3
            },
            xaxis: {
              categories: interactionDates.reverse()
            },
            colors: ['#0066CC'],
            tooltip: {
              y: {
                formatter: (val) => `${val} interactions`
              }
            }
          }
        }
      },
      channelPerformance: {
        loading: false,
        value: topChannel,
        data: {
          series: channelValues,
          options: {
            chart: {
              type: 'donut',
              height: 180
            },
            labels: channelLabels,
            colors: ['#0066CC', '#1E88E5', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD', '#F5F5F5'],
            legend: { show: false },
            dataLabels: { enabled: false },
            plotOptions: {
              pie: {
                donut: {
                  size: '70%',
                  labels: {
                    show: true,
                    total: {
                      show: true,
                      label: 'Total',
                      formatter: () => channelValues.reduce((sum, val) => sum + val, 0).toLocaleString()
                    }
                  }
                }
              }
            },
            tooltip: {
              y: {
                formatter: (val) => `${val.toLocaleString()} interactions`
              }
            }
          }
        }
      },
      conversationTypes: {
        loading: false,
        value: topConversationType,
        data: {
          series: conversationValues,
          options: {
            chart: {
              type: 'donut',
              height: 180
            },
            labels: conversationLabels,
            colors: ['#0066CC', '#1E88E5', '#42A5F5', '#64B5F6', '#90CAF9'],
            legend: { show: false },
            dataLabels: { enabled: false },
            plotOptions: {
              pie: {
                donut: {
                  size: '70%',
                  labels: {
                    show: true,
                    total: {
                      show: true,
                      label: 'Total',
                      formatter: () => conversationValues.reduce((sum, val) => sum + val, 0).toLocaleString()
                    }
                  }
                }
              }
            },
            tooltip: {
              y: {
                formatter: (val) => `${val.toLocaleString()} conversations`
              }
            }
          }
        }
      },
      transactionTypes: {
        loading: false,
        value: topTransactionType,
        data: {
          series: [
            {
              name: 'Transaction Count',
              data: transactionValues.slice(0, 8) // Show top 8 transaction types
            }
          ],
          options: {
            chart: {
              type: 'bar',
              height: 180,
              toolbar: { show: false }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 4
              }
            },
            colors: ['#0066CC'],
            xaxis: {
              categories: transactionLabels.slice(0, 8)
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: (val) => `${val.toLocaleString()} transactions`
              }
            }
          }
        }
      }
    });

    console.log('Subscriber care KPI data updated with real database values');
  };

  useEffect(() => {
    // Initial data fetch
    fetchRealData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      console.log('Auto-refreshing customer care KPI data...');
      fetchRealData();
    }, 5 * 60 * 1000); // 5 minutes

    setRefreshInterval(interval);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const KPICard = ({ title, value, subtitle, chart, loading }) => (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '3px solid #0066CC',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <Typography variant="h6" sx={{ color: '#000000', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ color: '#0066CC', fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
        {subtitle}
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} sx={{ color: '#0066CC', mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#666666' }}>
              Loading data...
            </Typography>
          </Box>
        ) : (
          <Chart
            options={chart.options}
            series={chart.series}
            type={chart.options.chart.type}
            height={180}
            width="100%"
          />
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 2, backgroundColor: '#F8F9FA' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Interactions"
            value={kpiData.totalInteractions.value}
            subtitle="All subscriber interactions in database"
            chart={kpiData.totalInteractions.data}
            loading={kpiData.totalInteractions.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Top Channel"
            value={kpiData.channelPerformance.value}
            subtitle="Channel performance (30 days)"
            chart={kpiData.channelPerformance.data}
            loading={kpiData.channelPerformance.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Top Conversation"
            value={kpiData.conversationTypes.value}
            subtitle="Conversation types (30 days)"
            chart={kpiData.conversationTypes.data}
            loading={kpiData.conversationTypes.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Top Transaction"
            value={kpiData.transactionTypes.value}
            subtitle="Transaction types (30 days)"
            chart={kpiData.transactionTypes.data}
            loading={kpiData.transactionTypes.loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard;
