import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid, Card, CardContent, Chip, Avatar } from '@mui/material';
import { NetworkCheck, Speed, Devices, TrendingUp } from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { executeQuery } from '../utils/AwsCalls';
import { kpiQueries } from '../utils/DatabaseQueries';

// Helper function to format data for charts
const formatChartData = (data, labelField, valueField, chartType = 'donut') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { series: [], labels: [], type: chartType };
  }

  if (chartType === 'line') {
    if (labelField === 'time_hour' && valueField === 'avg_latency_ms') {
      // Multi-series for latency by network
      console.log('Processing latency data:', data);
      const networks = [...new Set(data.map(item => item.network_name))];
      console.log('Networks found:', networks);
      const series = networks.map(network => ({
        name: network,
        data: data
          .filter(item => item.network_name === network && item[labelField] != null)
          .map(item => ({
            x: new Date(item[labelField]).getTime(),
            y: parseFloat(item[valueField]) || 0
          }))
      }));
      console.log('Latency series:', series);
      return { series, type: 'line' };
    } else {
      // Single series for availability - handle both time_hour and time_day
      const seriesName = 'Availability %';
      const timeField = labelField === 'time_day' ? 'time_day' : 'time_hour';
      console.log('Processing availability data:', data);
      console.log('Using timeField:', timeField, 'valueField:', valueField);
      
      const processedData = data
        .filter(item => {
          const hasTime = item[timeField] != null;
          const hasValue = item[valueField] != null;
          const isNotHeader = item[timeField] !== 'time_day' && item[timeField] !== 'time_hour';
          console.log('Item:', item, 'hasTime:', hasTime, 'hasValue:', hasValue, 'isNotHeader:', isNotHeader);
          return hasTime && hasValue && isNotHeader;
        })
        .map(item => {
          const timeValue = new Date(item[timeField]).getTime();
          const yValue = parseFloat(item[valueField]);
          console.log('Mapping:', item[timeField], '->', timeValue, item[valueField], '->', yValue);
          return {
            x: timeValue,
            y: yValue
          };
        });
      
      console.log('Final processed data:', processedData);
      
      return {
        series: [{
          name: seriesName,
          data: processedData
        }],
        type: 'line'
      };
    }
  }

  return {
    series: data.map(item => item[valueField] || 0),
    labels: data.map(item => item[labelField] || 'Unknown'),
    type: chartType
  };
};

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    networkOverview: { loading: true, data: null, value: '0' },
    networkAvailability: { loading: true, data: null, value: '0%' },
    deviceCount: { loading: true, data: null, value: '0' }
  });

  const isFetchingRef = useRef({
    networkOverview: false,
    networkAvailability: false,
    deviceCount: false
  });

  const cacheRef = useRef({
    networkOverview: null,
    networkAvailability: null,
    deviceCount: null
  });

  // Individual fetch functions for each KPI
  const fetchNetworkOverview = async () => {
    if (isFetchingRef.current.networkOverview || cacheRef.current.networkOverview) return;
    
    try {
      isFetchingRef.current.networkOverview = true;
      const result = await executeQuery(kpiQueries.networksByClient);
      const totalNetworks = result.reduce((sum, item) => sum + (item.network_count || 0), 0);
      
      const kpiResult = {
        loading: false,
        data: formatChartData(result, 'enterprise_client', 'network_count'),
        value: totalNetworks.toString()
      };
      
      cacheRef.current.networkOverview = kpiResult;
      setKpiData(prev => ({ ...prev, networkOverview: kpiResult }));
    } catch (error) {
      console.error('Error fetching Network Overview:', error);
    } finally {
      isFetchingRef.current.networkOverview = false;
    }
  };

  const fetchNetworkAvailability = async () => {
    if (isFetchingRef.current.networkAvailability || cacheRef.current.networkAvailability) return;
    
    try {
      isFetchingRef.current.networkAvailability = true;
      const result = await executeQuery(kpiQueries.networkAvailability);
      console.log('Network Availability raw result:', result);
      console.log('First item structure:', result[0]);
      
      const avgValue = result.length > 0 ? 
        (result.reduce((sum, item) => sum + (parseFloat(item.avg_availability) || 0), 0) / result.length).toFixed(1) : '0';
      
      const chartData = formatChartData(result, 'time_day', 'avg_availability', 'line');
      console.log('Network Availability chart data:', JSON.stringify(chartData, null, 2));
      
      const kpiResult = {
        loading: false,
        data: chartData,
        value: `${avgValue}%`
      };
      
      cacheRef.current.networkAvailability = kpiResult;
      setKpiData(prev => ({ ...prev, networkAvailability: kpiResult }));
    } catch (error) {
      console.error('Error fetching Network Availability:', error);
    } finally {
      isFetchingRef.current.networkAvailability = false;
    }
  };

  const fetchDeviceCount = async () => {
    if (isFetchingRef.current.deviceCount || cacheRef.current.deviceCount) return;
    
    try {
      isFetchingRef.current.deviceCount = true;
      const result = await executeQuery(kpiQueries.ueByType);
      const totalDevices = result.reduce((sum, item) => sum + (item.device_count || 0), 0);
      
      const kpiResult = {
        loading: false,
        data: formatChartData(result, 'device_type', 'device_count'),
        value: totalDevices.toString()
      };
      
      cacheRef.current.deviceCount = kpiResult;
      setKpiData(prev => ({ ...prev, deviceCount: kpiResult }));
    } catch (error) {
      console.error('Error fetching Device Count:', error);
    } finally {
      isFetchingRef.current.deviceCount = false;
    }
  };

  useEffect(() => {
    // Load cached data first
    Object.keys(cacheRef.current).forEach(key => {
      if (cacheRef.current[key]) {
        setKpiData(prev => ({ ...prev, [key]: cacheRef.current[key] }));
      }
    });

    // Execute queries sequentially with delays only if not cached
    const fetchAllKPIs = async () => {
      await fetchNetworkOverview();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchNetworkAvailability();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchDeviceCount();
    };
    
    fetchAllKPIs();
  }, []);

  // Enhanced chart configurations with Telcel blue theme
  const getChartOptions = (kpiType, data) => {
    if (!data) return {};

    const telcelBlueGradient = ['#0066CC', '#1E88E5', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB'];
    
    const baseOptions = {
      chart: {
        height: 280,
        toolbar: { show: false },
        background: 'transparent',
        dropShadow: {
          enabled: true,
          top: 3,
          left: 2,
          blur: 4,
          opacity: 0.1,
        }
      },
      colors: telcelBlueGradient,
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily: 'Roboto, sans-serif',
        markers: {
          width: 8,
          height: 8,
          radius: 4,
        }
      },
      tooltip: {
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Roboto, sans-serif',
        }
      }
    };

    if (data.type === 'line') {
      const isLatency = data.series.length > 1 || (data.series[0] && data.series[0].name !== 'Availability %');
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'line' },
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'MMM dd HH:mm'
          }
        },
        yaxis: {
          title: { text: isLatency ? 'Latency (ms)' : 'Availability (%)' },
          labels: {
            formatter: function (val) {
              return isLatency ? val.toFixed(1) + 'ms' : val.toFixed(1) + '%';
            }
          }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        dataLabels: { enabled: false },
        grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'],
            opacity: 0.5
          }
        }
      };
    }

    if (data.type === 'bar') {
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'bar' },
        xaxis: {
          categories: data.series[0].data.map(item => item.x)
        },
        yaxis: {
          title: { text: 'Latency (ms)' },
          labels: {
            formatter: function (val) {
              return val.toFixed(1) + 'ms';
            }
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val.toFixed(1) + 'ms';
          }
        }
      };
    }

    return {
      ...baseOptions,
      chart: { ...baseOptions.chart, type: 'donut' },
      labels: data.labels,
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          // For Network Overview, show actual counts instead of percentages
          if (kpiType === 'networkoverview') {
            return data.series[opts.seriesIndex];
          }
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '11px',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 600,
          colors: ['#fff']
        },
        dropShadow: {
          enabled: true,
          top: 1,
          left: 1,
          blur: 1,
          opacity: 0.8
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#0066CC'
              },
              value: {
                show: true,
                fontSize: '20px',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 700,
                color: '#000',
                formatter: function (val) {
                  return parseInt(val);
                }
              },
              total: {
                show: true,
                showAlways: false,
                label: 'Total',
                fontSize: '12px',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#0066CC'
              }
            }
          }
        }
      },
      stroke: {
        width: 2,
        colors: ['#fff']
      }
    };
  };

  const getKpiIcon = (title) => {
    switch (title.toLowerCase()) {
      case 'network overview': return <NetworkCheck sx={{ fontSize: 28, color: '#0066CC' }} />;
      case 'network availability': return <TrendingUp sx={{ fontSize: 28, color: '#0066CC' }} />;
      case 'average latency': return <Speed sx={{ fontSize: 28, color: '#0066CC' }} />;
      case 'connected devices': return <Devices sx={{ fontSize: 28, color: '#0066CC' }} />;
      default: return <NetworkCheck sx={{ fontSize: 28, color: '#0066CC' }} />;
    }
  };

  const KPICard = ({ title, value, loading, chartData, description }) => (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafe 100%)',
        border: '1px solid #e3f2fd',
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 102, 204, 0.15)',
          borderColor: '#0066CC'
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(0, 102, 204, 0.1)', 
              mr: 2,
              width: 48,
              height: 48
            }}
          >
            {getKpiIcon(title)}
          </Avatar>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#0066CC', 
                fontWeight: 700,
                fontSize: '1.1rem',
                lineHeight: 1.2
              }}
            >
              {title}
            </Typography>
            <Chip 
              label="Live" 
              size="small" 
              sx={{ 
                bgcolor: '#e8f5e8', 
                color: '#2e7d32',
                fontSize: '0.7rem',
                height: 20,
                mt: 0.5
              }} 
            />
          </Box>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress size={40} sx={{ color: '#0066CC' }} />
          </Box>
        ) : (
          <>
            <Typography 
              variant="h3" 
              sx={{ 
                color: '#000', 
                fontWeight: 800,
                mb: 1,
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #0066CC 0%, #1E88E5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {value}
            </Typography>
            
            {description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666', 
                  mb: 2,
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                {description}
              </Typography>
            )}
            
            {chartData && chartData.series.length > 0 && (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                <Chart
                  options={getChartOptions(title.toLowerCase().replace(/\s+/g, ''), chartData)}
                  series={chartData.series}
                  type={chartData.type}
                  height={280}
                  width="100%"
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      p: 2, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
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
            title="Connected Devices"
            value={kpiData.deviceCount.value}
            loading={kpiData.deviceCount.loading}
            chartData={kpiData.deviceCount.data}
            description="Total user equipment across all networks"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard;
