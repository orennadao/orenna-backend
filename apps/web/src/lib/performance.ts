// Performance monitoring utilities

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Observe Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observer not supported', error);
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observer not supported', error);
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      let clsEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = clsEntries[0];
            const lastSessionEntry = clsEntries[clsEntries.length - 1];

            if (!firstSessionEntry || 
                entry.startTime - lastSessionEntry.startTime < 1000 ||
                entry.startTime - firstSessionEntry.startTime < 5000) {
              clsEntries.push(entry);
              clsValue += entry.value;
            } else {
              clsEntries = [entry];
              clsValue = entry.value;
            }
          }
        });

        this.metrics.cls = clsValue;
        this.reportMetric('CLS', clsValue);
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observer not supported', error);
    }
  }

  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP observer not supported', error);
    }
  }

  private observeTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.responseStart) {
            this.metrics.ttfb = entry.responseStart - entry.requestStart;
            this.reportMetric('TTFB', this.metrics.ttfb);
          }
        });
      });

      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('TTFB observer not supported', error);
    }
  }

  private reportMetric(name: string, value: number): void {
    console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    
    // Send to analytics service if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'web_vital', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      });
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Bundle size monitoring
export function measureBundleSize(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalJSSize = 0;
      let totalCSSSize = 0;
      
      resources.forEach((resource) => {
        if (resource.name.includes('.js')) {
          totalJSSize += resource.transferSize || 0;
        } else if (resource.name.includes('.css')) {
          totalCSSSize += resource.transferSize || 0;
        }
      });

      console.log(`[Bundle Size] JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`);
      console.log(`[Bundle Size] CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`);
    });
  }
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
    const memory = (performance as any).memory;
    
    console.log(`[Memory] Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`[Memory] Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`[Memory] Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
  }
}

// Performance budget checker
export function checkPerformanceBudget(thresholds: {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}): void {
  const monitor = new PerformanceMonitor();
  
  setTimeout(() => {
    const metrics = monitor.getMetrics();
    
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (value && value > threshold) {
        console.warn(`[Performance Budget] ${metric.toUpperCase()} exceeded: ${value.toFixed(2)}ms > ${threshold}ms`);
      }
    });
    
    monitor.disconnect();
  }, 5000); // Check after 5 seconds
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  measureBundleSize();
  
  // Monitor memory usage every 30 seconds
  setInterval(monitorMemoryUsage, 30000);
  
  // Check performance budget
  checkPerformanceBudget({
    fcp: 2000,  // 2 seconds
    lcp: 4000,  // 4 seconds
    fid: 100,   // 100ms
    cls: 0.1,   // 0.1
    ttfb: 800,  // 800ms
  });
}