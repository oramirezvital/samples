import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';
import { executeDirectQuery, kpiQueries, parseQueryResult } from '../utils/DatabaseQueries';

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    dailyUsage: { loading: true, data: null, value: '0 TB' },
    simInventory: { loading: true, data: null, value: '0' },
    lineSubscriptions: { loading: true, data: null, value: '0' },
    devices: { loading: true, data: null, value: '0' },
    usageTotals: { loading: true, data: null, value: '0' }
  });

  const [refreshInterval, setRefreshInterval] = useState(null);

  // Function to fetch real data from database
  const fetchRealData = async () => {
    try {
      console.log('Fetching real KPI data from database...');

      // Execute all queries in parallel
      const [
        dailyUsageResult,
        simInventoryResult,
        lineSubscriptionsResult,
        devicesResult,
        totalDevicesResult,
        todayUsageResult,
        usageTotalsResult,
        usageTotalsDailyResult
      ] = await Promise.all([
        executeDirectQuery(kpiQueries.dailyUsage, 'Daily usage trend'),
        executeDirectQuery(kpiQueries.simInventory, 'SIM inventory status'),
        executeDirectQuery(kpiQueries.lineSubscriptions, 'Total active lines'),
        executeDirectQuery(kpiQueries.devices, 'Device types'),
        executeDirectQuery(kpiQueries.totalDevices, 'Total devices'),
        executeDirectQuery(kpiQueries.todayUsage, 'Today usage'),
        executeDirectQuery(kpiQueries.usageTotals, 'Usage totals'),
        executeDirectQuery(kpiQueries.usageTotalsDaily, 'Daily usage totals')
      ]);

      // Parse results
      const dailyUsageData = parseQueryResult(dailyUsageResult, 'dailyUsage');
      const simInventoryData = parseQueryResult(simInventoryResult, 'simInventory');
      const lineSubscriptionsData = parseQueryResult(lineSubscriptionsResult, 'lineSubscriptions');
      const devicesData = parseQueryResult(devicesResult, 'devices');
      const totalDevicesData = parseQueryResult(totalDevicesResult, 'totalDevices');
      const todayUsageData = parseQueryResult(todayUsageResult, 'todayUsage');
      const usageTotalsData = parseQueryResult(usageTotalsResult, 'usageTotals');
      const usageTotalsDailyData = parseQueryResult(usageTotalsDailyResult, 'usageTotalsDaily');

      // Process and update state with real data
      updateKPIData(dailyUsageData, simInventoryData, lineSubscriptionsData, devicesData, totalDevicesData, todayUsageData, usageTotalsData, usageTotalsDailyData);

    } catch (error) {
      console.error('Error fetching real data:', error);
      // Fallback to mock data if real data fails
      setMockData();
    }
  };

  const updateKPIData = (dailyUsageData, simInventoryData, lineSubscriptionsData, devicesData, totalDevicesData, todayUsageData, usageTotalsData, usageTotalsDailyData) => {
    // Process daily usage data
    const usageValues = dailyUsageData.map(item => item.total_gb);
    const usageDates = dailyUsageData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const todayUsage = todayUsageData[0]?.total_tb || 0;

    // Process SIM inventory data
    const simValues = simInventoryData.map(item => item.count);
    const simLabels = simInventoryData.map(item => {
      switch(item.sim_status) {
        case 'ACTIVE': return 'Active';
        case 'INVENTORY': return 'Inventory';
        case 'SUSPENDED': return 'Suspended';
        default: return item.sim_status;
      }
    });
    const totalSims = simValues.reduce((sum, val) => sum + val, 0);

    // Process line subscriptions data
    const totalActiveLines = lineSubscriptionsData[0]?.total_active_lines || 0;

    // Process devices data
    const deviceValues = devicesData.map(item => item.count);
    const deviceLabels = devicesData.map(item => {
      switch(item.device_type) {
        case 'SMARTPHONE': return 'Smartphones';
        case 'TABLET': return 'Tablets';
        case 'IOT_DEVICE': return 'IoT Devices';
        case 'HOTSPOT': return 'Hotspots';
        default: return 'Others';
      }
    });
    const totalDevices = totalDevicesData[0]?.total_devices || 0;

    // Process usage totals data
    const usageTotals = usageTotalsData[0] || { total_data_gb: 0, total_voice_minutes: 0, total_sms_count: 0 };
    const totalDataGB = usageTotals.total_data_gb || 0;
    const totalVoiceMinutes = usageTotals.total_voice_minutes || 0;
    const totalSMSCount = usageTotals.total_sms_count || 0;

    // Process daily usage totals for chart
    const dailyDataValues = usageTotalsDailyData.map(item => item.daily_data_gb);
    const dailyVoiceValues = usageTotalsDailyData.map(item => Math.round(item.daily_voice_minutes / 1000)); // Convert to thousands
    const dailySMSValues = usageTotalsDailyData.map(item => Math.round(item.daily_sms_count / 100)); // Convert to hundreds
    const dailyDates = usageTotalsDailyData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    // Update state with processed data
    setKpiData({
      dailyUsage: {
        loading: false,
        value: `${todayUsage} TB`,
        data: {
          series: [
            {
              name: 'Data Usage (GB)',
              data: usageValues.reverse() // Reverse to show chronological order
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
              colors: ['#E30613'],
              width: 3
            },
            xaxis: {
              categories: usageDates.reverse()
            },
            colors: ['#E30613'],
            tooltip: {
              y: {
                formatter: (val) => `${val} GB`
              }
            }
          }
        }
      },
      simInventory: {
        loading: false,
        value: totalSims.toLocaleString(),
        data: {
          series: simValues,
          options: {
            chart: {
              type: 'donut',
              height: 180
            },
            labels: simLabels,
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
                      formatter: () => totalSims.toLocaleString()
                    }
                  }
                }
              }
            },
            tooltip: {
              y: {
                formatter: (val) => val.toLocaleString()
              }
            }
          }
        }
      },
      lineSubscriptions: {
        loading: false,
        value: totalActiveLines.toLocaleString(),
        data: {
          series: [
            {
              name: 'Active Lines',
              data: [12800, 12950, 13005, 13100, 13200, 13150, totalActiveLines] // Mock trend data
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
              colors: ['#E30613'],
              width: 2
            },
            colors: ['#E30613'],
            xaxis: {
              categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Current']
            },
            tooltip: {
              y: {
                formatter: (val) => val.toLocaleString()
              }
            }
          }
        }
      },
      devices: {
        loading: false,
        value: totalDevices.toLocaleString(),
        data: {
          series: [
            {
              name: 'Devices',
              data: deviceValues
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
              categories: deviceLabels
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: (val) => val.toLocaleString()
              }
            }
          }
        }
      },
      usageTotals: {
        loading: false,
        value: `${totalDataGB.toLocaleString()} GB`,
        data: {
          series: [
            {
              name: 'Data (GB)',
              data: dailyDataValues.reverse()
            },
            {
              name: 'Voice (K min)',
              data: dailyVoiceValues.reverse()
            },
            {
              name: 'SMS (100s)',
              data: dailySMSValues.reverse()
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
              colors: ['#E30613', '#666666', '#CCCCCC'],
              width: 2
            },
            xaxis: {
              categories: dailyDates.reverse()
            },
            colors: ['#E30613', '#666666', '#CCCCCC'],
            tooltip: {
              y: [
                {
                  formatter: (val) => `${val} GB`
                },
                {
                  formatter: (val) => `${val}K minutes`
                },
                {
                  formatter: (val) => `${val * 100} SMS`
                }
              ]
            },
            legend: {
              show: false
            }
          }
        }
      }
    });

    console.log('KPI data updated with real database values including usage totals');
  };
  const setMockData = () => {
    console.log('Using mock data for KPIs');
    setKpiData({
      dailyUsage: {
        loading: false,
        value: '68.2 TB',
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
              colors: ['#E30613'],
              width: 3
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
        value: '10,000',
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
        value: '13,005',
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
              colors: ['#E30613'],
              width: 2
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
        value: '11,500',
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
      },
      usageTotals: {
        loading: false,
        value: '2,048 GB',
        data: {
          series: [
            {
              name: 'Data (GB)',
              data: [45, 52, 38, 65, 49, 75, 68]
            },
            {
              name: 'Voice (K min)',
              data: [3.6, 4.5, 3.2, 4.1, 3.8, 3.9, 4.2]
            },
            {
              name: 'SMS (100s)',
              data: [15, 21, 14, 19, 16, 17, 18]
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
              colors: ['#E30613', '#666666', '#CCCCCC'],
              width: 2
            },
            xaxis: {
              categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            colors: ['#E30613', '#666666', '#CCCCCC'],
            legend: {
              show: false
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
      console.log('Auto-refreshing KPI data...');
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
        borderTop: '3px solid #E30613',
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
      <Typography variant="h4" sx={{ color: '#E30613', fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
        {subtitle}
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} sx={{ color: '#E30613', mb: 1 }} />
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
            title="Daily Usage"
            value={kpiData.dailyUsage.value}
            subtitle="Total data consumed today"
            chart={kpiData.dailyUsage.data}
            loading={kpiData.dailyUsage.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="SIM Inventory"
            value={kpiData.simInventory.value}
            subtitle="Active, inventory & suspended"
            chart={kpiData.simInventory.data}
            loading={kpiData.simInventory.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Line Subscriptions"
            value={kpiData.lineSubscriptions.value}
            subtitle="Active lines currently"
            chart={kpiData.lineSubscriptions.data}
            loading={kpiData.lineSubscriptions.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Devices"
            value={kpiData.devices.value}
            subtitle="Total managed devices"
            chart={kpiData.devices.data}
            loading={kpiData.devices.loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <KPICard
            title="Usage Totals"
            value={kpiData.usageTotals.value}
            subtitle="Data, voice & SMS (30 days)"
            chart={kpiData.usageTotals.data}
            loading={kpiData.usageTotals.loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard;
