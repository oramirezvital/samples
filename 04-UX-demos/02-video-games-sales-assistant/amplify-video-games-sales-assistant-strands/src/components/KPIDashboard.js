import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import Chart from 'react-apexcharts';
import { executeDirectQuery, kpiQueries, parseQueryResult } from '../utils/DatabaseQueries';

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState({
    enterpriseOverview: { loading: true, data: null, value: '0' },
    lineSubscriptions: { loading: true, data: null, value: '0' },
    devices: { loading: true, data: null, value: '0' },
    billingRevenue: { loading: true, data: null, value: '$0' }
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
      console.log('Fetching KPI data from database...');

      // Execute only essential queries for 4 KPIs
      const [
        enterpriseCountResult,
        enterprisesByIndustryResult,
        lineSubscriptionsResult,
        devicesResult,
        billingOverviewResult,
        monthlyRevenueResult
      ] = await Promise.all([
        executeDirectQuery(kpiQueries.enterpriseCount, 'Total enterprises'),
        executeDirectQuery(kpiQueries.enterprisesByIndustry, 'Enterprises by industry'),
        executeDirectQuery(kpiQueries.lineSubscriptions, 'Line subscriptions by status'),
        executeDirectQuery(kpiQueries.devices, 'Device types'),
        executeDirectQuery(kpiQueries.billingOverview, 'Billing overview'),
        executeDirectQuery(kpiQueries.monthlyRevenue, 'Monthly revenue')
      ]);

      // Parse results
      const enterpriseCountData = parseQueryResult(enterpriseCountResult, 'enterpriseCount');
      const enterprisesByIndustryData = parseQueryResult(enterprisesByIndustryResult, 'enterprisesByIndustry');
      const lineSubscriptionsData = parseQueryResult(lineSubscriptionsResult, 'lineSubscriptions');
      const devicesData = parseQueryResult(devicesResult, 'devices');
      const billingOverviewData = parseQueryResult(billingOverviewResult, 'billingOverview');
      const monthlyRevenueData = parseQueryResult(monthlyRevenueResult, 'monthlyRevenue');

      // Process and update state with real data
      updateKPIData(
        enterpriseCountData, 
        enterprisesByIndustryData, 
        lineSubscriptionsData, 
        devicesData, 
        billingOverviewData,
        monthlyRevenueData
      );

    } catch (error) {
      console.error('Error fetching real data:', error);
      // Set empty state instead of mock data
      setEmptyKPIData();
    } finally {
      isFetchingRef.current = false; // Reset fetch flag
    }
  };

  const updateKPIData = (
    enterpriseCountData, 
    enterprisesByIndustryData, 
    lineSubscriptionsData, 
    devicesData, 
    billingOverviewData,
    monthlyRevenueData
  ) => {
    console.log('Updating KPI data with real database results');
    
    // Validate and process enterprise data
    const enterpriseValues = Array.isArray(enterprisesByIndustryData) && enterprisesByIndustryData.length > 0 ? 
      enterprisesByIndustryData.map(item => parseInt(item.count) || 0) : [0];
    const enterpriseLabels = Array.isArray(enterprisesByIndustryData) && enterprisesByIndustryData.length > 0 ? 
      enterprisesByIndustryData.map(item => item.industry || 'Unknown') : ['No Data'];
    
    // Handle different formats for enterprise count data
    let totalEnterprises = 0;
    if (Array.isArray(enterpriseCountData) && enterpriseCountData[0]) {
      // Try different possible field names for enterprise count
      totalEnterprises = parseInt(enterpriseCountData[0].total_enterprises) || 
                        parseInt(enterpriseCountData[0].column_1) || 
                        parseInt(enterpriseCountData[0].value) || 0;
    }
    
    console.log('Raw enterpriseCountData:', enterpriseCountData);
    console.log('Processed totalEnterprises:', totalEnterprises);
    console.log('Enterprise values:', enterpriseValues);
    console.log('Enterprise labels:', enterpriseLabels);

    // Validate and process line subscriptions data
    const lineStatusValues = Array.isArray(lineSubscriptionsData) && lineSubscriptionsData.length > 0 ? 
      lineSubscriptionsData.map(item => parseInt(item.count) || 0) : [0];
    const lineStatusLabels = Array.isArray(lineSubscriptionsData) && lineSubscriptionsData.length > 0 ? 
      lineSubscriptionsData.map(item => {
        switch(item.status) {
          case 'ACTIVE': return 'Active';
          case 'INACTIVE': return 'Inactive';
          case 'SUSPENDED': return 'Suspended';
          case 'CANCELLED': return 'Cancelled';
          default: return item.status || 'Unknown';
        }
      }) : ['No Data'];
    
    const totalLines = lineStatusValues.reduce((sum, val) => sum + val, 0);
    
    // Validate and process devices data
    console.log('Raw devicesData:', devicesData);
    const deviceValues = Array.isArray(devicesData) && devicesData.length > 0 ? 
      devicesData.map(item => parseInt(item.count) || 0) : [0];
    const deviceLabels = Array.isArray(devicesData) && devicesData.length > 0 ? 
      devicesData.map(item => {
        switch(item.device_type) {
          case 'SMARTPHONE': return 'Smartphones';
          case 'TABLET': return 'Tablets';
          case 'IOT_DEVICE': return 'IoT Devices';
          case 'HOTSPOT': return 'Hotspots';
          default: return item.device_type || 'Others';
        }
      }) : ['No Data'];
    
    // Calculate total devices from device breakdown
    const totalDevices = deviceValues.reduce((sum, val) => sum + val, 0);
    
    console.log('Processed deviceValues:', deviceValues);
    console.log('Processed deviceLabels:', deviceLabels);
    console.log('Total devices:', totalDevices);

    // Validate and process billing data
    let billingOverview;
    if (Array.isArray(billingOverviewData) && billingOverviewData[0]) {
      // Handle direct array format
      billingOverview = billingOverviewData[0];
    } else if (billingOverviewData && billingOverviewData.result && Array.isArray(billingOverviewData.result)) {
      // Handle nested result format
      billingOverview = billingOverviewData.result[0];
    } else {
      billingOverview = { total_revenue: 0, avg_bill_amount: 0, paid_bills: 0, overdue_bills: 0 };
    }
    
    const totalRevenue = parseFloat(billingOverview.total_revenue) || 0;
    const revenueValues = Array.isArray(monthlyRevenueData) && monthlyRevenueData.length > 0 ? 
      monthlyRevenueData.map(item => Math.round((parseFloat(item.monthly_revenue) || 0) / 1000)) : [0]; // Convert to thousands
    const revenueLabels = Array.isArray(monthlyRevenueData) && monthlyRevenueData.length > 0 ? 
      monthlyRevenueData.map(item => {
        const date = new Date(item.month);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { month: 'short' });
      }) : ['No Data'];
    
    console.log('Billing overview processed:', billingOverview);
    console.log('Total revenue:', totalRevenue);

    // Update state with processed and validated data
    setKpiData({
      enterpriseOverview: {
        loading: false,
        value: totalEnterprises > 0 ? totalEnterprises.toLocaleString() : 'No Data',
        data: {
          series: enterpriseValues,
          options: {
            chart: {
              type: 'donut',
              height: 180
            },
            labels: enterpriseLabels,
            colors: ['#E30613', '#666666', '#CCCCCC', '#999999', '#777777'],
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
                      label: 'Total Enterprises',
                      formatter: () => totalEnterprises > 0 ? totalEnterprises.toLocaleString() : 'No Data'
                    }
                  }
                }
              }
            },
            tooltip: {
              y: {
                formatter: (val) => val.toLocaleString()
              }
            },
            noData: {
              text: 'No enterprise data available'
            }
          }
        }
      },
      lineSubscriptions: {
        loading: false,
        value: totalLines > 0 ? totalLines.toLocaleString() : 'No Data',
        data: {
          series: lineStatusValues,
          options: {
            chart: {
              type: 'donut',
              height: 180
            },
            labels: lineStatusLabels,
            colors: ['#E30613', '#666666', '#CCCCCC', '#999999', '#777777'],
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
                      label: 'Total Lines',
                      formatter: () => totalLines > 0 ? totalLines.toLocaleString() : 'No Data'
                    }
                  }
                }
              }
            },
            tooltip: {
              y: {
                formatter: (val) => val.toLocaleString()
              }
            },
            noData: {
              text: 'No line subscription data available'
            }
          }
        }
      },
      devices: {
        loading: false,
        value: totalDevices > 0 ? totalDevices.toLocaleString() : 'No Data',
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
            },
            noData: {
              text: 'No device data available'
            }
          }
        }
      },
      billingRevenue: {
        loading: false,
        value: totalRevenue > 0 ? `$${(totalRevenue / 1000000).toFixed(1)}M` : 'No Data',
        data: {
          series: [
            {
              name: 'Revenue ($K)',
              data: revenueValues.reverse()
            }
          ],
          options: {
            chart: {
              type: 'bar',
              height: 180,
              toolbar: { show: false },
              sparkline: { enabled: true }
            },
            plotOptions: {
              bar: {
                borderRadius: 4,
                columnWidth: '60%'
              }
            },
            colors: ['#E30613'],
            xaxis: {
              categories: revenueLabels.reverse()
            },
            tooltip: {
              y: {
                formatter: (val) => `$${val}K`
              }
            },
            noData: {
              text: 'No billing data available'
            }
          }
        }
      }
    });

    console.log('KPI data updated with real wireless carrier database values');
  };
  const setEmptyKPIData = () => {
    console.log('Setting empty KPI data due to database connection issues');
    setKpiData({
      enterpriseOverview: {
        loading: false,
        value: 'No Data',
        data: {
          series: [],
          options: {
            chart: { type: 'donut', height: 180 },
            labels: [],
            colors: ['#E30613', '#666666', '#CCCCCC', '#999999', '#777777'],
            legend: { show: false },
            dataLabels: { enabled: false },
            noData: { text: 'No data available' }
          }
        }
      },
      lineSubscriptions: {
        loading: false,
        value: 'No Data',
        data: {
          series: [{ name: 'Active Lines', data: [] }],
          options: {
            chart: { type: 'area', height: 180, toolbar: { show: false }, sparkline: { enabled: true } },
            colors: ['#E30613'],
            noData: { text: 'No data available' }
          }
        }
      },
      devices: {
        loading: false,
        value: 'No Data',
        data: {
          series: [{ name: 'Devices', data: [] }],
          options: {
            chart: { type: 'bar', height: 180, toolbar: { show: false } },
            colors: ['#E30613'],
            noData: { text: 'No data available' }
          }
        }
      },
      billingRevenue: {
        loading: false,
        value: 'No Data',
        data: {
          series: [{ name: 'Revenue ($K)', data: [] }],
          options: {
            chart: { type: 'bar', height: 180, toolbar: { show: false }, sparkline: { enabled: true } },
            colors: ['#E30613'],
            noData: { text: 'No data available' }
          }
        }
      }
    });
  };

  useEffect(() => {
    // Initial data fetch - only runs once when component mounts
    fetchRealData();
  }, []); // Empty dependency array ensures this only runs once

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
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          '@media (min-width: 1200px)': {
            flexWrap: 'nowrap'
          }
        }}
      >
        <Box sx={{ 
          flex: '1 1 300px', 
          minWidth: '280px',
          '@media (min-width: 1200px)': {
            flex: '1 1 0',
            minWidth: 'auto'
          }
        }}>
          <KPICard
            title="Enterprise Overview"
            value={kpiData.enterpriseOverview.value}
            subtitle="Active B2B customers by industry"
            chart={kpiData.enterpriseOverview.data}
            loading={kpiData.enterpriseOverview.loading}
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px', 
          minWidth: '280px',
          '@media (min-width: 1200px)': {
            flex: '1 1 0',
            minWidth: 'auto'
          }
        }}>
          <KPICard
            title="Line Subscriptions"
            value={kpiData.lineSubscriptions.value}
            subtitle="Active lines currently"
            chart={kpiData.lineSubscriptions.data}
            loading={kpiData.lineSubscriptions.loading}
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px', 
          minWidth: '280px',
          '@media (min-width: 1200px)': {
            flex: '1 1 0',
            minWidth: 'auto'
          }
        }}>
          <KPICard
            title="Devices"
            value={kpiData.devices.value}
            subtitle="Total managed devices"
            chart={kpiData.devices.data}
            loading={kpiData.devices.loading}
          />
        </Box>
        <Box sx={{ 
          flex: '1 1 300px', 
          minWidth: '280px',
          '@media (min-width: 1200px)': {
            flex: '1 1 0',
            minWidth: 'auto'
          }
        }}>
          <KPICard
            title="Billing Revenue"
            value={kpiData.billingRevenue.value}
            subtitle="Total revenue (6 months)"
            chart={kpiData.billingRevenue.data}
            loading={kpiData.billingRevenue.loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default KPIDashboard;
