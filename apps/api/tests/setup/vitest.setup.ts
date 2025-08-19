import { beforeAll, afterAll, vi } from 'vitest';
import { setupGlobalTestDatabase, teardownGlobalTestDatabase } from '../utils/test-db';

// Global test setup - runs once before all tests
beforeAll(async () => {
  console.log('🔧 Setting up global test environment...');
  
  // Setup test database
  try {
    await setupGlobalTestDatabase();
    console.log('✅ Test database initialized');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    // Continue without database for unit tests that don't need it
  }

  // Setup global test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.API_CORS_ORIGIN = 'http://localhost:3000';
  process.env.SIWE_DOMAIN = 'localhost';
  process.env.SIWE_ORIGIN = 'http://localhost:3000';
  process.env.SIWE_SESSION_TTL = '3600';

  // Mock console.log in tests to reduce noise
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  
  console.log('✅ Global test environment setup complete');
});

// Global test teardown - runs once after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  try {
    await teardownGlobalTestDatabase();
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error);
  }

  // Restore console methods
  vi.restoreAllMocks();
  
  console.log('✅ Global test environment cleanup complete');
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in tests, just log the error
});

// Global error handler for uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in tests, just log the error
});

// Export test utilities for convenience
export * from '../utils/test-server';
export * from '../utils/fixtures';
export * from '../utils/test-helpers';
export * from '../utils/test-db';