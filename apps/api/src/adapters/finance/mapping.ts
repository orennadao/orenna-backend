// Service → Prisma shape mapping glue (pilot-safe)
export const mapDisbursement = (s: any) => ({
  id: s.id,
  paymentMethod: s.method,        // was: method → paymentMethod
  executedDate: s.processedAt,    // was: processedAt → executedDate
  reconciledDate: s.reconciledAt, // was: reconciledAt → reconciledDate
  txHash: s.transactionHash,      // was: transactionHash → txHash
  amountCents: s.amount,          // was: amount → amountCents
  status: s.status,
  vendorId: s.vendorId,
  invoiceId: s.invoiceId,
  memo: s.memo,
  fees: s.fees,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt
});

export const mapInvoice = (s: any) => ({
  id: s.id,
  invoiceNumber: s.number,        // was: number → invoiceNumber
  amountCents: s.amount,          // was: amount → amountCents
  submittedDate: s.submittedAt,   // was: submittedAt → submittedDate
  approvedDate: s.approvedAt,     // was: approvedAt → approvedDate
  paidDate: s.paidAt,            // was: paidAt → paidDate
  status: s.status,
  vendorId: s.vendorId,
  contractId: s.contractId,
  description: s.description,
  wbsCode: s.wbsCode,
  retentionPercent: s.retentionPercent,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt
});

export const mapContract = (s: any) => ({
  id: s.id,
  contractNumber: s.number,       // was: number → contractNumber
  totalAmountCents: s.totalAmount, // was: totalAmount → totalAmountCents
  executedDate: s.executedAt,     // was: executedAt → executedDate
  startDate: s.startDate,
  endDate: s.endDate,
  status: s.status,
  vendorId: s.vendorId,
  projectId: s.projectId,
  title: s.title,
  description: s.description,
  workStatement: s.workStatement,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt
});

export const mapVendor = (s: any) => ({
  id: s.id,
  legalName: s.name,              // was: name → legalName
  displayName: s.displayName || s.name,
  kycStatus: s.kycStatus,
  taxId: s.ein,                   // was: ein → taxId
  contactEmail: s.email,          // was: email → contactEmail
  paymentMethod: s.preferredPaymentMethod, // was: preferredPaymentMethod → paymentMethod
  status: s.status,
  businessType: s.businessType,
  address: s.address,
  phone: s.phone,
  website: s.website,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt
});

export const mapReconciliation = (s: any) => ({
  id: s.id,
  disbursementId: s.disbursementId,
  matchedDate: s.reconciledAt,    // was: reconciledAt → matchedDate
  bankReference: s.bankRef,       // was: bankRef → bankReference
  blockchainTxHash: s.txHash,     // was: txHash → blockchainTxHash
  status: s.status,
  matchConfidence: s.confidence,  // was: confidence → matchConfidence
  discrepancyAmount: s.discrepancy, // was: discrepancy → discrepancyAmount
  notes: s.notes,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt
});

// Reverse mapping for compatibility
export const toServiceFormat = {
  disbursement: (d: any) => ({
    id: d.id,
    method: d.paymentMethod,
    processedAt: d.executedDate,
    reconciledAt: d.reconciledDate,
    transactionHash: d.txHash,
    amount: d.amountCents,
    status: d.status,
    vendorId: d.vendorId,
    invoiceId: d.invoiceId,
    memo: d.memo,
    fees: d.fees,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  }),
  
  invoice: (i: any) => ({
    id: i.id,
    number: i.invoiceNumber,
    amount: i.amountCents,
    submittedAt: i.submittedDate,
    approvedAt: i.approvedDate,
    paidAt: i.paidDate,
    status: i.status,
    vendorId: i.vendorId,
    contractId: i.contractId,
    description: i.description,
    wbsCode: i.wbsCode,
    retentionPercent: i.retentionPercent,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt
  })
};