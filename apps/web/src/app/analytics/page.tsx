'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useDashboardAnalytics, usePaymentAnalytics, useBlockchainAnalytics, useLiftTokenAnalytics } from '@/hooks/use-analytics';
import { ChartContainer } from '@/components/analytics/chart-container';
import { RealtimeAnalyticsWrapper, LiveMetric } from '@/components/analytics/real-time-analytics';
import { ComponentLoading } from '@/components/ui/loading';

// Static imports - no lazy loading
import PaymentChartsSection from '@/components/analytics/payment-charts-section';
import BlockchainChartsSection from '@/components/analytics/blockchain-charts-section';
import { BulkExportActions } from '@/components/analytics/bulk-export-actions';

type TabType = 'overview' | 'payments' | 'blockchain' | 'lift-tokens';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardAnalytics();
  const { data: paymentData, isLoading: paymentLoading, error: paymentError, refetch: refetchPayments } = usePaymentAnalytics({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });
  const { data: blockchainData, isLoading: blockchainLoading, error: blockchainError, refetch: refetchBlockchain } = useBlockchainAnalytics();
  const { data: liftTokenData, isLoading: liftTokenLoading, error: liftTokenError, refetch: refetchLiftTokens } = useLiftTokenAnalytics();

  const formatCurrency = (value: string) => {
    const ethValue = parseFloat(value) / 1e18;
    return `${ethValue.toFixed(4)} ETH`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <MainLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Comprehensive analytics for payments, blockchain metrics, and platform performance
        </p>
      </div>

        {/* Date Range Picker and Export Actions */}
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[44px] w-full sm:w-auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[44px] w-full sm:w-auto"
                />
              </div>
              <div className="pt-0 sm:pt-6">
                <button
                  onClick={() => setDateRange({ startDate: '', endDate: '' })}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 min-h-[44px] w-full sm:w-auto"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Export Actions */}
          <BulkExportActions
            paymentData={paymentData}
            blockchainData={blockchainData}
            liftTokenData={liftTokenData}
            dashboardData={dashboardData}
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'payments', label: 'Payments' },
              { id: 'blockchain', label: 'Blockchain' },
              { id: 'lift-tokens', label: 'Lift Tokens' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <RealtimeAnalyticsWrapper 
            onPaymentUpdate={refetchDashboard}
            onIndexerUpdate={refetchDashboard}
          >
            <div className="space-y-6">
              {/* Key Metrics */}
              {dashboardData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <LiveMetric
                    title="Total Projects"
                    value={dashboardData.overview.totalProjects}
                    type="number"
                  />
                  <LiveMetric
                    title="Total Payments"
                    value={dashboardData.overview.totalPayments}
                    type="number"
                  />
                  <LiveMetric
                    title="Total Volume"
                    value={dashboardData.overview.totalVolume}
                    type="currency"
                  />
                  <LiveMetric
                    title="Lift Tokens"
                    value={dashboardData.overview.totalLiftTokens}
                    type="number"
                  />
                  <LiveMetric
                    title="Active Indexers"
                    value={dashboardData.overview.activeIndexers}
                    type="number"
                  />
                </div>
              )}

            {/* Recent Activity */}
            <ChartContainer
              title="Recent Activity"
              description="Latest platform activity"
              isLoading={dashboardLoading}
              error={dashboardError}
            >
              <div className="space-y-3">
                {dashboardData?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(activity.amount)}
                    </div>
                  </div>
                )) || <p className="text-gray-500 text-center py-4">No recent activity</p>}
              </div>
            </ChartContainer>

            {/* Top Projects */}
            <ChartContainer
              title="Top Projects"
              description="Projects with highest payment activity"
              isLoading={dashboardLoading}
              error={dashboardError}
            >
              <div className="space-y-3">
                {dashboardData?.topProjects?.map((project, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.paymentCount} payments</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(project.totalVolume)}
                    </div>
                  </div>
                )) || <p className="text-gray-500 text-center py-4">No projects found</p>}
              </div>
            </ChartContainer>
            </div>
          </RealtimeAnalyticsWrapper>
        )}

        {activeTab === 'payments' && (
          <RealtimeAnalyticsWrapper onPaymentUpdate={refetchPayments}>
            <PaymentChartsSection 
              data={paymentData} 
              isLoading={paymentLoading} 
              error={paymentError} 
            />
          </RealtimeAnalyticsWrapper>
        )}

        {activeTab === 'blockchain' && (
          <RealtimeAnalyticsWrapper onIndexerUpdate={refetchBlockchain}>
            <BlockchainChartsSection 
              data={blockchainData} 
              isLoading={blockchainLoading} 
              error={blockchainError} 
            />
          </RealtimeAnalyticsWrapper>
        )}

        {activeTab === 'lift-tokens' && liftTokenData && (
          <div className="space-y-6">
            {/* Lift Token Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Supply</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {(parseFloat(liftTokenData.totalSupply) / 1e18).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Tokens</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(liftTokenData.activeTokens)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Retired Tokens</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(liftTokenData.retiredTokens)}
                </p>
              </div>
            </div>

            {/* Placeholder for lift token charts - would implement similar to payment charts */}
            <ChartContainer
              title="Lift Token Status Distribution"
              description="Distribution of lift tokens by status"
              isLoading={liftTokenLoading}
              error={liftTokenError}
            >
              <div className="space-y-2">
                {liftTokenData?.statusDistribution?.map((status, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium">{status.status}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{status.count}</span>
                      <span className="text-xs text-gray-500">({status.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>
        )}
    </MainLayout>
  );
}