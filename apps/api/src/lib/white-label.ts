import { FastifyInstance } from 'fastify';
import crypto from 'crypto';

export interface WhiteLabelConfiguration {
  id: string;
  name: string;
  organizationName: string;
  domain: string;
  apiKey: string;
  
  // Branding
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    theme: 'light' | 'dark' | 'auto';
    customCSS?: string;
  };
  
  // Features & Permissions
  features: {
    verificationMethods: string[];
    maxVerificationsPerMonth: number;
    batchOperations: boolean;
    realTimeUpdates: boolean;
    auditTrails: boolean;
    complianceReporting: boolean;
    customWorkflows: boolean;
    whitelistedDomains: string[];
  };
  
  // Customization
  customization: {
    reportTemplates: Record<string, any>;
    workflowTemplates: Record<string, any>;
    emailTemplates: Record<string, any>;
    webhookEndpoints: string[];
    customFields: Record<string, any>;
  };
  
  // Compliance & Security
  compliance: {
    requireTwoFactorAuth: boolean;
    dataRetentionDays: number;
    allowDataExport: boolean;
    requiredCompliance: string[];
    ipWhitelist: string[];
  };
  
  // Billing & Limits
  billing: {
    plan: 'starter' | 'professional' | 'enterprise' | 'custom';
    monthlyFee: number;
    perVerificationFee: number;
    usageTracking: boolean;
    billingContact: string;
  };
  
  // Integration
  integration: {
    ssoEnabled: boolean;
    ssoProviders: string[];
    apiRateLimit: number;
    webhookSecret: string;
    customIntegrations: Record<string, any>;
  };
  
  // Status
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface WhiteLabelUsageMetrics {
  organizationId: string;
  period: { start: Date; end: Date };
  verifications: {
    total: number;
    successful: number;
    failed: number;
    byMethod: Record<string, number>;
  };
  apiCalls: {
    total: number;
    byEndpoint: Record<string, number>;
    rateLimit: { hits: number; exceeded: number };
  };
  storage: {
    evidenceFiles: number;
    totalSizeGB: number;
  };
  costs: {
    verificationFees: number;
    storageFees: number;
    additionalFees: number;
    total: number;
  };
}

export interface WhiteLabelReport {
  organizationId: string;
  reportType: string;
  generatedAt: Date;
  data: any;
  format: 'json' | 'pdf' | 'csv';
  customBranding: boolean;
}

export class WhiteLabelService {
  constructor(private app: FastifyInstance) {}

  async createWhiteLabelOrganization(config: Omit<WhiteLabelConfiguration, 'id' | 'apiKey' | 'createdAt' | 'updatedAt'>): Promise<WhiteLabelConfiguration> {
    const id = `WL-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const apiKey = this.generateApiKey();
    
    const whiteLabelConfig: WhiteLabelConfiguration = {
      ...config,
      id,
      apiKey,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database
    await this.app.prisma.whiteLabelOrganization.create({
      data: {
        organizationId: id,
        name: config.name,
        organizationName: config.organizationName,
        domain: config.domain,
        apiKey,
        branding: config.branding,
        features: config.features,
        customization: config.customization,
        compliance: config.compliance,
        billing: config.billing,
        integration: config.integration,
        status: config.status,
        expiresAt: config.expiresAt
      }
    });

    // Initialize usage tracking
    await this.initializeUsageTracking(id);

    // Setup default templates
    await this.setupDefaultTemplates(id);

    return whiteLabelConfig;
  }

  async updateWhiteLabelConfiguration(organizationId: string, updates: Partial<WhiteLabelConfiguration>): Promise<WhiteLabelConfiguration> {
    const existingConfig = await this.getWhiteLabelConfiguration(organizationId);
    if (!existingConfig) {
      throw new Error(`White-label organization not found: ${organizationId}`);
    }

    const updatedConfig = {
      ...existingConfig,
      ...updates,
      updatedAt: new Date()
    };

    await this.app.prisma.whiteLabelOrganization.update({
      where: { organizationId },
      data: {
        name: updatedConfig.name,
        organizationName: updatedConfig.organizationName,
        domain: updatedConfig.domain,
        branding: updatedConfig.branding,
        features: updatedConfig.features,
        customization: updatedConfig.customization,
        compliance: updatedConfig.compliance,
        billing: updatedConfig.billing,
        integration: updatedConfig.integration,
        status: updatedConfig.status,
        expiresAt: updatedConfig.expiresAt
      }
    });

    return updatedConfig;
  }

  async getWhiteLabelConfiguration(organizationId: string): Promise<WhiteLabelConfiguration | null> {
    const config = await this.app.prisma.whiteLabelOrganization.findUnique({
      where: { organizationId }
    });

    if (!config) return null;

    return {
      id: config.organizationId,
      name: config.name,
      organizationName: config.organizationName,
      domain: config.domain,
      apiKey: config.apiKey,
      branding: config.branding as any,
      features: config.features as any,
      customization: config.customization as any,
      compliance: config.compliance as any,
      billing: config.billing as any,
      integration: config.integration as any,
      status: config.status as any,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      expiresAt: config.expiresAt || undefined
    };
  }

  async validateApiKey(apiKey: string): Promise<WhiteLabelConfiguration | null> {
    const config = await this.app.prisma.whiteLabelOrganization.findUnique({
      where: { apiKey }
    });

    if (!config || config.status !== 'active') return null;

    // Check expiration
    if (config.expiresAt && config.expiresAt < new Date()) {
      await this.updateOrganizationStatus(config.organizationId, 'inactive');
      return null;
    }

    return this.mapDatabaseConfigToWhiteLabel(config);
  }

  async createCustomVerificationMethod(organizationId: string, method: {
    methodId: string;
    name: string;
    description: string;
    criteria: any;
    workflow: any;
    template: any;
  }): Promise<void> {
    const config = await this.getWhiteLabelConfiguration(organizationId);
    if (!config) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    // Validate method doesn't already exist
    const existingMethod = await this.app.prisma.verificationMethod.findUnique({
      where: { methodId: method.methodId }
    });

    if (existingMethod) {
      throw new Error(`Verification method already exists: ${method.methodId}`);
    }

    // Create custom verification method
    await this.app.prisma.verificationMethod.create({
      data: {
        methodId: method.methodId,
        name: method.name,
        description: method.description,
        methodologyType: 'CUSTOM',
        criteria: method.criteria,
        active: true,
        organizationId,
        customWorkflow: method.workflow,
        reportTemplate: method.template
      }
    });

    // Update organization's available methods
    const updatedFeatures = {
      ...config.features,
      verificationMethods: [...config.features.verificationMethods, method.methodId]
    };

    await this.updateWhiteLabelConfiguration(organizationId, {
      features: updatedFeatures
    });
  }

  async generateCustomReport(organizationId: string, reportType: string, parameters: any): Promise<WhiteLabelReport> {
    const config = await this.getWhiteLabelConfiguration(organizationId);
    if (!config) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    // Get report template
    const template = config.customization.reportTemplates[reportType];
    if (!template) {
      throw new Error(`Report template not found: ${reportType}`);
    }

    // Generate report data based on template
    const reportData = await this.generateReportData(organizationId, reportType, parameters, template);

    // Apply custom branding
    const brandedReport = this.applyCustomBranding(reportData, config.branding);

    // Store report
    const report: WhiteLabelReport = {
      organizationId,
      reportType,
      generatedAt: new Date(),
      data: brandedReport,
      format: parameters.format || 'json',
      customBranding: true
    };

    await this.storeReport(report);

    return report;
  }

  async getUsageMetrics(organizationId: string, startDate: Date, endDate: Date): Promise<WhiteLabelUsageMetrics> {
    // Get verification usage
    const verifications = await this.app.prisma.verificationResult.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        organizationId
      },
      include: { evidenceFiles: true }
    });

    // Get API usage
    const apiLogs = await this.app.prisma.apiUsageLog.findMany({
      where: {
        organizationId,
        timestamp: { gte: startDate, lte: endDate }
      }
    });

    // Calculate metrics
    const verificationMetrics = {
      total: verifications.length,
      successful: verifications.filter(v => v.verified === true).length,
      failed: verifications.filter(v => v.verified === false).length,
      byMethod: this.groupByMethod(verifications)
    };

    const apiMetrics = {
      total: apiLogs.length,
      byEndpoint: this.groupByEndpoint(apiLogs),
      rateLimit: {
        hits: apiLogs.filter(log => (log.metadata as any)?.rateLimitHit).length,
        exceeded: apiLogs.filter(log => (log.metadata as any)?.rateLimitExceeded).length
      }
    };

    const evidenceFiles = verifications.flatMap(v => v.evidenceFiles || []);
    const storageMetrics = {
      evidenceFiles: evidenceFiles.length,
      totalSizeGB: evidenceFiles.reduce((sum, file) => sum + Number(file.fileSize), 0) / (1024 * 1024 * 1024)
    };

    // Calculate costs
    const config = await this.getWhiteLabelConfiguration(organizationId);
    const costs = {
      verificationFees: verificationMetrics.total * (config?.billing.perVerificationFee || 0),
      storageFees: storageMetrics.totalSizeGB * 0.1, // $0.10 per GB
      additionalFees: 0,
      total: 0
    };
    costs.total = costs.verificationFees + costs.storageFees + costs.additionalFees;

    return {
      organizationId,
      period: { start: startDate, end: endDate },
      verifications: verificationMetrics,
      apiCalls: apiMetrics,
      storage: storageMetrics,
      costs
    };
  }

  async setupCustomWorkflow(organizationId: string, workflowId: string, workflow: {
    name: string;
    description: string;
    triggers: any[];
    actions: any[];
    conditions: any[];
    notifications: any[];
  }): Promise<void> {
    const config = await this.getWhiteLabelConfiguration(organizationId);
    if (!config) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    if (!config.features.customWorkflows) {
      throw new Error('Custom workflows not enabled for this organization');
    }

    // Store workflow
    await this.app.prisma.customWorkflow.create({
      data: {
        workflowId,
        organizationId,
        name: workflow.name,
        description: workflow.description,
        triggers: workflow.triggers,
        actions: workflow.actions,
        conditions: workflow.conditions,
        notifications: workflow.notifications,
        active: true
      }
    });

    // Update organization configuration
    const updatedCustomization = {
      ...config.customization,
      workflowTemplates: {
        ...config.customization.workflowTemplates,
        [workflowId]: workflow
      }
    };

    await this.updateWhiteLabelConfiguration(organizationId, {
      customization: updatedCustomization
    });
  }

  async processWebhook(organizationId: string, eventType: string, eventData: any): Promise<void> {
    const config = await this.getWhiteLabelConfiguration(organizationId);
    if (!config) return;

    const webhookEndpoints = config.customization.webhookEndpoints;
    if (!webhookEndpoints || webhookEndpoints.length === 0) return;

    const payload = {
      organizationId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      signature: this.generateWebhookSignature(eventData, config.integration.webhookSecret)
    };

    // Send to all configured webhook endpoints
    for (const endpoint of webhookEndpoints) {
      try {
        await this.sendWebhook(endpoint, payload);
      } catch (error) {
        this.app.log.error({ error, endpoint, organizationId }, 'Failed to send webhook');
      }
    }
  }

  async generateDashboardUrl(organizationId: string, userId?: string): Promise<string> {
    const config = await this.getWhiteLabelConfiguration(organizationId);
    if (!config) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    // Generate secure dashboard token
    const dashboardToken = this.generateDashboardToken(organizationId, userId);
    
    // Return custom domain URL or default with organization branding
    const baseUrl = config.domain ? `https://${config.domain}` : `https://dashboard.orenna.com/org/${organizationId}`;
    return `${baseUrl}/dashboard?token=${dashboardToken}`;
  }

  private generateApiKey(): string {
    return `wl_${crypto.randomBytes(32).toString('hex')}`;
  }

  private async initializeUsageTracking(organizationId: string): Promise<void> {
    await this.app.prisma.organizationUsage.create({
      data: {
        organizationId,
        period: new Date(),
        verificationCount: 0,
        apiCallCount: 0,
        storageUsed: 0,
        costs: 0
      }
    });
  }

  private async setupDefaultTemplates(organizationId: string): Promise<void> {
    const defaultTemplates = {
      reportTemplates: {
        'verification-summary': {
          title: 'Verification Summary Report',
          sections: ['overview', 'method-breakdown', 'quality-metrics'],
          branding: true
        },
        'compliance': {
          title: 'Compliance Report',
          sections: ['executive-summary', 'verification-details', 'audit-trail'],
          branding: true
        }
      },
      workflowTemplates: {
        'auto-approve': {
          name: 'Auto-Approve High Confidence',
          triggers: [{ type: 'verification-submitted' }],
          conditions: [{ field: 'confidence', operator: '>', value: 0.95 }],
          actions: [{ type: 'approve-verification' }]
        }
      },
      emailTemplates: {
        'verification-complete': {
          subject: 'Verification Complete - {{liftTokenId}}',
          body: 'Your verification for lift token {{liftTokenId}} has been completed with {{confidence}}% confidence.',
          branding: true
        }
      }
    };

    await this.app.prisma.whiteLabelOrganization.update({
      where: { organizationId },
      data: {
        customization: {
          ...defaultTemplates,
          webhookEndpoints: [],
          customFields: {}
        }
      }
    });
  }

  private async updateOrganizationStatus(organizationId: string, status: string): Promise<void> {
    await this.app.prisma.whiteLabelOrganization.update({
      where: { organizationId },
      data: { status }
    });
  }

  private mapDatabaseConfigToWhiteLabel(config: any): WhiteLabelConfiguration {
    return {
      id: config.organizationId,
      name: config.name,
      organizationName: config.organizationName,
      domain: config.domain,
      apiKey: config.apiKey,
      branding: config.branding,
      features: config.features,
      customization: config.customization,
      compliance: config.compliance,
      billing: config.billing,
      integration: config.integration,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      expiresAt: config.expiresAt
    };
  }

  private async generateReportData(organizationId: string, reportType: string, parameters: any, template: any): Promise<any> {
    // This would generate report data based on the template and parameters
    // Implementation would vary based on report type
    return {
      organizationName: (await this.getWhiteLabelConfiguration(organizationId))?.organizationName,
      reportType,
      generatedAt: new Date().toISOString(),
      parameters,
      data: {} // Report-specific data would be generated here
    };
  }

  private applyCustomBranding(reportData: any, branding: any): any {
    return {
      ...reportData,
      branding: {
        logo: branding.logo,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        theme: branding.theme
      }
    };
  }

  private async storeReport(report: WhiteLabelReport): Promise<void> {
    await this.app.prisma.organizationReport.create({
      data: {
        organizationId: report.organizationId,
        reportType: report.reportType,
        reportData: report.data,
        format: report.format,
        generatedAt: report.generatedAt
      }
    });
  }

  private groupByMethod(verifications: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    verifications.forEach(v => {
      groups[v.methodId] = (groups[v.methodId] || 0) + 1;
    });
    return groups;
  }

  private groupByEndpoint(apiLogs: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    apiLogs.forEach(log => {
      const endpoint = (log.metadata as any)?.endpoint || 'unknown';
      groups[endpoint] = (groups[endpoint] || 0) + 1;
    });
    return groups;
  }

  private generateWebhookSignature(data: any, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private async sendWebhook(endpoint: string, payload: any): Promise<void> {
    // This would send HTTP POST request to webhook endpoint
    // Simulated for now
    this.app.log.info({ endpoint, payload }, 'Webhook sent');
  }

  private generateDashboardToken(organizationId: string, userId?: string): string {
    const tokenData = {
      organizationId,
      userId,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(tokenData))
      .digest('hex');
  }
}