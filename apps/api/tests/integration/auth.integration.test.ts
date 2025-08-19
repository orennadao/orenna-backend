import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { TestServer } from "../utils/test-server";
import { createMockUser, createMockSiweMessage } from "../utils/fixtures";
import { expectSuccessResponse, expectErrorResponse, expectValidJWTStructure } from "../utils/test-helpers";
import authRoutes from "../../src/routes/auth";

describe("Auth Integration Tests", () => {
  let testServer: TestServer;
  let mockPrisma: any;

  beforeAll(async () => {
    testServer = new TestServer({ includeAuth: true });
    await testServer.setup();
    await testServer.app.register(authRoutes);
    mockPrisma = testServer.getMockPrisma();
  });

  afterAll(async () => {
    await testServer.teardown();
  });

  describe("GET /auth/nonce", () => {
    it("should generate and return a nonce", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/auth/nonce",
      });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.nonce).toBeTruthy();
      expect(typeof body.nonce).toBe("string");
      expect(body.nonce.length).toBeGreaterThan(0);
      
      // Check that cookie is set
      const cookies = response.cookies;
      expect(cookies).toHaveLength(1);
      expect(cookies[0].name).toBe("nonce");
      expect(cookies[0].httpOnly).toBe(true);
    });

    it("should set secure cookie in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = await testServer.app.inject({
        method: "GET",
        url: "/auth/nonce",
      });

      expectSuccessResponse(response);
      const cookies = response.cookies;
      expect(cookies[0].secure).toBe(true);
      expect(cookies[0].sameSite).toBe("Strict");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("POST /auth/verify", () => {
    let nonceToken: string;
    let mockUser: any;

    beforeAll(async () => {
      // Get a nonce first
      const nonceResponse = await testServer.app.inject({
        method: "GET",
        url: "/auth/nonce",
      });
      const nonceCookie = nonceResponse.cookies.find(c => c.name === "nonce");
      nonceToken = nonceCookie!.value;

      // Create mock user
      mockUser = createMockUser();
      mockPrisma.user.upsert.mockResolvedValue(mockUser);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it("should successfully verify valid SIWE message", async () => {
      const siweData = createMockSiweMessage();
      
      // Mock SIWE verification (normally would be done by siwe library)
      vi.doMock("siwe", () => ({
        SiweMessage: vi.fn().mockImplementation((message) => ({
          verify: vi.fn().mockResolvedValue(true),
          address: siweData.address,
          domain: "localhost",
          uri: "http://localhost:3000",
          chainId: 1,
        })),
        generateNonce: vi.fn().mockReturnValue("test-nonce"),
      }));

      const response = await testServer.app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: {
          message: siweData.message,
          signature: siweData.signature,
        },
        cookies: { nonce: nonceToken },
      });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user.address).toBe(mockUser.address);
      
      // Check session cookie is set
      const cookies = response.cookies;
      const sessionCookie = cookies.find(c => c.name === "session");
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie!.httpOnly).toBe(true);
    });

    it("should reject missing message or signature", async () => {
      const response = await testServer.app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: {
          message: "test-message",
          // missing signature
        },
        cookies: { nonce: nonceToken },
      });

      expectErrorResponse(response, 400, "signature");
    });

    it("should reject missing nonce", async () => {
      const siweData = createMockSiweMessage();
      
      const response = await testServer.app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: {
          message: siweData.message,
          signature: siweData.signature,
        },
        // no nonce cookie
      });

      expectErrorResponse(response, 401, "Missing nonce");
    });

    it("should reject invalid signature format", async () => {
      const response = await testServer.app.inject({
        method: "POST",
        url: "/auth/verify",
        payload: {
          message: "test-message",
          signature: "invalid-signature",
        },
        cookies: { nonce: nonceToken },
      });

      expectErrorResponse(response, 400, "Invalid signature format");
    });
  });

  describe("GET /auth/profile", () => {
    it("should return user profile for authenticated user", async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/auth/profile",
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.user).toBeDefined();
      expect(body.user.address).toBe(mockUser.address);
      expect(body.user.id).toBe(mockUser.id);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/auth/profile",
      });

      expectErrorResponse(response, 401);
    });

    it("should return 404 if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/auth/profile",
      });

      expectErrorResponse(response, 404, "User not found");
    });
  });

  describe("POST /auth/logout", () => {
    it("should clear session cookies", async () => {
      const response = await testServer.app.inject({
        method: "POST",
        url: "/auth/logout",
      });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.success).toBe(true);
      
      // Check that cookies are cleared
      const cookies = response.cookies;
      const sessionCookie = cookies.find(c => c.name === "session");
      const nonceCookie = cookies.find(c => c.name === "nonce");
      
      expect(sessionCookie?.value).toBe("");
      expect(nonceCookie?.value).toBe("");
    });
  });

  describe("GET /me (legacy endpoint)", () => {
    it("should return user address for authenticated user", async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/me",
      }, { address: mockUser.address });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.address).toBe(mockUser.address);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/me",
      });

      expectErrorResponse(response, 401);
    });
  });
});