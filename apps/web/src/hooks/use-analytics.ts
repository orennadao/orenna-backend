'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface PaymentAnalytics {
  totalVolume: string;
  volumeByPeriod: { date: string; volume: string; count: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  typeDistribution: { type: string; count: number; volume: string; percentage: number }[];
  projectBreakdown: { projectId: number; projectName: string; count: number; volume: string }[];
  dailyMetrics: {
    date: string;
    totalVolume: string;
    totalCount: number;
    avgAmount: string;
    uniquePayers: number;
  }[];
  growthMetrics: {
    periodOverPeriod: {
      volume: { current: string; previous: string; growth: number };
      count: { current: number; previous: number; growth: number };
    };
  };
}

export interface BlockchainAnalytics {
  indexerMetrics: {
    totalIndexers: number;
    activeIndexers: number;
    totalEventsIndexed: number;
    indexingLatency: number;
    errorRate: number;
  };
  chainDistribution: { chainId: number; eventCount: number; indexerCount: number }[];
  eventTypeDistribution: { eventName: string; count: number; successRate: number }[];
  processingMetrics: {
    totalProcessed: number;
    totalFailed: number;
    averageProcessingTime: number;
    recentErrors: { eventId: string; error: string; timestamp: string }[];
  };
  dailyIndexingMetrics: {
    date: string;
    eventsIndexed: number;
    eventsProcessed: number;
    avgLatency: number;
    errorCount: number;
  }[];
  syncStatus: {
    indexerId: string;
    chainId: number;
    contractAddress: string;
    indexerType: string;
    latestBlock: number;
    lastSyncBlock: number;
    blocksRemaining: number;
    isHealthy: boolean;
  }[];
}

export interface LiftUnitAnalytics {
  totalSupply: string;
  activeUnits: number;
  retiredUnits: number;
  statusDistribution: { status: string; count: number; percentage: number }[];
  projectBreakdown: { projectId: number; projectName: string; unitCount: number; totalQuantity: string }[];
  issuanceTimeline: { date: string; issued: number; retired: number; cumulative: number }[];
  chainDistribution: { chainId: number; unitCount: number; totalQuantity: string }[];
}

export interface DashboardAnalytics {
  overview: {
    totalProjects: number;
    totalPayments: number;
    totalVolume: string;
    totalLiftUnits: number;
    activeIndexers: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    amount: string;
    timestamp: string;
  }>;
  topProjects: Array<{
    id: number;
    name: string;
    paymentCount: number;
    totalVolume: string;
  }>;
  systemHealth: {
    indexerHealth: number;
    activeIndexers: number;
    totalIndexers: number;
    lastSyncStatus: string;
  };
}

interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  projectId?: number;
  period?: 'day' | 'week' | 'month' | 'year';
}

export function usePaymentAnalytics(params?: AnalyticsParams) {
  const [data, setData] = useState<PaymentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.projectId) searchParams.set('projectId', params.projectId.toString());
      if (params?.period) searchParams.set('period', params.period);

      const response = await api.get(`/analytics/payments?${searchParams.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params?.startDate, params?.endDate, params?.projectId, params?.period]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useBlockchainAnalytics() {
  const [data, setData] = useState<BlockchainAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/analytics/blockchain');
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blockchain analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

export function useLiftUnitAnalytics(projectId?: number) {
  const [data, setData] = useState<LiftUnitAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (projectId) searchParams.set('projectId', projectId.toString());

      const response = await api.get(`/analytics/lift-units?${searchParams.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lift unit analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useDashboardAnalytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

export function useProjectAnalytics(projectId: number, params?: AnalyticsParams) {
  const [data, setData] = useState<{
    project: any;
    payments: PaymentAnalytics;
    liftUnits: LiftUnitAnalytics;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);

      const response = await api.get(`/analytics/projects/${projectId}?${searchParams.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId, params?.startDate, params?.endDate]);

  return { data, isLoading, error, refetch: fetchData };
}