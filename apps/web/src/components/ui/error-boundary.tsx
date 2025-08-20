'use client';

import React from 'react';
import { Card } from './card';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
          <p className="text-gray-600 mt-2">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error details (development only)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <Button onClick={resetError} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </Card>
  );
}

// Simpler error fallback for inline use
export function SimpleErrorFallback({ 
  error, 
  resetError, 
  title = "Error",
  className = ""
}: ErrorFallbackProps & { title?: string; className?: string }) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-900">{title}</h4>
          <p className="text-sm text-red-800 mt-1">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {resetError && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={resetError}
              className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// HOC version for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundaryClass {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundaryClass>
    );
  };
}

export { ErrorBoundaryClass as ErrorBoundary };