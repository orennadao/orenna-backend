import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { WhiteLabelService } from '../lib/white-label.js';

// Validation schemas
const CreateOrganizationSchema = z.object({
  name: z.string().min(1),
  organizationName: z.string().min(1),
  domain: z.string().optional(),
  branding: z.object({
    logo: z.string().url(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    theme: z.enum(['light', 'dark', 'auto']),
    customCSS: z.string().optional()
  }),
  features: z.object({
    verificationMethods: z.array(z.string()),
    maxVerificationsPerMonth: z.number().positive(),
    batchOperations: z.boolean(),
    realTimeUpdates: z.boolean(),
    auditTrails: z.boolean(),
    complianceReporting: z.boolean(),
    customWorkflows: z.boolean(),
    whitelistedDomains: z.array(z.string())
  }),
  customization: z.object({
    reportTemplates: z.record(z.any()).optional(),
    workflowTemplates: z.record(z.any()).optional(),
    emailTemplates: z.record(z.any()).optional(),
    webhookEndpoints: z.array(z.string().url()).optional(),
    customFields: z.record(z.any()).optional()
  }).optional(),
  compliance: z.object({
    requireTwoFactorAuth: z.boolean(),
    dataRetentionDays: z.number().positive(),
    allowDataExport: z.boolean(),
    requiredCompliance: z.array(z.string()),
    ipWhitelist: z.array(z.string()).optional()
  }),
  billing: z.object({
    plan: z.enum(['starter', 'professional', 'enterprise', 'custom']),
    monthlyFee: z.number().nonnegative(),
    perVerificationFee: z.number().nonnegative(),
    usageTracking: z.boolean(),
    billingContact: z.string().email()
  }),
  integration: z.object({
    ssoEnabled: z.boolean(),
    ssoProviders: z.array(z.string()).optional(),
    apiRateLimit: z.number().positive(),
    webhookSecret: z.string().optional(),
    customIntegrations: z.record(z.any()).optional()
  }),
  status: z.enum(['active', 'suspended', 'trial', 'inactive']).default('trial'),
  expiresAt: z.string().datetime().optional()
});

const CustomMethodSchema = z.object({
  methodId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  criteria: z.record(z.any()),
  workflow: z.record(z.any()),
  template: z.record(z.any())
});

const CustomWorkflowSchema = z.object({
  workflowId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  triggers: z.array(z.record(z.any())),
  actions: z.array(z.record(z.any())),
  conditions: z.array(z.record(z.any())),
  notifications: z.array(z.record(z.any()))
});

export default async function whiteLabelRoutes(app: FastifyInstance) {
  const whiteLabelService = new WhiteLabelService(app);

  // Authentication middleware for white-label API
  const authenticateWhiteLabel = async (request: FastifyRequest, reply: any) => {
    const apiKey = request.headers.authorization?.replace('Bearer ', '') || 
                   request.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return reply.code(401).send({ error: 'API key required' });
    }

    const organization = await whiteLabelService.validateApiKey(apiKey);
    if (!organization) {
      return reply.code(401).send({ error: 'Invalid or expired API key' });
    }

    // Add organization to request context
    (request as any).organization = organization;
  };

  // Create white-label organization (admin only)
  app.post('/white-label/organizations', {
    preHandler: (app as any).authenticate, // Admin authentication
    schema: {
      description: 'Create a new white-label organization',
      tags: ['White Label', 'Admin'],
      security: [{ bearerAuth: [] }],
      body: CreateOrganizationSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            apiKey: { type: 'string' },
            dashboardUrl: { type: 'string' },
            status: { type: 'string' },
            expiresAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const body = CreateOrganizationSchema.parse(request.body);
      
      const organization = await whiteLabelService.createWhiteLabelOrganization({
        ...body,
        customization: body.customization || {
          reportTemplates: {},
          workflowTemplates: {},
          emailTemplates: {},
          webhookEndpoints: [],
          customFields: {}
        },
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
      });

      const dashboardUrl = await whiteLabelService.generateDashboardUrl(organization.id);

      return reply.code(201).send({
        id: organization.id,
        apiKey: organization.apiKey,
        dashboardUrl,
        status: organization.status,
        expiresAt: organization.expiresAt?.toISOString()
      });
    } catch (error) {
      app.log.error({ error }, 'Failed to create white-label organization');
      return reply.code(500).send({ error: 'Failed to create organization' });
    }
  });

  // Get organization configuration
  app.get('/white-label/config', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Get white-label organization configuration',
      tags: ['White Label'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            organizationName: { type: 'string' },
            domain: { type: 'string' },
            branding: { type: 'object' },
            features: { type: 'object' },
            customization: { type: 'object' },
            compliance: { type: 'object' },
            billing: { type: 'object' },
            integration: { type: 'object' },
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      
      // Remove sensitive information
      const publicConfig = {
        ...organization,
        apiKey: undefined // Don't expose API key
      };

      return publicConfig;
    } catch (error) {
      app.log.error({ error }, 'Failed to get organization configuration');
      return reply.code(500).send({ error: 'Failed to get configuration' });
    }
  });

  // Update organization configuration
  app.put('/white-label/config', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Update white-label organization configuration',
      tags: ['White Label'],
      body: {
        type: 'object',
        properties: {
          branding: { type: 'object' },
          customization: { type: 'object' },
          integration: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const updates = request.body as any;
      
      const updatedOrganization = await whiteLabelService.updateWhiteLabelConfiguration(
        organization.id,
        updates
      );

      return {
        id: updatedOrganization.id,
        updatedAt: updatedOrganization.updatedAt,
        status: 'updated'
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to update organization configuration');
      return reply.code(500).send({ error: 'Failed to update configuration' });
    }
  });

  // Create custom verification method
  app.post('/white-label/verification-methods', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Create custom verification method for organization',
      tags: ['White Label', 'Verification'],
      body: CustomMethodSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            methodId: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const body = CustomMethodSchema.parse(request.body);
      
      if (!organization.features.customWorkflows) {
        return reply.code(403).send({ error: 'Custom verification methods not enabled' });
      }

      await whiteLabelService.createCustomVerificationMethod(organization.id, body);

      return reply.code(201).send({
        methodId: body.methodId,
        name: body.name,
        status: 'created'
      });
    } catch (error) {
      app.log.error({ error }, 'Failed to create custom verification method');
      return reply.code(500).send({ error: 'Failed to create verification method' });
    }
  });

  // Generate custom report
  app.post('/white-label/reports/generate', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Generate custom branded report',
      tags: ['White Label', 'Reports'],
      body: {
        type: 'object',
        required: ['reportType'],
        properties: {
          reportType: { type: 'string' },
          parameters: { type: 'object' },
          format: { type: 'string', enum: ['json', 'pdf', 'csv'], default: 'json' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            reportId: { type: 'string' },
            reportType: { type: 'string' },
            format: { type: 'string' },
            downloadUrl: { type: 'string' },
            generatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const body = request.body as {
        reportType: string;
        parameters: any;
        format?: 'json' | 'pdf' | 'csv';
      };
      
      if (!organization.features.complianceReporting) {
        return reply.code(403).send({ error: 'Custom reporting not enabled' });
      }

      const report = await whiteLabelService.generateCustomReport(
        organization.id,
        body.reportType,
        { ...body.parameters, format: body.format }
      );

      const downloadUrl = `/white-label/reports/${organization.id}/${report.reportType}/${report.generatedAt.getTime()}`;

      return reply.code(201).send({
        reportId: `${organization.id}-${report.reportType}-${report.generatedAt.getTime()}`,
        reportType: report.reportType,
        format: report.format,
        downloadUrl,
        generatedAt: report.generatedAt.toISOString()
      });
    } catch (error) {
      app.log.error({ error }, 'Failed to generate custom report');
      return reply.code(500).send({ error: 'Failed to generate report' });
    }
  });

  // Get usage metrics
  app.get('/white-label/usage', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Get organization usage metrics and billing information',
      tags: ['White Label', 'Usage'],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          period: { type: 'string', enum: ['current', 'previous', 'ytd'], default: 'current' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            organizationId: { type: 'string' },
            period: { type: 'object' },
            verifications: { type: 'object' },
            apiCalls: { type: 'object' },
            storage: { type: 'object' },
            costs: { type: 'object' },
            limits: { type: 'object' },
            utilizationPercentage: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const query = request.query as {
        startDate?: string;
        endDate?: string;
        period?: 'current' | 'previous' | 'ytd';
      };

      let startDate: Date, endDate: Date;
      const now = new Date();

      switch (query.period) {
        case 'previous':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        case 'current':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
      }

      if (query.startDate) startDate = new Date(query.startDate);
      if (query.endDate) endDate = new Date(query.endDate);

      const usageMetrics = await whiteLabelService.getUsageMetrics(
        organization.id,
        startDate,
        endDate
      );

      // Calculate utilization percentage
      const utilizationPercentage = organization.features.maxVerificationsPerMonth > 0
        ? (usageMetrics.verifications.total / organization.features.maxVerificationsPerMonth) * 100
        : 0;

      return {
        ...usageMetrics,
        limits: {
          maxVerificationsPerMonth: organization.features.maxVerificationsPerMonth,
          apiRateLimit: organization.integration.apiRateLimit
        },
        utilizationPercentage
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to get usage metrics');
      return reply.code(500).send({ error: 'Failed to get usage metrics' });
    }
  });

  // Setup custom workflow
  app.post('/white-label/workflows', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Setup custom workflow for organization',
      tags: ['White Label', 'Workflows'],
      body: CustomWorkflowSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            workflowId: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const body = CustomWorkflowSchema.parse(request.body);
      
      if (!organization.features.customWorkflows) {
        return reply.code(403).send({ error: 'Custom workflows not enabled' });
      }

      await whiteLabelService.setupCustomWorkflow(organization.id, body.workflowId, body);

      return reply.code(201).send({
        workflowId: body.workflowId,
        name: body.name,
        status: 'active'
      });
    } catch (error) {
      app.log.error({ error }, 'Failed to setup custom workflow');
      return reply.code(500).send({ error: 'Failed to setup workflow' });
    }
  });

  // Get dashboard URL
  app.get('/white-label/dashboard-url', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Get branded dashboard URL for organization',
      tags: ['White Label'],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            dashboardUrl: { type: 'string' },
            expiresAt: { type: 'string' },
            customDomain: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const query = request.query as { userId?: string };

      const dashboardUrl = await whiteLabelService.generateDashboardUrl(
        organization.id,
        query.userId
      );

      return {
        dashboardUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        customDomain: !!organization.domain
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to generate dashboard URL');
      return reply.code(500).send({ error: 'Failed to generate dashboard URL' });
    }
  });

  // Webhook test endpoint
  app.post('/white-label/webhooks/test', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Test webhook endpoints for organization',
      tags: ['White Label', 'Webhooks'],
      body: {
        type: 'object',
        required: ['eventType'],
        properties: {
          eventType: { type: 'string' },
          testData: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const body = request.body as {
        eventType: string;
        testData: any;
      };

      const testData = {
        ...body.testData,
        test: true,
        organizationId: organization.id
      };

      await whiteLabelService.processWebhook(organization.id, body.eventType, testData);

      return {
        status: 'sent',
        eventType: body.eventType,
        webhookCount: organization.customization.webhookEndpoints?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to test webhooks');
      return reply.code(500).send({ error: 'Failed to test webhooks' });
    }
  });

  // Get organization analytics (white-label specific)
  app.get('/white-label/analytics', {
    preHandler: authenticateWhiteLabel,
    schema: {
      description: 'Get organization-specific analytics with custom branding',
      tags: ['White Label', 'Analytics'],
      querystring: {
        type: 'object',
        properties: {
          timeRange: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
          includeComparison: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const organization = (request as any).organization;
      const query = request.query as {
        timeRange?: '1h' | '24h' | '7d' | '30d';
        includeComparison?: boolean;
      };

      const timeRange = query.timeRange || '24h';
      const now = new Date();
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const startDate = new Date(now.getTime() - timeRanges[timeRange]);
      const usageMetrics = await whiteLabelService.getUsageMetrics(
        organization.id,
        startDate,
        now
      );

      // Add organization branding to response
      const analytics = {
        organization: {
          id: organization.id,
          name: organization.organizationName,
          branding: organization.branding
        },
        timeRange,
        period: { start: startDate.toISOString(), end: now.toISOString() },
        metrics: usageMetrics,
        customization: {
          dashboardTheme: organization.branding.theme,
          primaryColor: organization.branding.primaryColor
        }
      };

      // Add comparison data if requested
      if (query.includeComparison) {
        const previousStartDate = new Date(startDate.getTime() - timeRanges[timeRange]);
        const previousMetrics = await whiteLabelService.getUsageMetrics(
          organization.id,
          previousStartDate,
          startDate
        );

        (analytics as any).comparison = {
          period: { start: previousStartDate.toISOString(), end: startDate.toISOString() },
          metrics: previousMetrics,
          changes: {
            verifications: {
              absolute: usageMetrics.verifications.total - previousMetrics.verifications.total,
              percentage: previousMetrics.verifications.total > 0 
                ? ((usageMetrics.verifications.total - previousMetrics.verifications.total) / previousMetrics.verifications.total) * 100
                : 0
            },
            costs: {
              absolute: usageMetrics.costs.total - previousMetrics.costs.total,
              percentage: previousMetrics.costs.total > 0 
                ? ((usageMetrics.costs.total - previousMetrics.costs.total) / previousMetrics.costs.total) * 100
                : 0
            }
          }
        };
      }

      return analytics;
    } catch (error) {
      app.log.error({ error }, 'Failed to get organization analytics');
      return reply.code(500).send({ error: 'Failed to get analytics' });
    }
  });
}