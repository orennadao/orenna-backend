'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartContainer } from './chart-container';
import { ChartExportActions, useChartExport } from './chart-export-actions';
import { prepareBlockchainDataForExport } from '@/utils/chart-export';
import type { BlockchainAnalytics } from '@/hooks/use-analytics';

interface BlockchainChartsProps {
  data: BlockchainAnalytics;
  isLoading?: boolean;
  error?: string | null;
}

const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

export function IndexerPerformanceChart({ data, isLoading, error }: BlockchainChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.dailyIndexingMetrics) return [];
    
    return data.dailyIndexingMetrics.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      indexed: item.eventsIndexed,
      processed: item.eventsProcessed,
      errors: item.errorCount,
      successRate: item.eventsIndexed > 0 ? (item.eventsProcessed / item.eventsIndexed) * 100 : 0
    }));
  }, [data?.dailyIndexingMetrics]);

  return (
    <ChartContainer
      title="Indexer Performance Over Time"
      description="Daily event indexing and processing metrics"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Indexer Performance Over Time"
          exportData={data?.dailyIndexingMetrics}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="events" orientation="left" />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Success Rate') return [`${Number(value).toFixed(1)}%`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="events"
              type="monotone"
              dataKey="indexed"
              stroke={COLORS[0]}
              strokeWidth={2}
              name="Events Indexed"
            />
            <Line
              yAxisId="events"
              type="monotone"
              dataKey="processed"
              stroke={COLORS[1]}
              strokeWidth={2}
              name="Events Processed"
            />
            <Line
              yAxisId="events"
              type="monotone"
              dataKey="errors"
              stroke={COLORS[3]}
              strokeWidth={2}
              name="Errors"
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="successRate"
              stroke={COLORS[2]}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Success Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function ChainDistributionChart({ data, isLoading, error }: BlockchainChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.chainDistribution) return [];
    
    const chainNames: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      11155111: 'Sepolia'
    };
    
    return data.chainDistribution.map((item, index) => ({
      chainId: item.chainId,
      chainName: chainNames[item.chainId] || `Chain ${item.chainId}`,
      eventCount: item.eventCount,
      indexerCount: item.indexerCount,
      color: COLORS[index % COLORS.length]
    }));
  }, [data?.chainDistribution]);

  return (
    <ChartContainer
      title="Blockchain Distribution"
      description="Events and indexers by blockchain"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Blockchain Distribution"
          exportData={data?.chainDistribution}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="chainName" />
            <YAxis yAxisId="events" orientation="left" />
            <YAxis yAxisId="indexers" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="events"
              dataKey="eventCount"
              fill={COLORS[0]}
              name="Events"
            />
            <Bar
              yAxisId="indexers"
              dataKey="indexerCount"
              fill={COLORS[1]}
              name="Indexers"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function EventTypeChart({ data, isLoading, error }: BlockchainChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.eventTypeDistribution) return [];
    
    return data.eventTypeDistribution.map((item, index) => ({
      eventName: item.eventName,
      count: item.count,
      successRate: item.successRate,
      color: COLORS[index % COLORS.length]
    }));
  }, [data?.eventTypeDistribution]);

  return (
    <ChartContainer
      title="Event Type Distribution"
      description="Event count and success rate by type"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Event Type Distribution"
          exportData={data?.eventTypeDistribution}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="count" orientation="left" />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Success Rate') return [`${Number(value).toFixed(1)}%`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              yAxisId="count"
              dataKey="count"
              fill={COLORS[0]}
              name="Event Count"
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="successRate"
              stroke={COLORS[1]}
              strokeWidth={3}
              name="Success Rate (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function IndexerHealthChart({ data, isLoading, error }: BlockchainChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.syncStatus) return [];
    
    return data.syncStatus.map(indexer => ({
      indexer: `${indexer.indexerType} (${indexer.chainId})`,
      syncedBlocks: indexer.lastSyncBlock,
      latestBlock: indexer.latestBlock,
      blocksRemaining: indexer.blocksRemaining,
      syncPercentage: indexer.latestBlock > 0 ? (indexer.lastSyncBlock / indexer.latestBlock) * 100 : 0,
      isHealthy: indexer.isHealthy,
      healthColor: indexer.isHealthy ? '#10B981' : '#EF4444'
    }));
  }, [data?.syncStatus]);

  return (
    <ChartContainer
      title="Indexer Sync Status"
      description="Sync progress and health of each indexer"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Indexer Sync Status"
          exportData={data?.syncStatus}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="indexer" type="category" width={120} />
            <Tooltip 
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Sync Progress']}
            />
            <Bar
              dataKey="syncPercentage"
              fill={COLORS[0]}
              name="Sync Progress (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function IndexerMetricsOverview({ data, isLoading, error }: BlockchainChartsProps) {
  const { chartRef } = useChartExport();
  const metrics = useMemo(() => {
    if (!data?.indexerMetrics) return [];
    
    return [
      {
        name: 'Total Indexers',
        value: data.indexerMetrics.totalIndexers,
        color: COLORS[0]
      },
      {
        name: 'Active Indexers',
        value: data.indexerMetrics.activeIndexers,
        color: COLORS[1]
      },
      {
        name: 'Events Indexed',
        value: data.indexerMetrics.totalEventsIndexed,
        color: COLORS[2]
      }
    ];
  }, [data?.indexerMetrics]);

  const performanceData = useMemo(() => {
    if (!data?.indexerMetrics) return [];
    
    return [
      {
        metric: 'Avg Latency',
        value: data.indexerMetrics.indexingLatency,
        unit: 'seconds',
        color: COLORS[0]
      },
      {
        metric: 'Error Rate',
        value: data.indexerMetrics.errorRate,
        unit: '%',
        color: COLORS[3]
      }
    ];
  }, [data?.indexerMetrics]);

  const exportData = useMemo(() => {
    if (!data?.indexerMetrics) return [];
    return [
      { metric: 'Total Indexers', value: data.indexerMetrics.totalIndexers },
      { metric: 'Active Indexers', value: data.indexerMetrics.activeIndexers },
      { metric: 'Events Indexed', value: data.indexerMetrics.totalEventsIndexed },
      { metric: 'Avg Latency (seconds)', value: data.indexerMetrics.indexingLatency },
      { metric: 'Error Rate (%)', value: data.indexerMetrics.errorRate }
    ];
  }, [data?.indexerMetrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartContainer
        title="Indexer Overview"
        description="Key indexer metrics"
        isLoading={isLoading}
        error={error}
        actions={
          <ChartExportActions
            chartTitle="Indexer Overview"
            exportData={exportData}
          />
        }
      >
        <div ref={chartRef}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title="Performance Metrics"
        description="Latency and error rates"
        isLoading={isLoading}
        error={error}
      >
        <div className="space-y-4">
          {performanceData.map((metric, index) => (
            <div key={metric.metric} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
              <div className="flex items-center">
                <span className="text-lg font-semibold mr-2">
                  {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                </span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
                <div 
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ backgroundColor: metric.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}

export function RecentErrorsChart({ data, isLoading, error }: BlockchainChartsProps) {
  const errorData = useMemo(() => {
    if (!data?.processingMetrics?.recentErrors) return [];
    
    return data.processingMetrics.recentErrors.map((err, index) => ({
      id: err.eventId.slice(0, 8),
      error: err.error.slice(0, 50) + (err.error.length > 50 ? '...' : ''),
      timestamp: format(parseISO(err.timestamp), 'MMM dd HH:mm'),
      index: index + 1
    }));
  }, [data?.processingMetrics?.recentErrors]);

  const exportData = useMemo(() => {
    return data?.processingMetrics?.recentErrors?.map(err => ({
      event_id: err.eventId,
      error_message: err.error,
      timestamp: err.timestamp
    })) || [];
  }, [data?.processingMetrics?.recentErrors]);

  return (
    <ChartContainer
      title="Recent Processing Errors"
      description="Latest indexer errors for debugging"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Recent Processing Errors"
          exportData={exportData}
        />
      }
    >
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {errorData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent errors
          </div>
        ) : (
          errorData.map((err) => (
            <div key={err.id} className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800">
                    Event ID: {err.id}
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    {err.error}
                  </div>
                </div>
                <div className="text-xs text-red-600 ml-4">
                  {err.timestamp}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ChartContainer>
  );
}