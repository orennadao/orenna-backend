import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuditTrailService } from '../lib/audit-trail.js';

// Validation schemas
const AuditTrailQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actor: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventTypes: z.array(z.string()).optional(),
  includeBlockchainEvents: z.boolean().default(true),
  includeSystemEvents: z.boolean().default(true),
  verifyIntegrity: z.boolean().default(false)
});

const AnomalyDetectionSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  analysisWindow: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  severityFilter: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional()
});

export default async function auditRoutes(app: FastifyInstance) {
  const auditService = new AuditTrailService(app);

  // Get immutable audit trail for entity
  app.get('/audit/trail', {
    schema: {
      description: 'Get immutable audit trail with integrity verification',
      tags: ['Audit'],
      querystring: {
        type: 'object',
        properties: {
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          actor: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          eventTypes: { type: 'array', items: { type: 'string' } },
          includeBlockchainEvents: { type: 'boolean', default: true },
          includeSystemEvents: { type: 'boolean', default: true },
          verifyIntegrity: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            metadata: {
              type: 'object',
              properties: {
                exportId: { type: 'string' },
                generatedAt: { type: 'string' },
                totalEvents: { type: 'number' },
                integrityVerified: { type: 'boolean' },
                chainHash: { type: 'string' }
              }
            },
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  timestamp: { type: 'string' },
                  eventType: { type: 'string' },
                  action: { type: 'string' },
                  entityType: { type: 'string' },
                  entityId: { type: 'string' },
                  actor: { type: 'string' },
                  source: { type: 'string' },
                  details: { type: 'object' },
                  eventHash: { type: 'string' },
                  previousEventHash: { type: 'string' },
                  blockchainTxHash: { type: 'string' },
                  ipfsHash: { type: 'string' }
                }
              }
            },
            integrity: {
              type: 'object',
              properties: {
                chainValid: { type: 'boolean' },
                eventHashesValid: { type: 'boolean' },
                blockchainAnchored: { type: 'boolean' },
                ipfsBackupExists: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const query = AuditTrailQuerySchema.parse(request.query);
      
      const auditTrail = await auditService.getAuditTrail({
        entityType: query.entityType,
        entityId: query.entityId,
        actor: query.actor,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        eventTypes: query.eventTypes,
        includeBlockchainEvents: query.includeBlockchainEvents,
        includeSystemEvents: query.includeSystemEvents,
        verifyIntegrity: query.verifyIntegrity
      });

      return auditTrail;
    } catch (error) {
      app.log.error({ error }, 'Failed to get audit trail');
      return reply.code(500).send({ error: 'Failed to get audit trail' });
    }
  });

  // Verify event integrity
  app.get('/audit/events/:eventId/verify', {
    schema: {
      description: 'Verify the integrity of a specific audit event',
      tags: ['Audit'],
      params: {
        type: 'object',
        required: ['eventId'],
        properties: {
          eventId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            valid: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } },
            verificationDetails: {
              type: 'object',
              properties: {
                hashVerification: { type: 'object' },
                chainLinkage: { type: 'object' },
                ipfsBackup: { type: 'object' },
                blockchainAnchor: { type: 'object' }
              }
            },
            verifiedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const { eventId } = request.params as { eventId: string };
      
      const verification = await auditService.verifyEventIntegrity(eventId);
      
      return {
        eventId,
        ...verification,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      app.log.error({ error, eventId: request.params }, 'Failed to verify event integrity');
      return reply.code(500).send({ error: 'Failed to verify event integrity' });
    }
  });

  // Generate immutable chain proof
  app.get('/audit/entities/:entityType/:entityId/proof', {
    schema: {
      description: 'Generate cryptographic proof of audit chain integrity',
      tags: ['Audit'],
      params: {
        type: 'object',
        required: ['entityType', 'entityId'],
        properties: {
          entityType: { type: 'string' },
          entityId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            chainProof: { type: 'string' },
            merkleRoot: { type: 'string' },
            eventHashes: { type: 'array', items: { type: 'string' } },
            blockchainAnchors: { type: 'array', items: { type: 'string' } },
            ipfsBackups: { type: 'array', items: { type: 'string' } },
            generatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const { entityType, entityId } = request.params as { entityType: string; entityId: string };
      
      const proof = await auditService.generateImmutableChainProof(entityType, entityId);
      
      return {
        entityType,
        entityId,
        ...proof
      };
    } catch (error) {
      app.log.error({ error, params: request.params }, 'Failed to generate chain proof');
      return reply.code(500).send({ error: 'Failed to generate chain proof' });
    }
  });

  // Detect audit anomalies
  app.post('/audit/anomalies/detect', {
    schema: {
      description: 'Detect anomalies and suspicious patterns in audit trails',
      tags: ['Audit', 'Security'],
      body: {
        type: 'object',
        properties: {
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          analysisWindow: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
          severityFilter: { 
            type: 'array', 
            items: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            analysisWindow: { type: 'string' },
            totalEventsAnalyzed: { type: 'number' },
            anomalies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  description: { type: 'string' },
                  affectedEvents: { type: 'array', items: { type: 'string' } },
                  detectedAt: { type: 'string' }
                }
              }
            },
            riskScore: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } },
            analyzedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const body = AnomalyDetectionSchema.parse(request.body);
      
      // Calculate time window
      const now = new Date();
      const timeWindows = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      const startDate = new Date(now.getTime() - timeWindows[body.analysisWindow]);
      
      const anomalyResult = await auditService.detectAnomalies({
        entityType: body.entityType,
        entityId: body.entityId,
        startDate,
        endDate: now,
        verifyIntegrity: true
      });

      // Filter by severity if specified
      let filteredAnomalies = anomalyResult.anomalies;
      if (body.severityFilter && body.severityFilter.length > 0) {
        filteredAnomalies = anomalyResult.anomalies.filter(a => 
          body.severityFilter!.includes(a.severity)
        );
      }

      // Get total events for analysis window
      const auditTrail = await auditService.getAuditTrail({
        entityType: body.entityType,
        entityId: body.entityId,
        startDate,
        endDate: now
      });

      return {
        analysisWindow: body.analysisWindow,
        totalEventsAnalyzed: auditTrail.metadata.totalEvents,
        anomalies: filteredAnomalies,
        riskScore: anomalyResult.riskScore,
        recommendations: anomalyResult.recommendations,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to detect audit anomalies');
      return reply.code(500).send({ error: 'Failed to detect audit anomalies' });
    }
  });

  // Record audit event (for system use)
  app.post('/audit/events', {
    preHandler: (app as any).authenticate,
    schema: {
      description: 'Record a new audit event (system use)',
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['eventType', 'action', 'entityType', 'entityId'],
        properties: {
          eventType: { type: 'string' },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          actor: { type: 'string' },
          source: { type: 'string' },
          details: { type: 'object' },
          blockchainTxHash: { type: 'string' },
          ipfsHash: { type: 'string' },
          signature: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            eventHash: { type: 'string' },
            timestamp: { type: 'string' },
            chainLinked: { type: 'boolean' },
            backupStatus: {
              type: 'object',
              properties: {
                ipfsBackup: { type: 'boolean' },
                blockchainAnchor: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const body = request.body as {
        eventType: string;
        action: string;
        entityType: string;
        entityId: string;
        actor?: string;
        source?: string;
        details?: Record<string, any>;
        blockchainTxHash?: string;
        ipfsHash?: string;
        signature?: string;
      };
      const user = request.user!;

      const auditEvent = await auditService.recordEvent({
        eventType: body.eventType,
        action: body.action,
        entityType: body.entityType,
        entityId: body.entityId,
        actor: body.actor || user.address,
        source: body.source || 'API',
        details: body.details || {},
        blockchainTxHash: body.blockchainTxHash,
        ipfsHash: body.ipfsHash,
        signature: body.signature
      });

      return reply.code(201).send({
        id: auditEvent.id,
        eventHash: auditEvent.eventHash,
        timestamp: auditEvent.timestamp.toISOString(),
        chainLinked: !!auditEvent.previousEventHash,
        backupStatus: {
          ipfsBackup: !!auditEvent.ipfsHash,
          blockchainAnchor: !!auditEvent.blockchainTxHash
        }
      });
    } catch (error) {
      app.log.error({ error }, 'Failed to record audit event');
      return reply.code(500).send({ error: 'Failed to record audit event' });
    }
  });

  // Bulk integrity verification
  app.post('/audit/verify/bulk', {
    schema: {
      description: 'Verify integrity of multiple audit events in bulk',
      tags: ['Audit'],
      body: {
        type: 'object',
        required: ['eventIds'],
        properties: {
          eventIds: { 
            type: 'array', 
            items: { type: 'string' },
            minItems: 1,
            maxItems: 100
          },
          includeDetails: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalEvents: { type: 'number' },
                validEvents: { type: 'number' },
                invalidEvents: { type: 'number' },
                overallIntegrity: { type: 'string' }
              }
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  eventId: { type: 'string' },
                  valid: { type: 'boolean' },
                  issueCount: { type: 'number' },
                  verificationDetails: { type: 'object' }
                }
              }
            },
            verifiedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const body = request.body as {
        eventIds: string[];
        includeDetails: boolean;
      };

      const results = [];
      let validCount = 0;
      let invalidCount = 0;

      for (const eventId of body.eventIds) {
        try {
          const verification = await auditService.verifyEventIntegrity(eventId);
          
          if (verification.valid) {
            validCount++;
          } else {
            invalidCount++;
          }

          results.push({
            eventId,
            valid: verification.valid,
            issueCount: verification.issues.length,
            verificationDetails: body.includeDetails ? verification.verificationDetails : undefined
          });
        } catch (error) {
          invalidCount++;
          results.push({
            eventId,
            valid: false,
            issueCount: 1,
            verificationDetails: body.includeDetails ? { error: (error as Error).message } : undefined
          });
        }
      }

      const overallIntegrity = invalidCount === 0 ? 'VALID' : 
                              validCount === 0 ? 'COMPROMISED' : 
                              'PARTIALLY_VALID';

      return {
        summary: {
          totalEvents: body.eventIds.length,
          validEvents: validCount,
          invalidEvents: invalidCount,
          overallIntegrity
        },
        results,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to perform bulk verification');
      return reply.code(500).send({ error: 'Failed to perform bulk verification' });
    }
  });

  // Get audit statistics
  app.get('/audit/statistics', {
    schema: {
      description: 'Get audit trail statistics and health metrics',
      tags: ['Audit'],
      querystring: {
        type: 'object',
        properties: {
          timeWindow: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
          entityType: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            timeWindow: { type: 'string' },
            summary: {
              type: 'object',
              properties: {
                totalEvents: { type: 'number' },
                uniqueActors: { type: 'number' },
                uniqueEntities: { type: 'number' },
                integrityScore: { type: 'number' }
              }
            },
            eventTypeDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  eventType: { type: 'string' },
                  count: { type: 'number' },
                  percentage: { type: 'number' }
                }
              }
            },
            actorActivity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  actor: { type: 'string' },
                  eventCount: { type: 'number' },
                  lastActivity: { type: 'string' }
                }
              }
            },
            integrityMetrics: {
              type: 'object',
              properties: {
                eventsWithBlockchainAnchor: { type: 'number' },
                eventsWithIPFSBackup: { type: 'number' },
                chainIntegrityScore: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply) => {
    try {
      const query = request.query as {
        timeWindow?: '1h' | '24h' | '7d' | '30d';
        entityType?: string;
      };

      const timeWindow = query.timeWindow || '24h';
      const timeWindows = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const startDate = new Date(Date.now() - timeWindows[timeWindow]);
      const endDate = new Date();

      // Get events for analysis
      const auditTrail = await auditService.getAuditTrail({
        entityType: query.entityType,
        startDate,
        endDate,
        verifyIntegrity: true
      });

      const events = auditTrail.events;

      // Calculate statistics
      const uniqueActors = new Set(events.map(e => e.actor)).size;
      const uniqueEntities = new Set(events.map(e => `${e.entityType}:${e.entityId}`)).size;

      // Event type distribution
      const eventTypeCounts = new Map<string, number>();
      events.forEach(event => {
        eventTypeCounts.set(event.eventType, (eventTypeCounts.get(event.eventType) || 0) + 1);
      });

      const eventTypeDistribution = Array.from(eventTypeCounts.entries()).map(([eventType, count]) => ({
        eventType,
        count,
        percentage: (count / events.length) * 100
      }));

      // Actor activity
      const actorCounts = new Map<string, { count: number; lastActivity: Date }>();
      events.forEach(event => {
        const existing = actorCounts.get(event.actor);
        actorCounts.set(event.actor, {
          count: (existing?.count || 0) + 1,
          lastActivity: !existing || event.timestamp > existing.lastActivity ? event.timestamp : existing.lastActivity
        });
      });

      const actorActivity = Array.from(actorCounts.entries())
        .map(([actor, data]) => ({
          actor,
          eventCount: data.count,
          lastActivity: data.lastActivity.toISOString()
        }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10); // Top 10 most active actors

      // Integrity metrics
      const eventsWithBlockchainAnchor = events.filter(e => e.blockchainTxHash).length;
      const eventsWithIPFSBackup = events.filter(e => e.ipfsHash).length;
      
      const integrityScore = auditTrail.integrity.chainValid && auditTrail.integrity.eventHashesValid ? 100 :
                            auditTrail.integrity.chainValid || auditTrail.integrity.eventHashesValid ? 50 : 0;

      const chainIntegrityScore = (
        (auditTrail.integrity.chainValid ? 25 : 0) +
        (auditTrail.integrity.eventHashesValid ? 25 : 0) +
        (auditTrail.integrity.blockchainAnchored ? 25 : 0) +
        (auditTrail.integrity.ipfsBackupExists ? 25 : 0)
      );

      return {
        timeWindow,
        summary: {
          totalEvents: events.length,
          uniqueActors,
          uniqueEntities,
          integrityScore
        },
        eventTypeDistribution,
        actorActivity,
        integrityMetrics: {
          eventsWithBlockchainAnchor,
          eventsWithIPFSBackup,
          chainIntegrityScore
        }
      };
    } catch (error) {
      app.log.error({ error }, 'Failed to get audit statistics');
      return reply.code(500).send({ error: 'Failed to get audit statistics' });
    }
  });
}