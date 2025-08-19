import { FastifyInstance } from 'fastify';
import { CostTrackingService } from '../lib/cost-tracking.js';

/**
 * Cost Tracking API Routes
 * 
 * Provides endpoints for tracking project costs and calculating
 * lift token prices based on actual delivery costs.
 */

export default async function costTrackingRoutes(app: FastifyInstance) {
  const costTrackingService = new CostTrackingService(app.prisma);

  // Get project cost summary
  app.get('/projects/:projectId/costs/summary', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const projectIdNum = parseInt(projectId);

      if (isNaN(projectIdNum)) {
        return reply.code(400).send({ error: 'Invalid project ID' });
      }

      const summary = await costTrackingService.getProjectCostSummary(projectIdNum);
      return reply.send(summary);
    } catch (error: any) {
      app.log.warn('Failed to get project cost summary', { error: error.message });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get detailed cost breakdown by vendor
  app.get('/projects/:projectId/costs/breakdown', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const projectIdNum = parseInt(projectId);

      if (isNaN(projectIdNum)) {
        return reply.code(400).send({ error: 'Invalid project ID' });
      }

      const breakdown = await costTrackingService.getProjectCostBreakdown(projectIdNum);
      return reply.send(breakdown);
    } catch (error: any) {
      app.log.warn('Failed to get project cost breakdown', { error: error.message });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Calculate lift token price based on actual costs
  app.get('/projects/:projectId/lift-tokens/cost-based-price', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const projectIdNum = parseInt(projectId);

      if (isNaN(projectIdNum)) {
        return reply.code(400).send({ error: 'Invalid project ID' });
      }

      const pricing = await costTrackingService.calculateLiftTokenPrice(projectIdNum);
      return reply.send(pricing);
    } catch (error: any) {
      app.log.warn('Failed to calculate lift token price', { error: error.message });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get cost per ecosystem function unit
  app.get('/projects/:projectId/costs/per-ecosystem-unit', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const projectIdNum = parseInt(projectId);

      if (isNaN(projectIdNum)) {
        return reply.code(400).send({ error: 'Invalid project ID' });
      }

      const costPerUnit = await costTrackingService.getCostPerEcosystemUnit(projectIdNum);
      return reply.send(costPerUnit);
    } catch (error: any) {
      app.log.warn('Failed to get cost per ecosystem unit', { error: error.message });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get cost trends over time
  app.get('/projects/:projectId/costs/trends', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const { months } = request.query as { months?: string };
      
      const projectIdNum = parseInt(projectId);
      const monthsNum = months ? parseInt(months) : 12;

      if (isNaN(projectIdNum)) {
        return reply.code(400).send({ error: 'Invalid project ID' });
      }

      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 60) {
        return reply.code(400).send({ error: 'Months must be between 1 and 60' });
      }

      const trends = await costTrackingService.getProjectCostTrends(projectIdNum, monthsNum);
      return reply.send(trends);
    } catch (error: any) {
      app.log.warn('Failed to get project cost trends', { error: error.message });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get aggregated cost data for multiple projects (useful for platform analytics)
  app.get('/costs/platform-summary', async (request, reply) => {
    try {
      // Get all projects with costs
      const projects = await app.prisma.project.findMany({
        include: {
          financeContracts: {
            include: {
              invoices: true,
            },
          },
          liftTokens: true,
        },
      });

      const platformSummary = {
        totalProjects: projects.length,
        projectsWithCosts: 0,
        totalPlatformCostsCents: BigInt(0),
        totalLiftTokens: 0,
        avgCostPerProject: "0.00",
        avgCostPerLiftToken: "0.00",
      };

      for (const project of projects) {
        const totalProjectCosts = project.financeContracts.reduce((sum, contract) => {
          return sum + contract.invoices.reduce((invoiceSum, invoice) => {
            return invoiceSum + invoice.totalCents;
          }, BigInt(0));
        }, BigInt(0));

        if (totalProjectCosts > 0) {
          platformSummary.projectsWithCosts++;
          platformSummary.totalPlatformCostsCents += totalProjectCosts;
        }

        platformSummary.totalLiftTokens += project.liftTokens.length;
      }

      // Calculate averages
      if (platformSummary.projectsWithCosts > 0) {
        platformSummary.avgCostPerProject = (
          Number(platformSummary.totalPlatformCostsCents) / 
          platformSummary.projectsWithCosts / 100
        ).toFixed(2);
      }

      if (platformSummary.totalLiftTokens > 0) {
        platformSummary.avgCostPerLiftToken = (
          Number(platformSummary.totalPlatformCostsCents) / 
          platformSummary.totalLiftTokens / 100
        ).toFixed(2);
      }

      return reply.send({
        ...platformSummary,
        totalPlatformCostsCents: platformSummary.totalPlatformCostsCents.toString(),
      });
    } catch (error: any) {
      app.log.warn('Failed to get platform cost summary', { error: error.message });
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}