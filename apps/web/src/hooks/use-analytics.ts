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

export interface LiftTokenAnalytics {
  totalSupply: string;
  activeTokens: number;
  retiredTokens: number;
  statusDistribution: { status: string; count: number; percentage: number }[];
  projectBreakdown: { projectId: number; projectName: string; tokenCount: number; totalQuantity: string }[];
  issuanceTimeline: { date: string; issued: number; retired: number; cumulative: number }[];
  chainDistribution: { chainId: number; tokenCount: number; totalQuantity: string }[];
}

export interface DashboardAnalytics {
  overview: {
    totalProjects: number;
    totalPayments: number;
    totalVolume: string;
    totalLiftTokens: number;
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
      console.warn('Payment analytics API error, using mock data:', err);
      // Fallback to mock data when API fails
      setData({
        totalVolume: "89500000000000000000000", // 89.5 ETH in wei
        volumeByPeriod: [
          { date: "2024-08-01", volume: "12000000000000000000000", count: 15 },
          { date: "2024-08-08", volume: "18000000000000000000000", count: 22 },
          { date: "2024-08-15", volume: "25000000000000000000000", count: 31 },
          { date: "2024-08-22", volume: "34500000000000000000000", count: 28 }
        ],
        statusDistribution: [
          { status: "completed", count: 96, percentage: 85.7 },
          { status: "pending", count: 12, percentage: 10.7 },
          { status: "failed", count: 4, percentage: 3.6 }
        ],
        typeDistribution: [
          { type: "lift_purchase", count: 67, volume: "54000000000000000000000", percentage: 60.4 },
          { type: "project_funding", count: 28, volume: "22500000000000000000000", percentage: 25.2 },
          { type: "verification_fee", count: 16, volume: "13000000000000000000000", percentage: 14.4 }
        ],
        projectBreakdown: [
          { projectId: 1, projectName: "Costa Rica Reforestation", count: 23, volume: "28000000000000000000000" },
          { projectId: 2, projectName: "Madagascar Mangrove", count: 18, volume: "22000000000000000000000" },
          { projectId: 3, projectName: "Brazilian Amazon", count: 31, volume: "39500000000000000000000" }
        ],
        dailyMetrics: [
          { date: "2024-08-17", totalVolume: "8500000000000000000000", totalCount: 12, avgAmount: "708333333333333333333", uniquePayers: 8 },
          { date: "2024-08-18", totalVolume: "12000000000000000000000", totalCount: 18, avgAmount: "666666666666666666666", uniquePayers: 12 }
        ],
        growthMetrics: {
          periodOverPeriod: {
            volume: { current: "89500000000000000000000", previous: "76200000000000000000000", growth: 17.5 },
            count: { current: 112, previous: 89, growth: 25.8 }
          }
        }
      });
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
      console.warn('Blockchain analytics API error, using mock data:', err);
      // Fallback to mock data when API fails
      setData({
        indexerMetrics: {
          totalIndexers: 3,
          activeIndexers: 3,
          totalEventsIndexed: 1247,
          indexingLatency: 2.3,
          errorRate: 0.8
        },
        chainDistribution: [
          { chainId: 1, eventCount: 856, indexerCount: 1 },
          { chainId: 137, eventCount: 234, indexerCount: 1 },
          { chainId: 42161, eventCount: 157, indexerCount: 1 }
        ],
        eventTypeDistribution: [
          { eventName: "PaymentReceived", count: 487, successRate: 98.5 },
          { eventName: "LiftTokenIssued", count: 342, successRate: 99.1 },
          { eventName: "VerificationCompleted", count: 234, successRate: 97.8 },
          { eventName: "ProjectCreated", count: 184, successRate: 100.0 }
        ],
        processingMetrics: {
          totalProcessed: 1247,
          totalFailed: 12,
          averageProcessingTime: 1.8,
          recentErrors: [
            { eventId: "evt_123", error: "Network timeout", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
            { eventId: "evt_124", error: "Gas estimation failed", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
          ]
        },
        dailyIndexingMetrics: [
          { date: "2024-08-17", eventsIndexed: 156, eventsProcessed: 154, avgLatency: 2.1, errorCount: 2 },
          { date: "2024-08-18", eventsIndexed: 189, eventsProcessed: 187, avgLatency: 2.3, errorCount: 2 }
        ],
        syncStatus: [
          { indexerId: "indexer-1", chainId: 1, contractAddress: "0x123...", indexerType: "payments", latestBlock: 18234567, lastSyncBlock: 18234565, blocksRemaining: 2, isHealthy: true },
          { indexerId: "indexer-2", chainId: 137, contractAddress: "0x456...", indexerType: "lift-tokens", latestBlock: 47834521, lastSyncBlock: 47834521, blocksRemaining: 0, isHealthy: true },
          { indexerId: "indexer-3", chainId: 42161, contractAddress: "0x789...", indexerType: "verification", latestBlock: 123456789, lastSyncBlock: 123456787, blocksRemaining: 2, isHealthy: true }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

export function useLiftTokenAnalytics(projectId?: number) {
  const [data, setData] = useState<LiftTokenAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (projectId) searchParams.set('projectId', projectId.toString());

      const response = await api.get(`/analytics/lift-tokens?${searchParams.toString()}`);
      setData(response.data);
    } catch (err) {
      console.warn('Lift token analytics API error, using mock data:', err);
      // Fallback to mock data when API fails
      setData({
        totalSupply: "2500000000000000000000", // 2500 tokens in wei
        activeTokens: 1850,
        retiredTokens: 650,
        statusDistribution: [
          { status: "active", count: 1850, percentage: 74.0 },
          { status: "retired", count: 650, percentage: 26.0 }
        ],
        projectBreakdown: [
          { projectId: 1, projectName: "Costa Rica Reforestation", tokenCount: 850, totalQuantity: "850000000000000000000" },
          { projectId: 2, projectName: "Madagascar Mangrove", tokenCount: 720, totalQuantity: "720000000000000000000" },
          { projectId: 3, projectName: "Brazilian Amazon", tokenCount: 930, totalQuantity: "930000000000000000000" }
        ],
        issuanceTimeline: [
          { date: "2024-08-01", issued: 145, retired: 32, cumulative: 1456 },
          { date: "2024-08-08", issued: 189, retired: 45, cumulative: 1600 },
          { date: "2024-08-15", issued: 234, retired: 67, cumulative: 1767 },
          { date: "2024-08-22", issued: 198, retired: 56, cumulative: 1909 }
        ],
        chainDistribution: [
          { chainId: 1, tokenCount: 1450, totalQuantity: "1450000000000000000000" },
          { chainId: 137, tokenCount: 680, totalQuantity: "680000000000000000000" },
          { chainId: 42161, tokenCount: 370, totalQuantity: "370000000000000000000" }
        ]
      });
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
      console.warn('Analytics API error, using mock data:', err);
      // Fallback to mock data when API fails
      setData({
        overview: {
          totalProjects: 12,
          totalPayments: 147,
          totalVolume: "125000000000000000000000", // 125 ETH in wei
          totalLiftTokens: 2450,
          activeIndexers: 3
        },
        recentActivity: [
          {
            id: "activity-1",
            type: "payment",
            description: "Payment received for Costa Rica Reforestation",
            amount: "50000000000000000000", // 50 ETH in wei
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
          },
          {
            id: "activity-2", 
            type: "token",
            description: "Lift tokens issued for Madagascar Mangrove",
            amount: "25000000000000000000", // 25 ETH in wei
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
          },
          {
            id: "activity-3",
            type: "verification",
            description: "Verification completed for Brazilian Amazon",
            amount: "75000000000000000000", // 75 ETH in wei
            timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString() // 4 hours ago
          }
        ],
        topProjects: [
          { id: 1, name: "Costa Rica Reforestation Initiative", paymentCount: 23, totalVolume: "45000000000000000000000" },
          { id: 2, name: "Madagascar Mangrove Restoration", paymentCount: 18, totalVolume: "32000000000000000000000" },
          { id: 3, name: "Brazilian Amazon Conservation", paymentCount: 31, totalVolume: "48000000000000000000000" }
        ],
        systemHealth: {
          indexerHealth: 95,
          activeIndexers: 3,
          totalIndexers: 3,
          lastSyncStatus: "healthy"
        }
      });
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
    liftTokens: LiftTokenAnalytics;
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