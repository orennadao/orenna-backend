import { logger } from '../../utils/logger';

export interface ACHTransferRequest {
  recipientName: string;
  recipientAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  bankDetails: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    bankName: string;
  };
  amount: bigint; // Amount in cents
  currency: string;
  memo?: string;
  reference: string;
  effectiveDate?: Date; // For scheduled transfers
}

export interface ACHTransferResponse {
  transactionId: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'RETURNED';
  reference: string;
  effectiveDate: Date;
  fee?: bigint;
  error?: string;
  traceNumber?: string;
  returnCode?: string;
  returnReason?: string;
}

export interface ACHStatus {
  transactionId: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'RETURNED';
  amount: bigint;
  reference: string;
  effectiveDate: Date;
  settledDate?: Date;
  fee?: bigint;
  traceNumber?: string;
  returnCode?: string;
  returnReason?: string;
  lastUpdated: Date;
}

export interface ACHBatch {
  batchId: string;
  transactions: ACHTransferRequest[];
  totalAmount: bigint;
  effectiveDate: Date;
  status: 'CREATED' | 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface ACHBatchResponse {
  batchId: string;
  submittedCount: number;
  totalAmount: bigint;
  status: 'SUBMITTED' | 'FAILED';
  transactions: {
    reference: string;
    transactionId: string;
    status: string;
  }[];
  error?: string;
}

export interface ACHReconciliationRecord {
  transactionId: string;
  reference: string;
  amount: bigint;
  status: 'SETTLED' | 'RETURNED';
  settledDate: Date;
  traceNumber: string;
  returnCode?: string;
  returnReason?: string;
}

/**
 * ACH Payment Provider
 * 
 * This service handles ACH (Automated Clearing House) transactions for domestic US payments.
 * In a production environment, this would integrate with providers like:
 * - Dwolla
 * - Plaid
 * - Stripe ACH
 * - Modern Treasury
 * - Bank APIs directly
 */
export class ACHProvider {
  private apiKey: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;
  private companyId: string;

  constructor(config: {
    apiKey: string;
    environment: 'sandbox' | 'production';
    companyId: string;
  }) {
    this.apiKey = config.apiKey;
    this.environment = config.environment;
    this.companyId = config.companyId;
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.achprovider.com'
      : 'https://sandbox.achprovider.com';
  }

  /**
   * Submit a single ACH transfer
   */
  async submitTransfer(request: ACHTransferRequest): Promise<ACHTransferResponse> {
    try {
      logger.info('Submitting ACH transfer', {
        reference: request.reference,
        amount: request.amount.toString(),
        bankName: request.bankDetails.bankName,
      });

      // Validate transfer request
      this.validateTransferRequest(request);

      // In a real implementation, this would make an HTTP request to the ACH provider
      // For now, we'll simulate the response
      const response = await this.simulateACHTransfer(request);

      logger.info('ACH transfer submitted', {
        transactionId: response.transactionId,
        status: response.status,
        reference: response.reference,
      });

      return response;
    } catch (error) {
      logger.error('Failed to submit ACH transfer', {
        error: error.message,
        reference: request.reference,
      });
      throw error;
    }
  }

  /**
   * Submit a batch of ACH transfers
   */
  async submitBatch(batch: ACHBatch): Promise<ACHBatchResponse> {
    try {
      logger.info('Submitting ACH batch', {
        batchId: batch.batchId,
        transactionCount: batch.transactions.length,
        totalAmount: batch.totalAmount.toString(),
      });

      // Validate batch
      this.validateBatch(batch);

      // Process each transaction in the batch
      const transactionResults = [];
      let successCount = 0;

      for (const transaction of batch.transactions) {
        try {
          const result = await this.submitTransfer(transaction);
          transactionResults.push({
            reference: transaction.reference,
            transactionId: result.transactionId,
            status: result.status,
          });
          if (result.status !== 'FAILED') {
            successCount++;
          }
        } catch (error) {
          transactionResults.push({
            reference: transaction.reference,
            transactionId: '',
            status: 'FAILED',
          });
        }
      }

      const batchResponse: ACHBatchResponse = {
        batchId: batch.batchId,
        submittedCount: successCount,
        totalAmount: batch.totalAmount,
        status: successCount > 0 ? 'SUBMITTED' : 'FAILED',
        transactions: transactionResults,
      };

      logger.info('ACH batch submitted', {
        batchId: batch.batchId,
        submittedCount: successCount,
        totalTransactions: batch.transactions.length,
      });

      return batchResponse;
    } catch (error) {
      logger.error('Failed to submit ACH batch', {
        error: error.message,
        batchId: batch.batchId,
      });
      throw error;
    }
  }

  /**
   * Check the status of an ACH transfer
   */
  async getTransferStatus(transactionId: string): Promise<ACHStatus> {
    try {
      logger.info('Checking ACH transfer status', { transactionId });

      // In a real implementation, this would query the ACH provider's API
      const status = await this.simulateStatusCheck(transactionId);

      logger.info('ACH status retrieved', {
        transactionId,
        status: status.status,
        lastUpdated: status.lastUpdated,
      });

      return status;
    } catch (error) {
      logger.error('Failed to get ACH transfer status', {
        error: error.message,
        transactionId,
      });
      throw error;
    }
  }

  /**
   * Get reconciliation data for a date range
   */
  async getReconciliationData(startDate: Date, endDate: Date): Promise<ACHReconciliationRecord[]> {
    try {
      logger.info('Fetching ACH reconciliation data', { startDate, endDate });

      // In a real implementation, this would fetch settlement data from the provider
      const records = await this.simulateReconciliationData(startDate, endDate);

      logger.info('ACH reconciliation data retrieved', {
        recordCount: records.length,
        startDate,
        endDate,
      });

      return records;
    } catch (error) {
      logger.error('Failed to get ACH reconciliation data', {
        error: error.message,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  /**
   * Cancel a pending ACH transfer (if supported by provider)
   */
  async cancelTransfer(transactionId: string): Promise<boolean> {
    try {
      logger.info('Cancelling ACH transfer', { transactionId });

      // Check if transfer can be cancelled (usually only if still pending)
      const status = await this.getTransferStatus(transactionId);
      
      if (status.status !== 'PENDING') {
        throw new Error(`Cannot cancel ACH transfer with status: ${status.status}`);
      }

      // In a real implementation, this would call the provider's cancel API
      const cancelled = await this.simulateCancellation(transactionId);

      if (cancelled) {
        logger.info('ACH transfer cancelled successfully', { transactionId });
      }

      return cancelled;
    } catch (error) {
      logger.error('Failed to cancel ACH transfer', {
        error: error.message,
        transactionId,
      });
      throw error;
    }
  }

  /**
   * Validate bank routing number using ABA routing number format
   */
  async validateRoutingNumber(routingNumber: string): Promise<boolean> {
    try {
      // Remove any non-numeric characters
      const cleaned = routingNumber.replace(/\D/g, '');

      // Must be exactly 9 digits
      if (cleaned.length !== 9) {
        return false;
      }

      // Calculate checksum using ABA formula
      const digits = cleaned.split('').map(Number);
      const checksum = (
        3 * (digits[0] + digits[3] + digits[6]) +
        7 * (digits[1] + digits[4] + digits[7]) +
        1 * (digits[2] + digits[5] + digits[8])
      ) % 10;

      const isValid = checksum === 0;

      logger.info('Routing number validation', {
        routingNumber: cleaned,
        isValid,
      });

      return isValid;
    } catch (error) {
      logger.error('Failed to validate routing number', {
        error: error.message,
        routingNumber,
      });
      return false;
    }
  }

  /**
   * Get ACH processing cutoff times for same-day and next-day processing
   */
  getCutoffTimes(): { sameDay: string; nextDay: string } {
    // These would typically be provided by the ACH provider
    return {
      sameDay: '14:30', // 2:30 PM EST for same-day ACH
      nextDay: '17:00',  // 5:00 PM EST for next-day processing
    };
  }

  /**
   * Calculate ACH fees based on transaction details
   */
  calculateFees(amount: bigint, isExpedited: boolean = false): bigint {
    // Standard ACH fee structure (example)
    const baseFee = BigInt(25); // $0.25 base fee
    const percentageFee = amount / BigInt(10000); // 0.01% of amount
    const expediteFee = isExpedited ? BigInt(500) : BigInt(0); // $5.00 for same-day

    return baseFee + percentageFee + expediteFee;
  }

  // Private helper methods

  private validateTransferRequest(request: ACHTransferRequest): void {
    if (!request.recipientName || request.recipientName.trim().length === 0) {
      throw new Error('Recipient name is required');
    }

    if (!request.bankDetails.routingNumber || !request.bankDetails.accountNumber) {
      throw new Error('Bank routing and account numbers are required');
    }

    if (request.amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }

    if (request.amount > BigInt(100000000)) { // $1M limit
      throw new Error('Transfer amount exceeds maximum limit');
    }

    if (!this.validateRoutingNumber(request.bankDetails.routingNumber)) {
      throw new Error('Invalid bank routing number');
    }
  }

  private validateBatch(batch: ACHBatch): void {
    if (!batch.transactions || batch.transactions.length === 0) {
      throw new Error('Batch must contain at least one transaction');
    }

    if (batch.transactions.length > 1000) {
      throw new Error('Batch size exceeds maximum limit of 1000 transactions');
    }

    const calculatedTotal = batch.transactions.reduce(
      (sum, tx) => sum + tx.amount,
      BigInt(0)
    );

    if (calculatedTotal !== batch.totalAmount) {
      throw new Error('Batch total amount does not match sum of transactions');
    }
  }

  // Simulation methods (replace with real API calls in production)

  private async simulateACHTransfer(request: ACHTransferRequest): Promise<ACHTransferResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const transactionId = `ACH_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Simulate various outcomes based on amount and routing number
    const shouldFail = Math.random() < 0.05; // 5% failure rate
    
    if (shouldFail) {
      return {
        transactionId,
        status: 'FAILED',
        reference: request.reference,
        effectiveDate: new Date(),
        error: 'Invalid account number or insufficient funds',
      };
    }

    return {
      transactionId,
      status: 'PENDING',
      reference: request.reference,
      effectiveDate: request.effectiveDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Next business day
      fee: this.calculateFees(request.amount),
      traceNumber: `${this.companyId}${Date.now().toString().slice(-7)}`,
    };
  }

  private async simulateStatusCheck(transactionId: string): Promise<ACHStatus> {
    // Simulate different statuses based on transaction age
    const age = Date.now() - parseInt(transactionId.split('_')[1]);
    const daysSinceCreation = age / (24 * 60 * 60 * 1000);

    let status: ACHStatus['status'];
    let settledDate: Date | undefined;

    if (daysSinceCreation < 1) {
      status = 'PENDING';
    } else if (daysSinceCreation < 3) {
      status = 'PROCESSING';
    } else if (Math.random() > 0.02) { // 98% success rate
      status = 'CONFIRMED';
      settledDate = new Date(Date.now() - (daysSinceCreation - 3) * 24 * 60 * 60 * 1000);
    } else {
      status = 'RETURNED';
    }

    return {
      transactionId,
      status,
      amount: BigInt(100000), // Would come from stored transaction data
      reference: `REF_${transactionId}`,
      effectiveDate: new Date(Date.now() - daysSinceCreation * 24 * 60 * 60 * 1000),
      settledDate,
      fee: BigInt(25),
      traceNumber: `${this.companyId}${Date.now().toString().slice(-7)}`,
      returnCode: status === 'RETURNED' ? 'R03' : undefined,
      returnReason: status === 'RETURNED' ? 'No Account/Unable to Locate Account' : undefined,
      lastUpdated: new Date(),
    };
  }

  private async simulateReconciliationData(
    startDate: Date,
    endDate: Date
  ): Promise<ACHReconciliationRecord[]> {
    const records: ACHReconciliationRecord[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    // Generate sample reconciliation records
    for (let i = 0; i < Math.min(daysDiff * 10, 100); i++) {
      const transactionId = `ACH_${Date.now() - i * 100000}_${Math.random().toString(36).substring(2, 8)}`;
      const settledDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      records.push({
        transactionId,
        reference: `REF_${transactionId}`,
        amount: BigInt(Math.floor(Math.random() * 10000000)), // Random amount up to $100k
        status: Math.random() > 0.95 ? 'RETURNED' : 'SETTLED',
        settledDate,
        traceNumber: `${this.companyId}${Date.now().toString().slice(-7)}`,
        returnCode: Math.random() > 0.95 ? 'R01' : undefined,
        returnReason: Math.random() > 0.95 ? 'Insufficient Funds' : undefined,
      });
    }

    return records;
  }

  private async simulateCancellation(transactionId: string): Promise<boolean> {
    // Simulate cancellation success/failure
    return Math.random() > 0.1; // 90% success rate for cancellations
  }
}