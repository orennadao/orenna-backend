import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { afterAll, beforeAll } from "vitest";

// Test server configuration
export interface TestServerConfig {
  includeAuth?: boolean;
  includeWebsocket?: boolean;
  includeSecurity?: boolean;
  mockPrisma?: boolean;
}

export class TestServer {
  public app: FastifyInstance;
  private config: TestServerConfig;

  constructor(config: TestServerConfig = {}) {
    this.config = {
      includeAuth: true,
      includeWebsocket: false,
      includeSecurity: false,
      mockPrisma: true,
      ...config,
    };

    this.app = Fastify({
      logger: false, // Disable logging in tests
    });
  }

  async setup() {
    // Core plugins
    await this.app.register(cors, { 
      origin: "http://localhost:3000", 
      credentials: true 
    });
    
    await this.app.register(cookie);
    
    if (this.config.includeAuth) {
      await this.app.register(jwt, {
        secret: "test-secret-key-for-testing-only",
        cookie: { cookieName: "session", signed: false },
      });

      // Add authenticate decorator
      this.app.decorate("authenticate", async function (req: any, reply: any) {
        try {
          await req.jwtVerify();
        } catch (err) {
          return reply.send(err);
        }
      });
    }

    if (this.config.includeWebsocket) {
      await this.app.register(websocket);
    }

    if (this.config.mockPrisma) {
      await this.setupMockPrisma();
    }

    // Global error handler
    this.app.setErrorHandler((err, _req, reply) => {
      reply.status(500).send({
        statusCode: 500,
        error: err.name ?? "Error",
        message: err.message,
      });
    });

    return this.app;
  }

  private async setupMockPrisma() {
    // Mock Prisma client for testing
    const mockPrisma = {
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
    };

    this.app.decorate("prisma", mockPrisma);
  }

  async teardown() {
    await this.app.close();
  }

  // Helper method to get mock Prisma instance
  getMockPrisma() {
    return (this.app as any).prisma;
  }

  // Helper method to create JWT token for testing
  async createTestToken(payload: any = { userId: "test-user", address: "0x1234567890123456789012345678901234567890" }) {
    return this.app.jwt.sign(payload);
  }

  // Helper method to inject requests with authentication
  async injectWithAuth(options: any, payload?: any) {
    const token = await this.createTestToken(payload);
    return this.app.inject({
      ...options,
      cookies: { session: token },
    });
  }
}

// Vitest global setup helper
export function createTestServerSetup(config?: TestServerConfig) {
  let testServer: TestServer;

  beforeAll(async () => {
    testServer = new TestServer(config);
    await testServer.setup();
  });

  afterAll(async () => {
    if (testServer) {
      await testServer.teardown();
    }
  });

  return () => testServer;
}