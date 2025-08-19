import { test, expect } from '@playwright/test';
import { ApiClient } from './utils/api-client';

test.describe('Authentication E2E Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async () => {
    apiClient = await ApiClient.create();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test('complete authentication flow', async () => {
    // Step 1: Get nonce
    const { nonce } = await apiClient.getNonce();
    expect(nonce).toBeTruthy();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);

    // Step 2: Authenticate with SIWE
    const authResponse = await apiClient.authenticate();
    expect(authResponse.ok()).toBeTruthy();
    
    const authData = await authResponse.json();
    expect(authData.success).toBe(true);
    expect(authData.user).toBeDefined();
    expect(authData.user.address).toBeTruthy();

    // Step 3: Access protected endpoint
    const profileResponse = await apiClient.getProfile();
    expect(profileResponse.ok()).toBeTruthy();
    
    const profileData = await profileResponse.json();
    expect(profileData.user).toBeDefined();
    expect(profileData.user.address).toBe(authData.user.address);

    // Step 4: Logout
    const logoutResponse = await apiClient.logout();
    expect(logoutResponse.ok()).toBeTruthy();
    
    const logoutData = await logoutResponse.json();
    expect(logoutData.success).toBe(true);

    // Step 5: Verify access is revoked
    const protectedResponse = await apiClient.getProfile();
    expect(protectedResponse.status()).toBe(401);
  });

  test('nonce generation creates unique values', async () => {
    const { nonce: nonce1 } = await apiClient.getNonce();
    const { nonce: nonce2 } = await apiClient.getNonce();
    
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBe(nonce2.length);
  });

  test('authentication fails without nonce', async () => {
    const response = await apiClient.authenticate();
    // This should fail because we didn't get a nonce first
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toContain('nonce');
  });

  test('protected endpoints reject unauthenticated requests', async () => {
    const endpoints = [
      '/auth/profile',
      '/api/lift-tokens',
      '/api/payments',
      '/api/mint-requests',
    ];

    for (const endpoint of endpoints) {
      const response = await apiClient.context.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test('session persistence across requests', async () => {
    // Authenticate
    const authResponse = await apiClient.authenticate();
    expect(authResponse.ok()).toBeTruthy();

    // Make multiple authenticated requests
    const requests = [
      apiClient.getProfile(),
      apiClient.getLiftTokens(),
      apiClient.getPayments(),
    ];

    const responses = await Promise.all(requests);
    
    // All should succeed with the same session
    responses.forEach(response => {
      expect(response.ok() || response.status() === 404).toBeTruthy(); // 404 is ok for empty resources
    });
  });

  test('session expiration handling', async () => {
    // This test would require manipulating JWT expiration
    // For now, we'll test with an invalid token
    
    // Create client with invalid token
    const invalidClient = await ApiClient.create();
    (invalidClient as any).authToken = 'invalid-token';

    const response = await invalidClient.getProfile();
    expect(response.status()).toBe(401);

    await invalidClient.dispose();
  });

  test('concurrent authentication sessions', async () => {
    const client1 = await ApiClient.create();
    const client2 = await ApiClient.create();

    try {
      // Authenticate both clients
      const auth1 = await client1.authenticate('0x1111111111111111111111111111111111111111');
      const auth2 = await client2.authenticate('0x2222222222222222222222222222222222222222');

      expect(auth1.ok()).toBeTruthy();
      expect(auth2.ok()).toBeTruthy();

      // Both should be able to access their profiles
      const profile1 = await client1.getProfile();
      const profile2 = await client2.getProfile();

      expect(profile1.ok()).toBeTruthy();
      expect(profile2.ok()).toBeTruthy();

      const data1 = await profile1.json();
      const data2 = await profile2.json();

      expect(data1.user.address).not.toBe(data2.user.address);
    } finally {
      await client1.dispose();
      await client2.dispose();
    }
  });

  test('malformed authentication requests', async () => {
    const { cookies } = await apiClient.getNonce();

    // Test various malformed requests
    const malformedRequests = [
      { message: '', signature: '0x' + '1'.repeat(130) },
      { message: 'valid-message', signature: 'invalid-signature' },
      { message: 'valid-message', signature: '0x' + '1'.repeat(64) }, // Too short
      { }, // Empty payload
      { message: 'valid-message' }, // Missing signature
      { signature: '0x' + '1'.repeat(130) }, // Missing message
    ];

    for (const payload of malformedRequests) {
      const response = await apiClient.context.post('/auth/verify', {
        data: payload,
        headers: { Cookie: cookies || '' },
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    }
  });
});