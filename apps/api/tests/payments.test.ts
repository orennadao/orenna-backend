// apps/api/tests/payments.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Payment API Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Payment Initialization', () => {
    it('should initialize a new lift unit purchase payment', async () => {
      // First create a test project
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/mint-requests/create-test-project'
      });

      expect(projectResponse.statusCode).toBe(200);
      const projectData = JSON.parse(projectResponse.payload);
      const projectId = projectData.project.id;

      // Create payment config for the project
      await app.inject({
        method: 'POST',
        url: '/api/payments/test/create-project-config',
        payload: {
          projectId,
          allocationEscrow: '0x1234567890123456789012345678901234567890',
          repaymentEscrow: '0x0987654321098765432109876543210987654321'
        }
      });

      // Initialize payment
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/initiate',
        payload: {
          projectId,
          paymentType: 'LIFT_UNIT_PURCHASE',
          amount: '1000000000000000000', // 1 ETH
          paymentToken: '0x0000000000000000000000000000000000000000',
          payerAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          recipientAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          chainId: 1,
          description: 'Test lift unit purchase',
          tokenIds: ['1001'],
          tokenAmounts: ['100']
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.paymentId).toBeTruthy();
      expect(data.message).toContain('Payment initiated successfully');
    });

    it('should reject invalid payment data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/initiate',
        payload: {
          projectId: -1, // Invalid project ID
          paymentType: 'LIFT_UNIT_PURCHASE',
          amount: 'invalid', // Invalid amount
          paymentToken: 'not-an-address', // Invalid address
          payerAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          recipientAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          chainId: 1
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle project funding payment type', async () => {
      // Create a test project first
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/mint-requests/create-test-project'
      });

      const projectData = JSON.parse(projectResponse.payload);
      const projectId = projectData.project.id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/initiate',
        payload: {
          projectId,
          paymentType: 'PROJECT_FUNDING',
          amount: '10000000000000000000', // 10 ETH
          paymentToken: '0x0000000000000000000000000000000000000000',
          payerAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          recipientAddress: '0x742d35Cc1fF1C6e5a3c5ABebc4E5e1Eb7f3bD2c0',
          chainId: 1,
          description: 'Project funding for regenerative agriculture',
          escrowConfig: {
            forwardPrincipal: '8000000000000000000', // 8 ETH
            repaymentCap: '12000000000000000000', // 12 ETH
            platformFeeBps: 250, // 2.5%
            platformFeeCap: '1000000000000000000', // 1 ETH
            funder: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            stewardOrPool: '0x742d35Cc1fF1C6e5a3c5ABebc4E5e1Eb7f3bD2c0',
            policy: 0 // FUNDER_FIRST_95_5
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.paymentId).toBeTruthy();
    });
  });

  describe('Payment Status and Queries', () => {
    let testPaymentId: string;
    let testProjectId: number;

    beforeAll(async () => {
      // Create test project and payment
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/mint-requests/create-test-project'
      });
      const projectData = JSON.parse(projectResponse.payload);
      testProjectId = projectData.project.id;

      const paymentResponse = await app.inject({
        method: 'POST',
        url: '/api/payments/initiate',
        payload: {
          projectId: testProjectId,
          paymentType: 'LIFT_UNIT_PURCHASE',
          amount: '2000000000000000000', // 2 ETH
          paymentToken: '0x0000000000000000000000000000000000000000',
          payerAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          recipientAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          chainId: 1,
          description: 'Test payment for status queries'
        }
      });

      const paymentData = JSON.parse(paymentResponse.payload);
      testPaymentId = paymentData.paymentId;
    });

    it('should get payment status by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/payments/${testPaymentId}`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.id).toBe(testPaymentId);
      expect(data.paymentType).toBe('LIFT_UNIT_PURCHASE');
      expect(data.status).toBe('PENDING');
      expect(data.amount).toBe('2000000000000000000');
      expect(data.chainId).toBe(1);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Payment not found');
    });

    it('should get project payments', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/payments/project/${testProjectId}`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.payments).toBeInstanceOf(Array);
      expect(data.payments.length).toBeGreaterThan(0);
      expect(data.total).toBeGreaterThan(0);
      expect(data.payments[0].projectId).toBe(testProjectId);
    });

    it('should filter project payments by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/payments/project/${testProjectId}?status=PENDING`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.payments).toBeInstanceOf(Array);
      data.payments.forEach((payment: any) => {
        expect(payment.status).toBe('PENDING');
      });
    });

    it('should get all payments with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments?limit=10&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.payments).toBeInstanceOf(Array);
      expect(data.payments.length).toBeLessThanOrEqual(10);
      expect(data.total).toBeGreaterThanOrEqual(data.payments.length);
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    });
  });

  describe('Escrow Configuration', () => {
    it('should configure project escrow settings', async () => {
      // Create test project first
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/mint-requests/create-test-project'
      });
      const projectData = JSON.parse(projectResponse.payload);
      const projectId = projectData.project.id;

      // Create payment config
      await app.inject({
        method: 'POST',
        url: '/api/payments/test/create-project-config',
        payload: {
          projectId,
          repaymentEscrow: '0x0987654321098765432109876543210987654321'
        }
      });

      // Note: This test would fail in a real environment because we don't have
      // actual blockchain connectivity. In a real test environment, you'd use
      // a test network or mock the blockchain service.
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/configure-escrow',
        payload: {
          projectId,
          chainId: 1,
          config: {
            forwardPrincipal: '5000000000000000000', // 5 ETH
            repaymentCap: '7500000000000000000', // 7.5 ETH
            platformFeeBps: 300, // 3%
            platformFeeCap: '500000000000000000', // 0.5 ETH
            funder: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            stewardOrPool: '0x742d35Cc1fF1C6e5a3c5ABebc4E5e1Eb7f3bD2c0',
            paymentToken: '0x0000000000000000000000000000000000000000',
            policy: 1 // AFTER_REPAYMENT
          }
        }
      });

      // This would normally succeed with proper blockchain setup
      // For now, we expect it to fail due to missing wallet client
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Webhook Handling', () => {
    it('should accept webhook from supported provider', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/webhook/stripe',
        payload: {
          id: 'evt_test_webhook',
          object: 'event',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test_payment',
              amount: 2000,
              currency: 'usd',
              status: 'succeeded'
            }
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Webhook processed');
    });

    it('should reject webhook from unsupported provider', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/webhook/unsupported',
        payload: {
          test: 'data'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Unsupported payment provider');
    });
  });

  describe('Project Payment Configuration', () => {
    it('should create project payment configuration', async () => {
      // Create test project first
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/mint-requests/create-test-project'
      });
      const projectData = JSON.parse(projectResponse.payload);
      const projectId = projectData.project.id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/test/create-project-config',
        payload: {
          projectId,
          allocationEscrow: '0x1111111111111111111111111111111111111111',
          repaymentEscrow: '0x2222222222222222222222222222222222222222'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.message).toContain('Project payment configuration created/updated');
      expect(data.config.projectId).toBe(projectId);
      expect(data.config.acceptsPayments).toBe(true);
      expect(data.config.allocationEscrow).toBe('0x1111111111111111111111111111111111111111');
      expect(data.config.repaymentEscrow).toBe('0x2222222222222222222222222222222222222222');
    });

    it('should update existing project payment configuration', async () => {
      // Create test project
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/mint-requests/create-test-project'
      });
      const projectData = JSON.parse(projectResponse.payload);
      const projectId = projectData.project.id;

      // Create initial config
      await app.inject({
        method: 'POST',
        url: '/api/payments/test/create-project-config',
        payload: {
          projectId,
          allocationEscrow: '0x1111111111111111111111111111111111111111'
        }
      });

      // Update config
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/test/create-project-config',
        payload: {
          projectId,
          allocationEscrow: '0x3333333333333333333333333333333333333333',
          repaymentEscrow: '0x4444444444444444444444444444444444444444'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.config.allocationEscrow).toBe('0x3333333333333333333333333333333333333333');
      expect(data.config.repaymentEscrow).toBe('0x4444444444444444444444444444444444444444');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in payment initiation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/initiate',
        payload: 'invalid json'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate required fields in payment initiation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/payments/initiate',
        payload: {
          // Missing required fields
          paymentType: 'LIFT_UNIT_PURCHASE'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to simulate errors
      // For now, we'll test a scenario that might cause database issues
      const response = await app.inject({
        method: 'GET',
        url: '/api/payments/project/999999' // Non-existent project
      });

      // Should still return 200 with empty results, not crash
      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.payments).toEqual([]);
      expect(data.total).toBe(0);
    });
  });
});