import { test, expect } from '@playwright/test';
import { ApiClient } from './utils/api-client';

test.describe('Complete API Flow E2E Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async () => {
    apiClient = await ApiClient.create();
    await apiClient.authenticate();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test('complete lift token lifecycle', async () => {
    // Step 1: Create a new lift token
    const liftTokenData = {
      tokenId: '12345',
      contractAddress: '0x1234567890123456789012345678901234567890',
      name: 'E2E Test Lift Token',
      description: 'A lift token created during E2E testing',
      imageUrl: 'https://example.com/image.jpg',
      metadataUrl: 'https://example.com/metadata.json',
      chainId: 1,
      attributes: {
        location: 'Test Location',
        capacity: 5000,
        efficiency: 95.5,
      },
    };

    const createResponse = await apiClient.createLiftToken(liftTokenData);
    expect(createResponse.status()).toBe(201);
    
    const createdLiftToken = await createResponse.json();
    expect(createdLiftToken.id).toBeTruthy();
    expect(createdLiftToken.name).toBe(liftTokenData.name);
    expect(createdLiftToken.status).toBe('ACTIVE');

    const liftTokenId = createdLiftToken.id;

    // Step 2: Retrieve the created lift token
    const getResponse = await apiClient.getLiftToken(liftTokenId);
    expect(getResponse.ok()).toBeTruthy();
    
    const retrievedLiftToken = await getResponse.json();
    expect(retrievedLiftToken.id).toBe(liftTokenId);
    expect(retrievedLiftToken.name).toBe(liftTokenData.name);

    // Step 3: Update the lift token
    const updateData = {
      name: 'Updated E2E Test Lift Token',
      description: 'Updated description',
    };

    const updateResponse = await apiClient.updateLiftToken(liftTokenId, updateData);
    expect(updateResponse.ok()).toBeTruthy();
    
    const updatedLiftToken = await updateResponse.json();
    expect(updatedLiftToken.name).toBe(updateData.name);
    expect(updatedLiftToken.description).toBe(updateData.description);

    // Step 4: List lift tokens and verify it appears
    const listResponse = await apiClient.getLiftTokens();
    expect(listResponse.ok()).toBeTruthy();
    
    const listData = await listResponse.json();
    expect(listData.data).toBeDefined();
    expect(Array.isArray(listData.data)).toBe(true);
    
    const foundLiftToken = listData.data.find((lu: any) => lu.id === liftTokenId);
    expect(foundLiftToken).toBeDefined();
    expect(foundLiftToken.name).toBe(updateData.name);

    // Step 5: Delete the lift token
    const deleteResponse = await apiClient.deleteLiftToken(liftTokenId);
    expect(deleteResponse.status()).toBe(204);

    // Step 6: Verify deletion
    const getDeletedResponse = await apiClient.getLiftToken(liftTokenId);
    expect(getDeletedResponse.status()).toBe(404);
  });

  test('payment processing workflow', async () => {
    // Step 1: Create a payment
    const paymentData = {
      amount: '1000000000000000000', // 1 ETH in wei
      currency: 'ETH',
      paymentType: 'MINT_FEE',
      relatedEntityId: 'test-entity-id',
      chainId: 1,
    };

    const createResponse = await apiClient.createPayment(paymentData);
    expect(createResponse.status()).toBe(201);
    
    const createdPayment = await createResponse.json();
    expect(createdPayment.id).toBeTruthy();
    expect(createdPayment.amount).toBe(paymentData.amount);
    expect(createdPayment.status).toBe('PENDING');

    const paymentId = createdPayment.id;

    // Step 2: Retrieve the payment
    const getResponse = await apiClient.getPayment(paymentId);
    expect(getResponse.ok()).toBeTruthy();
    
    const retrievedPayment = await getResponse.json();
    expect(retrievedPayment.id).toBe(paymentId);
    expect(retrievedPayment.status).toBe('PENDING');

    // Step 3: Confirm the payment
    const confirmData = {
      transactionHash: '0x' + '1'.repeat(64),
      blockNumber: '18000000',
    };

    const confirmResponse = await apiClient.confirmPayment(paymentId, confirmData);
    expect(confirmResponse.ok()).toBeTruthy();
    
    const confirmedPayment = await confirmResponse.json();
    expect(confirmedPayment.status).toBe('CONFIRMED');
    expect(confirmedPayment.transactionHash).toBe(confirmData.transactionHash);

    // Step 4: Check payment stats
    const statsResponse = await apiClient.getPaymentStats();
    expect(statsResponse.ok()).toBeTruthy();
    
    const stats = await statsResponse.json();
    expect(stats.totalPayments).toBeGreaterThan(0);
    expect(stats.confirmedPayments).toBeGreaterThan(0);

    // Step 5: List payments and verify
    const listResponse = await apiClient.getPayments();
    expect(listResponse.ok()).toBeTruthy();
    
    const listData = await listResponse.json();
    expect(listData.data).toBeDefined();
    
    const foundPayment = listData.data.find((p: any) => p.id === paymentId);
    expect(foundPayment).toBeDefined();
    expect(foundPayment.status).toBe('CONFIRMED');
  });

  test('payment cancellation workflow', async () => {
    // Step 1: Create a payment
    const paymentData = {
      amount: '500000000000000000', // 0.5 ETH
      currency: 'ETH',
      paymentType: 'TRANSFER_FEE',
      relatedEntityId: 'test-entity-id',
      chainId: 1,
    };

    const createResponse = await apiClient.createPayment(paymentData);
    expect(createResponse.status()).toBe(201);
    
    const createdPayment = await createResponse.json();
    const paymentId = createdPayment.id;

    // Step 2: Cancel the payment
    const cancelResponse = await apiClient.cancelPayment(paymentId);
    expect(cancelResponse.ok()).toBeTruthy();
    
    const cancelledPayment = await cancelResponse.json();
    expect(cancelledPayment.status).toBe('CANCELLED');

    // Step 3: Verify we cannot confirm a cancelled payment
    const confirmData = {
      transactionHash: '0x' + '2'.repeat(64),
      blockNumber: '18000001',
    };

    const confirmResponse = await apiClient.confirmPayment(paymentId, confirmData);
    expect(confirmResponse.status()).toBe(400);
  });

  test('filtering and pagination', async () => {
    // Create multiple lift tokens for testing
    const liftTokens = [];
    for (let i = 0; i < 5; i++) {
      const data = {
        tokenId: `${1000 + i}`,
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: `Test Lift Token ${i}`,
        description: `Description ${i}`,
        chainId: 1,
        status: i % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
      };

      const response = await apiClient.createLiftToken(data);
      expect(response.status()).toBe(201);
      const created = await response.json();
      liftTokens.push(created);
    }

    // Test pagination
    const page1Response = await apiClient.getLiftTokens({ page: '1', limit: '3' });
    expect(page1Response.ok()).toBeTruthy();
    
    const page1Data = await page1Response.json();
    expect(page1Data.data.length).toBeLessThanOrEqual(3);
    expect(page1Data.pagination.page).toBe(1);
    expect(page1Data.pagination.limit).toBe(3);

    // Test filtering by status
    const activeResponse = await apiClient.getLiftTokens({ status: 'ACTIVE' });
    expect(activeResponse.ok()).toBeTruthy();
    
    const activeData = await activeResponse.json();
    activeData.data.forEach((unit: any) => {
      expect(unit.status).toBe('ACTIVE');
    });

    // Clean up created lift tokens
    for (const unit of liftTokens) {
      await apiClient.deleteLiftToken(unit.id);
    }
  });

  test('error handling for invalid requests', async () => {
    // Test invalid lift token creation
    const invalidLiftTokenData = {
      tokenId: '', // Empty token ID
      contractAddress: 'invalid-address', // Invalid format
      name: '', // Empty name
    };

    const createResponse = await apiClient.createLiftToken(invalidLiftTokenData);
    expect(createResponse.status()).toBe(400);

    // Test invalid payment creation
    const invalidPaymentData = {
      amount: 'invalid-amount',
      currency: 'INVALID_CURRENCY',
      paymentType: 'INVALID_TYPE',
    };

    const paymentResponse = await apiClient.createPayment(invalidPaymentData);
    expect(paymentResponse.status()).toBe(400);

    // Test non-existent resource access
    const nonExistentResponse = await apiClient.getLiftToken('non-existent-id');
    expect(nonExistentResponse.status()).toBe(404);
  });

  test('rate limiting', async () => {
    // Make many requests quickly to test rate limiting
    const requests = [];
    for (let i = 0; i < 105; i++) { // Exceed the 100 requests/minute limit
      requests.push(apiClient.getLiftTokens());
    }

    const responses = await Promise.all(requests);
    
    // Some responses should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('websocket connection', async () => {
    // Test WebSocket status endpoint
    const wsStatusResponse = await apiClient.testWebSocketConnection();
    expect(wsStatusResponse.ok() || wsStatusResponse.status() === 404).toBeTruthy();
    
    // Note: Full WebSocket testing would require additional setup
    // This is a basic connectivity test
  });
});