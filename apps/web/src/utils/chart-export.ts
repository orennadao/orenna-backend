// Chart export utilities for analytics dashboard

export function downloadDataAsCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function downloadChartAsPNG(chartElement: HTMLElement, filename: string) {
  try {
    // Find the recharts SVG element
    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) {
      console.error('No SVG element found in chart');
      return;
    }

    // Get SVG dimensions
    const rect = svgElement.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create a new SVG with white background
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgWithBackground = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <rect width="100%" height="100%" fill="white"/>
        ${svgData.replace('<svg', '<g').replace('</svg>', '</g>')}
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([svgWithBackground], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      console.error('Failed to load SVG for export');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
}

export function preparePaymentDataForExport(data: any) {
  if (!data) return [];

  const exportData = [];

  // Volume by period
  if (data.volumeByPeriod) {
    exportData.push(...data.volumeByPeriod.map((item: any) => ({
      type: 'Volume by Period',
      date: item.date,
      volume_eth: (parseFloat(item.volume) / 1e18).toFixed(6),
      volume_wei: item.volume,
      count: item.count
    })));
  }

  // Status distribution
  if (data.statusDistribution) {
    exportData.push(...data.statusDistribution.map((item: any) => ({
      type: 'Status Distribution',
      status: item.status,
      count: item.count,
      percentage: item.percentage.toFixed(2)
    })));
  }

  // Type distribution
  if (data.typeDistribution) {
    exportData.push(...data.typeDistribution.map((item: any) => ({
      type: 'Type Distribution',
      payment_type: item.type,
      count: item.count,
      volume_eth: (parseFloat(item.volume) / 1e18).toFixed(6),
      percentage: item.percentage.toFixed(2)
    })));
  }

  return exportData;
}

export function prepareBlockchainDataForExport(data: any) {
  if (!data) return [];

  const exportData = [];

  // Chain distribution
  if (data.chainDistribution) {
    exportData.push(...data.chainDistribution.map((item: any) => ({
      type: 'Chain Distribution',
      chain_id: item.chainId,
      event_count: item.eventCount,
      indexer_count: item.indexerCount
    })));
  }

  // Event type distribution
  if (data.eventTypeDistribution) {
    exportData.push(...data.eventTypeDistribution.map((item: any) => ({
      type: 'Event Type Distribution',
      event_name: item.eventName,
      count: item.count,
      success_rate: item.successRate.toFixed(2)
    })));
  }

  // Daily indexing metrics
  if (data.dailyIndexingMetrics) {
    exportData.push(...data.dailyIndexingMetrics.map((item: any) => ({
      type: 'Daily Indexing Metrics',
      date: item.date,
      events_indexed: item.eventsIndexed,
      events_processed: item.eventsProcessed,
      error_count: item.errorCount
    })));
  }

  return exportData;
}