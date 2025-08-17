import { FastifyInstance } from 'fastify';
import { getEnv } from '../types/env.js';

const env = getEnv();

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromAddress?: string;
  };
  webhook?: {
    enabled: boolean;
    urls: string[];
    secret?: string;
  };
  push?: {
    enabled: boolean;
    fcmServerKey?: string;
  };
}

export interface PaymentNotification {
  paymentId: string;
  projectId: number;
  paymentType: string;
  status: string;
  amount: string;
  paymentToken: string;
  payerAddress: string;
  recipientAddress: string;
  txHash?: string;
  chainId: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserNotificationPreferences {
  userId: string;
  email?: string;
  webhookUrl?: string;
  pushTokens?: string[];
  preferences: {
    paymentConfirmed: boolean;
    paymentFailed: boolean;
    paymentRefunded: boolean;
    proceedsReceived: boolean;
    distributionComplete: boolean;
    escrowConfigured: boolean;
  };
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(private app: FastifyInstance, config?: NotificationConfig) {
    this.config = config || {
      email: {
        enabled: false
      },
      webhook: {
        enabled: true,
        urls: []
      },
      push: {
        enabled: false
      }
    };
  }

  async sendPaymentNotification(
    notification: PaymentNotification,
    recipients: string[] = [],
    userPreferences?: UserNotificationPreferences[]
  ): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];

    try {
      // Send email notifications
      if (this.config.email?.enabled && recipients.length > 0) {
        for (const email of recipients) {
          try {
            const emailResult = await this.sendEmailNotification(notification, email);
            results.push({ type: 'email', recipient: email, ...emailResult });
          } catch (error) {
            results.push({ 
              type: 'email', 
              recipient: email, 
              success: false, 
              error: error.message 
            });
          }
        }
      }

      // Send webhook notifications
      if (this.config.webhook?.enabled) {
        const webhookUrls = [
          ...(this.config.webhook.urls || []),
          ...(userPreferences?.map(p => p.webhookUrl).filter(Boolean) || [])
        ];

        for (const url of webhookUrls) {
          try {
            const webhookResult = await this.sendWebhookNotification(notification, url);
            results.push({ type: 'webhook', recipient: url, ...webhookResult });
          } catch (error) {
            results.push({ 
              type: 'webhook', 
              recipient: url, 
              success: false, 
              error: error.message 
            });
          }
        }
      }

      // Send push notifications
      if (this.config.push?.enabled && userPreferences) {
        for (const userPref of userPreferences) {
          if (userPref.pushTokens && userPref.pushTokens.length > 0) {
            try {
              const pushResult = await this.sendPushNotification(notification, userPref.pushTokens);
              results.push({ type: 'push', recipient: userPref.userId, ...pushResult });
            } catch (error) {
              results.push({ 
                type: 'push', 
                recipient: userPref.userId, 
                success: false, 
                error: error.message 
              });
            }
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      this.app.log.info({
        paymentId: notification.paymentId,
        totalNotifications: results.length,
        successful: successCount
      }, 'Payment notifications sent');

      return {
        success: successCount > 0,
        results
      };

    } catch (error) {
      this.app.log.error({ error, notification }, 'Failed to send payment notifications');
      return {
        success: false,
        results: [{ error: error.message }]
      };
    }
  }

  private async sendEmailNotification(
    notification: PaymentNotification,
    recipient: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // For now, just log the email notification
      // In production, integrate with email service like SendGrid, AWS SES, etc.
      
      const subject = this.getEmailSubject(notification);
      const body = this.getEmailBody(notification);

      this.app.log.info({
        to: recipient,
        subject,
        paymentId: notification.paymentId
      }, 'Email notification sent (simulated)');

      // Simulate email sending
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async sendWebhookNotification(
    notification: PaymentNotification,
    webhookUrl: string
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
      const payload = {
        event: 'payment.status_changed',
        data: notification,
        timestamp: new Date().toISOString(),
        signature: this.generateWebhookSignature(notification)
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Orenna-Webhook/1.0',
          ...(this.config.webhook?.secret && {
            'X-Orenna-Signature': this.generateWebhookSignature(notification)
          })
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          error: `Webhook returned ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async sendPushNotification(
    notification: PaymentNotification,
    pushTokens: string[]
  ): Promise<{ success: boolean; deliveredCount?: number; error?: string }> {
    try {
      // For now, just log the push notification
      // In production, integrate with FCM, APNS, etc.

      const title = this.getPushTitle(notification);
      const body = this.getPushBody(notification);

      this.app.log.info({
        tokens: pushTokens.length,
        title,
        paymentId: notification.paymentId
      }, 'Push notification sent (simulated)');

      return {
        success: true,
        deliveredCount: pushTokens.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private getEmailSubject(notification: PaymentNotification): string {
    switch (notification.status) {
      case 'CONFIRMED':
        return `Payment Confirmed - ${notification.paymentType}`;
      case 'FAILED':
        return `Payment Failed - ${notification.paymentType}`;
      case 'REFUNDED':
        return `Payment Refunded - ${notification.paymentType}`;
      case 'IN_ESCROW':
        return `Payment In Escrow - ${notification.paymentType}`;
      case 'DISTRIBUTED':
        return `Payment Distributed - ${notification.paymentType}`;
      default:
        return `Payment Update - ${notification.paymentType}`;
    }
  }

  private getEmailBody(notification: PaymentNotification): string {
    return `
Payment Update

Payment ID: ${notification.paymentId}
Type: ${notification.paymentType}
Status: ${notification.status}
Amount: ${notification.amount}
Payer: ${notification.payerAddress}
Recipient: ${notification.recipientAddress}
${notification.txHash ? `Transaction: ${notification.txHash}` : ''}
Timestamp: ${notification.timestamp.toISOString()}

${this.getStatusDescription(notification.status)}

Best regards,
Orenna Platform
    `.trim();
  }

  private getPushTitle(notification: PaymentNotification): string {
    switch (notification.status) {
      case 'CONFIRMED':
        return 'Payment Confirmed ✅';
      case 'FAILED':
        return 'Payment Failed ❌';
      case 'REFUNDED':
        return 'Payment Refunded 💰';
      case 'IN_ESCROW':
        return 'Payment In Escrow 🏦';
      case 'DISTRIBUTED':
        return 'Payment Distributed 📤';
      default:
        return 'Payment Update 📱';
    }
  }

  private getPushBody(notification: PaymentNotification): string {
    return `${notification.paymentType}: ${notification.amount} ${notification.paymentToken}`;
  }

  private getStatusDescription(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Your payment is being processed.';
      case 'CONFIRMED':
        return 'Your payment has been confirmed on the blockchain.';
      case 'FAILED':
        return 'Your payment failed to process. Please try again or contact support.';
      case 'REFUNDED':
        return 'Your payment has been refunded.';
      case 'IN_ESCROW':
        return 'Your payment is now held in escrow and will be distributed according to the project terms.';
      case 'DISTRIBUTED':
        return 'Your payment has been distributed to the designated recipients.';
      case 'CANCELLED':
        return 'Your payment has been cancelled.';
      default:
        return 'Your payment status has been updated.';
    }
  }

  private generateWebhookSignature(notification: PaymentNotification): string {
    if (!this.config.webhook?.secret) {
      return '';
    }

    // Simple signature generation - in production, use HMAC-SHA256
    const payload = JSON.stringify(notification);
    const secret = this.config.webhook.secret;
    
    // This is a simplified signature - implement proper HMAC in production
    return `sha256=${Buffer.from(payload + secret).toString('base64')}`;
  }

  // Utility method to notify about payment status changes
  async notifyPaymentStatusChange(
    paymentId: string,
    newStatus: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Get payment details
      const payment = await this.app.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          project: {
            select: { id: true, name: true, ownerAddress: true }
          }
        }
      });

      if (!payment) {
        this.app.log.warn({ paymentId }, 'Payment not found for notification');
        return;
      }

      // Create notification payload
      const notification: PaymentNotification = {
        paymentId: payment.id,
        projectId: payment.projectId!,
        paymentType: payment.paymentType,
        status: newStatus,
        amount: payment.amount,
        paymentToken: payment.paymentToken,
        payerAddress: payment.payerAddress,
        recipientAddress: payment.recipientAddress,
        txHash: payment.txHash || undefined,
        chainId: payment.chainId,
        timestamp: new Date(),
        metadata: {
          ...payment.metadata,
          ...additionalData,
          projectName: payment.project?.name
        }
      };

      // Determine recipients
      const recipients: string[] = [];
      
      // Add project owner if email is available
      if (payment.project?.ownerAddress) {
        // In production, you'd look up the owner's email from user preferences
      }

      // Add payer email if available
      if (payment.payerEmail) {
        recipients.push(payment.payerEmail);
      }

      // Send notifications
      await this.sendPaymentNotification(notification, recipients);

    } catch (error) {
      this.app.log.error({ error, paymentId, newStatus }, 'Failed to notify payment status change');
    }
  }

  // Method to notify about escrow events
  async notifyEscrowEvent(
    projectId: number,
    eventType: 'proceeds_received' | 'funds_distributed' | 'configuration_updated',
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      // Get project details
      const project = await this.app.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          paymentConfig: true
        }
      });

      if (!project) {
        this.app.log.warn({ projectId }, 'Project not found for escrow notification');
        return;
      }

      this.app.log.info({
        projectId,
        projectName: project.name,
        eventType,
        eventData
      }, 'Escrow event notification');

      // Create webhook payload for escrow events
      const payload = {
        event: `escrow.${eventType}`,
        data: {
          projectId,
          projectName: project.name,
          eventType,
          ...eventData
        },
        timestamp: new Date().toISOString()
      };

      // Send webhook notifications if configured
      if (this.config.webhook?.enabled && this.config.webhook.urls.length > 0) {
        for (const url of this.config.webhook.urls) {
          try {
            await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Orenna-Webhook/1.0'
              },
              body: JSON.stringify(payload)
            });
          } catch (error) {
            this.app.log.error({ error, url, payload }, 'Failed to send escrow webhook');
          }
        }
      }

    } catch (error) {
      this.app.log.error({ error, projectId, eventType }, 'Failed to notify escrow event');
    }
  }
}

// Factory function to create notification service with environment config
export function createNotificationService(app: FastifyInstance): NotificationService {
  const config: NotificationConfig = {
    email: {
      enabled: env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      smtpHost: env.SMTP_HOST,
      smtpPort: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : 587,
      smtpUser: env.SMTP_USER,
      smtpPassword: env.SMTP_PASSWORD,
      fromAddress: env.EMAIL_FROM_ADDRESS || 'noreply@orenna.com'
    },
    webhook: {
      enabled: env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
      urls: env.WEBHOOK_NOTIFICATION_URLS ? env.WEBHOOK_NOTIFICATION_URLS.split(',') : [],
      secret: env.WEBHOOK_SECRET
    },
    push: {
      enabled: env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      fcmServerKey: env.FCM_SERVER_KEY
    }
  };

  return new NotificationService(app, config);
}