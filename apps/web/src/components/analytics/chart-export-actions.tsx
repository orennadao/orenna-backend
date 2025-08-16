'use client';

import React, { useRef } from 'react';
import { downloadChartAsPNG, downloadDataAsCSV } from '@/utils/chart-export';

interface ChartExportActionsProps {
  chartTitle: string;
  chartData?: any[];
  exportData?: any[];
  onExport?: () => void;
}

export function ChartExportActions({ 
  chartTitle, 
  chartData, 
  exportData,
  onExport 
}: ChartExportActionsProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = () => {
    if (chartRef.current) {
      const sanitizedTitle = chartTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      downloadChartAsPNG(chartRef.current, `${sanitizedTitle}_chart`);
      onExport?.();
    }
  };

  const handleExportCSV = () => {
    const dataToExport = exportData || chartData;
    if (dataToExport && dataToExport.length > 0) {
      const sanitizedTitle = chartTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      downloadDataAsCSV(dataToExport, `${sanitizedTitle}_data`);
      onExport?.();
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExportPNG}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          title="Export chart as PNG"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          PNG
        </button>

        {(chartData || exportData) && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            title="Export data as CSV"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
        )}
      </div>
      {/* Hidden div to capture chart for export */}
      <div ref={chartRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {/* Chart will be cloned here for export */}
      </div>
    </>
  );
}

// Hook to provide chart reference for export
export function useChartExport() {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportChart = (title: string) => {
    if (chartRef.current) {
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      downloadChartAsPNG(chartRef.current, `${sanitizedTitle}_chart`);
    }
  };

  return { chartRef, exportChart };
}