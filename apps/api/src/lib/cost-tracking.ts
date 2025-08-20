import { PrismaClient } from '@orenna/db';

/**
 * Simplified Cost Tracking Service for Lift Token Pricing
 * 
 * This service tracks actual project delivery costs using existing schema models
 * and provides cost data for lift token pricing calculations.
 */

export interface ProjectCostSummary {
  projectId: number;
  totalCostCents: bigint;
  totalPaidCents: bigint;
  outstandingCostCents: bigint;
  costPerLiftToken: string; // Cost per lift token if minted
  lastUpdated: Date;
}

export interface CostBreakdown {
  vendorCosts: VendorCost[];
  totalVendorCosts: bigint;
  platformFees: bigint;
  totalProjectCosts: bigint;
}

export interface VendorCost {
  vendorId: number;
  vendorName: string;
  totalInvoiced: bigint;
  totalPaid: bigint;
  outstanding: bigint;
  invoiceCount: number;
}

export class CostTrackingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get project cost summary for lift token pricing
   */
  async getProjectCostSummary(projectId: number): Promise<ProjectCostSummary> {
    // Get all invoices for the project through contracts
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contract: {
          projectId,
        },
      },
      include: {
        contract: {
          include: {
            vendor: true,
          },
        },
        disbursements: true,
      },
    });

    // Calculate cost totals
    const totalCostCents = invoices.reduce((sum, invoice) => sum + invoice.totalCents, BigInt(0));
    const totalPaidCents = invoices.reduce((sum, invoice) => {
      const paidAmount = invoice.paidAmount || BigInt(0);
      return sum + paidAmount;
    }, BigInt(0));
    const outstandingCostCents = totalCostCents - totalPaidCents;

    // Get lift token count for this project
    const liftTokenCount = await this.prisma.liftToken.count({
      where: { projectId },
    });

    // Calculate cost per lift token
    const costPerLiftToken = liftTokenCount > 0 
      ? (Number(totalCostCents) / liftTokenCount / 100).toFixed(2) // Convert cents to dollars
      : "0.00";

    return {
      projectId,
      totalCostCents,
      totalPaidCents,
      outstandingCostCents,
      costPerLiftToken,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get detailed cost breakdown by vendor
   */
  async getProjectCostBreakdown(projectId: number): Promise<CostBreakdown> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contract: {
          projectId,
        },
      },
      include: {
        contract: {
          include: {
            vendor: true,
          },
        },
        disbursements: true,
      },
    });

    // Group by vendor
    const vendorCostMap = new Map<number, VendorCost>();

    for (const invoice of invoices) {
      const vendorId = invoice.vendorId;
      const vendorName = invoice.contract.vendor.name;
      
      if (!vendorCostMap.has(vendorId)) {
        vendorCostMap.set(vendorId, {
          vendorId,
          vendorName,
          totalInvoiced: BigInt(0),
          totalPaid: BigInt(0),
          outstanding: BigInt(0),
          invoiceCount: 0,
        });
      }

      const vendorCost = vendorCostMap.get(vendorId)!;
      vendorCost.totalInvoiced += invoice.totalCents;
      vendorCost.totalPaid += invoice.paidAmount || BigInt(0);
      vendorCost.outstanding = vendorCost.totalInvoiced - vendorCost.totalPaid;
      vendorCost.invoiceCount++;
    }

    const vendorCosts = Array.from(vendorCostMap.values());
    const totalVendorCosts = vendorCosts.reduce((sum, vc) => sum + vc.totalInvoiced, BigInt(0));
    
    // For now, platform fees are 0 - could be calculated based on business rules
    const platformFees = BigInt(0);
    const totalProjectCosts = totalVendorCosts + platformFees;

    return {
      vendorCosts,
      totalVendorCosts,
      platformFees,
      totalProjectCosts,
    };
  }

  /**
   * Calculate lift token price based on actual project costs
   */
  async calculateLiftTokenPrice(projectId: number): Promise<{
    costBasedPrice: string;
    totalCosts: bigint;
    tokenCount: number;
    priceCalculationMethod: string;
  }> {
    const costSummary = await this.getProjectCostSummary(projectId);
    const tokenCount = await this.prisma.liftToken.count({
      where: { projectId },
    });

    if (tokenCount === 0) {
      return {
        costBasedPrice: "0.00",
        totalCosts: costSummary.totalCostCents,
        tokenCount: 0,
        priceCalculationMethod: "NO_TOKENS_MINTED",
      };
    }

    // Base price on actual costs
    const costBasedPriceCents = Number(costSummary.totalCostCents) / tokenCount;
    const costBasedPrice = (costBasedPriceCents / 100).toFixed(2); // Convert to dollars

    return {
      costBasedPrice,
      totalCosts: costSummary.totalCostCents,
      tokenCount,
      priceCalculationMethod: "ACTUAL_PROJECT_COSTS",
    };
  }

  /**
   * Track cost per ecosystem function unit (for more granular pricing)
   */
  async getCostPerEcosystemUnit(projectId: number): Promise<{
    costPerUnit: string;
    totalEcosystemUnits: string;
    totalCosts: bigint;
    unitType: string;
  }> {
    const costSummary = await this.getProjectCostSummary(projectId);
    
    // Get total ecosystem function quantity from lift tokens
    const liftTokens = await this.prisma.liftToken.findMany({
      where: { projectId },
      select: {
        quantity: true,
        unit: true,
      },
    });

    if (liftTokens.length === 0) {
      return {
        costPerUnit: "0.00",
        totalEcosystemUnits: "0",
        totalCosts: costSummary.totalCostCents,
        unitType: "UNKNOWN",
      };
    }

    // Sum up total ecosystem function quantity
    const totalQuantity = liftTokens.reduce((sum, token) => {
      const quantity = token.quantity ? Number(token.quantity) : 0;
      return sum + quantity;
    }, 0);

    // Use the most common unit type
    const unitType = liftTokens[0]?.unit || "ECOSYSTEM_FUNCTION_UNITS";

    // Calculate cost per ecosystem function unit
    const costPerUnit = totalQuantity > 0 
      ? (Number(costSummary.totalCostCents) / totalQuantity / 100).toFixed(2)
      : "0.00";

    return {
      costPerUnit,
      totalEcosystemUnits: totalQuantity.toString(),
      totalCosts: costSummary.totalCostCents,
      unitType,
    };
  }

  /**
   * Get cost trends over time for a project
   */
  async getProjectCostTrends(projectId: number, months: number = 12): Promise<{
    monthlyData: Array<{
      month: string;
      totalCostsCents: bigint;
      invoiceCount: number;
      avgInvoiceSize: string;
    }>;
  }> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        contract: {
          projectId,
        },
        createdAt: {
          gte: monthsAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by month
    const monthlyMap = new Map<string, {
      totalCostsCents: bigint;
      invoiceCount: number;
    }>();

    for (const invoice of invoices) {
      const monthKey = invoice.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          totalCostsCents: BigInt(0),
          invoiceCount: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.totalCostsCents += invoice.totalCents;
      monthData.invoiceCount++;
    }

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      totalCostsCents: data.totalCostsCents,
      invoiceCount: data.invoiceCount,
      avgInvoiceSize: data.invoiceCount > 0 
        ? (Number(data.totalCostsCents) / data.invoiceCount / 100).toFixed(2)
        : "0.00",
    }));

    return { monthlyData };
  }
}