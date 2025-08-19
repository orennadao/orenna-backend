import { faker } from "@faker-js/faker";

// User fixtures
export const createMockUser = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  address: faker.finance.ethereumAddress().toLowerCase(),
  ensName: faker.internet.domainName(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Lift Token fixtures
export const createMockLiftToken = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  tokenId: faker.number.bigInt({ min: 1n, max: 1000000n }).toString(),
  contractAddress: faker.finance.ethereumAddress().toLowerCase(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  imageUrl: faker.image.url(),
  metadataUrl: faker.internet.url(),
  ownerAddress: faker.finance.ethereumAddress().toLowerCase(),
  chainId: faker.helpers.arrayElement([1, 11155111]), // mainnet or sepolia
  status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "PENDING"]),
  attributes: {
    location: faker.location.city(),
    capacity: faker.number.int({ min: 100, max: 10000 }),
    efficiency: faker.number.float({ min: 80, max: 99, fractionDigits: 2 }),
  },
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Mint Request fixtures
export const createMockMintRequest = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userAddress: faker.finance.ethereumAddress().toLowerCase(),
  contractAddress: faker.finance.ethereumAddress().toLowerCase(),
  tokenId: faker.number.bigInt({ min: 1n, max: 1000000n }).toString(),
  amount: faker.number.int({ min: 1, max: 100 }),
  status: faker.helpers.arrayElement(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  transactionHash: faker.string.hexadecimal({ length: 64, prefix: "0x" }),
  chainId: faker.helpers.arrayElement([1, 11155111]),
  metadata: {
    requestedBy: faker.person.fullName(),
    reason: faker.lorem.sentence(),
  },
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Verification Method fixtures
export const createMockVerificationMethod = (overrides: any = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  methodId: faker.string.alphanumeric(10),
  name: faker.commerce.productName() + ' Verification Method',
  description: faker.lorem.paragraph(),
  methodologyType: faker.helpers.arrayElement(['VWBA', 'VCS', 'GOLD_STANDARD', 'CUSTOM']),
  version: '1.0',
  criteria: {
    requiredDataPoints: faker.helpers.arrayElements(['water_volume', 'baseline', 'location', 'accuracy']),
    minimumAccuracy: faker.number.float({ min: 0.8, max: 0.99, fractionDigits: 2 }),
    measurementPeriod: faker.number.int({ min: 30, max: 365 })
  },
  requiredDataTypes: faker.helpers.arrayElements([
    'WATER_MEASUREMENT_DATA',
    'BASELINE_ASSESSMENT', 
    'SITE_VERIFICATION',
    'GPS_COORDINATES',
    'METHODOLOGY_DOCUMENTATION'
  ]),
  minimumConfidence: faker.number.float({ min: 0.7, max: 0.95, fractionDigits: 2 }),
  validationPeriod: faker.number.int({ min: 90, max: 365 }),
  chainId: faker.helpers.arrayElement([1, 11155111]),
  active: true,
  isPublic: true,
  approvedValidators: [
    faker.finance.ethereumAddress().toLowerCase(),
    faker.finance.ethereumAddress().toLowerCase()
  ],
  metadata: {
    standard: faker.helpers.arrayElement(['ISO 14064', 'VERRA VCS', 'WRI VWBA']),
    lastUpdated: faker.date.recent().toISOString()
  },
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Verification Result fixtures
export const createMockVerificationResult = (overrides: any = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  liftTokenId: faker.number.int({ min: 1, max: 100 }),
  methodId: faker.string.alphanumeric(10),
  verified: faker.datatype.boolean(),
  confidenceScore: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 4 }),
  verificationLevel: faker.helpers.arrayElement(['PRELIMINARY', 'FINAL', 'CERTIFIED']),
  evidenceHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
  evidenceIpfsCid: faker.string.alphanumeric(46),
  calculationData: {
    waterBenefitVolume: faker.number.int({ min: 10000, max: 1000000 }),
    baselineVolume: faker.number.int({ min: 50000, max: 500000 }),
    projectVolume: faker.number.int({ min: 60000, max: 1500000 }),
    methodology: 'VWBA v2.0',
    uncertaintyRange: {
      lower: faker.number.int({ min: 8000, max: 12000 }),
      upper: faker.number.int({ min: 12000, max: 15000 })
    }
  },
  validatorAddress: faker.finance.ethereumAddress().toLowerCase(),
  validatorName: faker.company.name() + ' Verification Services',
  verificationDate: faker.date.recent(),
  expiryDate: faker.date.future(),
  submittedAt: faker.date.past(),
  status: faker.helpers.arrayElement(['PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED']),
  notes: faker.lorem.paragraph(),
  metadata: {
    verificationStandard: faker.helpers.arrayElement(['VWBA 2.0', 'VCS 4.0', 'Gold Standard']),
    qualityScore: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
  },
  reviewedBy: faker.finance.ethereumAddress().toLowerCase(),
  reviewedAt: faker.date.recent(),
  reviewNotes: faker.lorem.sentence(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Evidence File fixtures
export const createMockEvidenceFile = (overrides: any = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  verificationResultId: faker.number.int({ min: 1, max: 100 }),
  evidenceType: faker.helpers.arrayElement([
    'WATER_MEASUREMENT_DATA',
    'SENSOR_DATA',
    'SATELLITE_IMAGE',
    'FIELD_REPORT',
    'CALCULATION_SHEET',
    'GPS_COORDINATES',
    'BASELINE_ASSESSMENT',
    'SITE_VERIFICATION',
    'METHODOLOGY_DOCUMENTATION'
  ]),
  fileName: faker.system.fileName(),
  originalFileName: faker.system.fileName(),
  fileHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
  ipfsCid: faker.string.alphanumeric(46),
  fileSize: BigInt(faker.number.int({ min: 1024, max: 10485760 })), // 1KB to 10MB
  mimeType: faker.helpers.arrayElement([
    'application/json',
    'application/pdf',
    'text/csv',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel'
  ]),
  captureDate: faker.date.recent(),
  captureLocation: {
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    altitude: faker.number.int({ min: 0, max: 3000 })
  },
  captureDevice: faker.helpers.arrayElement([
    'Field Sensor Model X1',
    'GPS Logger Pro',
    'Water Flow Meter 2000',
    'Digital Camera D850',
    'Smartphone GPS'
  ]),
  uploadedBy: faker.finance.ethereumAddress().toLowerCase(),
  uploadedAt: faker.date.recent(),
  processed: faker.datatype.boolean(),
  processingError: faker.datatype.boolean() ? faker.lorem.sentence() : null,
  verified: faker.datatype.boolean(),
  verifiedAt: faker.date.recent(),
  verificationHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
  metadata: {
    waterVolume: faker.number.int({ min: 1000, max: 100000 }),
    measurementPeriod: faker.number.int({ min: 1, max: 365 }),
    accuracy: faker.number.float({ min: 0.8, max: 0.99, fractionDigits: 2 }),
    gpsAccuracy: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
    instrumentCalibration: faker.date.recent().toISOString()
  },
  createdAt: faker.date.past(),
  ...overrides,
});

// Project fixtures (if not already defined)
export const createMockProject = (overrides: any = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.company.name() + ' Environmental Project',
  slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
  description: faker.lorem.paragraphs(2),
  ownerAddress: faker.finance.ethereumAddress().toLowerCase(),
  chainId: faker.helpers.arrayElement([1, 11155111]),
  contractAddress: faker.finance.ethereumAddress().toLowerCase(),
  meta: {
    location: faker.location.city() + ', ' + faker.location.country(),
    projectType: faker.helpers.arrayElement(['Water Conservation', 'Carbon Sequestration', 'Biodiversity']),
    area: faker.number.int({ min: 10, max: 1000 }) + ' hectares',
    startDate: faker.date.past().toISOString(),
    status: faker.helpers.arrayElement(['Planning', 'Active', 'Completed'])
  },
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Payment fixtures
export const createMockPayment = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userAddress: faker.finance.ethereumAddress().toLowerCase(),
  amount: faker.number.bigInt({ min: 1000000n, max: 1000000000000000000n }).toString(), // 0.001 to 1 ETH in wei
  currency: faker.helpers.arrayElement(["ETH", "USDC", "USDT"]),
  status: faker.helpers.arrayElement(["PENDING", "CONFIRMED", "FAILED", "CANCELLED"]),
  transactionHash: faker.string.hexadecimal({ length: 64, prefix: "0x" }),
  blockNumber: faker.number.bigInt({ min: 18000000n, max: 20000000n }).toString(),
  chainId: faker.helpers.arrayElement([1, 11155111]),
  paymentType: faker.helpers.arrayElement(["MINT_FEE", "TRANSFER_FEE", "UPGRADE_FEE"]),
  relatedEntityId: faker.string.uuid(),
  metadata: {
    gasUsed: faker.number.int({ min: 21000, max: 500000 }),
    gasPrice: faker.number.bigInt({ min: 1000000000n, max: 100000000000n }).toString(),
  },
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// SIWE Message fixtures
export const createMockSiweMessage = (overrides: any = {}) => {
  const address = faker.finance.ethereumAddress();
  const domain = "localhost:3000";
  const uri = "http://localhost:3000";
  const version = "1";
  const chainId = 1;
  const nonce = faker.string.alphanumeric(17);
  const issuedAt = new Date().toISOString();

  const message = `${domain} wants you to sign in with your Ethereum account:
${address}

Test SIWE message for authentication

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;

  return {
    message,
    signature: faker.string.hexadecimal({ length: 130, prefix: "0x" }),
    address,
    domain,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    ...overrides,
  };
};

// Blockchain fixtures
export const createMockTransaction = (overrides: any = {}) => ({
  hash: faker.string.hexadecimal({ length: 64, prefix: "0x" }),
  blockNumber: faker.number.bigInt({ min: 18000000n, max: 20000000n }),
  blockHash: faker.string.hexadecimal({ length: 64, prefix: "0x" }),
  transactionIndex: faker.number.int({ min: 0, max: 200 }),
  from: faker.finance.ethereumAddress().toLowerCase(),
  to: faker.finance.ethereumAddress().toLowerCase(),
  value: faker.number.bigInt({ min: 0n, max: 1000000000000000000n }),
  gasPrice: faker.number.bigInt({ min: 1000000000n, max: 100000000000n }),
  gasUsed: faker.number.bigInt({ min: 21000n, max: 500000n }),
  status: "success",
  logs: [],
  ...overrides,
});

// Test data collections
export const testFixtures = {
  users: Array.from({ length: 5 }, () => createMockUser()),
  liftTokens: Array.from({ length: 10 }, () => createMockLiftToken()),
  mintRequests: Array.from({ length: 8 }, () => createMockMintRequest()),
  payments: Array.from({ length: 12 }, () => createMockPayment()),
};

// Helper to create related test data
export const createRelatedTestData = () => {
  const user = createMockUser();
  const liftToken = createMockLiftToken({ ownerAddress: user.address });
  const mintRequest = createMockMintRequest({ 
    userAddress: user.address,
    contractAddress: liftToken.contractAddress,
    tokenId: liftToken.tokenId,
  });
  const payment = createMockPayment({ 
    userAddress: user.address,
    relatedEntityId: mintRequest.id,
    paymentType: "MINT_FEE",
  });

  return { user, liftToken, mintRequest, payment };
};