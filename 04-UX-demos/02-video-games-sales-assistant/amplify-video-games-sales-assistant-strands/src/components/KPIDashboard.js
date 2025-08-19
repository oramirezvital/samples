import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid } from '@mui/material';
import Chart from 'react-apexcharts';
import { executeQuery } from '../utils/AwsCalls';
import { kpiQueries } from '../utils/DatabaseQueries';

// Helper function to format data for charts
const formatChartData = (data, labelField, valueField) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { series: [], labels: [], type: 'pie' };
  }

  return {
    series: data.map(item => item[valueField] || 0),
    labels: data.map(item => item[labelField] || 'Unknown'),
    type: 'pie'
  };
};

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    networkOverview: { loading: true, data: null, value: '0' },
    networkAvailability: { loading: true, data: null, value: '0%' },
    averageLatency: { loading: true, data: null, value: '0ms' },
    deviceCount: { loading: true, data: null, value: '0' }
  });

  // Add refs to track fetch state and prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  // Function to fetch real data from database
  const fetchRealData = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      console.log('Fetching MPN KPI data from database...');

      // Execute essential queries for 4 main KPIs
      const [
        networkCountResult,
        networksByClientResult,
        networkAvailabilityResult,
        averageLatencyResult,
        ueCountResult,
        ueByTypeResult
      ] = await Promise.all([
        executeQuery(kpiQueries.networkCount),
        executeQuery(kpiQueries.networksByClient),
        executeQuery(kpiQueries.networkAvailability),
        executeQuery(kpiQueries.averageLatency),
        executeQuery(kpiQueries.ueCount),
        executeQuery(kpiQueries.ueByType)
      ]);

      console.log('Query result for Total networks:', networkCountResult);
      console.log('Query result for Networks by client:', networksByClientResult);
      console.log('Query result for Network availability:', networkAvailabilityResult);
      console.log('Query result for Average latency:', averageLatencyResult);
      console.log('Query result for Total devices:', ueCountResult);
      console.log('Query result for Devices by type:', ueByTypeResult);

      // Update state with real data
      setKpiData({
        networkOverview: {
          loading: false,
          data: formatChartData(networksByClientResult, 'enterprise_client', 'network_count'),
          value: networkCountResult[0]?.total_networks?.toString() || '0'
        },
        networkAvailability: {
          loading: false,
          data: formatChartData(networkAvailabilityResult, 'network_name', 'avg_availability'),
          value: networkAvailabilityResult[0]?.avg_availability ? `${networkAvailabilityResult[0].avg_availability.toFixed(1)}%` : '0%'
        },
        averageLatency: {
          loading: false,
          data: formatChartData(averageLatencyResult, 'network_name', 'avg_latency_ms'),
          value: averageLatencyResult[0]?.avg_latency_ms ? `${averageLatencyResult[0].avg_latency_ms.toFixed(1)}ms` : '0ms'
        },
        deviceCount: {
          loading: false,
          data: formatChartData(ueByTypeResult, 'device_type', 'device_count'),
          value: ueCountResult[0]?.total_devices?.toString() || '0'
        }
      });

      console.log('MPN KPI data fetched successfully');

    } catch (error) {
      console.error('Error fetching MPN KPI data:', error);
      
      // Set mock data on error
      setKpiData({
        networkOverview: {
          loading: false,
          data: getMockChartData('networksByClient'),
          value: '3'
        },
        networkAvailability: {
          loading: false,
          data: getMockChartData('networkAvailability'),
          value: '99.85%'
        },
        averageLatency: {
          loading: false,
          data: getMockChartData('averageLatency'),
          value: '12.5ms'
        },
        deviceCount: {
          loading: false,
          data: getMockChartData('devicesByType'),
          value: '60'
        }
      });
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Mock data for fallback
  const getMockChartData = (type) => {
    switch (type) {
      case 'networksByClient':
        return {
          series: [1, 1, 1],
          labels: ['PEMEX', 'América Móvil', 'Grupo Bimbo'],
          type: 'pie'
        };
      
      case 'networkAvailability':
        return {
          series: [{
            name: 'Availability %',
            data: [99.85, 99.92, 99.78]
          }],
          categories: ['MPN-001', 'MPN-002', 'MPN-003'],
          type: 'bar'
        };
      
      case 'averageLatency':
        return {
          series: [{
            name: 'Latency (ms)',
            data: [12.5, 8.3, 15.7]
          }],
          categories: ['MPN-001', 'MPN-002', 'MPN-003'],
          type: 'line'
        };
      
      case 'devicesByType':
        return {
          series: [25, 15, 12, 5, 3],
          labels: ['Smartphone', 'Tablet', 'IoT Sensor', 'Laptop', 'Industrial Device'],
          type: 'donut'
        };
      
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  // Chart configurations
  const getChartOptions = (kpiType, data) => {
    if (!data) return {};

    const baseOptions = {
      chart: {
        height: 300,
        toolbar: { show: false }
      },
      colors: ['#0066CC', '#1E88E5', '#004499', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD'],
      legend: {
        position: 'bottom'
      }
    };

    switch (data.type) {
      case 'pie':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'pie' },
          labels: data.labels,
          dataLabels: {
            enabled: true,
            formatter: function (val) {
              return val.toFixed(1) + '%';
            }
          }
        };

      case 'donut':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'donut' },
          labels: data.labels,
          dataLabels: {
            enabled: true,
            formatter: function (val) {
              return val.toFixed(1) + '%';
            }
          }
        };

      case 'bar':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'bar' },
          xaxis: { categories: data.categories },
          yaxis: {
            title: { text: kpiType === 'networkAvailability' ? 'Availability (%)' : 'Success Rate (%)' }
          },
          dataLabels: { enabled: false }
        };

      case 'line':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'line' },
          xaxis: { categories: data.categories },
          yaxis: {
            title: { text: 'Latency (ms)' }
          },
          stroke: { curve: 'smooth' },
          dataLabels: { enabled: false }
        };

      default:
        return baseOptions;
    }
  };

  const KPICard = ({ title, value, loading, chartData, description }) => (
    <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#0066CC', fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
          <CircularProgress size={40} sx={{ color: '#0066CC' }} />
        </Box>
      ) : (
        <>
          <Typography variant="h4" sx={{ color: '#000000', fontWeight: 'bold', mb: 2 }}>
            {value}
          </Typography>
          
          {description && (
            <Typography variant="body2" sx={{ color: '#333333', mb: 2 }}>
              {description}
            </Typography>
          )}
          
          {chartData && (
            <Box flex={1} display="flex" alignItems="center">
              <Chart
                options={getChartOptions(title.toLowerCase().replace(/\s+/g, ''), chartData)}
                series={chartData.series}
                type={chartData.type}
                height={250}
                width="100%"
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#0066CC', fontWeight: 'bold', mb: 4 }}>
        Mobile Private Network KPIs Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Network Overview"
            value={kpiData.networkOverview.value}
            loading={kpiData.networkOverview.loading}
            chartData={kpiData.networkOverview.data}
            description="Total MPN networks by enterprise client"
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Network Availability"
            value={kpiData.networkAvailability.value}
            loading={kpiData.networkAvailability.loading}
            chartData={kpiData.networkAvailability.data}
            description="Average availability in last 24 hours"
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Average Latency"
            value={kpiData.averageLatency.value}
            loading={kpiData.averageLatency.loading}
            chartData={kpiData.averageLatency.data}
            description="Network response time in last 24 hours"
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Connected Devices"
            value={kpiData.deviceCount.value}
            loading={kpiData.deviceCount.loading}
            chartData={kpiData.deviceCount.data}
            description="Total user equipment across all networks"
          />
        </Grid>
      </Grid>

      {/* Additional KPI Cards Row */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
              Network Performance Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Real-time monitoring of key performance indicators across all MPN networks
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
              <Typography variant="body1" color="text.secondary">
                Performance trends visualization will appear here when data is available
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
              SLA Compliance Status
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Service Level Agreement compliance tracking for availability, latency, and throughput
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
              <Typography variant="body1" color="text.secondary">
                SLA compliance metrics will appear here when data is available
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard;
