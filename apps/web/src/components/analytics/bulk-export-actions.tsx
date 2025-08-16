'use client';

import React, { useState } from 'react';
import { downloadDataAsCSV, preparePaymentDataForExport, prepareBlockchainDataForExport } from '@/utils/chart-export';
import type { PaymentAnalytics, BlockchainAnalytics, LiftUnitAnalytics } from '@/hooks/use-analytics';

interface BulkExportActionsProps {
  paymentData?: PaymentAnalytics | null;
  blockchainData?: BlockchainAnalytics | null;
  liftUnitData?: LiftUnitAnalytics | null;
  dashboardData?: any;
}

export function BulkExportActions({ 
  paymentData, 
  blockchainData, 
  liftUnitData,
  dashboardData 
}: BulkExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      
      // Export payment data
      if (paymentData) {
        const paymentExportData = preparePaymentDataForExport(paymentData);
        downloadDataAsCSV(paymentExportData, `payment_analytics_${timestamp}`);
      }

      // Export blockchain data
      if (blockchainData) {
        const blockchainExportData = prepareBlockchainDataForExport(blockchainData);
        downloadDataAsCSV(blockchainExportData, `blockchain_analytics_${timestamp}`);
      }

      // Export lift unit data
      if (liftUnitData) {
        const liftUnitExportData = [
          {
            metric: 'Total Supply',
            value: liftUnitData.totalSupply,
            value_eth: (parseFloat(liftUnitData.totalSupply) / 1e18).toFixed(6)
          },
          {
            metric: 'Active Units',
            value: liftUnitData.activeUnits
          },
          {
            metric: 'Retired Units',
            value: liftUnitData.retiredUnits
          },
          ...(liftUnitData.statusDistribution?.map(status => ({
            metric: `Status Distribution - ${status.status}`,
            count: status.count,
            percentage: status.percentage
          })) || [])
        ];
        downloadDataAsCSV(liftUnitExportData, `lift_unit_analytics_${timestamp}`);
      }

      // Export dashboard overview data
      if (dashboardData) {
        const overviewData = [
          { metric: 'Total Projects', value: dashboardData.overview?.totalProjects || 0 },
          { metric: 'Total Payments', value: dashboardData.overview?.totalPayments || 0 },
          { metric: 'Total Volume (Wei)', value: dashboardData.overview?.totalVolume || '0' },
          { metric: 'Total Volume (ETH)', value: (parseFloat(dashboardData.overview?.totalVolume || '0') / 1e18).toFixed(6) },
          { metric: 'Total Lift Units', value: dashboardData.overview?.totalLiftUnits || 0 },
          { metric: 'Active Indexers', value: dashboardData.overview?.activeIndexers || 0 }
        ];
        downloadDataAsCSV(overviewData, `dashboard_overview_${timestamp}`);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPayments = () => {
    if (!paymentData) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const exportData = preparePaymentDataForExport(paymentData);
    downloadDataAsCSV(exportData, `payment_analytics_${timestamp}`);
  };

  const handleExportBlockchain = () => {
    if (!blockchainData) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const exportData = prepareBlockchainDataForExport(blockchainData);
    downloadDataAsCSV(exportData, `blockchain_analytics_${timestamp}`);
  };

  return (
    <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Export Data:</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExportAll}
          disabled={isExporting}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              All Data
            </>
          )}
        </button>

        {paymentData && (
          <button
            onClick={handleExportPayments}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Payments
          </button>
        )}

        {blockchainData && (
          <button
            onClick={handleExportBlockchain}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Blockchain
          </button>
        )}
      </div>
    </div>
  );
}