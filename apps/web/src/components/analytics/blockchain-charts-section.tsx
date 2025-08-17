import React from 'react';
import { 
  IndexerPerformanceChart,
  ChainDistributionChart,
  EventTypeChart,
  IndexerHealthChart,
  IndexerMetricsOverview,
  RecentErrorsChart
} from './blockchain-charts';

interface BlockchainChartsSectionProps {
  data: any;
  isLoading: boolean;
  error: any;
}

export default function BlockchainChartsSection({ data, isLoading, error }: BlockchainChartsSectionProps) {
  return (
    <div className="space-y-6">
      <IndexerMetricsOverview data={data} isLoading={isLoading} error={error} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChainDistributionChart data={data} isLoading={isLoading} error={error} />
        <EventTypeChart data={data} isLoading={isLoading} error={error} />
      </div>
      
      <IndexerPerformanceChart data={data} isLoading={isLoading} error={error} />
      <IndexerHealthChart data={data} isLoading={isLoading} error={error} />
      <RecentErrorsChart data={data} isLoading={isLoading} error={error} />
    </div>
  );
}