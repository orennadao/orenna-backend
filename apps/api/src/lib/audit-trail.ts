import { FastifyInstance } from 'fastify';
import crypto from 'crypto';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  source: string;
  details: Record<string, any>;
  blockchainTxHash?: string;
  ipfsHash?: string;
  previousEventHash?: string;
  eventHash: string;
  signature?: string;
}

export interface ImmutableAuditChain {
  chainId: string;
  genesisHash: string;
  latestHash: string;
  eventCount: number;
  integrityStatus: 'VERIFIED' | 'COMPROMISED' | 'UNKNOWN';
  lastVerifiedAt: Date;
}

export interface AuditTrailQuery {
  entityType?: string;
  entityId?: string;
  actor?: string;
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  includeBlockchainEvents?: boolean;
  includeSystemEvents?: boolean;
  verifyIntegrity?: boolean;
}

export interface AuditTrailExport {
  metadata: {
    exportId: string;
    generatedAt: string;
    query: AuditTrailQuery;
    totalEvents: number;
    integrityVerified: boolean;
    chainHash: string;
  };
  events: AuditEvent[];
  integrity: {
    chainValid: boolean;
    eventHashesValid: boolean;
    blockchainAnchored: boolean;
    ipfsBackupExists: boolean;
  };
}

export class AuditTrailService {
  constructor(private app: FastifyInstance) {}

  async recordEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'eventHash' | 'previousEventHash'>): Promise<AuditEvent> {
    const eventId = `AE-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const timestamp = new Date();

    // Get the previous event hash for chain linking
    const previousEvent = await this.getLatestEvent(event.entityType, event.entityId);
    const previousEventHash = previousEvent?.eventHash || null;

    // Create event hash for integrity
    const eventData = {
      id: eventId,
      timestamp: timestamp.toISOString(),
      eventType: event.eventType,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actor: event.actor,
      source: event.source,
      details: event.details,
      previousEventHash
    };

    const eventHash = this.calculateEventHash(eventData);

    const auditEvent: AuditEvent = {
      ...eventData,
      timestamp,
      eventHash,
      previousEventHash: previousEventHash || undefined,
      blockchainTxHash: event.blockchainTxHash,
      ipfsHash: event.ipfsHash,
      signature: event.signature
    };

    // Store in database
    await this.storeAuditEvent(auditEvent);

    // Backup to IPFS for immutable storage
    if (this.shouldBackupToIPFS(event.eventType)) {
      try {
        const ipfsHash = await this.backupEventToIPFS(auditEvent);
        auditEvent.ipfsHash = ipfsHash;
        await this.updateEventIPFSHash(eventId, ipfsHash);
      } catch (error) {
        this.app.log.warn({ eventId, error }, 'Failed to backup event to IPFS');
      }
    }

    // Anchor to blockchain for high-priority events
    if (this.shouldAnchorToBlockchain(event.eventType)) {
      try {
        const txHash = await this.anchorEventToBlockchain(auditEvent);
        auditEvent.blockchainTxHash = txHash;
        await this.updateEventBlockchainHash(eventId, txHash);
      } catch (error) {
        this.app.log.warn({ eventId, error }, 'Failed to anchor event to blockchain');
      }
    }

    return auditEvent;
  }

  async getAuditTrail(query: AuditTrailQuery): Promise<AuditTrailExport> {
    const events = await this.queryAuditEvents(query);
    
    const exportId = `EXP-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const chainHash = await this.calculateChainHash(events);
    
    let integrity = {
      chainValid: false,
      eventHashesValid: false,
      blockchainAnchored: false,
      ipfsBackupExists: false
    };

    if (query.verifyIntegrity) {
      integrity = await this.verifyAuditChainIntegrity(events);
    }

    return {
      metadata: {
        exportId,
        generatedAt: new Date().toISOString(),
        query,
        totalEvents: events.length,
        integrityVerified: query.verifyIntegrity || false,
        chainHash
      },
      events,
      integrity
    };
  }

  async verifyEventIntegrity(eventId: string): Promise<{
    valid: boolean;
    issues: string[];
    verificationDetails: Record<string, any>;
  }> {
    const event = await this.getAuditEvent(eventId);
    if (!event) {
      return {
        valid: false,
        issues: ['Event not found'],
        verificationDetails: {}
      };
    }

    const issues: string[] = [];
    const verificationDetails: Record<string, any> = {};

    // Verify event hash
    const calculatedHash = this.calculateEventHash({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actor: event.actor,
      source: event.source,
      details: event.details,
      previousEventHash: event.previousEventHash
    });

    if (calculatedHash !== event.eventHash) {
      issues.push('Event hash mismatch - event may have been tampered with');
    }
    verificationDetails.hashVerification = {
      expected: event.eventHash,
      calculated: calculatedHash,
      valid: calculatedHash === event.eventHash
    };

    // Verify chain linkage if this isn't the genesis event
    if (event.previousEventHash) {
      const previousEvent = await this.getPreviousEvent(event);
      if (!previousEvent) {
        issues.push('Previous event in chain not found');
      } else if (previousEvent.eventHash !== event.previousEventHash) {
        issues.push('Chain linkage broken - previous event hash mismatch');
      }
      verificationDetails.chainLinkage = {
        hasPrevious: !!previousEvent,
        valid: previousEvent?.eventHash === event.previousEventHash
      };
    }

    // Verify IPFS backup if exists
    if (event.ipfsHash) {
      try {
        const ipfsValid = await this.verifyIPFSBackup(event);
        if (!ipfsValid) {
          issues.push('IPFS backup verification failed');
        }
        verificationDetails.ipfsBackup = { valid: ipfsValid };
      } catch (error) {
        issues.push('Unable to verify IPFS backup');
        verificationDetails.ipfsBackup = { error: (error as Error).message };
      }
    }

    // Verify blockchain anchor if exists
    if (event.blockchainTxHash) {
      try {
        const blockchainValid = await this.verifyBlockchainAnchor(event);
        if (!blockchainValid) {
          issues.push('Blockchain anchor verification failed');
        }
        verificationDetails.blockchainAnchor = { valid: blockchainValid };
      } catch (error) {
        issues.push('Unable to verify blockchain anchor');
        verificationDetails.blockchainAnchor = { error: (error as Error).message };
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      verificationDetails
    };
  }

  async generateImmutableChainProof(entityType: string, entityId: string): Promise<{
    chainProof: string;
    merkleRoot: string;
    eventHashes: string[];
    blockchainAnchors: string[];
    ipfsBackups: string[];
    generatedAt: string;
  }> {
    const events = await this.queryAuditEvents({
      entityType,
      entityId,
      verifyIntegrity: true
    });

    // Generate Merkle tree of event hashes
    const eventHashes = events.map(e => e.eventHash);
    const merkleRoot = this.calculateMerkleRoot(eventHashes);

    // Collect blockchain anchors and IPFS backups
    const blockchainAnchors = events
      .filter(e => e.blockchainTxHash)
      .map(e => e.blockchainTxHash!);

    const ipfsBackups = events
      .filter(e => e.ipfsHash)
      .map(e => e.ipfsHash!);

    // Generate comprehensive chain proof
    const chainProof = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        entityType,
        entityId,
        merkleRoot,
        eventCount: events.length,
        firstEventHash: eventHashes[0] || null,
        lastEventHash: eventHashes[eventHashes.length - 1] || null,
        blockchainAnchors,
        ipfsBackups
      }))
      .digest('hex');

    return {
      chainProof,
      merkleRoot,
      eventHashes,
      blockchainAnchors,
      ipfsBackups,
      generatedAt: new Date().toISOString()
    };
  }

  async detectAnomalies(query: AuditTrailQuery): Promise<{
    anomalies: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      affectedEvents: string[];
      detectedAt: string;
    }>;
    riskScore: number;
    recommendations: string[];
  }> {
    const auditTrail = await this.getAuditTrail(query);
    const events = auditTrail.events;
    const anomalies: any[] = [];

    // Detect suspicious activity patterns
    const actorFrequency = new Map<string, number>();
    const hourlyActivity = new Map<number, number>();
    
    events.forEach(event => {
      // Track actor frequency
      actorFrequency.set(event.actor, (actorFrequency.get(event.actor) || 0) + 1);
      
      // Track hourly activity
      const hour = event.timestamp.getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });

    // Detect unusual actor activity
    const avgActorActivity = Array.from(actorFrequency.values()).reduce((a, b) => a + b, 0) / actorFrequency.size;
    actorFrequency.forEach((count, actor) => {
      if (count > avgActorActivity * 3) {
        anomalies.push({
          type: 'UNUSUAL_ACTOR_ACTIVITY',
          severity: 'MEDIUM' as const,
          description: `Actor ${actor} has unusually high activity (${count} events vs avg ${avgActorActivity.toFixed(1)})`,
          affectedEvents: events.filter(e => e.actor === actor).map(e => e.id),
          detectedAt: new Date().toISOString()
        });
      }
    });

    // Detect off-hours activity
    const offHours = [22, 23, 0, 1, 2, 3, 4, 5]; // 10 PM to 5 AM
    offHours.forEach(hour => {
      const activity = hourlyActivity.get(hour) || 0;
      if (activity > avgActorActivity * 2) {
        anomalies.push({
          type: 'OFF_HOURS_ACTIVITY',
          severity: 'LOW' as const,
          description: `Unusual activity detected at ${hour}:00 (${activity} events)`,
          affectedEvents: events.filter(e => e.timestamp.getHours() === hour).map(e => e.id),
          detectedAt: new Date().toISOString()
        });
      }
    });

    // Detect integrity violations
    if (!auditTrail.integrity.chainValid) {
      anomalies.push({
        type: 'INTEGRITY_VIOLATION',
        severity: 'CRITICAL' as const,
        description: 'Audit chain integrity has been compromised',
        affectedEvents: events.map(e => e.id),
        detectedAt: new Date().toISOString()
      });
    }

    // Calculate risk score
    const riskScore = anomalies.reduce((score, anomaly) => {
      const severityScores = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 10 };
      return score + (severityScores[anomaly.severity as keyof typeof severityScores] || 0);
    }, 0);

    // Generate recommendations
    const recommendations = [];
    if (anomalies.some(a => a.type === 'UNUSUAL_ACTOR_ACTIVITY')) {
      recommendations.push('Review actor permissions and access controls');
    }
    if (anomalies.some(a => a.type === 'OFF_HOURS_ACTIVITY')) {
      recommendations.push('Implement time-based access restrictions');
    }
    if (anomalies.some(a => a.type === 'INTEGRITY_VIOLATION')) {
      recommendations.push('Immediately investigate and restore audit chain integrity');
    }

    return {
      anomalies,
      riskScore,
      recommendations
    };
  }

  private calculateEventHash(eventData: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(eventData, Object.keys(eventData).sort()))
      .digest('hex');
  }

  private async getLatestEvent(entityType: string, entityId: string): Promise<AuditEvent | null> {
    const result = await this.app.prisma.auditEvent.findFirst({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' }
    });

    return result ? this.mapDatabaseEventToAuditEvent(result) : null;
  }

  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    await this.app.prisma.auditEvent.create({
      data: {
        eventId: event.id,
        timestamp: event.timestamp,
        eventType: event.eventType,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        actor: event.actor,
        source: event.source,
        details: event.details,
        eventHash: event.eventHash,
        previousEventHash: event.previousEventHash,
        blockchainTxHash: event.blockchainTxHash,
        ipfsHash: event.ipfsHash,
        signature: event.signature
      }
    });
  }

  private shouldBackupToIPFS(eventType: string): boolean {
    const criticalEvents = [
      'VERIFICATION_APPROVED',
      'VERIFICATION_REJECTED',
      'LIFT_UNIT_ISSUED',
      'LIFT_UNIT_RETIRED',
      'PAYMENT_PROCESSED'
    ];
    return criticalEvents.includes(eventType);
  }

  private shouldAnchorToBlockchain(eventType: string): boolean {
    const blockchainEvents = [
      'VERIFICATION_APPROVED',
      'LIFT_UNIT_ISSUED',
      'LIFT_UNIT_RETIRED'
    ];
    return blockchainEvents.includes(eventType);
  }

  private async backupEventToIPFS(event: AuditEvent): Promise<string> {
    // This would integrate with IPFS client
    const eventData = JSON.stringify(event);
    // Simulated IPFS hash
    return `Qm${crypto.randomBytes(32).toString('hex')}`;
  }

  private async anchorEventToBlockchain(event: AuditEvent): Promise<string> {
    // This would integrate with blockchain service
    // Simulated transaction hash
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }

  private async updateEventIPFSHash(eventId: string, ipfsHash: string): Promise<void> {
    await this.app.prisma.auditEvent.update({
      where: { eventId },
      data: { ipfsHash }
    });
  }

  private async updateEventBlockchainHash(eventId: string, blockchainTxHash: string): Promise<void> {
    await this.app.prisma.auditEvent.update({
      where: { eventId },
      data: { blockchainTxHash }
    });
  }

  private async queryAuditEvents(query: AuditTrailQuery): Promise<AuditEvent[]> {
    const where: any = {};
    
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actor) where.actor = query.actor;
    if (query.eventTypes) where.eventType = { in: query.eventTypes };
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    const events = await this.app.prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    return events.map(this.mapDatabaseEventToAuditEvent);
  }

  private async getAuditEvent(eventId: string): Promise<AuditEvent | null> {
    const result = await this.app.prisma.auditEvent.findUnique({
      where: { eventId }
    });

    return result ? this.mapDatabaseEventToAuditEvent(result) : null;
  }

  private async getPreviousEvent(event: AuditEvent): Promise<AuditEvent | null> {
    if (!event.previousEventHash) return null;

    const result = await this.app.prisma.auditEvent.findFirst({
      where: { eventHash: event.previousEventHash }
    });

    return result ? this.mapDatabaseEventToAuditEvent(result) : null;
  }

  private async verifyIPFSBackup(event: AuditEvent): Promise<boolean> {
    // This would verify the event data against IPFS backup
    // Simulated verification
    return true;
  }

  private async verifyBlockchainAnchor(event: AuditEvent): Promise<boolean> {
    // This would verify the event hash is anchored on blockchain
    // Simulated verification
    return true;
  }

  private async calculateChainHash(events: AuditEvent[]): Promise<string> {
    const eventHashes = events.map(e => e.eventHash);
    return crypto
      .createHash('sha256')
      .update(eventHashes.join(''))
      .digest('hex');
  }

  private async verifyAuditChainIntegrity(events: AuditEvent[]): Promise<{
    chainValid: boolean;
    eventHashesValid: boolean;
    blockchainAnchored: boolean;
    ipfsBackupExists: boolean;
  }> {
    let chainValid = true;
    let eventHashesValid = true;
    let blockchainAnchored = false;
    let ipfsBackupExists = false;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event) continue;
      
      // Verify event hash
      const calculatedHash = this.calculateEventHash({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        eventType: event.eventType,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        actor: event.actor,
        source: event.source,
        details: event.details,
        previousEventHash: event.previousEventHash
      });

      if (calculatedHash !== event.eventHash) {
        eventHashesValid = false;
      }

      // Verify chain linkage
      if (i > 0) {
        const previousEvent = events[i - 1];
        if (previousEvent && event.previousEventHash !== previousEvent.eventHash) {
          chainValid = false;
        }
      }

      if (event.blockchainTxHash) blockchainAnchored = true;
      if (event.ipfsHash) ipfsBackupExists = true;
    }

    return {
      chainValid,
      eventHashesValid,
      blockchainAnchored,
      ipfsBackupExists
    };
  }

  private calculateMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0] || '';

    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i] || '';
      const right = hashes[i + 1] || left || ''; // Duplicate if odd number
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }

    return this.calculateMerkleRoot(nextLevel);
  }

  private mapDatabaseEventToAuditEvent(dbEvent: any): AuditEvent {
    return {
      id: dbEvent.eventId || '',
      timestamp: dbEvent.timestamp,
      eventType: dbEvent.eventType,
      action: dbEvent.action,
      entityType: dbEvent.entityType,
      entityId: dbEvent.entityId,
      actor: dbEvent.actor,
      source: dbEvent.source,
      details: dbEvent.details,
      eventHash: dbEvent.eventHash,
      previousEventHash: dbEvent.previousEventHash,
      blockchainTxHash: dbEvent.blockchainTxHash,
      ipfsHash: dbEvent.ipfsHash,
      signature: dbEvent.signature
    };
  }
}