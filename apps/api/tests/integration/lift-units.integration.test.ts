import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { TestServer } from "../utils/test-server";
import { createMockUser, createMockLiftToken } from "../utils/fixtures";
import { expectSuccessResponse, expectErrorResponse, expectPaginatedResponse } from "../utils/test-helpers";
import liftTokenRoutes from "../../src/routes/lift-tokens";

describe("Lift Tokens Integration Tests", () => {
  let testServer: TestServer;
  let mockPrisma: any;
  let mockUser: any;

  beforeAll(async () => {
    testServer = new TestServer({ includeAuth: true });
    await testServer.setup();
    await testServer.app.register(liftTokenRoutes, { prefix: "/api" });
    mockPrisma = testServer.getMockPrisma();
    mockUser = createMockUser();
  });

  afterAll(async () => {
    await testServer.teardown();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(mockPrisma.liftToken).forEach((mock: any) => mock.mockReset());
  });

  describe("GET /api/lift-tokens", () => {
    it("should return paginated list of lift tokens", async () => {
      const mockLiftTokens = Array.from({ length: 5 }, () => createMockLiftToken());
      mockPrisma.liftToken.findMany.mockResolvedValue(mockLiftTokens);
      mockPrisma.liftToken.count = vi.fn().mockResolvedValue(15);

      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/lift-tokens?page=1&limit=5",
      });

      expectPaginatedResponse(response);
      const body = response.json();
      expect(body.data).toHaveLength(5);
      expect(body.pagination.total).toBe(15);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
    });

    it("should filter by owner address", async () => {
      const ownerAddress = "0x1234567890123456789012345678901234567890";
      const mockLiftTokens = [createMockLiftToken({ ownerAddress })];
      mockPrisma.liftToken.findMany.mockResolvedValue(mockLiftTokens);
      mockPrisma.liftToken.count = vi.fn().mockResolvedValue(1);

      const response = await testServer.app.inject({
        method: "GET",
        url: `/api/lift-tokens?ownerAddress=${ownerAddress}`,
      });

      expectPaginatedResponse(response);
      expect(mockPrisma.liftToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerAddress: ownerAddress.toLowerCase(),
          }),
        })
      );
    });

    it("should filter by status", async () => {
      const mockLiftTokens = [createMockLiftToken({ status: "ACTIVE" })];
      mockPrisma.liftToken.findMany.mockResolvedValue(mockLiftTokens);
      mockPrisma.liftToken.count = vi.fn().mockResolvedValue(1);

      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/lift-tokens?status=ACTIVE",
      });

      expectPaginatedResponse(response);
      expect(mockPrisma.liftToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("should handle invalid pagination parameters", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/lift-tokens?page=0&limit=1000",
      });

      expectErrorResponse(response, 400);
    });
  });

  describe("GET /api/lift-tokens/:id", () => {
    it("should return specific lift token by id", async () => {
      const mockLiftToken = createMockLiftToken();
      mockPrisma.liftToken.findUnique.mockResolvedValue(mockLiftToken);

      const response = await testServer.app.inject({
        method: "GET",
        url: `/api/lift-tokens/${mockLiftToken.id}`,
      });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.id).toBe(mockLiftToken.id);
      expect(body.name).toBe(mockLiftToken.name);
    });

    it("should return 404 for non-existent lift token", async () => {
      mockPrisma.liftToken.findUnique.mockResolvedValue(null);

      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/lift-tokens/non-existent-id",
      });

      expectErrorResponse(response, 404, "Lift token not found");
    });

    it("should validate UUID format", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/lift-tokens/invalid-uuid",
      });

      expectErrorResponse(response, 400, "Invalid UUID");
    });
  });

  describe("POST /api/lift-tokens", () => {
    it("should create new lift token for authenticated user", async () => {
      const newLiftToken = createMockLiftToken({ ownerAddress: mockUser.address });
      mockPrisma.liftToken.create.mockResolvedValue(newLiftToken);

      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/lift-tokens",
        payload: {
          tokenId: newLiftToken.tokenId,
          contractAddress: newLiftToken.contractAddress,
          name: newLiftToken.name,
          description: newLiftToken.description,
          imageUrl: newLiftToken.imageUrl,
          metadataUrl: newLiftToken.metadataUrl,
          chainId: newLiftToken.chainId,
          attributes: newLiftToken.attributes,
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response, 201);
      const body = response.json();
      expect(body.id).toBe(newLiftToken.id);
      expect(body.ownerAddress).toBe(mockUser.address.toLowerCase());
    });

    it("should reject unauthenticated requests", async () => {
      const response = await testServer.app.inject({
        method: "POST",
        url: "/api/lift-tokens",
        payload: {
          tokenId: "123",
          contractAddress: "0x1234567890123456789012345678901234567890",
          name: "Test Lift Token",
        },
      });

      expectErrorResponse(response, 401);
    });

    it("should validate required fields", async () => {
      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/lift-tokens",
        payload: {
          // missing required fields
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400);
    });

    it("should validate Ethereum address format", async () => {
      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/lift-tokens",
        payload: {
          tokenId: "123",
          contractAddress: "invalid-address",
          name: "Test Lift Token",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400, "Invalid Ethereum address");
    });
  });

  describe("PUT /api/lift-tokens/:id", () => {
    it("should update lift token for owner", async () => {
      const existingLiftToken = createMockLiftToken({ ownerAddress: mockUser.address });
      const updatedLiftToken = { ...existingLiftToken, name: "Updated Name" };
      
      mockPrisma.liftToken.findUnique.mockResolvedValue(existingLiftToken);
      mockPrisma.liftToken.update.mockResolvedValue(updatedLiftToken);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/lift-tokens/${existingLiftToken.id}`,
        payload: {
          name: "Updated Name",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.name).toBe("Updated Name");
    });

    it("should reject updates by non-owner", async () => {
      const existingLiftToken = createMockLiftToken({ ownerAddress: "0x0000000000000000000000000000000000000000" });
      mockPrisma.liftToken.findUnique.mockResolvedValue(existingLiftToken);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/lift-tokens/${existingLiftToken.id}`,
        payload: {
          name: "Updated Name",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 403, "Unauthorized");
    });

    it("should reject update for non-existent lift token", async () => {
      mockPrisma.liftToken.findUnique.mockResolvedValue(null);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: "/api/lift-tokens/non-existent-id",
        payload: {
          name: "Updated Name",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 404, "Lift token not found");
    });
  });

  describe("DELETE /api/lift-tokens/:id", () => {
    it("should delete lift token for owner", async () => {
      const existingLiftToken = createMockLiftToken({ ownerAddress: mockUser.address });
      mockPrisma.liftToken.findUnique.mockResolvedValue(existingLiftToken);
      mockPrisma.liftToken.delete.mockResolvedValue(existingLiftToken);

      const response = await testServer.injectWithAuth({
        method: "DELETE",
        url: `/api/lift-tokens/${existingLiftToken.id}`,
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response, 204);
    });

    it("should reject deletion by non-owner", async () => {
      const existingLiftToken = createMockLiftToken({ ownerAddress: "0x0000000000000000000000000000000000000000" });
      mockPrisma.liftToken.findUnique.mockResolvedValue(existingLiftToken);

      const response = await testServer.injectWithAuth({
        method: "DELETE",
        url: `/api/lift-tokens/${existingLiftToken.id}`,
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 403, "Unauthorized");
    });
  });

  describe("GET /api/lift-tokens/:id/metadata", () => {
    it("should return metadata for lift token", async () => {
      const mockLiftToken = createMockLiftToken();
      mockPrisma.liftToken.findUnique.mockResolvedValue(mockLiftToken);

      const response = await testServer.app.inject({
        method: "GET",
        url: `/api/lift-tokens/${mockLiftToken.id}/metadata`,
      });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.name).toBe(mockLiftToken.name);
      expect(body.description).toBe(mockLiftToken.description);
      expect(body.image).toBe(mockLiftToken.imageUrl);
      expect(body.attributes).toBeDefined();
    });

    it("should return 404 for non-existent lift token", async () => {
      mockPrisma.liftToken.findUnique.mockResolvedValue(null);

      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/lift-tokens/non-existent-id/metadata",
      });

      expectErrorResponse(response, 404, "Lift token not found");
    });
  });
});