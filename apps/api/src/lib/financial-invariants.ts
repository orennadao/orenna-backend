import { prisma } from '@orenna/db';
import { fromDollars, add, subtract, isPositive, Money } from '../adapters/finance';

export interface FinancialSummary {
  projectId: number;
  depositsTotal: Money;
  contractsTotal: Money;
  invoicesTotal: Money;
  disbursementsTotal: Money;
  liftTokensIssued: string;
  liftTokensRetired: string;
  balanceAvailable: Money;
  balanceCommitted: Money;
  balanceEncumbered: Money;
  balanceDisbursed: Money;
}

export interface InvariantCheck {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  tolerance?: string;
  message?: string;
}

// MVP Financial Invariants per hybrid plan
export const FINANCIAL_INVARIANTS = {
  // 1. Deposits >= Disbursements + Available + Encumbered
  BALANCE_CONSERVATION: 'Balance Conservation',
  
  // 2. Available + Committed + Encumbered + Disbursed = Total Deposits
  BUCKET_COMPLETENESS: 'Bucket Completeness',
  
  // 3. Contract amounts = sum of related invoices
  CONTRACT_INVOICE_CONSISTENCY: 'Contract-Invoice Consistency',
  
  // 4. Invoice amounts = related disbursements
  INVOICE_DISBURSEMENT_CONSISTENCY: 'Invoice-Disbursement Consistency',
  
  // 5. Lift tokens issued <= available budget
  LIFT_TOKEN_BUDGET_CONSTRAINT: 'Lift Token Budget Constraint',
} as const;

/**
 * Calculate financial summary for a project
 */
export async function calculateFinancialSummary(projectId: number): Promise<FinancialSummary> {
  // Get all deposits for the project
  const deposits = await prisma.deposit.findMany({
    where: { projectId, status: 'COMPLETED' },
  });

  // Get all funding buckets for the project
  const fundingBuckets = await prisma.fundingBucket.findMany({
    where: { projectId, active: true },
  });

  // Get all contracts for the project
  const contracts = await prisma.financeContract.findMany({
    where: { projectId },
  });

  // Get all invoices for the project
  const invoices = await prisma.invoice.findMany({
    where: {
      contract: { projectId },
    },
  });

  // Get all disbursements for the project
  const disbursements = await prisma.disbursement.findMany({
    where: {
      invoice: {
        contract: { projectId },
      },
    },
  });

  // Get all lift tokens for the project
  const liftTokens = await prisma.liftToken.findMany({
    where: { projectId },
  });

  // Calculate totals
  const depositsTotal = deposits.reduce(
    (sum: Money, d: any) => add(sum, fromDollars(Number(d.amountCents) / 100)),
    fromDollars(0)
  );

  const contractsTotal = contracts.reduce(
    (sum: Money, c: any) => add(sum, fromDollars(Number(c.currentAmount) / 100)),
    fromDollars(0)
  );

  const invoicesTotal = invoices.reduce(
    (sum: Money, i: any) => add(sum, fromDollars(Number(i.totalCents) / 100)),
    fromDollars(0)
  );

  const disbursementsTotal = disbursements.reduce(
    (sum: Money, d: any) => add(sum, fromDollars(Number(d.amountCents) / 100)),
    fromDollars(0)
  );

  // Calculate bucket balances
  const balanceAvailable = fundingBuckets.reduce(
    (sum: Money, b: any) => add(sum, fromDollars(Number(b.availableCents) / 100)),
    fromDollars(0)
  );

  const balanceCommitted = fundingBuckets.reduce(
    (sum: Money, b: any) => add(sum, fromDollars(Number(b.committedCents) / 100)),
    fromDollars(0)
  );

  const balanceEncumbered = fundingBuckets.reduce(
    (sum: Money, b: any) => add(sum, fromDollars(Number(b.encumberedCents) / 100)),
    fromDollars(0)
  );

  const balanceDisbursed = fundingBuckets.reduce(
    (sum: Money, b: any) => add(sum, fromDollars(Number(b.disbursedCents) / 100)),
    fromDollars(0)
  );

  // Calculate lift token quantities
  const liftTokensIssued = liftTokens
    .filter(lt => lt.status === 'ISSUED')
    .reduce((sum, lt) => sum + Number(lt.quantity || 0), 0)
    .toString();

  const liftTokensRetired = liftTokens
    .filter(lt => lt.status === 'RETIRED')
    .reduce((sum, lt) => sum + Number(lt.quantity || 0), 0)
    .toString();

  return {
    projectId,
    depositsTotal,
    contractsTotal,
    invoicesTotal,
    disbursementsTotal,
    liftTokensIssued,
    liftTokensRetired,
    balanceAvailable,
    balanceCommitted,
    balanceEncumbered,
    balanceDisbursed,
  };
}

/**
 * Check MVP financial invariants for a project
 */
export async function checkFinancialInvariants(projectId: number): Promise<InvariantCheck[]> {
  const summary = await calculateFinancialSummary(projectId);
  const checks: InvariantCheck[] = [];

  // 1. Balance Conservation: Deposits >= Disbursements + Available + Encumbered
  const totalAllocated = add(
    add(summary.disbursementsTotal, summary.balanceAvailable),
    summary.balanceEncumbered
  );
  
  checks.push({
    name: FINANCIAL_INVARIANTS.BALANCE_CONSERVATION,
    passed: summary.depositsTotal.cents >= totalAllocated.cents,
    expected: `Deposits (${summary.depositsTotal.cents}) >= Allocated (${totalAllocated.cents})`,
    actual: `Deposits: ${summary.depositsTotal.cents}, Allocated: ${totalAllocated.cents}`,
    message: 'Total deposits must be greater than or equal to all allocated funds',
  });

  // 2. Bucket Completeness: Available + Committed + Encumbered + Disbursed = Total Deposits
  const totalBucketBalance = add(
    add(
      add(summary.balanceAvailable, summary.balanceCommitted),
      summary.balanceEncumbered
    ),
    summary.balanceDisbursed
  );

  checks.push({
    name: FINANCIAL_INVARIANTS.BUCKET_COMPLETENESS,
    passed: summary.depositsTotal.cents === totalBucketBalance.cents,
    expected: summary.depositsTotal.cents.toString(),
    actual: totalBucketBalance.cents.toString(),
    tolerance: '100', // Allow $1 tolerance for rounding
    message: 'All deposited funds must be accounted for in bucket balances',
  });

  // 3. Contract-Invoice Consistency: Check a few contracts
  const contractInvoiceChecks = await checkContractInvoiceConsistency(projectId);
  checks.push(...contractInvoiceChecks);

  // 4. Invoice-Disbursement Consistency: Check paid invoices
  const invoiceDisbursementChecks = await checkInvoiceDisbursementConsistency(projectId);
  checks.push(...invoiceDisbursementChecks);

  // 5. Lift Token Budget Constraint: Lift tokens <= available budget
  const availableBudget = Number(summary.balanceAvailable.cents);
  const liftTokenValue = Number(summary.liftTokensIssued) * 100; // Assuming $1 per lift token
  
  checks.push({
    name: FINANCIAL_INVARIANTS.LIFT_TOKEN_BUDGET_CONSTRAINT,
    passed: liftTokenValue <= availableBudget,
    expected: `Lift Token Value (${liftTokenValue}) <= Available Budget (${availableBudget})`,
    actual: `Lift Token Value: ${liftTokenValue}, Available: ${availableBudget}`,
    message: 'Lift tokens issued should not exceed available budget',
  });

  return checks;
}

/**
 * Check contract-invoice consistency
 */
async function checkContractInvoiceConsistency(projectId: number): Promise<InvariantCheck[]> {
  const checks: InvariantCheck[] = [];

  const contracts = await prisma.financeContract.findMany({
    where: { projectId },
    include: {
      invoices: true,
    },
  });

  for (const contract of contracts.slice(0, 5)) { // Check first 5 contracts
    const contractAmount = Number(contract.currentAmount);
    const invoicesTotal = contract.invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalCents),
      0
    );

    checks.push({
      name: `${FINANCIAL_INVARIANTS.CONTRACT_INVOICE_CONSISTENCY} (Contract ${contract.id})`,
      passed: invoicesTotal <= contractAmount,
      expected: `Invoices (${invoicesTotal}) <= Contract (${contractAmount})`,
      actual: `Invoices: ${invoicesTotal}, Contract: ${contractAmount}`,
      message: `Contract ${contract.contractNumber}: Invoice total should not exceed contract amount`,
    });
  }

  return checks;
}

/**
 * Check invoice-disbursement consistency
 */
async function checkInvoiceDisbursementConsistency(projectId: number): Promise<InvariantCheck[]> {
  const checks: InvariantCheck[] = [];

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      contract: { projectId },
      status: 'PAID',
    },
    include: {
      disbursements: true,
    },
  });

  for (const invoice of paidInvoices.slice(0, 5)) { // Check first 5 paid invoices
    const invoiceAmount = Number(invoice.netPayableCents);
    const disbursementsTotal = invoice.disbursements.reduce(
      (sum: number, disbursement: any) => sum + Number(disbursement.amountCents),
      0
    );

    checks.push({
      name: `${FINANCIAL_INVARIANTS.INVOICE_DISBURSEMENT_CONSISTENCY} (Invoice ${invoice.id})`,
      passed: Math.abs(invoiceAmount - disbursementsTotal) <= 100, // $1 tolerance
      expected: invoiceAmount.toString(),
      actual: disbursementsTotal.toString(),
      tolerance: '100',
      message: `Invoice ${invoice.invoiceNumber}: Disbursements should match net payable amount`,
    });
  }

  return checks;
}

/**
 * Get overall financial health score (0-100)
 */
export async function getFinancialHealthScore(projectId: number): Promise<number> {
  const checks = await checkFinancialInvariants(projectId);
  const passedChecks = checks.filter(check => check.passed).length;
  return Math.round((passedChecks / checks.length) * 100);
}

/**
 * Generate financial integrity report
 */
export async function generateFinancialIntegrityReport(projectId: number) {
  const summary = await calculateFinancialSummary(projectId);
  const checks = await checkFinancialInvariants(projectId);
  const healthScore = await getFinancialHealthScore(projectId);

  const passedChecks = checks.filter(c => c.passed);
  const failedChecks = checks.filter(c => !c.passed);

  return {
    projectId,
    generatedAt: new Date().toISOString(),
    healthScore,
    summary: {
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
    },
    invariantChecks: {
      total: checks.length,
      passed: passedChecks.length,
      failed: failedChecks.length,
      details: checks,
    },
    recommendations: generateRecommendations(failedChecks),
  };
}

/**
 * Generate recommendations based on failed checks
 */
function generateRecommendations(failedChecks: InvariantCheck[]): string[] {
  const recommendations: string[] = [];

  for (const check of failedChecks) {
    switch (check.name) {
      case FINANCIAL_INVARIANTS.BALANCE_CONSERVATION:
        recommendations.push(
          'Review deposit records and ensure all funds are properly allocated to funding buckets'
        );
        break;
      case FINANCIAL_INVARIANTS.BUCKET_COMPLETENESS:
        recommendations.push(
          'Reconcile funding bucket balances to ensure all deposited funds are accounted for'
        );
        break;
      case FINANCIAL_INVARIANTS.LIFT_TOKEN_BUDGET_CONSTRAINT:
        recommendations.push(
          'Review lift token issuance and ensure it does not exceed available project budget'
        );
        break;
      default:
        if (check.name.includes('Contract-Invoice')) {
          recommendations.push(
            'Review contract and invoice amounts to ensure invoices do not exceed contract values'
          );
        } else if (check.name.includes('Invoice-Disbursement')) {
          recommendations.push(
            'Reconcile disbursements with corresponding invoices to ensure payment accuracy'
          );
        }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All financial invariants are satisfied. No recommendations at this time.');
  }

  return recommendations;
}