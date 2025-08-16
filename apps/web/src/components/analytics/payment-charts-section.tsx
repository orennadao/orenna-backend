import React from 'react';
import { 
  PaymentVolumeChart, 
  PaymentStatusChart, 
  PaymentTypeChart, 
  DailyMetricsChart,
  ProjectBreakdownChart 
} from './payment-charts';

interface PaymentChartsSectionProps {
  data: any;
  isLoading: boolean;
  error: any;
}

export default function PaymentChartsSection({ data, isLoading, error }: PaymentChartsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentVolumeChart data={data} isLoading={isLoading} error={error} />
        <PaymentStatusChart data={data} isLoading={isLoading} error={error} />
      </div>
      
      <PaymentTypeChart data={data} isLoading={isLoading} error={error} />
      <DailyMetricsChart data={data} isLoading={isLoading} error={error} />
      <ProjectBreakdownChart data={data} isLoading={isLoading} error={error} />
    </div>
  );
}