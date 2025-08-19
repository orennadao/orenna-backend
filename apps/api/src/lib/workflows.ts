import { PrismaClient } from '@orenna/db';
import { queueService } from './queue-service';
import { verificationService } from './verification';
import { websocketManager } from './websocket-manager';
import { analyticsService } from './analytics';

export interface WorkflowTrigger {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  cooldown: number; // Minutes between triggers
  lastTriggered?: Date;
}

export interface WorkflowCondition {
  type: 'data_threshold' | 'time_based' | 'evidence_count' | 'confidence_score' | 'external_signal';
  field: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'matches';
  value: any;
  metadata?: any;
}

export interface WorkflowAction {
  type: 'auto_verify' | 'require_review' | 'notify_validators' | 'escalate' | 'reject' | 'schedule_recheck';
  parameters: any;
  delay?: number; // Minutes to delay action
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  liftTokenId: number;
  verificationResultId?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  executedActions: Array<{
    action: WorkflowAction;
    status: 'pending' | 'completed' | 'failed';
    result?: any;
    error?: string;
    executedAt?: Date;
  }>;
}

export class WorkflowEngine {
  private triggers: Map<string, WorkflowTrigger> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private intervalId?: NodeJS.Timeout;

  constructor(private prisma: PrismaClient) {
    this.loadDefaultTriggers();
  }

  private loadDefaultTriggers() {
    // VWBA High Confidence Auto-Approval
    this.addTrigger({
      id: 'vwba-auto-approve',
      name: 'VWBA High Confidence Auto-Approval',
      description: 'Automatically approve VWBA verifications with confidence > 90%',
      enabled: true,
      conditions: [
        {
          type: 'confidence_score',
          field: 'confidenceScore',
          operator: '>',
          value: 0.9
        },
        {
          type: 'data_threshold',
          field: 'methodId',
          operator: '=',
          value: 'vwba-v2'
        }
      ],
      actions: [
        {
          type: 'auto_verify',
          parameters: { approved: true, reason: 'High confidence VWBA verification' }
        },
        {
          type: 'notify_validators',
          parameters: { message: 'Auto-approved due to high confidence score' }
        }
      ],
      priority: 'normal',
      cooldown: 0
    });

    // Low Confidence Review Required
    this.addTrigger({
      id: 'low-confidence-review',
      name: 'Low Confidence Review Required',
      description: 'Require manual review for verifications with confidence < 60%',
      enabled: true,
      conditions: [
        {
          type: 'confidence_score',
          field: 'confidenceScore',
          operator: '<',
          value: 0.6
        }
      ],
      actions: [
        {
          type: 'require_review',
          parameters: { 
            reviewType: 'manual',
            priority: 'high',
            reason: 'Low confidence score requires manual review'
          }
        },
        {
          type: 'notify_validators',
          parameters: { 
            urgency: 'high',
            message: 'Manual review required for low confidence verification'
          }
        }
      ],
      priority: 'high',
      cooldown: 0
    });

    // Insufficient Evidence Rejection
    this.addTrigger({
      id: 'insufficient-evidence',
      name: 'Insufficient Evidence Auto-Rejection',
      description: 'Auto-reject verifications with insufficient evidence files',
      enabled: true,
      conditions: [
        {
          type: 'evidence_count',
          field: 'evidenceFiles',
          operator: '<',
          value: 3
        }
      ],
      actions: [
        {
          type: 'reject',
          parameters: { 
            reason: 'Insufficient evidence files (minimum 3 required)',
            allowResubmission: true
          }
        }
      ],
      priority: 'normal',
      cooldown: 0
    });

    // Rapid Verification Pattern Detection
    this.addTrigger({
      id: 'rapid-verification-pattern',
      name: 'Rapid Verification Pattern Detection',
      description: 'Flag lift tokens with >5 verification attempts in 24 hours',
      enabled: true,
      conditions: [
        {
          type: 'data_threshold',
          field: 'verificationsIn24h',
          operator: '>',
          value: 5
        }
      ],
      actions: [
        {
          type: 'escalate',
          parameters: { 
            level: 'security_review',
            reason: 'Suspicious verification pattern detected'
          }
        },
        {
          type: 'require_review',
          parameters: { 
            reviewType: 'security',
            priority: 'critical'
          }
        }
      ],
      priority: 'critical',
      cooldown: 60 // 1 hour cooldown
    });

    // Daily Quality Check
    this.addTrigger({
      id: 'daily-quality-check',
      name: 'Daily Quality Assurance Check',
      description: 'Run quality checks on all verifications from the past day',
      enabled: true,
      conditions: [
        {
          type: 'time_based',
          field: 'schedule',
          operator: '=',
          value: '0 2 * * *', // Daily at 2 AM
          metadata: { timezone: 'UTC' }
        }
      ],
      actions: [
        {
          type: 'schedule_recheck',
          parameters: { 
            scope: 'daily',
            checks: ['confidence_consistency', 'evidence_integrity', 'cross_validation']
          }
        }
      ],
      priority: 'low',
      cooldown: 1440 // 24 hours
    });
  }

  addTrigger(trigger: WorkflowTrigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  removeTrigger(triggerId: string): boolean {
    return this.triggers.delete(triggerId);
  }

  getTrigger(triggerId: string): WorkflowTrigger | undefined {
    return this.triggers.get(triggerId);
  }

  getAllTriggers(): WorkflowTrigger[] {
    return Array.from(this.triggers.values());
  }

  updateTrigger(triggerId: string, updates: Partial<WorkflowTrigger>): boolean {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;

    this.triggers.set(triggerId, { ...trigger, ...updates });
    return true;
  }

  async processVerificationEvent(
    event: 'verification_submitted' | 'verification_completed' | 'evidence_uploaded',
    data: {
      liftTokenId: number;
      verificationResultId?: number;
      methodId?: string;
      confidenceScore?: number;
      evidenceCount?: number;
      [key: string]: any;
    }
  ): Promise<void> {
    // Get additional context for evaluation
    const context = await this.buildEvaluationContext(data);

    // Evaluate all enabled triggers
    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) continue;

      // Check cooldown
      if (trigger.lastTriggered && trigger.cooldown > 0) {
        const cooldownEnd = new Date(trigger.lastTriggered.getTime() + trigger.cooldown * 60000);
        if (new Date() < cooldownEnd) continue;
      }

      // Evaluate conditions
      if (this.evaluateConditions(trigger.conditions, context)) {
        await this.executeTrigger(trigger, data);
      }
    }
  }

  private async buildEvaluationContext(data: any): Promise<any> {
    const context = { ...data };

    // Add verification history for this lift token
    if (data.liftTokenId) {
      const recentVerifications = await this.prisma.verificationResult.findMany({
        where: {
          liftTokenId: data.liftTokenId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });
      context.verificationsIn24h = recentVerifications.length;
    }

    // Add evidence count if verification result exists
    if (data.verificationResultId) {
      const evidenceCount = await this.prisma.evidenceFile.count({
        where: { verificationResultId: data.verificationResultId }
      });
      context.evidenceCount = evidenceCount;
    }

    // Add current time context
    context.currentTime = new Date();
    context.hourOfDay = new Date().getHours();
    context.dayOfWeek = new Date().getDay();

    return context;
  }

  private evaluateConditions(conditions: WorkflowCondition[], context: any): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(condition: WorkflowCondition, context: any): boolean {
    const value = this.getContextValue(condition.field, context);
    
    switch (condition.operator) {
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '=':
        return value === condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case '!=':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'matches':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  private getContextValue(field: string, context: any): any {
    // Support nested field access with dot notation
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  private async executeTrigger(trigger: WorkflowTrigger, data: any): Promise<void> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: trigger.id,
      liftTokenId: data.liftTokenId,
      verificationResultId: data.verificationResultId,
      status: 'running',
      startedAt: new Date(),
      executedActions: trigger.actions.map(action => ({
        action,
        status: 'pending'
      }))
    };

    this.executions.set(executionId, execution);

    try {
      // Update trigger last triggered time
      trigger.lastTriggered = new Date();

      // Execute actions in sequence
      for (let i = 0; i < trigger.actions.length; i++) {
        const action = trigger.actions[i];
        const actionExecution = execution.executedActions[i];

        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay * 60000));
        }

        try {
          const result = await this.executeAction(action, data, execution);
          actionExecution.status = 'completed';
          actionExecution.result = result;
          actionExecution.executedAt = new Date();
        } catch (error) {
          actionExecution.status = 'failed';
          actionExecution.error = error instanceof Error ? error.message : String(error);
          
          // Continue with other actions unless it's a critical failure
          if (trigger.priority === 'critical') {
            throw error;
          }
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();

      // Log workflow execution
      console.log(`Workflow ${trigger.id} executed successfully for lift token ${data.liftTokenId}`);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();

      console.error(`Workflow ${trigger.id} failed for lift token ${data.liftTokenId}:`, error);
    }

    // Send real-time update
    if (websocketManager) {
      websocketManager.notifyAnalyticsUpdate('verification_metrics', {
        type: 'workflow_execution',
        workflowId: trigger.id,
        executionId,
        status: execution.status,
        liftTokenId: data.liftTokenId
      });
    }
  }

  private async executeAction(
    action: WorkflowAction,
    data: any,
    execution: WorkflowExecution
  ): Promise<any> {
    switch (action.type) {
      case 'auto_verify':
        return this.executeAutoVerify(action, data);
      
      case 'require_review':
        return this.executeRequireReview(action, data);
      
      case 'notify_validators':
        return this.executeNotifyValidators(action, data);
      
      case 'escalate':
        return this.executeEscalate(action, data);
      
      case 'reject':
        return this.executeReject(action, data);
      
      case 'schedule_recheck':
        return this.executeScheduleRecheck(action, data);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeAutoVerify(action: WorkflowAction, data: any): Promise<any> {
    if (!data.verificationResultId) {
      throw new Error('Cannot auto-verify without verification result ID');
    }

    const { approved, reason } = action.parameters;

    // Update verification result
    const updated = await this.prisma.verificationResult.update({
      where: { id: data.verificationResultId },
      data: {
        verified: approved,
        verifiedAt: new Date(),
        notes: reason
      }
    });

    // Log the auto-verification event
    await this.prisma.liftTokenEvent.create({
      data: {
        liftTokenId: data.liftTokenId,
        eventType: approved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
        eventData: {
          verificationResultId: data.verificationResultId,
          automated: true,
          reason,
          workflowTriggered: true
        }
      }
    });

    return { success: true, verified: approved, reason };
  }

  private async executeRequireReview(action: WorkflowAction, data: any): Promise<any> {
    const { reviewType, priority, reason } = action.parameters;

    // Create a review task (simplified - would integrate with task management system)
    const reviewTask = {
      type: reviewType,
      priority,
      reason,
      liftTokenId: data.liftTokenId,
      verificationResultId: data.verificationResultId,
      createdAt: new Date(),
      status: 'pending'
    };

    // In a real implementation, this would create a task in a task management system
    console.log('Review task created:', reviewTask);

    return { success: true, reviewTask };
  }

  private async executeNotifyValidators(action: WorkflowAction, data: any): Promise<any> {
    const { message, urgency = 'normal' } = action.parameters;

    // Send notification via WebSocket
    if (websocketManager) {
      websocketManager.emitVerificationEvent('validation_required', {
        verificationResultId: data.verificationResultId || 0,
        liftTokenId: data.liftTokenId,
        methodId: data.methodId || 'unknown',
        status: 'processing',
        message: message
      });
    }

    // Queue notification job for email/other channels
    await queueService.addNotificationJob({
      type: 'validator_notification',
      priority: urgency,
      data: {
        message,
        liftTokenId: data.liftTokenId,
        verificationResultId: data.verificationResultId,
        urgency
      }
    });

    return { success: true, notificationSent: true };
  }

  private async executeEscalate(action: WorkflowAction, data: any): Promise<any> {
    const { level, reason } = action.parameters;

    // Create escalation record
    const escalation = {
      level,
      reason,
      liftTokenId: data.liftTokenId,
      verificationResultId: data.verificationResultId,
      escalatedAt: new Date(),
      status: 'open'
    };

    // Log escalation event
    await this.prisma.liftTokenEvent.create({
      data: {
        liftTokenId: data.liftTokenId,
        eventType: 'VERIFICATION_ESCALATED',
        eventData: escalation
      }
    });

    console.log('Verification escalated:', escalation);

    return { success: true, escalation };
  }

  private async executeReject(action: WorkflowAction, data: any): Promise<any> {
    const { reason, allowResubmission = false } = action.parameters;

    if (data.verificationResultId) {
      // Update verification result
      await this.prisma.verificationResult.update({
        where: { id: data.verificationResultId },
        data: {
          verified: false,
          verifiedAt: new Date(),
          notes: reason
        }
      });
    }

    // Log rejection event
    await this.prisma.liftTokenEvent.create({
      data: {
        liftTokenId: data.liftTokenId,
        eventType: 'VERIFICATION_REJECTED',
        eventData: {
          reason,
          allowResubmission,
          automated: true,
          workflowTriggered: true
        }
      }
    });

    return { success: true, rejected: true, reason, allowResubmission };
  }

  private async executeScheduleRecheck(action: WorkflowAction, data: any): Promise<any> {
    const { scope, checks } = action.parameters;

    // Queue recheck job
    await queueService.addVerificationJob({
      type: 'quality_recheck',
      priority: 'low',
      data: {
        scope,
        checks,
        scheduledAt: new Date()
      }
    });

    return { success: true, recheckScheduled: true, scope, checks };
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionHistory(limit: number = 100): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  startPeriodicTriggerCheck(intervalMinutes: number = 5): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      await this.checkTimeBasedTriggers();
    }, intervalMinutes * 60000);
  }

  stopPeriodicTriggerCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkTimeBasedTriggers(): Promise<void> {
    const now = new Date();
    
    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) continue;

      // Check for time-based conditions
      const timeConditions = trigger.conditions.filter(c => c.type === 'time_based');
      if (timeConditions.length === 0) continue;

      // Simple cron-like checking (would be replaced with proper cron implementation)
      for (const condition of timeConditions) {
        if (condition.field === 'schedule' && this.shouldTriggerSchedule(condition.value, now)) {
          await this.executeTrigger(trigger, { liftTokenId: 0, scheduled: true });
        }
      }
    }
  }

  private shouldTriggerSchedule(cronExpression: string, now: Date): boolean {
    // Simplified cron checking - in production would use a proper cron library
    // Format: minute hour day month dayOfWeek
    // Example: "0 2 * * *" = daily at 2 AM
    
    if (cronExpression === '0 2 * * *') {
      return now.getHours() === 2 && now.getMinutes() === 0;
    }
    
    return false;
  }

  cleanup(): void {
    this.stopPeriodicTriggerCheck();
    
    // Clean up old executions (keep last 1000)
    const executions = Array.from(this.executions.entries())
      .sort(([,a], [,b]) => b.startedAt.getTime() - a.startedAt.getTime());
    
    if (executions.length > 1000) {
      const toRemove = executions.slice(1000);
      toRemove.forEach(([id]) => this.executions.delete(id));
    }
  }
}

export const workflowEngine = new WorkflowEngine(new PrismaClient());