import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { prisma } from '@orenna/db';
import { requireAuth } from '../lib/authorization.js';
// Uses fastify.log for logging
import { fromDollars, formatMoney, memoTag, generateReceiptId } from '../adapters/finance';

// Request/Response schemas
const DepositRequestSchema = Type.Object({
  projectId: Type.Number(),
  amountCents: Type.Number({ minimum: 1 }),
  currency: Type.Union([Type.Literal('USD'), Type.Literal('USDC')]),
  sourceRef: Type.Optional(Type.String({ maxLength: 255 })),
  txHash: Type.Optional(Type.String({ pattern: '^0x[a-fA-F0-9]{64}$' })),
  memo: Type.Optional(Type.String({ maxLength: 500 })),
});

const VerificationAttestationSchema = Type.Object({
  attestorId: Type.String(),
  note: Type.Optional(Type.String({ maxLength: 1000 })),
  evidenceUrl: Type.Optional(Type.String({ format: 'uri' })),
  passed: Type.Boolean(),
});

const MintLiftRequestSchema = Type.Object({
  quantity: Type.String({ pattern: '^\\d+$' }),
  unitType: Type.String({ default: 'LU' }),
  financeRefs: Type.Object({
    invoiceId: Type.Number(),
    memo: Type.Optional(Type.String()),
    contractId: Type.Optional(Type.Number()),
  }),
});

const RetireLiftRequestSchema = Type.Object({
  beneficiaryId: Type.String(),
  quantity: Type.String({ pattern: '^\\d+$' }),
  reason: Type.String(),
  financeRefs: Type.Optional(Type.Object({
    invoiceId: Type.Optional(Type.Number()),
    contractId: Type.Optional(Type.Number()),
    memo: Type.Optional(Type.String()),
  })),
});

// Response schemas
const DepositResponseSchema = Type.Object({
  id: Type.Number(),
  projectId: Type.Number(),
  amountCents: Type.Number(),
  currency: Type.String(),
  sourceRef: Type.Union([Type.String(), Type.Null()]),
  txHash: Type.Union([Type.String(), Type.Null()]),
  memo: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  createdAt: Type.String(),
});

const AttestationResponseSchema = Type.Object({
  id: Type.Number(),
  gateId: Type.Number(),
  attestorId: Type.String(),
  passed: Type.Boolean(),
  note: Type.Union([Type.String(), Type.Null()]),
  evidenceUrl: Type.Union([Type.String(), Type.Null()]),
  attestedAt: Type.String(),
  retentionReleaseInvoiceId: Type.Union([Type.Number(), Type.Null()]),
});

const MintResponseSchema = Type.Object({
  id: Type.Number(),
  liftTokenId: Type.Number(),
  quantity: Type.String(),
  unitType: Type.String(),
  memo: Type.String(),
  status: Type.String(),
  txHash: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
});

const RetireResponseSchema = Type.Object({
  id: Type.Number(),
  liftTokenId: Type.Number(),
  beneficiaryId: Type.String(),
  quantity: Type.String(),
  reason: Type.String(),
  memo: Type.Union([Type.String(), Type.Null()]),
  receiptId: Type.String(),
  status: Type.String(),
  createdAt: Type.String(),
});

export async function financeLoopRoutes(fastify: FastifyInstance) {
  // Register authentication requirement for all routes
  await fastify.register(requireAuth);

  /**
   * 1. Funds In — credit Lift Forward
   * POST /api/finance/deposits
   */
  fastify.post('/deposits', {
    schema: {
      tags: ['Finance Loop'],
      summary: 'Credit funds to Lift Forward bucket',
      body: DepositRequestSchema,
      response: {
        201: DepositResponseSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ Body: typeof DepositRequestSchema.static }>, reply: FastifyReply) => {
    try {
      const { projectId, amountCents, currency, sourceRef, txHash, memo } = request.body;
      const userId = request.user.id;

      fastify.log.info('Creating deposit for Lift Forward', { 
        projectId,
        amountCents,
        currency,
        sourceRef,
        txHash,
        createdBy: userId,
      });

      // Verify project exists
      const project = await db.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Create or get Lift Forward funding bucket
      let liftForwardBucket = await db.fundingBucket.findFirst({
        where: {
          projectId,
          type: 'LIFT_FORWARD',
        },
      });

      if (!liftForwardBucket) {
        liftForwardBucket = await db.fundingBucket.create({
          data: {
            projectId,
            type: 'LIFT_FORWARD',
            name: 'Lift Forward',
            description: 'Funds allocated for lift token generation',
            availableCents: BigInt(0),
            currency: currency,
            active: true,
            createdBy: userId,
          },
        });
      }

      // Create deposit record
      const deposit = await db.deposit.create({
        data: {
          projectId,
          fundingBucketId: liftForwardBucket.id,
          amountCents: BigInt(amountCents),
          currency,
          sourceRef,
          txHash,
          memo,
          status: 'COMPLETED',
          depositedBy: userId,
          depositedAt: new Date(),
        },
      });

      // Create CREDIT ledger entry
      await db.ledgerEntry.create({
        data: {
          fundingBucketId: liftForwardBucket.id,
          type: 'CREDIT',
          amountCents: BigInt(amountCents),
          currency,
          description: `Deposit: ${memo || sourceRef || 'Lift Forward funding'}`,
          referenceType: 'DEPOSIT',
          referenceId: deposit.id.toString(),
          txHash,
          createdBy: userId,
        },
      });

      // Update bucket balances
      await db.fundingBucket.update({
        where: { id: liftForwardBucket.id },
        data: {
          availableCents: {
            increment: BigInt(amountCents),
          },
        },
      });

      reply.code(201).send({
        id: deposit.id,
        projectId: deposit.projectId,
        amountCents: Number(deposit.amountCents),
        currency: deposit.currency,
        sourceRef: deposit.sourceRef,
        txHash: deposit.txHash,
        memo: deposit.memo,
        status: deposit.status,
        createdAt: deposit.createdAt.toISOString(),
      });
    } catch (error) {
      fastify.log.error('Failed to create deposit', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * 2. Verification Attestation → retention release
   * POST /api/verification/:gateId/attest
   */
  fastify.post('/verification/:gateId/attest', {
    schema: {
      tags: ['Finance Loop'],
      summary: 'Attest verification gate and trigger retention release',
      params: Type.Object({
        gateId: Type.Number(),
      }),
      body: VerificationAttestationSchema,
      response: {
        201: AttestationResponseSchema,
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
  }, async (request: FastifyRequest<{ 
    Params: { gateId: number }; 
    Body: typeof VerificationAttestationSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { gateId } = request.params;
      const { attestorId, note, evidenceUrl, passed } = request.body;
      const userId = request.user.id;

      fastify.log.info('Creating verification attestation', { 
        gateId,
        attestorId,
        passed,
        attestedBy: userId,
      });

      // Find verification gate
      const verificationGate = await db.verificationGate.findUnique({
        where: { id: gateId },
        include: {
          project: true,
        },
      });

      if (!verificationGate) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Verification gate ${gateId} not found`,
        });
      }

      // Create attestation record
      const attestation = await db.verificationAttestation.create({
        data: {
          verificationGateId: gateId,
          attestorId,
          passed,
          note,
          evidenceUrl,
          attestedBy: userId,
          attestedAt: new Date(),
        },
      });

      let retentionReleaseInvoiceId = null;

      // If verification passed, create retention release invoice
      if (passed) {
        // Find any invoices with retention for this project
        const invoicesWithRetention = await db.invoice.findMany({
          where: {
            projectId: verificationGate.projectId,
            retentionAmountCents: { gt: BigInt(0) },
            status: 'PAID',
          },
          include: {
            vendor: true,
          },
        });

        if (invoicesWithRetention.length > 0) {
          const totalRetentionRelease = invoicesWithRetention.reduce(
            (sum, inv) => sum + inv.retentionAmountCents,
            BigInt(0)
          );

          // Create retention release invoice
          const retentionInvoice = await db.invoice.create({
            data: {
              invoiceNumber: `RET-${gateId}-${Date.now()}`,
              vendorId: invoicesWithRetention[0].vendorId, // Use first vendor for simplicity
              projectId: verificationGate.projectId,
              contractId: invoicesWithRetention[0].contractId,
              description: `Retention release for verification gate ${gateId}`,
              grossAmountCents: totalRetentionRelease,
              netPayableCents: totalRetentionRelease,
              currency: 'USD',
              status: 'APPROVED', // Auto-approve retention releases
              wbsCode: verificationGate.phase || 'RETENTION',
              retentionPercent: 0, // No retention on retention release
              submittedAt: new Date(),
              approvedAt: new Date(),
              approvedBy: userId,
            },
          });

          retentionReleaseInvoiceId = retentionInvoice.id;

          fastify.log.info('Created retention release invoice', {
            invoiceId: retentionInvoice.id,
            amount: Number(totalRetentionRelease),
            verificationGateId: gateId,
          });
        }

        // Update verification gate status
        await db.verificationGate.update({
          where: { id: gateId },
          data: {
            status: 'PASSED',
            passedAt: new Date(),
          },
        });
      } else {
        // Update verification gate status to failed
        await db.verificationGate.update({
          where: { id: gateId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
          },
        });
      }

      reply.code(201).send({
        id: attestation.id,
        gateId,
        attestorId: attestation.attestorId,
        passed: attestation.passed,
        note: attestation.note,
        evidenceUrl: attestation.evidenceUrl,
        attestedAt: attestation.attestedAt.toISOString(),
        retentionReleaseInvoiceId,
      });
    } catch (error) {
      fastify.log.error('Failed to create verification attestation', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * 3. Mint Lift Units (with finance refs)
   * POST /api/lift/:projectId/mint
   */
  fastify.post('/lift/:projectId/mint', {
    schema: {
      tags: ['Finance Loop'],
      summary: 'Mint lift units with finance references',
      params: Type.Object({
        projectId: Type.Number(),
      }),
      body: MintLiftRequestSchema,
      response: {
        201: MintResponseSchema,
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
  }, async (request: FastifyRequest<{ 
    Params: { projectId: number }; 
    Body: typeof MintLiftRequestSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params;
      const { quantity, unitType, financeRefs } = request.body;
      const userId = request.user.id;

      fastify.log.info('Minting lift units with finance refs', { 
        projectId,
        quantity,
        unitType,
        financeRefs,
        mintedBy: userId,
      });

      // Verify project exists
      const project = await db.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Project ${projectId} not found`,
        });
      }

      // Verify invoice exists if provided
      if (financeRefs.invoiceId) {
        const invoice = await db.invoice.findUnique({
          where: { id: financeRefs.invoiceId },
        });

        if (!invoice) {
          throw new Error(`Invoice ${financeRefs.invoiceId} not found`);
        }
      }

      // Generate memo tag
      const memo = financeRefs.memo || memoTag(
        projectId,
        financeRefs.invoiceId,
        financeRefs.contractId?.toString()
      );

      // Create lift token
      const liftToken = await db.liftToken.create({
        data: {
          projectId,
          quantity: BigInt(quantity),
          unit: unitType,
          status: 'ISSUED',
          meta: {
            financeRefs,
            memo,
            mintedBy: userId,
          },
          issuedAt: new Date(),
        },
      });

      // Create lift token event
      const event = await db.liftTokenEvent.create({
        data: {
          liftTokenId: liftToken.id,
          type: 'ISSUED',
          payload: {
            quantity,
            unitType,
            financeRefs,
            memo,
            issuedBy: userId,
          },
          eventAt: new Date(),
        },
      });

      // If invoice provided, create finance link
      if (financeRefs.invoiceId) {
        await db.financeLink.create({
          data: {
            sourceType: 'INVOICE',
            sourceId: financeRefs.invoiceId.toString(),
            targetType: 'LIFT_TOKEN',
            targetId: liftToken.id.toString(),
            linkType: 'FUNDING',
            memo,
            createdBy: userId,
          },
        });
      }

      reply.code(201).send({
        id: event.id,
        liftTokenId: liftToken.id,
        quantity,
        unitType,
        memo,
        status: liftToken.status,
        txHash: null, // Would be populated if blockchain minting succeeded
        createdAt: event.createdAt.toISOString(),
      });
    } catch (error) {
      fastify.log.error('Failed to mint lift units', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * 4. Retire Lift Units + generate receipt
   * POST /api/lift/:liftId/retire
   */
  fastify.post('/lift/:liftId/retire', {
    schema: {
      tags: ['Finance Loop'],
      summary: 'Retire lift units and generate receipt',
      params: Type.Object({
        liftId: Type.Number(),
      }),
      body: RetireLiftRequestSchema,
      response: {
        201: RetireResponseSchema,
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
  }, async (request: FastifyRequest<{ 
    Params: { liftId: number }; 
    Body: typeof RetireLiftRequestSchema.static 
  }>, reply: FastifyReply) => {
    try {
      const { liftId } = request.params;
      const { beneficiaryId, quantity, reason, financeRefs } = request.body;
      const userId = request.user.id;

      fastify.log.info('Retiring lift units', { 
        liftId,
        beneficiaryId,
        quantity,
        reason,
        retiredBy: userId,
      });

      // Verify lift token exists and can be retired
      const liftToken = await db.liftToken.findUnique({
        where: { id: liftId },
        include: {
          project: true,
        },
      });

      if (!liftToken) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Lift token ${liftId} not found`,
        });
      }

      if (liftToken.status !== 'ISSUED') {
        throw new Error(`Cannot retire lift token with status: ${liftToken.status}`);
      }

      // Generate receipt ID
      const receiptId = generateReceiptId(liftToken.projectId!, beneficiaryId);

      // Create retirement event
      const retirementEvent = await db.liftTokenEvent.create({
        data: {
          liftTokenId: liftId,
          type: 'RETIRED',
          payload: {
            beneficiaryId,
            quantity,
            reason,
            financeRefs,
            retiredBy: userId,
            receiptId,
          },
          eventAt: new Date(),
        },
      });

      // Update lift token status
      await db.liftToken.update({
        where: { id: liftId },
        data: {
          status: 'RETIRED',
          retiredAt: new Date(),
        },
      });

      // Create receipt record
      const receipt = await db.receipt.create({
        data: {
          receiptId,
          liftTokenId: liftId,
          beneficiaryId,
          projectId: liftToken.projectId!,
          quantity: BigInt(quantity),
          reason,
          memo: financeRefs?.memo,
          status: 'GENERATED',
          generatedBy: userId,
          generatedAt: new Date(),
          metadata: {
            financeRefs,
            retirementEventId: retirementEvent.id,
          },
        },
      });

      reply.code(201).send({
        id: retirementEvent.id,
        liftTokenId: liftId,
        beneficiaryId,
        quantity,
        reason,
        memo: financeRefs?.memo || null,
        receiptId,
        status: 'RETIRED',
        createdAt: retirementEvent.createdAt.toISOString(),
      });
    } catch (error) {
      fastify.log.error('Failed to retire lift units', { error: error.message });
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * 5. Receipt endpoint
   * GET /api/receipts/:id
   */
  fastify.get('/receipts/:id', {
    schema: {
      tags: ['Finance Loop'],
      summary: 'Get receipt with full finance traceability',
      params: Type.Object({
        id: Type.String(),
      }),
      querystring: Type.Object({
        format: Type.Optional(Type.Union([Type.Literal('json'), Type.Literal('html'), Type.Literal('pdf')])),
      }),
      response: {
        200: Type.Object({
          receiptId: Type.String(),
          status: Type.String(),
          beneficiaryId: Type.String(),
          project: Type.Object({
            id: Type.Number(),
            name: Type.String(),
            slug: Type.String(),
          }),
          liftToken: Type.Object({
            id: Type.Number(),
            quantity: Type.String(),
            unit: Type.String(),
            issuedAt: Type.String(),
            retiredAt: Type.String(),
          }),
          financeTraceability: Type.Object({
            deposits: Type.Array(Type.Object({
              id: Type.Number(),
              amountCents: Type.Number(),
              currency: Type.String(),
              sourceRef: Type.Union([Type.String(), Type.Null()]),
              txHash: Type.Union([Type.String(), Type.Null()]),
              depositedAt: Type.String(),
            })),
            disbursements: Type.Array(Type.Object({
              id: Type.Number(),
              invoiceId: Type.Number(),
              amountCents: Type.Number(),
              method: Type.String(),
              txHash: Type.Union([Type.String(), Type.Null()]),
              processedAt: Type.Union([Type.String(), Type.Null()]),
            })),
            verifications: Type.Array(Type.Object({
              id: Type.Number(),
              gateId: Type.Number(),
              phase: Type.String(),
              passed: Type.Boolean(),
              attestedAt: Type.String(),
            })),
          }),
          generatedAt: Type.String(),
        }),
        404: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{ 
    Params: { id: string }; 
    Querystring: { format?: 'json' | 'html' | 'pdf' } 
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { format = 'json' } = request.query;

      fastify.log.info('Fetching receipt', { receiptId: id, format });

      // Find receipt with all related data
      const receipt = await db.receipt.findUnique({
        where: { receiptId: id },
        include: {
          project: {
            select: { id: true, name: true, slug: true },
          },
          liftToken: {
            include: {
              events: {
                where: { type: { in: ['ISSUED', 'RETIRED'] } },
                orderBy: { eventAt: 'asc' },
              },
            },
          },
        },
      });

      if (!receipt) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `Receipt ${id} not found`,
        });
      }

      // Get finance traceability
      const projectId = receipt.projectId;

      // Get deposits for the project
      const deposits = await db.deposit.findMany({
        where: { projectId },
        orderBy: { depositedAt: 'asc' },
      });

      // Get disbursements for the project
      const disbursements = await db.disbursement.findMany({
        where: {
          invoice: {
            contract: {
              projectId,
            },
          },
        },
        include: {
          invoice: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Get verifications for the project
      const verifications = await db.verificationAttestation.findMany({
        where: {
          verificationGate: {
            projectId,
          },
        },
        include: {
          verificationGate: {
            select: { id: true, gateName: true },
          },
        },
        orderBy: { attestedAt: 'asc' },
      });

      const receiptData = {
        receiptId: receipt.receiptId,
        status: receipt.status,
        beneficiaryId: receipt.beneficiaryId,
        project: {
          id: receipt.project.id,
          name: receipt.project.name,
          slug: receipt.project.slug,
        },
        liftToken: {
          id: receipt.liftToken.id,
          quantity: receipt.liftToken.quantity?.toString() || '0',
          unit: receipt.liftToken.unit || 'LU',
          issuedAt: receipt.liftToken.issuedAt?.toISOString() || new Date().toISOString(),
          retiredAt: receipt.liftToken.retiredAt?.toISOString() || new Date().toISOString(),
        },
        financeTraceability: {
          deposits: deposits.map(d => ({
            id: d.id,
            amountCents: Number(d.amountCents),
            currency: d.currency,
            sourceRef: d.sourceRef,
            txHash: d.txHash,
            depositedAt: d.depositedAt?.toISOString() || d.createdAt.toISOString(),
          })),
          disbursements: disbursements.map(d => ({
            id: d.id,
            invoiceId: d.invoiceId,
            amountCents: Number(d.amountCents),
            method: d.paymentMethod,
            txHash: d.txHash,
            processedAt: d.executedDate?.toISOString(),
          })),
          verifications: verifications.map(v => ({
            id: v.id,
            gateId: v.verificationGateId,
            phase: v.verificationGate?.gateName || 'Unknown',
            passed: v.passed,
            attestedAt: v.attestedAt.toISOString(),
          })),
        },
        generatedAt: receipt.generatedAt.toISOString(),
      };

      if (format === 'html') {
        // Generate HTML receipt
        const html = generateHTMLReceipt(receiptData);
        reply.type('text/html');
        return html;
      } else if (format === 'pdf') {
        // For PDF, we'd need a PDF generation library
        // For now, return JSON with a note
        return {
          ...receiptData,
          note: 'PDF generation not implemented yet',
        };
      }

      return receiptData;
    } catch (error) {
      fastify.log.error('Failed to fetch receipt', { error: error.message });
      reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch receipt',
      });
    }
  });
}

// Helper function to generate HTML receipt
function generateHTMLReceipt(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Lift Token Retirement Receipt - ${data.receiptId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .amount { font-weight: bold; color: #2563eb; }
        .verified { color: #059669; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lift Token Retirement Receipt</h1>
        <p><strong>Receipt ID:</strong> ${data.receiptId}</p>
        <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Project Information</h2>
        <p><strong>Project:</strong> ${data.project.name}</p>
        <p><strong>Project ID:</strong> ${data.project.id}</p>
    </div>

    <div class="section">
        <h2>Lift Token Details</h2>
        <p><strong>Token ID:</strong> ${data.liftToken.id}</p>
        <p><strong>Quantity Retired:</strong> <span class="amount">${data.liftToken.quantity} ${data.liftToken.unit}</span></p>
        <p><strong>Beneficiary:</strong> ${data.beneficiaryId}</p>
        <p><strong>Issued:</strong> ${new Date(data.liftToken.issuedAt).toLocaleDateString()}</p>
        <p><strong>Retired:</strong> ${new Date(data.liftToken.retiredAt).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Finance Traceability</h2>
        
        <h3>Funding Sources</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Source</th>
                    <th>Transaction</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${data.financeTraceability.deposits.map(d => `
                <tr>
                    <td class="amount">$${(d.amountCents / 100).toFixed(2)}</td>
                    <td>${d.currency}</td>
                    <td>${d.sourceRef || 'N/A'}</td>
                    <td>${d.txHash ? `${d.txHash.substring(0, 10)}...` : 'N/A'}</td>
                    <td>${new Date(d.depositedAt).toLocaleDateString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h3>Project Disbursements</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Transaction</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${data.financeTraceability.disbursements.map(d => `
                <tr>
                    <td class="amount">$${(d.amountCents / 100).toFixed(2)}</td>
                    <td>${d.method}</td>
                    <td>${d.txHash ? `${d.txHash.substring(0, 10)}...` : 'Pending'}</td>
                    <td>${d.processedAt ? new Date(d.processedAt).toLocaleDateString() : 'Pending'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <h3>Verification History</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Phase</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${data.financeTraceability.verifications.map(v => `
                <tr>
                    <td>${v.phase}</td>
                    <td class="${v.passed ? 'verified' : ''}">${v.passed ? '✓ VERIFIED' : '✗ FAILED'}</td>
                    <td>${new Date(v.attestedAt).toLocaleDateString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <p><em>This receipt certifies the retirement of lift tokens representing verified environmental improvements funded through the Orenna DAO platform.</em></p>
    </div>
</body>
</html>
  `;
}