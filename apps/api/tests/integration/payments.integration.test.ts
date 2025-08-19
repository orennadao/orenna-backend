import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { TestServer } from "../utils/test-server";
import { createMockUser, createMockPayment, createMockTransaction } from "../utils/fixtures";
import { expectSuccessResponse, expectErrorResponse, expectPaginatedResponse } from "../utils/test-helpers";
import paymentRoutes from "../../src/routes/payments";

describe("Payments Integration Tests", () => {
  let testServer: TestServer;
  let mockPrisma: any;
  let mockUser: any;

  beforeAll(async () => {
    testServer = new TestServer({ includeAuth: true });
    await testServer.setup();
    await testServer.app.register(paymentRoutes, { prefix: "/api" });
    mockPrisma = testServer.getMockPrisma();
    mockUser = createMockUser();
  });

  afterAll(async () => {
    await testServer.teardown();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(mockPrisma.payment).forEach((mock: any) => mock.mockReset());
  });

  describe("GET /api/payments", () => {
    it("should return paginated list of payments for authenticated user", async () => {
      const mockPayments = Array.from({ length: 3 }, () => 
        createMockPayment({ userAddress: mockUser.address })
      );
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.payment.count = vi.fn().mockResolvedValue(10);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/api/payments?page=1&limit=10",
      }, { address: mockUser.address, userId: mockUser.id });

      expectPaginatedResponse(response);
      const body = response.json();
      expect(body.data).toHaveLength(3);
      expect(body.pagination.total).toBe(10);
      
      // Verify filtering by user address
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userAddress: mockUser.address.toLowerCase(),
          }),
        })
      );
    });

    it("should filter by payment status", async () => {
      const mockPayments = [createMockPayment({ status: "CONFIRMED" })];
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.payment.count = vi.fn().mockResolvedValue(1);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/api/payments?status=CONFIRMED",
      }, { address: mockUser.address, userId: mockUser.id });

      expectPaginatedResponse(response);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "CONFIRMED",
          }),
        })
      );
    });

    it("should filter by payment type", async () => {
      const mockPayments = [createMockPayment({ paymentType: "MINT_FEE" })];
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.payment.count = vi.fn().mockResolvedValue(1);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/api/payments?paymentType=MINT_FEE",
      }, { address: mockUser.address, userId: mockUser.id });

      expectPaginatedResponse(response);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentType: "MINT_FEE",
          }),
        })
      );
    });

    it("should reject unauthenticated requests", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/payments",
      });

      expectErrorResponse(response, 401);
    });
  });

  describe("GET /api/payments/:id", () => {
    it("should return specific payment for owner", async () => {
      const mockPayment = createMockPayment({ userAddress: mockUser.address });
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: `/api/payments/${mockPayment.id}`,
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.id).toBe(mockPayment.id);
      expect(body.amount).toBe(mockPayment.amount);
      expect(body.status).toBe(mockPayment.status);
    });

    it("should reject access to other user's payments", async () => {
      const mockPayment = createMockPayment({ userAddress: "0x0000000000000000000000000000000000000000" });
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: `/api/payments/${mockPayment.id}`,
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 403, "Unauthorized");
    });

    it("should return 404 for non-existent payment", async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/api/payments/non-existent-id",
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 404, "Payment not found");
    });
  });

  describe("POST /api/payments", () => {
    it("should create new payment for authenticated user", async () => {
      const newPayment = createMockPayment({ userAddress: mockUser.address });
      mockPrisma.payment.create.mockResolvedValue(newPayment);

      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/payments",
        payload: {
          amount: newPayment.amount,
          currency: newPayment.currency,
          paymentType: newPayment.paymentType,
          relatedEntityId: newPayment.relatedEntityId,
          chainId: newPayment.chainId,
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response, 201);
      const body = response.json();
      expect(body.id).toBe(newPayment.id);
      expect(body.userAddress).toBe(mockUser.address.toLowerCase());
      expect(body.status).toBe("PENDING");
    });

    it("should validate required fields", async () => {
      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/payments",
        payload: {
          // missing required fields
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400);
    });

    it("should validate amount format", async () => {
      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/payments",
        payload: {
          amount: "invalid-amount",
          currency: "ETH",
          paymentType: "MINT_FEE",
          relatedEntityId: "test-id",
          chainId: 1,
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400, "Invalid amount");
    });

    it("should validate currency", async () => {
      const response = await testServer.injectWithAuth({
        method: "POST",
        url: "/api/payments",
        payload: {
          amount: "1000000000000000000",
          currency: "INVALID_CURRENCY",
          paymentType: "MINT_FEE",
          relatedEntityId: "test-id",
          chainId: 1,
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400, "Invalid currency");
    });
  });

  describe("PUT /api/payments/:id/confirm", () => {
    it("should confirm payment with valid transaction hash", async () => {
      const mockPayment = createMockPayment({ 
        userAddress: mockUser.address,
        status: "PENDING",
      });
      const confirmedPayment = { ...mockPayment, status: "CONFIRMED" };
      
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrisma.payment.update.mockResolvedValue(confirmedPayment);

      const transactionHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/payments/${mockPayment.id}/confirm`,
        payload: {
          transactionHash,
          blockNumber: "18000000",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.status).toBe("CONFIRMED");
      expect(body.transactionHash).toBe(transactionHash);
    });

    it("should reject confirmation by non-owner", async () => {
      const mockPayment = createMockPayment({ 
        userAddress: "0x0000000000000000000000000000000000000000",
        status: "PENDING",
      });
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/payments/${mockPayment.id}/confirm`,
        payload: {
          transactionHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
          blockNumber: "18000000",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 403, "Unauthorized");
    });

    it("should reject confirmation of already confirmed payment", async () => {
      const mockPayment = createMockPayment({ 
        userAddress: mockUser.address,
        status: "CONFIRMED",
      });
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/payments/${mockPayment.id}/confirm`,
        payload: {
          transactionHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
          blockNumber: "18000000",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400, "Payment already confirmed");
    });

    it("should validate transaction hash format", async () => {
      const mockPayment = createMockPayment({ 
        userAddress: mockUser.address,
        status: "PENDING",
      });
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/payments/${mockPayment.id}/confirm`,
        payload: {
          transactionHash: "invalid-hash",
          blockNumber: "18000000",
        },
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400, "Invalid transaction hash");
    });
  });

  describe("PUT /api/payments/:id/cancel", () => {
    it("should cancel pending payment", async () => {
      const mockPayment = createMockPayment({ 
        userAddress: mockUser.address,
        status: "PENDING",
      });
      const cancelledPayment = { ...mockPayment, status: "CANCELLED" };
      
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrisma.payment.update.mockResolvedValue(cancelledPayment);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/payments/${mockPayment.id}/cancel`,
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.status).toBe("CANCELLED");
    });

    it("should reject cancellation of confirmed payment", async () => {
      const mockPayment = createMockPayment({ 
        userAddress: mockUser.address,
        status: "CONFIRMED",
      });
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const response = await testServer.injectWithAuth({
        method: "PUT",
        url: `/api/payments/${mockPayment.id}/cancel`,
      }, { address: mockUser.address, userId: mockUser.id });

      expectErrorResponse(response, 400, "Cannot cancel confirmed payment");
    });
  });

  describe("GET /api/payments/stats", () => {
    it("should return payment statistics for authenticated user", async () => {
      const mockStats = {
        totalPayments: 10,
        totalAmount: "5000000000000000000", // 5 ETH
        confirmedPayments: 8,
        pendingPayments: 2,
        failedPayments: 0,
      };

      // Mock the aggregation query
      mockPrisma.$queryRaw.mockResolvedValue([mockStats]);

      const response = await testServer.injectWithAuth({
        method: "GET",
        url: "/api/payments/stats",
      }, { address: mockUser.address, userId: mockUser.id });

      expectSuccessResponse(response);
      const body = response.json();
      expect(body.totalPayments).toBe(10);
      expect(body.totalAmount).toBe("5000000000000000000");
      expect(body.confirmedPayments).toBe(8);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await testServer.app.inject({
        method: "GET",
        url: "/api/payments/stats",
      });

      expectErrorResponse(response, 401);
    });
  });
});