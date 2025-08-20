export const memoTag = (projectId: string | number, invoiceId: string | number, wbs?: string): string =>
  [projectId, invoiceId, wbs ?? ''].filter(Boolean).join(':');

export const parseMemoTag = (memo: string): { projectId: string; invoiceId: string; wbs?: string } => {
  const parts = memo.split(':');
  return {
    projectId: parts[0] || '',
    invoiceId: parts[1] || '',
    wbs: parts[2] || undefined
  };
};

export const generateInvoiceNumber = (vendorId: string | number, sequence: number): string =>
  `INV-${vendorId}-${sequence.toString().padStart(4, '0')}`;

export const generateContractNumber = (projectId: string | number, vendorId: string | number, year: number): string =>
  `CTR-${projectId}-${vendorId}-${year}`;

export const generatePaymentRunId = (date: Date = new Date()): string =>
  `RUN-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

export const generateReceiptId = (projectId: string | number, beneficiaryId: string | number): string =>
  `RCP-${projectId}-${beneficiaryId}-${Date.now()}`;

export const generateVerificationGateId = (projectId: string | number, phase: string): string =>
  `VG-${projectId}-${phase.toUpperCase()}-${Date.now().toString().slice(-6)}`;

export const generateLiftTokenBatchId = (projectId: string | number, unitType: string): string =>
  `LU-${projectId}-${unitType.toUpperCase()}-${Date.now().toString().slice(-6)}`;

export const formatFinanceRef = (type: 'invoice' | 'contract' | 'disbursement' | 'receipt', id: string | number): string =>
  `${type.toUpperCase()}-${id}`;

export const parseFinanceRef = (ref: string): { type: string; id: string } => {
  const [type, id] = ref.split('-', 2);
  return { type: type?.toLowerCase() || '', id: id || '' };
};

// Validation helpers
export const isValidMemoTag = (memo: string): boolean => {
  const parts = memo.split(':');
  return parts.length >= 2 && (parts[0]?.length || 0) > 0 && (parts[1]?.length || 0) > 0;
};

export const isValidFinanceRef = (ref: string): boolean => {
  const { type, id } = parseFinanceRef(ref);
  const validTypes = ['invoice', 'contract', 'disbursement', 'receipt'];
  return validTypes.includes(type) && id.length > 0;
};