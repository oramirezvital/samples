import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION } from '../env';

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    dailyUsage: { loading: true, data: null },
    simInventory: { loading: true, data: null },
    lineSubscriptions: { loading: true, data: null },
    devices: { loading: true, data: null }
  });

  // Mock data for demonstration - in production, this would fetch from your database
  useEffect(() => {
    // Simulate API calls with mock data
    setTimeout(() => {
      setKpiData({
        dailyUsage: {
          loading: false,
          data: {
            series: [
              {
                name: 'Data Usage (GB)',
                data: [45, 52, 38, 65, 49, 75, 68]
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
                colors: ['#E30613']
              },
              xaxis: {
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              },
              colors: ['#E30613']
            }
          }
        },
        simInventory: {
          loading: false,
          data: {
            series: [8450, 1200, 350],
            options: {
              chart: {
                type: 'donut',
                height: 180
              },
              labels: ['Active', 'Inventory', 'Suspended'],
              colors: ['#E30613', '#666666', '#CCCCCC'],
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
                        label: 'Total SIMs',
                        formatter: () => '10,000'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        lineSubscriptions: {
          loading: false,
          data: {
            series: [
              {
                name: 'Active Lines',
                data: [12800, 12950, 13005, 13100, 13200, 13150, 13005]
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
                colors: ['#E30613']
              },
              colors: ['#E30613'],
              xaxis: {
                categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']
              }
            }
          }
        },
        devices: {
          loading: false,
          data: {
            series: [
              {
                name: 'Devices',
                data: [5200, 3800, 1500, 800, 200]
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
              colors: ['#E30613'],
              xaxis: {
                categories: ['Smartphones', 'Tablets', 'IoT Devices', 'Hotspots', 'Others']
              },
              dataLabels: { enabled: false }
            }
          }
        }
      });
    }, 1000);
  }, []);

  const KPICard = ({ title, value, subtitle, chart, loading }) => (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '3px solid #E30613'
      }}
    >
      <Typography variant="h6" sx={{ color: '#000000', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ color: '#E30613', fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
        {subtitle}
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        {loading ? (
          <CircularProgress size={40} sx={{ color: '#E30613' }} />
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
            title="Daily Usage"
            value="68.2 TB"
            subtitle="Total data consumed today"
            chart={kpiData.dailyUsage.data}
            loading={kpiData.dailyUsage.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="SIM Inventory"
            value="10,000"
            subtitle="84.5% active utilization"
            chart={kpiData.simInventory.data}
            loading={kpiData.simInventory.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Line Subscriptions"
            value="13,005"
            subtitle="Active lines this month"
            chart={kpiData.lineSubscriptions.data}
            loading={kpiData.lineSubscriptions.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Devices"
            value="11,500"
            subtitle="Total managed devices"
            chart={kpiData.devices.data}
            loading={kpiData.devices.loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard;
