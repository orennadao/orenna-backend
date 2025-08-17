'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePaymentEvents, useIndexerEvents } from '@/components/providers/websocket-provider';
import { ChartContainer } from './chart-container';

interface RealtimeUpdateProps {
  onPaymentUpdate?: () => void;
  onIndexerUpdate?: () => void;
  children: React.ReactNode;
}

export function RealtimeAnalyticsWrapper({ 
  onPaymentUpdate, 
  onIndexerUpdate, 
  children 
}: RealtimeUpdateProps) {
  const [recentUpdates, setRecentUpdates] = useState<Array<{
    id: string;
    type: 'payment' | 'indexer';
    message: string;
    timestamp: Date;
  }>>([]);

  const paymentEvents = usePaymentEvents();
  const indexerEvents = useIndexerEvents();

  const addUpdate = useCallback((type: 'payment' | 'indexer', message: string) => {
    const update = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date()
    };
    
    setRecentUpdates(prev => [update, ...prev].slice(0, 10)); // Keep last 10 updates
  }, []);

  // Subscribe to payment events
  useEffect(() => {
    const unsubscribers = [
      paymentEvents.onPaymentInitiated((data) => {
        addUpdate('payment', `Payment ${data.paymentId} initiated - ${data.paymentType}`);
        onPaymentUpdate?.();
      }),
      paymentEvents.onPaymentConfirmed((data) => {
        addUpdate('payment', `Payment ${data.paymentId} confirmed - ${(parseFloat(data.amount) / 1e18).toFixed(4)} ETH`);
        onPaymentUpdate?.();
      }),
      paymentEvents.onPaymentFailed((data) => {
        addUpdate('payment', `Payment ${data.paymentId} failed`);
        onPaymentUpdate?.();
      }),
      paymentEvents.onProceedsNotified((data) => {
        addUpdate('payment', `Proceeds notified for payment ${data.paymentId}`);
        onPaymentUpdate?.();
      }),
      paymentEvents.onUnitsPurchased((data) => {
        addUpdate('payment', `Units purchased in payment ${data.paymentId}`);
        onPaymentUpdate?.();
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [paymentEvents, addUpdate, onPaymentUpdate]);

  // Subscribe to indexer events
  useEffect(() => {
    const unsubscribers = [
      indexerEvents.onEventIndexed((data) => {
        addUpdate('indexer', `${data.eventName} event indexed on chain ${data.chainId}`);
        onIndexerUpdate?.();
      }),
      indexerEvents.onEventProcessed((data) => {
        addUpdate('indexer', `${data.eventName} event processed on chain ${data.chainId}`);
        onIndexerUpdate?.();
      }),
      indexerEvents.onEventError((data) => {
        addUpdate('indexer', `Error processing ${data.eventName} on chain ${data.chainId}`);
        onIndexerUpdate?.();
      }),
      indexerEvents.onProceedsReceived((data) => {
        addUpdate('indexer', 'Proceeds received event detected');
        onIndexerUpdate?.();
      }),
      indexerEvents.onUnitsSold((data) => {
        addUpdate('indexer', 'Units sold event detected');
        onIndexerUpdate?.();
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [indexerEvents, addUpdate, onIndexerUpdate]);

  return (
    <div className="space-y-6">
      {/* Real-time Updates Panel */}
      {recentUpdates.length > 0 && (
        <ChartContainer
          title="Real-time Updates"
          description="Live data updates from WebSocket events"
          actions={
            <button
              onClick={() => setRecentUpdates([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          }
        >
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentUpdates.map((update) => (
              <div
                key={update.id}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  update.type === 'payment' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      update.type === 'payment' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                  />
                  <span className={update.type === 'payment' ? 'text-blue-800' : 'text-green-800'}>
                    {update.message}
                  </span>
                </div>
                <span className={`text-xs ${update.type === 'payment' ? 'text-blue-600' : 'text-green-600'}`}>
                  {update.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ChartContainer>
      )}

      {/* Chart Content */}
      {children}
    </div>
  );
}

interface LiveMetricProps {
  title: string;
  value: string | number;
  change?: number;
  unit?: string;
  type?: 'currency' | 'number' | 'percentage';
}

export function LiveMetric({ title, value, change, unit, type = 'number' }: LiveMetricProps) {
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    if (change !== undefined) {
      setIsUpdated(true);
      const timeout = setTimeout(() => setIsUpdated(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [change, value]);

  const formatValue = (val: string | number) => {
    if (type === 'currency') {
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      return `${(numVal / 1e18).toFixed(4)} ETH`;
    }
    if (type === 'percentage') {
      return `${val}%`;
    }
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`transition-colors duration-300 ${isUpdated ? 'bg-blue-100' : 'bg-white'} rounded-lg border border-gray-200 p-4`}>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
          {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
        {change !== undefined && (
          <span className={`text-sm font-medium ${getChangeColor(change)}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

export function LiveChartUpdater({ onUpdate }: { onUpdate: () => void }) {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  const handleUpdate = useCallback(() => {
    setLastUpdateTime(new Date());
    onUpdate();
  }, [onUpdate]);

  return (
    <RealtimeAnalyticsWrapper 
      onPaymentUpdate={handleUpdate}
      onIndexerUpdate={handleUpdate}
    >
      {lastUpdateTime && (
        <div className="text-xs text-gray-500 text-right mb-4">
          Last updated: {lastUpdateTime.toLocaleTimeString()}
        </div>
      )}
    </RealtimeAnalyticsWrapper>
  );
}