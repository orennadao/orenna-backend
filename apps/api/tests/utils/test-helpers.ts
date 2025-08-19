import { vi } from "vitest";
import { FastifyInstance } from "fastify";

// Mock implementations for common dependencies
export const mockPrismaClient = () => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  liftToken: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mintRequest: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  payment: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn().mockResolvedValue(1),
  $disconnect: vi.fn(),
  $transaction: vi.fn(),
});

// Mock blockchain client
export const mockBlockchainClient = () => ({
  getBalance: vi.fn().mockResolvedValue(BigInt("1000000000000000000")), // 1 ETH
  getTransaction: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getBlock: vi.fn(),
  readContract: vi.fn(),
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
});

// Mock WebSocket connections
export const mockWebSocketConnection = () => ({
  send: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
  readyState: 1, // OPEN
});

// Test assertion helpers
export const expectValidEthereumAddress = (address: string) => {
  expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
};

export const expectValidTransactionHash = (hash: string) => {
  expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
};

export const expectValidUUID = (uuid: string) => {
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
};

export const expectValidJWTStructure = (token: string) => {
  const parts = token.split('.');
  expect(parts).toHaveLength(3);
  parts.forEach(part => {
    expect(part).toBeTruthy();
  });
};

// API response helpers
export const expectSuccessResponse = (response: any, statusCode = 200) => {
  expect(response.statusCode).toBe(statusCode);
  expect(response.headers['content-type']).toContain('application/json');
};

export const expectErrorResponse = (response: any, statusCode: number, errorMessage?: string) => {
  expect(response.statusCode).toBe(statusCode);
  if (errorMessage) {
    const body = response.json();
    expect(body.error || body.message).toContain(errorMessage);
  }
};

export const expectPaginatedResponse = (response: any) => {
  expectSuccessResponse(response);
  const body = response.json();
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('pagination');
  expect(body.pagination).toHaveProperty('page');
  expect(body.pagination).toHaveProperty('limit');
  expect(body.pagination).toHaveProperty('total');
  expect(Array.isArray(body.data)).toBe(true);
};

// Database helpers
export const setupTestDatabase = async (prisma: any, fixtures: any) => {
  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.mintRequest.deleteMany();
  await prisma.liftToken.deleteMany();
  await prisma.user.deleteMany();

  // Insert test data
  for (const user of fixtures.users) {
    await prisma.user.create({ data: user });
  }
  
  for (const liftToken of fixtures.liftTokens) {
    await prisma.liftToken.create({ data: liftToken });
  }
  
  for (const mintRequest of fixtures.mintRequests) {
    await prisma.mintRequest.create({ data: mintRequest });
  }
  
  for (const payment of fixtures.payments) {
    await prisma.payment.create({ data: payment });
  }
};

export const cleanupTestDatabase = async (prisma: any) => {
  await prisma.payment.deleteMany();
  await prisma.mintRequest.deleteMany();
  await prisma.liftToken.deleteMany();
  await prisma.user.deleteMany();
};

// Mock API responses
export const mockSuccessfulAuth = (app: FastifyInstance, userPayload?: any) => {
  const defaultPayload = {
    userId: "test-user-id",
    address: "0x1234567890123456789012345678901234567890",
    chainId: 1,
  };
  
  vi.spyOn(app.jwt, 'verify').mockResolvedValue(userPayload || defaultPayload);
};

export const mockFailedAuth = (app: FastifyInstance, error?: Error) => {
  const defaultError = new Error("Invalid token");
  vi.spyOn(app.jwt, 'verify').mockRejectedValue(error || defaultError);
};

// Time helpers
export const waitForAsync = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

// Error simulation helpers
export const simulateNetworkError = () => {
  throw new Error("Network request failed");
};

export const simulateDatabaseError = () => {
  throw new Error("Database connection failed");
};

export const simulateRateLimitError = () => {
  const error = new Error("Too Many Requests") as any;
  error.statusCode = 429;
  throw error;
};

// Test data validation helpers
export const validateApiResponse = (response: any, schema: any) => {
  try {
    schema.parse(response.json());
    return true;
  } catch (error) {
    console.error("Response validation failed:", error);
    return false;
  }
};

// Environment helpers
export const withTestEnv = (envVars: Record<string, string>, testFn: () => Promise<void>) => {
  return async () => {
    const originalEnv = { ...process.env };
    
    // Set test environment variables
    Object.assign(process.env, envVars);
    
    try {
      await testFn();
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  };
};