import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { requireAuth } from '../lib/authorization.js';
// Uses fastify.log for logging
import {
  generateFinancialIntegrityReport,
  checkFinancialInvariants,
  calculateFinancialSummary,
  getFinancialHealthScore,
} from '../lib/financial-invariants';

// Response schemas
const FinancialSummarySchema = Type.Object({
  projectId: Type.Number(),
  depositsTotal: Type.String(),
  contractsTotal: Type.String(),
  invoicesTotal: Type.String(),
  disbursementsTotal: Type.String(),
  liftTokensIssued: Type.String(),
  liftTokensRetired: Type.String(),
  balances: Type.Object({
    available: Type.String(),
    committed: Type.String(),
    encumbered: Type.String(),
    disbursed: Type.String(),
  }),
});

const InvariantCheckSchema = Type.Object({
  name: Type.String(),
  passed: Type.Boolean(),
  expected: Type.String(),
  actual: Type.String(),
  tolerance: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
});

const FinancialIntegrityReportSchema = Type.Object({
  projectId: Type.Number(),
  generatedAt: Type.String(),
  healthScore: Type.Number(),
  summary: FinancialSummarySchema,
  invariantChecks: Type.Object({
    total: Type.Number(),
    passed: Type.Number(),
    failed: Type.Number(),
    details: Type.Array(InvariantCheckSchema),
  }),
  recommendations: Type.Array(Type.String()),
});

export async function financeIntegrityRoutes(fastify: FastifyInstance) {
  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * GET /api/finance/integrity/:projectId/summary
   * Get financial summary for a project
   */
  fastify.get('/integrity/:projectId/summary', {
    schema: {
      tags: ['Finance Integrity'],
      summary: 'Get financial summary for a project',
      params: Type.Object({
        projectId: Type.Number(),
      }),
      response: {
        200: Type.Object({
          projectId: Type.Number(),
          depositsTotal: Type.String(),
          contractsTotal: Type.String(),
          invoicesTotal: Type.String(),
          disbursementsTotal: Type.String(),
          liftTokensIssued: Type.String(),
          liftTokensRetired: Type.String(),
          balances: Type.Object({
            available: Type.String(),
            committed: Type.String(),
            encumbered: Type.String(),
            disbursed: Type.String(),
          }),
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { projectId: number } }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params;
      const userId = request.user.id;

      fastify.log.info('Getting financial summary', { projectId, requestedBy: userId });

      const summary = await calculateFinancialSummary(projectId);

      const response = {
        projectId: summary.projectId,
        depositsTotal: `$${(Number(summary.depositsTotal.cents) / 100).toFixed(2)}`,
        contractsTotal: `$${(Number(summary.contractsTotal.cents) / 100).toFixed(2)}`,
        invoicesTotal: `$${(Number(summary.invoicesTotal.cents) / 100).toFixed(2)}`,
        disbursementsTotal: `$${(Number(summary.disbursementsTotal.cents) / 100).toFixed(2)}`,
        liftTokensIssued: summary.liftTokensIssued,
        liftTokensRetired: summary.liftTokensRetired,
        balances: {
          available: `$${(Number(summary.balanceAvailable.cents) / 100).toFixed(2)}`,
          committed: `$${(Number(summary.balanceCommitted.cents) / 100).toFixed(2)}`,
          encumbered: `$${(Number(summary.balanceEncumbered.cents) / 100).toFixed(2)}`,
          disbursed: `$${(Number(summary.balanceDisbursed.cents) / 100).toFixed(2)}`,
        },
      };

      return response;
    } catch (error) {
      fastify.log.error('Failed to get financial summary', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/finance/integrity/:projectId/health
   * Get financial health score for a project
   */
  fastify.get('/integrity/:projectId/health', {
    schema: {
      tags: ['Finance Integrity'],
      summary: 'Get financial health score for a project',
      params: Type.Object({
        projectId: Type.Number(),
      }),
      response: {
        200: Type.Object({
          projectId: Type.Number(),
          healthScore: Type.Number(),
          status: Type.String(),
          generatedAt: Type.String(),
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { projectId: number } }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params;
      const userId = request.user.id;

      fastify.log.info('Getting financial health score', { projectId, requestedBy: userId });

      const healthScore = await getFinancialHealthScore(projectId);

      let status = 'POOR';
      if (healthScore >= 90) status = 'EXCELLENT';
      else if (healthScore >= 75) status = 'GOOD';
      else if (healthScore >= 60) status = 'FAIR';

      return {
        projectId,
        healthScore,
        status,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      fastify.log.error('Failed to get financial health score', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/finance/integrity/:projectId/invariants
   * Check financial invariants for a project
   */
  fastify.get('/integrity/:projectId/invariants', {
    schema: {
      tags: ['Finance Integrity'],
      summary: 'Check financial invariants for a project',
      params: Type.Object({
        projectId: Type.Number(),
      }),
      response: {
        200: Type.Object({
          projectId: Type.Number(),
          totalChecks: Type.Number(),
          passedChecks: Type.Number(),
          failedChecks: Type.Number(),
          checks: Type.Array(InvariantCheckSchema),
          generatedAt: Type.String(),
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Params: { projectId: number } }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params;
      const userId = request.user.id;

      fastify.log.info('Checking financial invariants', { projectId, requestedBy: userId });

      const checks = await checkFinancialInvariants(projectId);
      const passedChecks = checks.filter(c => c.passed).length;
      const failedChecks = checks.length - passedChecks;

      return {
        projectId,
        totalChecks: checks.length,
        passedChecks,
        failedChecks,
        checks,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      fastify.log.error('Failed to check financial invariants', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/finance/integrity/:projectId/report
   * Generate comprehensive financial integrity report
   */
  fastify.get('/integrity/:projectId/report', {
    schema: {
      tags: ['Finance Integrity'],
      summary: 'Generate comprehensive financial integrity report',
      params: Type.Object({
        projectId: Type.Number(),
      }),
      querystring: Type.Object({
        format: Type.Optional(Type.Union([Type.Literal('json'), Type.Literal('html')])),
      }),
      response: {
        200: FinancialIntegrityReportSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { projectId: number }; 
    Querystring: { format?: 'json' | 'html' } 
  }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params;
      const { format = 'json' } = request.query;
      const userId = request.user.id;

      fastify.log.info('Generating financial integrity report', { 
        projectId, 
        format, 
        requestedBy: userId 
      });

      const report = await generateFinancialIntegrityReport(projectId);

      if (format === 'html') {
        const html = generateHTMLReport(report);
        reply.type('text/html');
        return html;
      }

      return report;
    } catch (error) {
      fastify.log.error('Failed to generate financial integrity report', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/finance/integrity/:projectId/check
   * Trigger manual financial integrity check
   */
  fastify.post('/integrity/:projectId/check', {
    schema: {
      tags: ['Finance Integrity'],
      summary: 'Trigger manual financial integrity check',
      params: Type.Object({
        projectId: Type.Number(),
      }),
      body: Type.Object({
        checkType: Type.Optional(Type.Union([
          Type.Literal('all'),
          Type.Literal('balances'),
          Type.Literal('contracts'),
          Type.Literal('invoices'),
          Type.Literal('lift_tokens'),
        ])),
        autoFix: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          projectId: Type.Number(),
          checkType: Type.String(),
          issuesFound: Type.Number(),
          issuesFixed: Type.Number(),
          report: FinancialIntegrityReportSchema,
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { projectId: number }; 
    Body: { checkType?: string; autoFix?: boolean } 
  }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params;
      const { checkType = 'all', autoFix = false } = request.body;
      const userId = request.user.id;

      fastify.log.info('Triggering manual financial integrity check', { 
        projectId, 
        checkType, 
        autoFix,
        requestedBy: userId 
      });

      // Generate report
      const report = await generateFinancialIntegrityReport(projectId);
      
      // Count issues
      const issuesFound = report.invariantChecks.failed;
      let issuesFixed = 0;

      // TODO: Implement auto-fix logic based on checkType
      if (autoFix && issuesFound > 0) {
        fastify.log.info('Auto-fix requested but not implemented yet', { projectId });
        // Placeholder for auto-fix logic
      }

      return {
        projectId,
        checkType,
        issuesFound,
        issuesFixed,
        report,
      };
    } catch (error) {
      fastify.log.error('Failed to run financial integrity check', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });
}

// Helper function to generate HTML report
function generateHTMLReport(report: any): string {
  const healthColor = report.healthScore >= 90 ? '#059669' : 
                     report.healthScore >= 75 ? '#2563eb' : 
                     report.healthScore >= 60 ? '#d97706' : '#dc2626';

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Financial Integrity Report - Project ${report.projectId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .score { font-size: 3em; font-weight: bold; color: ${healthColor}; }
        .section { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .pass { color: #059669; font-weight: bold; }
        .fail { color: #dc2626; font-weight: bold; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Financial Integrity Report</h1>
        <p><strong>Project ID:</strong> ${report.projectId}</p>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleDateString()}</p>
        <div class="score">${report.healthScore}%</div>
        <p>Financial Health Score</p>
    </div>

    <div class="section">
        <h2>Financial Summary</h2>
        <div class="metric">
            <strong>Deposits:</strong> ${report.summary.depositsTotal}
        </div>
        <div class="metric">
            <strong>Contracts:</strong> ${report.summary.contractsTotal}
        </div>
        <div class="metric">
            <strong>Invoices:</strong> ${report.summary.invoicesTotal}
        </div>
        <div class="metric">
            <strong>Disbursements:</strong> ${report.summary.disbursementsTotal}
        </div>
        <div class="metric">
            <strong>Lift Tokens Issued:</strong> ${report.summary.liftTokensIssued}
        </div>
        <div class="metric">
            <strong>Lift Tokens Retired:</strong> ${report.summary.liftTokensRetired}
        </div>
    </div>

    <div class="section">
        <h2>Bucket Balances</h2>
        <div class="metric">
            <strong>Available:</strong> ${report.summary.balances.available}
        </div>
        <div class="metric">
            <strong>Committed:</strong> ${report.summary.balances.committed}
        </div>
        <div class="metric">
            <strong>Encumbered:</strong> ${report.summary.balances.encumbered}
        </div>
        <div class="metric">
            <strong>Disbursed:</strong> ${report.summary.balances.disbursed}
        </div>
    </div>

    <div class="section">
        <h2>Invariant Checks</h2>
        <p><strong>Total:</strong> ${report.invariantChecks.total} | 
           <strong>Passed:</strong> ${report.invariantChecks.passed} | 
           <strong>Failed:</strong> ${report.invariantChecks.failed}</p>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Check</th>
                    <th>Status</th>
                    <th>Expected</th>
                    <th>Actual</th>
                    <th>Message</th>
                </tr>
            </thead>
            <tbody>
                ${report.invariantChecks.details.map(check => `
                <tr>
                    <td>${check.name}</td>
                    <td class="${check.passed ? 'pass' : 'fail'}">
                        ${check.passed ? '✓ PASS' : '✗ FAIL'}
                    </td>
                    <td>${check.expected}</td>
                    <td>${check.actual}</td>
                    <td>${check.message || ''}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
  `;
}