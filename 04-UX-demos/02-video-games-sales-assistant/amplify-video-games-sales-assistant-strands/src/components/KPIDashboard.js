import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';
import { executeDirectQuery, kpiQueries, parseQueryResult } from '../utils/DatabaseQueries';

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    totalInteractions: { loading: true, data: null, value: '0' },
    avgSatisfaction: { loading: true, data: null, value: '0.0' },
    channelPerformance: { loading: true, data: null, value: '0' },
    agentProductivity: { loading: true, data: null, value: '0' },
    resolutionRate: { loading: true, data: null, value: '0%' }
  });

  const [refreshInterval, setRefreshInterval] = useState(null);

  // Customer Care KPI Queries
  const customerCareQueries = {
    totalInteractions: `
      SELECT COUNT(*) as total_interactions,
             DATE(start_timestamp) as interaction_date
      FROM customer_interactions 
      WHERE start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(start_timestamp)
      ORDER BY interaction_date DESC
      LIMIT 7
    `,
    avgSatisfaction: `
      SELECT AVG(satisfaction_score) as avg_satisfaction,
             DATE(start_timestamp) as interaction_date
      FROM customer_interactions 
      WHERE satisfaction_score IS NOT NULL 
        AND start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(start_timestamp)
      ORDER BY interaction_date DESC
      LIMIT 7
    `,
    channelPerformance: `
      SELECT c.channel_name,
             COUNT(*) as interaction_count,
             AVG(ci.satisfaction_score) as avg_satisfaction
      FROM customer_interactions ci
      JOIN channels c ON ci.channel_id = c.channel_id
      WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.channel_id, c.channel_name
      ORDER BY interaction_count DESC
      LIMIT 8
    `,
    agentProductivity: `
      SELECT a.agent_name,
             COUNT(*) as interactions_handled,
             AVG(ci.satisfaction_score) as avg_satisfaction,
             AVG(ci.duration_seconds) as avg_duration
      FROM customer_interactions ci
      JOIN agents a ON ci.agent_id = a.agent_id
      WHERE ci.start_timestamp >= CURRENT_DATE - INTERVAL '30 days'
        AND ci.agent_id IS NOT NULL
      GROUP BY a.agent_id, a.agent_name
      ORDER BY interactions_handled DESC
      LIMIT 10
    `,
    resolutionRate: `
      SELECT resolution_status,
             COUNT(*) as count,
             DATE(start_timestamp) as interaction_date
      FROM customer_interactions
      WHERE start_timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY resolution_status, DATE(start_timestamp)
      ORDER BY interaction_date DESC
    `,
    todayStats: `
      SELECT COUNT(*) as today_interactions,
             AVG(satisfaction_score) as today_satisfaction,
             COUNT(CASE WHEN resolution_status = 'Resolved' THEN 1 END) * 100.0 / COUNT(*) as today_resolution_rate
      FROM customer_interactions
      WHERE DATE(start_timestamp) = CURRENT_DATE
    `
  };

  // Function to fetch real data from database
  const fetchRealData = async () => {
    try {
      console.log('Fetching customer care KPI data from database...');

      // Execute all queries in parallel
      const [
        totalInteractionsResult,
        avgSatisfactionResult,
        channelPerformanceResult,
        agentProductivityResult,
        resolutionRateResult,
        todayStatsResult,
        totalStatsResult
      ] = await Promise.all([
        executeDirectQuery(customerCareQueries.totalInteractions, 'Total interactions trend'),
        executeDirectQuery(customerCareQueries.avgSatisfaction, 'Average satisfaction trend'),
        executeDirectQuery(customerCareQueries.channelPerformance, 'Channel performance'),
        executeDirectQuery(customerCareQueries.agentProductivity, 'Agent productivity'),
        executeDirectQuery(customerCareQueries.resolutionRate, 'Resolution rate trend'),
        executeDirectQuery(customerCareQueries.todayStats, 'Today statistics'),
        executeDirectQuery(kpiQueries.totalStats, 'Total statistics')
      ]);

      // Parse results
      const totalInteractionsData = parseQueryResult(totalInteractionsResult, 'totalInteractions');
      const avgSatisfactionData = parseQueryResult(avgSatisfactionResult, 'avgSatisfaction');
      const channelPerformanceData = parseQueryResult(channelPerformanceResult, 'channelPerformance');
      const agentProductivityData = parseQueryResult(agentProductivityResult, 'agentProductivity');
      const resolutionRateData = parseQueryResult(resolutionRateResult, 'resolutionRate');
      const todayStatsData = parseQueryResult(todayStatsResult, 'todayStats');
      const totalStatsData = parseQueryResult(totalStatsResult, 'totalStats');

      // Process and update state with real data
      updateKPIData(totalInteractionsData, avgSatisfactionData, channelPerformanceData, agentProductivityData, resolutionRateData, todayStatsData, totalStatsData);

    } catch (error) {
      console.error('Error fetching customer care data:', error);
      // Fallback to mock data if real data fails
      setMockData();
    }
  };

  const updateKPIData = (totalInteractionsData, avgSatisfactionData, channelPerformanceData, agentProductivityData, resolutionRateData, todayStatsData, totalStatsData) => {
    // Process total interactions data
    const interactionValues = totalInteractionsData.map(item => parseInt(item.total_interactions));
    const interactionDates = totalInteractionsData.map(item => {
      const date = new Date(item.interaction_date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const totalInteractions = totalStatsData[0]?.total_interactions || 0;

    // Process satisfaction data
    const satisfactionValues = avgSatisfactionData.map(item => parseFloat(item.avg_satisfaction).toFixed(2));
    const satisfactionDates = avgSatisfactionData.map(item => {
      const date = new Date(item.interaction_date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const todaySatisfaction = todayStatsData[0]?.today_satisfaction || 0;

    // Process channel performance data
    const channelValues = channelPerformanceData.map(item => parseInt(item.interaction_count));
    const channelLabels = channelPerformanceData.map(item => item.channel_name);
    const topChannel = channelPerformanceData[0]?.channel_name || 'N/A';

    // Process agent productivity data
    const agentValues = agentProductivityData.map(item => parseInt(item.interactions_handled));
    const agentLabels = agentProductivityData.map(item => item.agent_name);
    const totalAgentInteractions = agentValues.reduce((sum, val) => sum + val, 0);

    // Process resolution rate data
    const resolutionData = {};
    resolutionRateData.forEach(item => {
      const date = item.interaction_date;
      if (!resolutionData[date]) {
        resolutionData[date] = { total: 0, resolved: 0 };
      }
      resolutionData[date].total += parseInt(item.count);
      if (item.resolution_status === 'Resolved') {
        resolutionData[date].resolved += parseInt(item.count);
      }
    });

    const resolutionRates = Object.keys(resolutionData).map(date => {
      const rate = (resolutionData[date].resolved / resolutionData[date].total) * 100;
      return parseFloat(rate.toFixed(1));
    });
    const resolutionDates = Object.keys(resolutionData).map(date => {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const todayResolutionRate = todayStatsData[0]?.today_resolution_rate || 0;

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
      avgSatisfaction: {
        loading: false,
        value: parseFloat(todaySatisfaction).toFixed(2),
        data: {
          series: [
            {
              name: 'Satisfaction Score',
              data: satisfactionValues.reverse()
            }
          ],
          options: {
            chart: {
              type: 'area',
              height: 180,
              toolbar: { show: false },
              sparkline: { enabled: true }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
                stops: [0, 90, 100]
              }
            },
            stroke: {
              curve: 'smooth',
              colors: ['#0066CC'],
              width: 2
            },
            colors: ['#0066CC'],
            xaxis: {
              categories: satisfactionDates.reverse()
            },
            yaxis: {
              min: -1,
              max: 1
            },
            tooltip: {
              y: {
                formatter: (val) => `${val} score`
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
      agentProductivity: {
        loading: false,
        value: totalAgentInteractions.toLocaleString(),
        data: {
          series: [
            {
              name: 'Interactions Handled',
              data: agentValues.slice(0, 8) // Show top 8 agents
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
              categories: agentLabels.slice(0, 8)
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: (val) => `${val.toLocaleString()} interactions`
              }
            }
          }
        }
      },
      resolutionRate: {
        loading: false,
        value: `${parseFloat(todayResolutionRate).toFixed(1)}%`,
        data: {
          series: [
            {
              name: 'Resolution Rate (%)',
              data: resolutionRates.reverse()
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
              categories: resolutionDates.reverse()
            },
            colors: ['#0066CC'],
            yaxis: {
              min: 0,
              max: 100
            },
            tooltip: {
              y: {
                formatter: (val) => `${val}%`
              }
            }
          }
        }
      }
    });

    console.log('Customer care KPI data updated with real database values');
  };

  const setMockData = () => {
    console.log('Using mock data for customer care KPIs');
    setKpiData({
      totalInteractions: {
        loading: false,
        value: '4,247',
        data: {
          series: [
            {
              name: 'Daily Interactions',
              data: [1150, 1200, 1180, 1300, 1250, 1220, 1247]
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
              categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            colors: ['#0066CC']
          }
        }
      },
      avgSatisfaction: {
        loading: false,
        value: '0.72',
        data: {
          series: [
            {
              name: 'Satisfaction Score',
              data: [0.68, 0.71, 0.69, 0.74, 0.73, 0.70, 0.72]
            }
          ],
          options: {
            chart: {
              type: 'area',
              height: 180,
              toolbar: { show: false },
              sparkline: { enabled: true }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
                stops: [0, 90, 100]
              }
            },
            stroke: {
              curve: 'smooth',
              colors: ['#0066CC'],
              width: 2
            },
            colors: ['#0066CC'],
            xaxis: {
              categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yaxis: {
              min: -1,
              max: 1
            }
          }
        }
      },
      channelPerformance: {
        loading: false,
        value: 'Phone',
        data: {
          series: [450, 320, 280, 150, 120, 80, 60, 40],
          options: {
            chart: {
              type: 'donut',
              height: 180
            },
            labels: ['Phone', 'Web Chat', 'Email', 'Mobile App', 'WhatsApp', 'In-Store', 'Social Media', 'SMS'],
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
                      formatter: () => '1,500'
                    }
                  }
                }
              }
            }
          }
        }
      },
      agentProductivity: {
        loading: false,
        value: '8,450',
        data: {
          series: [
            {
              name: 'Interactions Handled',
              data: [145, 132, 128, 115, 108, 95, 87, 82]
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
              categories: ['María G.', 'Carlos R.', 'Ana M.', 'Luis H.', 'Carmen L.', 'Roberto S.', 'Patricia M.', 'Diego V.']
            },
            dataLabels: { enabled: false }
          }
        }
      },
      resolutionRate: {
        loading: false,
        value: '78.5%',
        data: {
          series: [
            {
              name: 'Resolution Rate (%)',
              data: [75.2, 77.8, 76.5, 79.1, 78.9, 77.3, 78.5]
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
              categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            colors: ['#0066CC'],
            yaxis: {
              min: 0,
              max: 100
            }
          }
        }
      }
    });
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
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Total Interactions"
            value={kpiData.totalInteractions.value}
            subtitle="All customer interactions in database"
            chart={kpiData.totalInteractions.data}
            loading={kpiData.totalInteractions.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Avg Satisfaction"
            value={kpiData.avgSatisfaction.value}
            subtitle="Customer satisfaction score (-1 to 1)"
            chart={kpiData.avgSatisfaction.data}
            loading={kpiData.avgSatisfaction.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Top Channel"
            value={kpiData.channelPerformance.value}
            subtitle="Channel performance (30 days)"
            chart={kpiData.channelPerformance.data}
            loading={kpiData.channelPerformance.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Agent Interactions"
            value={kpiData.agentProductivity.value}
            subtitle="Total agent-handled interactions"
            chart={kpiData.agentProductivity.data}
            loading={kpiData.agentProductivity.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Resolution Rate"
            value={kpiData.resolutionRate.value}
            subtitle="Issues resolved today"
            chart={kpiData.resolutionRate.data}
            loading={kpiData.resolutionRate.loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard;
