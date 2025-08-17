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
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartContainer } from './chart-container';
import { ChartExportActions, useChartExport } from './chart-export-actions';
import { preparePaymentDataForExport } from '@/utils/chart-export';
import type { PaymentAnalytics } from '@/hooks/use-analytics';

interface PaymentChartsProps {
  data: PaymentAnalytics;
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

export function PaymentVolumeChart({ data, isLoading, error }: PaymentChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.volumeByPeriod) return [];
    
    return data.volumeByPeriod.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      volume: parseFloat(item.volume) / 1e18, // Convert from wei to ETH
      count: item.count,
      volumeFormatted: `${(parseFloat(item.volume) / 1e18).toFixed(4)} ETH`
    }));
  }, [data?.volumeByPeriod]);

  const exportData = useMemo(() => {
    return data?.volumeByPeriod?.map(item => ({
      date: item.date,
      volume_eth: (parseFloat(item.volume) / 1e18).toFixed(6),
      volume_wei: item.volume,
      transaction_count: item.count
    })) || [];
  }, [data?.volumeByPeriod]);

  return (
    <ChartContainer
      title="Payment Volume Over Time"
      description="Daily payment volume and transaction count"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Payment Volume Over Time"
          exportData={exportData}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="volume" orientation="left" />
            <YAxis yAxisId="count" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'volume') return [`${Number(value).toFixed(4)} ETH`, 'Volume'];
                return [value, 'Count'];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Area
              yAxisId="volume"
              type="monotone"
              dataKey="volume"
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.3}
              name="Volume (ETH)"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              stroke={COLORS[1]}
              strokeWidth={2}
              name="Transaction Count"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function PaymentStatusChart({ data, isLoading, error }: PaymentChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.statusDistribution) return [];
    
    return data.statusDistribution.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));
  }, [data?.statusDistribution]);

  return (
    <ChartContainer
      title="Payment Status Distribution"
      description="Breakdown of payments by status"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Payment Status Distribution"
          exportData={data?.statusDistribution}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, 'Count']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function PaymentTypeChart({ data, isLoading, error }: PaymentChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.typeDistribution) return [];
    
    return data.typeDistribution.map(item => ({
      type: item.type.replace('_', ' '),
      count: item.count,
      volume: parseFloat(item.volume) / 1e18,
      percentage: item.percentage,
      volumeFormatted: `${(parseFloat(item.volume) / 1e18).toFixed(4)} ETH`
    }));
  }, [data?.typeDistribution]);

  return (
    <ChartContainer
      title="Payment Types"
      description="Payment count and volume by type"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Payment Types"
          exportData={data?.typeDistribution}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="count" orientation="left" />
            <YAxis yAxisId="volume" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Volume (ETH)') return [`${Number(value).toFixed(4)} ETH`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              yAxisId="count"
              dataKey="count"
              fill={COLORS[0]}
              name="Count"
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill={COLORS[1]}
              name="Volume (ETH)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function DailyMetricsChart({ data, isLoading, error }: PaymentChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.dailyMetrics) return [];
    
    return data.dailyMetrics.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      volume: parseFloat(item.totalVolume) / 1e18,
      count: item.totalCount,
      avgAmount: parseFloat(item.avgAmount) / 1e18,
      uniquePayers: item.uniquePayers
    }));
  }, [data?.dailyMetrics]);

  const exportData = useMemo(() => {
    return data?.dailyMetrics?.map(item => ({
      date: item.date,
      total_volume_eth: (parseFloat(item.totalVolume) / 1e18).toFixed(6),
      total_count: item.totalCount,
      avg_amount_eth: (parseFloat(item.avgAmount) / 1e18).toFixed(6),
      unique_payers: item.uniquePayers
    })) || [];
  }, [data?.dailyMetrics]);

  return (
    <ChartContainer
      title="Daily Payment Metrics"
      description="Daily volume, count, average amount, and unique payers"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Daily Payment Metrics"
          exportData={exportData}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="volume" orientation="left" />
            <YAxis yAxisId="count" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (typeof name === 'string' && name.includes('ETH')) return [`${Number(value).toFixed(4)} ETH`, name];
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="volume"
              stroke={COLORS[0]}
              strokeWidth={2}
              name="Volume (ETH)"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              stroke={COLORS[1]}
              strokeWidth={2}
              name="Transaction Count"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="uniquePayers"
              stroke={COLORS[2]}
              strokeWidth={2}
              name="Unique Payers"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

export function ProjectBreakdownChart({ data, isLoading, error }: PaymentChartsProps) {
  const { chartRef } = useChartExport();
  const chartData = useMemo(() => {
    if (!data?.projectBreakdown) return [];
    
    return data.projectBreakdown
      .map(item => ({
        project: item.projectName,
        count: item.count,
        volume: parseFloat(item.volume) / 1e18,
        volumeFormatted: `${(parseFloat(item.volume) / 1e18).toFixed(4)} ETH`
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10); // Top 10 projects
  }, [data?.projectBreakdown]);

  const exportData = useMemo(() => {
    return data?.projectBreakdown?.map(item => ({
      project_name: item.projectName,
      payment_count: item.count,
      total_volume_eth: (parseFloat(item.volume) / 1e18).toFixed(6)
    })) || [];
  }, [data?.projectBreakdown]);

  return (
    <ChartContainer
      title="Top Projects by Payment Volume"
      description="Projects with highest payment volume"
      isLoading={isLoading}
      error={error}
      actions={
        <ChartExportActions
          chartTitle="Top Projects by Payment Volume"
          exportData={exportData}
        />
      }
    >
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="project" type="category" width={100} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Volume (ETH)') return [`${Number(value).toFixed(4)} ETH`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="volume"
              fill={COLORS[0]}
              name="Volume (ETH)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}