import { request, APIRequestContext } from '@playwright/test';

export class ApiClient {
  private context: APIRequestContext;
  private baseURL: string;
  private authToken?: string;

  constructor(context: APIRequestContext, baseURL: string) {
    this.context = context;
    this.baseURL = baseURL;
  }

  static async create(baseURL: string = 'http://localhost:3001') {
    const context = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
    return new ApiClient(context, baseURL);
  }

  async dispose() {
    await this.context.dispose();
  }

  // Authentication methods
  async getNonce() {
    const response = await this.context.get('/auth/nonce');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    const cookies = response.headers()['set-cookie'];
    
    return { nonce: data.nonce, cookies };
  }

  async authenticate(address: string = '0x1234567890123456789012345678901234567890') {
    const { nonce, cookies } = await this.getNonce();
    
    // Create mock SIWE message
    const message = `localhost wants you to sign in with your Ethereum account:
${address}

E2E Test Authentication

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

    const signature = '0x' + '1'.repeat(130); // Mock signature

    const response = await this.context.post('/auth/verify', {
      data: { message, signature },
      headers: { Cookie: cookies || '' },
    });

    if (response.ok()) {
      const sessionCookies = response.headers()['set-cookie'];
      if (sessionCookies) {
        // Extract session token for future requests
        const sessionMatch = sessionCookies.match(/session=([^;]+)/);
        if (sessionMatch) {
          this.authToken = sessionMatch[1];
        }
      }
    }

    return response;
  }

  async logout() {
    const response = await this.context.post('/auth/logout', {
      headers: this.getAuthHeaders(),
    });
    
    if (response.ok()) {
      this.authToken = undefined;
    }
    
    return response;
  }

  // Helper methods
  private getAuthHeaders() {
    return this.authToken ? { Cookie: `session=${this.authToken}` } : {};
  }

  // API endpoints
  async getHealth() {
    return this.context.get('/health/liveness');
  }

  async getReadiness() {
    return this.context.get('/health/readiness');
  }

  async getProfile() {
    return this.context.get('/auth/profile', {
      headers: this.getAuthHeaders(),
    });
  }

  // Lift Tokens API
  async getLiftTokens(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.context.get(`/api/lift-tokens${queryString}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async getLiftToken(id: string) {
    return this.context.get(`/api/lift-tokens/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async createLiftToken(data: any) {
    return this.context.post('/api/lift-tokens', {
      data,
      headers: this.getAuthHeaders(),
    });
  }

  async updateLiftToken(id: string, data: any) {
    return this.context.put(`/api/lift-tokens/${id}`, {
      data,
      headers: this.getAuthHeaders(),
    });
  }

  async deleteLiftToken(id: string) {
    return this.context.delete(`/api/lift-tokens/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Payments API
  async getPayments(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.context.get(`/api/payments${queryString}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async getPayment(id: string) {
    return this.context.get(`/api/payments/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async createPayment(data: any) {
    return this.context.post('/api/payments', {
      data,
      headers: this.getAuthHeaders(),
    });
  }

  async confirmPayment(id: string, data: any) {
    return this.context.put(`/api/payments/${id}/confirm`, {
      data,
      headers: this.getAuthHeaders(),
    });
  }

  async cancelPayment(id: string) {
    return this.context.put(`/api/payments/${id}/cancel`, {
      headers: this.getAuthHeaders(),
    });
  }

  async getPaymentStats() {
    return this.context.get('/api/payments/stats', {
      headers: this.getAuthHeaders(),
    });
  }

  // Mint Requests API
  async getMintRequests(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.context.get(`/api/mint-requests${queryString}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async getMintRequest(id: string) {
    return this.context.get(`/api/mint-requests/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  async createMintRequest(data: any) {
    return this.context.post('/api/mint-requests', {
      data,
      headers: this.getAuthHeaders(),
    });
  }

  // WebSocket testing helper
  async testWebSocketConnection() {
    // Note: WebSocket testing in Playwright requires special handling
    // This is a placeholder for WebSocket E2E tests
    return this.context.get('/api/websocket/status', {
      headers: this.getAuthHeaders(),
    });
  }
}