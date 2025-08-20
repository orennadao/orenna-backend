// Error handling utilities for the application

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp?: string;
}

export class ApiError extends Error implements AppError {
  code?: string;
  status?: number;
  details?: any;
  timestamp: string;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  status = 400;
  details?: any;
  timestamp: string;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  status?: number;
  details?: any;
  timestamp: string;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error parsing utilities
export function parseApiError(error: any): AppError {
  if (error instanceof ApiError || error instanceof ValidationError || error instanceof NetworkError) {
    return error;
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network connection failed. Please check your internet connection.');
  }

  // Handle response errors
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return new ValidationError(
          data?.message || 'Invalid request data',
          data?.details
        );
      case 401:
        return new ApiError(
          'Authentication required. Please sign in.',
          'UNAUTHORIZED',
          401
        );
      case 403:
        return new ApiError(
          'You do not have permission to perform this action.',
          'FORBIDDEN',
          403
        );
      case 404:
        return new ApiError(
          'The requested resource was not found.',
          'NOT_FOUND',
          404
        );
      case 429:
        return new ApiError(
          'Too many requests. Please try again later.',
          'RATE_LIMITED',
          429
        );
      case 500:
        return new ApiError(
          'Server error. Please try again later.',
          'INTERNAL_ERROR',
          500
        );
      default:
        return new ApiError(
          data?.message || `Request failed with status ${status}`,
          'API_ERROR',
          status
        );
    }
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return new NetworkError('Request timed out. Please try again.');
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new ApiError(error.message, 'UNKNOWN_ERROR');
  }

  // Fallback for unknown error types
  return new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR');
}

// User-friendly error messages
export function getErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return error.message || 'Please check your input and try again.';
    case 'UNAUTHORIZED':
      return 'Please sign in to continue.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'NOT_FOUND':
      return 'The requested item could not be found.';
    case 'NETWORK_ERROR':
      return 'Connection failed. Please check your internet and try again.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'INTERNAL_ERROR':
      return 'Server error. Please try again in a few minutes.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

// Error categorization for different UI handling
export function getErrorSeverity(error: AppError): 'low' | 'medium' | 'high' {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'low';
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return 'medium';
    case 'NETWORK_ERROR':
    case 'INTERNAL_ERROR':
      return 'high';
    default:
      return 'medium';
  }
}

// Retry logic
export function shouldRetry(error: AppError): boolean {
  switch (error.code) {
    case 'NETWORK_ERROR':
    case 'INTERNAL_ERROR':
      return true;
    case 'RATE_LIMITED':
      return true; // With backoff
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
    case 'VALIDATION_ERROR':
    case 'NOT_FOUND':
      return false;
    default:
      return error.status ? error.status >= 500 : false;
  }
}

// Retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = parseApiError(error);
      
      if (attempt === maxRetries || !shouldRetry(appError)) {
        throw appError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw parseApiError(lastError);
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // You could send this to an error reporting service here
    const error = parseApiError(event.reason);
    
    // Show a non-intrusive error notification
    console.warn('An unexpected error occurred:', getErrorMessage(error));
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    
    const error = parseApiError(event.error);
    console.warn('An unexpected error occurred:', getErrorMessage(error));
  });
}

// Utility to handle async operations with error handling
export async function handleAsync<T>(
  promise: Promise<T>
): Promise<[AppError | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [parseApiError(error), null];
  }
}