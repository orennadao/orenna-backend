// apps/api/tests/indexer.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Indexer API Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Indexer Status', () => {
    it('should get indexer status when not running', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/status'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('isRunning');
      expect(data).toHaveProperty('activeIndexers');
      expect(data).toHaveProperty('states');
      expect(data.isRunning).toBe(false);
      expect(data.activeIndexers).toBe(0);
      expect(Array.isArray(data.states)).toBe(true);
    });
  });

  describe('Indexer Management', () => {
    it('should start indexing with valid configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [
            {
              chainId: 1,
              contractAddress: '0x1234567890123456789012345678901234567890',
              indexerType: 'RepaymentEscrow',
              startBlock: 18000000,
              confirmations: 12,
              batchSize: 1000
            },
            {
              chainId: 1,
              contractAddress: '0x0987654321098765432109876543210987654321',
              indexerType: 'AllocationEscrow',
              startBlock: 18000000,
              confirmations: 12,
              batchSize: 1000
            }
          ]
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Started indexing 2 contracts');
      expect(data.configs).toHaveLength(2);
      expect(data.configs[0].chainId).toBe(1);
      expect(data.configs[0].indexerType).toBe('RepaymentEscrow');
    });

    it('should reject invalid indexer configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [
            {
              chainId: -1, // Invalid chain ID
              contractAddress: 'invalid-address', // Invalid address
              indexerType: 'InvalidType', // Invalid type
              startBlock: -1 // Invalid block number
            }
          ]
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should stop indexing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/stop'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Indexing stopped');
    });

    it('should start with default configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start-default'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Started indexing with default configuration');
      expect(data.configs).toHaveLength(2);
    });
  });

  describe('Event Management', () => {
    it('should get indexed events with default pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/events'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('events');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('offset');
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
    });

    it('should filter events by chain ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/events?chainId=1&limit=10'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.events).toBeInstanceOf(Array);
      expect(data.limit).toBe(10);
      
      // If there are events, they should all be from chain 1
      data.events.forEach((event: any) => {
        expect(event.chainId).toBe(1);
      });
    });

    it('should filter events by contract address', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890';
      const response = await app.inject({
        method: 'GET',
        url: `/api/indexer/events?contractAddress=${contractAddress}`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.events).toBeInstanceOf(Array);
      
      // If there are events, they should all be from the specified contract
      data.events.forEach((event: any) => {
        expect(event.contractAddress.toLowerCase()).toBe(contractAddress.toLowerCase());
      });
    });

    it('should filter events by processing status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/events?processed=false'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.events).toBeInstanceOf(Array);
      
      // All returned events should be unprocessed
      data.events.forEach((event: any) => {
        expect(event.processed).toBe(false);
      });
    });

    it('should filter events with errors', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/events?hasError=true'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.events).toBeInstanceOf(Array);
      
      // All returned events should have processing errors
      data.events.forEach((event: any) => {
        expect(event.processingError).toBeTruthy();
      });
    });

    it('should return 404 for non-existent event', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/events/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Event not found');
    });
  });

  describe('Retry Failed Events', () => {
    it('should retry failed events with default limit', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/retry-failed',
        payload: {}
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('processed');
      expect(data).toHaveProperty('failed');
      expect(data.message).toMatch(/Processed \d+ events, \d+ failed/);
      expect(typeof data.processed).toBe('number');
      expect(typeof data.failed).toBe('number');
    });

    it('should retry failed events with custom limit', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/retry-failed',
        payload: {
          limit: 50
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(typeof data.processed).toBe('number');
      expect(typeof data.failed).toBe('number');
    });

    it('should validate retry limit bounds', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/retry-failed',
        payload: {
          limit: 2000 // Exceeds maximum of 1000
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Indexer Health Check', () => {
    it('should check indexer health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('healthy');
      expect(data).toHaveProperty('issues');
      expect(data).toHaveProperty('summary');
      expect(typeof data.healthy).toBe('boolean');
      expect(Array.isArray(data.issues)).toBe(true);
      
      expect(data.summary).toHaveProperty('totalIndexers');
      expect(data.summary).toHaveProperty('activeIndexers');
      expect(data.summary).toHaveProperty('staleIndexers');
      expect(data.summary).toHaveProperty('errorIndexers');
      
      expect(typeof data.summary.totalIndexers).toBe('number');
      expect(typeof data.summary.activeIndexers).toBe('number');
      expect(typeof data.summary.staleIndexers).toBe('number');
      expect(typeof data.summary.errorIndexers).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in start indexer request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: 'invalid json'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle empty configs array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [] // Empty array
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing required fields in config', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [
            {
              // Missing required fields
              chainId: 1
            }
          ]
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle invalid chain ID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [
            {
              chainId: 0, // Invalid chain ID
              contractAddress: '0x1234567890123456789012345678901234567890',
              indexerType: 'RepaymentEscrow'
            }
          ]
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle invalid contract address format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [
            {
              chainId: 1,
              contractAddress: '0xinvalid', // Invalid address format
              indexerType: 'RepaymentEscrow'
            }
          ]
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle invalid indexer type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/indexer/start',
        payload: {
          configs: [
            {
              chainId: 1,
              contractAddress: '0x1234567890123456789012345678901234567890',
              indexerType: 'InvalidType' // Invalid indexer type
            }
          ]
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Status After Operations', () => {
    it('should show updated status after starting indexers', async () => {
      // Start indexing first
      await app.inject({
        method: 'POST',
        url: '/api/indexer/start-default'
      });

      // Check status
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/status'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.isRunning).toBe(true);
      expect(data.activeIndexers).toBeGreaterThan(0);
      expect(data.states.length).toBeGreaterThan(0);
      
      // Check that states have the expected properties
      data.states.forEach((state: any) => {
        expect(state).toHaveProperty('chainId');
        expect(state).toHaveProperty('contractAddress');
        expect(state).toHaveProperty('indexerType');
        expect(state).toHaveProperty('lastBlockNumber');
        expect(state).toHaveProperty('isActive');
        expect(state).toHaveProperty('errorCount');
      });
    });

    it('should show stopped status after stopping indexers', async () => {
      // Stop indexing
      await app.inject({
        method: 'POST',
        url: '/api/indexer/stop'
      });

      // Check status
      const response = await app.inject({
        method: 'GET',
        url: '/api/indexer/status'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.isRunning).toBe(false);
      expect(data.activeIndexers).toBe(0);
    });
  });
});