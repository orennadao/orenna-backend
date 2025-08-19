'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

// Types for finance dashboard data
interface FinanceDashboardData {
  budget: {
    totalAllocated: string;
    totalCommitted: string;
    totalDisbursed: string;
    available: string;
  };
  cashFlow: {
    totalInflow: string;
    totalOutflow: string;
    netCashFlow: string;
    projectedNextMonth: string;
  };
  payments: {
    pendingApprovals: number;
    scheduledPayments: number;
    completedThisMonth: number;
    totalVolume: string;
  };
  compliance: {
    vendorsInCompliance: number;
    documentsExpiring: number;
    kycPending: number;
    complianceScore: number;
  };
  financeLoop: {
    depositsTotal: string;
    liftTokensIssued: string;
    liftTokensRetired: string;
    receiptsGenerated: number;
    healthScore: number;
  };
}

export default function FinanceDashboard() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use project ID 1 for demo purposes
        const projectId = 1;
        
        // Fetch both existing and new finance data
        const [platformSummary, costTrends, financeSummary, healthScore] = await Promise.all([
          fetch('/api/costs/platform-summary').then(res => res.json()),
          fetch('/api/costs/trends').then(res => res.json()).catch(() => null),
          fetch(`/api/finance/integrity/${projectId}/summary`).then(res => res.json()).catch(() => null),
          fetch(`/api/finance/integrity/${projectId}/health`).then(res => res.json()).catch(() => null)
        ]);

        // Transform the data for the dashboard
        const dashboardData: FinanceDashboardData = {
          budget: {
            totalAllocated: platformSummary.totalPlatformCostsCents || '0',
            totalCommitted: '0', // Would come from contract commitments
            totalDisbursed: platformSummary.totalPlatformCostsCents || '0',
            available: '0' // Would be calculated from allocations
          },
          cashFlow: {
            totalInflow: '0', // Would come from payment receipts
            totalOutflow: platformSummary.totalPlatformCostsCents || '0',
            netCashFlow: platformSummary.totalPlatformCostsCents || '0',
            projectedNextMonth: '0' // Would be calculated from projections
          },
          payments: {
            pendingApprovals: 0, // Would come from payment approval queue
            scheduledPayments: 0, // Would come from scheduled disbursements
            completedThisMonth: 0, // Would come from recent payments
            totalVolume: platformSummary.totalPlatformCostsCents || '0'
          },
          compliance: {
            vendorsInCompliance: 0, // Would come from vendor compliance status
            documentsExpiring: 0, // Would come from document expiry checks
            kycPending: 0, // Would come from KYC status
            complianceScore: 95 // Would be calculated from compliance metrics
          },
          financeLoop: {
            depositsTotal: financeSummary?.depositsTotal || '$0',
            liftTokensIssued: financeSummary?.liftTokensIssued || '0',
            liftTokensRetired: financeSummary?.liftTokensRetired || '0',
            receiptsGenerated: 0, // Would come from receipts API
            healthScore: healthScore?.healthScore || 0
          }
        };

        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: string) => {
    const amount = parseInt(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Allocated</p>
              <p className="text-2xl font-bold text-blue-600">
                {data ? formatCurrency(data.budget.totalAllocated) : '$0'}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">💰</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Disbursed</p>
              <p className="text-2xl font-bold text-green-600">
                {data ? formatCurrency(data.budget.totalDisbursed) : '$0'}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">✅</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-600">
                {data?.payments.pendingApprovals || 0}
              </p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm">⏳</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {data?.compliance.complianceScore || 95}%
              </p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">🛡️</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Cash Flow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cash Flow Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Outflow</span>
              <span className="font-medium text-red-600">
                {data ? formatCurrency(data.cashFlow.totalOutflow) : '$0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Net Cash Flow</span>
              <span className="font-medium">
                {data ? formatCurrency(data.cashFlow.netCashFlow) : '$0'}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Projected Next Month</span>
                <span className="font-medium text-blue-600">
                  {data ? formatCurrency(data.cashFlow.projectedNextMonth) : '$0'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Queue</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Approvals</span>
              <span className="font-medium text-orange-600">
                {data?.payments.pendingApprovals || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Scheduled Payments</span>
              <span className="font-medium text-blue-600">
                {data?.payments.scheduledPayments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed This Month</span>
              <span className="font-medium text-green-600">
                {data?.payments.completedThisMonth || 0}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Volume</span>
                <span className="font-medium">
                  {data ? formatCurrency(data.payments.totalVolume) : '$0'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Compliance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data?.compliance.vendorsInCompliance || 0}
            </p>
            <p className="text-sm text-gray-600">Vendors in Compliance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {data?.compliance.documentsExpiring || 0}
            </p>
            <p className="text-sm text-gray-600">Documents Expiring</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {data?.compliance.kycPending || 0}
            </p>
            <p className="text-sm text-gray-600">KYC Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {data?.compliance.complianceScore || 95}%
            </p>
            <p className="text-sm text-gray-600">Overall Score</p>
          </div>
        </div>
      </Card>

      {/* Finance Loop Completion */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Finance Loop Completion 🚀</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {data?.financeLoop.depositsTotal || '$0'}
            </p>
            <p className="text-sm text-gray-600">Total Deposits</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data?.financeLoop.liftTokensIssued || 0}
            </p>
            <p className="text-sm text-gray-600">Lift Tokens Issued</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {data?.financeLoop.liftTokensRetired || 0}
            </p>
            <p className="text-sm text-gray-600">Lift Tokens Retired</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {data?.financeLoop.receiptsGenerated || 0}
            </p>
            <p className="text-sm text-gray-600">Receipts Generated</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              (data?.financeLoop.healthScore || 0) >= 90 ? 'text-green-600' : 
              (data?.financeLoop.healthScore || 0) >= 75 ? 'text-blue-600' : 
              (data?.financeLoop.healthScore || 0) >= 60 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {data?.financeLoop.healthScore || 0}%
            </p>
            <p className="text-sm text-gray-600">Health Score</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>The finance loop connects deposits → disbursements → verification → lift tokens → retirement → receipts</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left">
            <div className="font-medium text-blue-600">Create Contract</div>
            <div className="text-sm text-gray-600">Start a new contract approval workflow</div>
          </button>
          <button className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left">
            <div className="font-medium text-green-600">Process Payments</div>
            <div className="text-sm text-gray-600">Review and approve pending payments</div>
          </button>
          <button className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left">
            <div className="font-medium text-purple-600">Generate Report</div>
            <div className="text-sm text-gray-600">Create financial or compliance reports</div>
          </button>
          <button className="p-4 border border-cyan-200 rounded-lg hover:bg-cyan-50 text-left">
            <div className="font-medium text-cyan-600">Add Deposit</div>
            <div className="text-sm text-gray-600">Credit funds to Lift Forward bucket</div>
          </button>
          <button className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 text-left">
            <div className="font-medium text-orange-600">Verify Gate</div>
            <div className="text-sm text-gray-600">Attest verification and release retention</div>
          </button>
          <button className="p-4 border border-pink-200 rounded-lg hover:bg-pink-50 text-left">
            <div className="font-medium text-pink-600">Mint Lift Tokens</div>
            <div className="text-sm text-gray-600">Issue new lift tokens with finance refs</div>
          </button>
        </div>
      </Card>
    </div>
  );
}