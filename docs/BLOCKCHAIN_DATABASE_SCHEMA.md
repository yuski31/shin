# Blockchain Database Schema Design
## Shin AI Platform - Phase 14.3

## Overview

This document defines the comprehensive database schema for blockchain integration, including model provenance tracking, smart contract interactions, cross-chain operations, and decentralized AI infrastructure.

## 1. Core Blockchain Collections

### 1.1 Blockchain Networks Collection

```typescript
interface IBlockchainNetwork extends Document {
  _id: ObjectId;
  networkId: string; // 'ethereum', 'polygon', 'solana'
  name: string;
  chainId: number;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isActive: boolean;
  isTestnet: boolean;
  features: {
    supportsEIP1559: boolean;
    supportsNFT: boolean;
    supportsDeFi: boolean;
    supportsCrossChain: boolean;
  };
  gasSettings: {
    defaultGasPrice: string;
    maxGasPrice: string;
    estimatedBlockTime: number; // in seconds
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 Smart Contracts Collection

```typescript
interface ISmartContract extends Document {
  _id: ObjectId;
  contractId: string;
  name: string;
  type: 'model_registry' | 'marketplace' | 'sla' | 'escrow' | 'arbitration' | 'token' | 'bridge';
  network: string;
  address: string;
  deployer: string;
  abi: any[];
  bytecode?: string;
  sourceCode?: string;
  compilerVersion?: string;
  optimization?: boolean;
  deployment: {
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    gasPrice: string;
    contractAddress: string;
    timestamp: Date;
  };
  interfaces: {
    methods: string[];
    events: string[];
    dependencies: string[];
  };
  metadata: Record<string, any>;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.3 Blockchain Transactions Collection

```typescript
interface IBlockchainTransaction extends Document {
  _id: ObjectId;
  txHash: string;
  network: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasUsed: string;
  gasPrice: string;
  nonce: number;
  data: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  timestamp: Date;
  contractAddress?: string;
  methodName?: string;
  decodedInput?: Record<string, any>;
  events?: ContractEvent[];
  error?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## 2. Model Provenance Collections

### 2.1 Model Registry Collection

```typescript
interface IModelRegistry extends Document {
  _id: ObjectId;
  modelId: string;
  name: string;
  description: string;
  version: string;
  framework: string;
  architecture: string;
  owner: ObjectId; // Reference to User
  organization: ObjectId; // Reference to Organization
  blockchain: {
    network: string;
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
    tokenId?: number;
  };
  ipfs: {
    modelHash: string;
    metadataHash: string;
    merkleRoot: string;
    proofs: string[];
  };
  trainingData: {
    datasetId: string;
    datasetHash: string;
    dataSources: Array<{
      source: string;
      hash: string;
      size: number;
      format: string;
      license: string;
      verificationHash: string;
    }>;
    preprocessing: Array<{
      step: string;
      parameters: Record<string, any>;
      timestamp: Date;
      hash: string;
    }>;
    validationHash: string;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    latency: number;
    throughput: number;
  };
  accessControl: {
    isPublic: boolean;
    allowedOrganizations: ObjectId[];
    allowedUsers: ObjectId[];
    license: string;
    price: number;
    currency: string;
  };
  auditTrail: Array<{
    eventType: string;
    timestamp: Date;
    actor: string;
    action: string;
    metadata: Record<string, any>;
    signature: string;
  }>;
  status: 'draft' | 'registered' | 'verified' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Training Data Provenance Collection

```typescript
interface ITrainingDataProvenance extends Document {
  _id: ObjectId;
  datasetId: string;
  name: string;
  description: string;
  owner: ObjectId;
  organization: ObjectId;
  dataHash: string;
  merkleTree: {
    root: string;
    depth: number;
    leafCount: number;
    treeHash: string;
  };
  dataSources: Array<{
    sourceId: string;
    source: string;
    hash: string;
    size: number;
    format: string;
    license: string;
    verificationHash: string;
    timestamp: Date;
  }>;
  preprocessing: Array<{
    stepId: string;
    step: string;
    parameters: Record<string, any>;
    inputHash: string;
    outputHash: string;
    timestamp: Date;
    executor: string;
  }>;
  validation: {
    validationHash: string;
    validator: string;
    validationResult: Record<string, any>;
    timestamp: Date;
  };
  accessControl: {
    isPublic: boolean;
    allowedOrganizations: ObjectId[];
    allowedUsers: ObjectId[];
  };
  blockchain: {
    network: string;
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 3. Decentralized AI Collections

### 3.1 Federated Learning Collection

```typescript
interface IFederatedLearning extends Document {
  _id: ObjectId;
  trainingId: string;
  modelId: string;
  coordinator: ObjectId;
  organization: ObjectId;
  participants: Array<{
    nodeId: string;
    organizationId: ObjectId;
    endpoint: string;
    stakeAmount: number;
    reputationScore: number;
    status: 'active' | 'inactive' | 'suspended';
    joinedAt: Date;
  }>;
  configuration: {
    rounds: number;
    epochsPerRound: number;
    batchSize: number;
    learningRate: number;
    targetAccuracy: number;
    privacyBudget: number;
  };
  currentRound: number;
  globalModel: {
    version: string;
    hash: string;
    ipfsHash: string;
    accuracy: number;
    timestamp: Date;
  };
  roundData: Array<{
    round: number;
    startTime: Date;
    endTime: Date;
    participants: string[];
    aggregatedModel: {
      hash: string;
      accuracy: number;
      size: number;
    };
    individualContributions: Array<{
      nodeId: string;
      modelHash: string;
      accuracy: number;
      latency: number;
      timestamp: Date;
    }>;
  }>;
  rewards: {
    totalDistributed: number;
    perParticipant: Record<string, number>;
    distributionTimestamp: Date;
  };
  status: 'initializing' | 'training' | 'aggregating' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Model Marketplace Collection

```typescript
interface IModelMarketplace extends Document {
  _id: ObjectId;
  listingId: string;
  modelId: string;
  seller: ObjectId;
  organization: ObjectId;
  blockchain: {
    network: string;
    contractAddress: string;
    tokenId: number;
    transactionHash: string;
  };
  nft: {
    tokenId: number;
    contractAddress: string;
    metadata: Record<string, any>;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  pricing: {
    price: number;
    currency: string;
    tokenAddress: string;
    priceHistory: Array<{
      price: number;
      timestamp: Date;
      changedBy: string;
    }>;
  };
  royalties: {
    percentage: number;
    recipient: string;
    distributionHistory: Array<{
      amount: number;
      transactionHash: string;
      timestamp: Date;
    }>;
  };
  sales: Array<{
    saleId: string;
    buyer: ObjectId;
    price: number;
    currency: string;
    transactionHash: string;
    timestamp: Date;
    escrowId: string;
  }>;
  status: 'active' | 'sold' | 'delisted' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. Smart Contract Integration Collections

### 4.1 SLA Contracts Collection

```typescript
interface ISLAContract extends Document {
  _id: ObjectId;
  slaId: string;
  name: string;
  description: string;
  serviceProvider: ObjectId;
  consumer: ObjectId;
  modelId: string;
  blockchain: {
    network: string;
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
  };
  terms: {
    performanceMetrics: Array<{
      name: string;
      threshold: number;
      unit: string;
      penaltyRate: number;
      rewardRate: number;
    }>;
    duration: number; // in seconds
    startDate: Date;
    endDate: Date;
    autoRenewal: boolean;
    terminationConditions: string[];
  };
  pricing: {
    basePrice: number;
    currency: string;
    paymentSchedule: 'upfront' | 'milestone' | 'usage_based';
    paymentTerms: Record<string, any>;
  };
  monitoring: {
    oracleAddress: string;
    dataFeeds: string[];
    monitoringInterval: number;
    alertThresholds: Record<string, number>;
  };
  performance: Array<{
    timestamp: Date;
    metrics: Record<string, number>;
    compliance: boolean;
    penalties: number;
    rewards: number;
  }>;
  disputes: Array<{
    disputeId: string;
    reason: string;
    status: 'open' | 'resolved' | 'appealed';
    resolution: Record<string, any>;
    timestamp: Date;
  }>;
  status: 'active' | 'expired' | 'terminated' | 'breached';
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Escrow Contracts Collection

```typescript
interface IEscrowContract extends Document {
  _id: ObjectId;
  escrowId: string;
  type: 'model_sale' | 'service_payment' | 'dispute_resolution';
  buyer: ObjectId;
  seller: ObjectId;
  amount: number;
  currency: string;
  tokenAddress: string;
  modelId?: string;
  slaId?: string;
  blockchain: {
    network: string;
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
  };
  multiSig: {
    signers: string[];
    requiredSignatures: number;
    currentSignatures: number;
    signatures: Record<string, {
      signature: string;
      timestamp: Date;
    }>;
  };
  conditions: {
    releaseConditions: Array<{
      type: 'time_based' | 'performance_based' | 'oracle_based';
      parameters: Record<string, any>;
      status: 'pending' | 'met' | 'failed';
    }>;
    disputePeriod: number; // in seconds
    arbitrationPeriod: number; // in seconds
  };
  funds: {
    deposited: boolean;
    released: boolean;
    disputed: boolean;
    releaseAmount: number;
    disputeAmount: number;
  };
  timeline: Array<{
    event: string;
    timestamp: Date;
    actor: string;
    metadata: Record<string, any>;
  }>;
  status: 'created' | 'funded' | 'locked' | 'released' | 'disputed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Arbitration Collection

```typescript
interface IArbitration extends Document {
  _id: ObjectId;
  arbitrationId: string;
  disputeId: string;
  escrowId: string;
  complainant: ObjectId;
  respondent: ObjectId;
  arbitrators: Array<{
    arbitratorId: string;
    address: string;
    reputation: number;
    assignedAt: Date;
    status: 'active' | 'inactive';
  }>;
  caseDetails: {
    subject: string;
    description: string;
    evidence: Array<{
      fileId: string;
      hash: string;
      ipfsHash: string;
      submittedBy: string;
      timestamp: Date;
    }>;
    amount: number;
    currency: string;
  };
  voting: {
    requiredVotes: number;
    votes: Record<string, {
      vote: 'approve' | 'reject' | 'modify';
      reasoning: string;
      timestamp: Date;
      signature: string;
    }>;
    consensus: {
      reached: boolean;
      result: 'approve' | 'reject' | 'modify';
      timestamp: Date;
    };
  };
  resolution: {
    decision: string;
    reasoning: string;
    settlement: {
      amount: number;
      recipient: string;
      transactionHash: string;
    };
    timestamp: Date;
  };
  appeals: Array<{
    appealId: string;
    appellant: string;
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: Date;
  }>;
  status: 'initiated' | 'evidence_collection' | 'voting' | 'resolved' | 'appealed';
  createdAt: Date;
  updatedAt: Date;
}
```

## 5. Cross-Chain Operations Collections

### 5.1 Cross-Chain Bridges Collection

```typescript
interface ICrossChainBridge extends Document {
  _id: ObjectId;
  bridgeId: string;
  name: string;
  type: 'wormhole' | 'layerzero' | 'axelar' | 'custom';
  sourceNetwork: string;
  targetNetwork: string;
  bridgeAddress: string;
  supportedTokens: Array<{
    symbol: string;
    address: string;
    decimals: number;
    minAmount: string;
    maxAmount: string;
  }>;
  feeStructure: {
    baseFee: string;
    percentageFee: number;
    minimumFee: string;
    maximumFee: string;
  };
  limits: {
    dailyLimit: string;
    perTransactionLimit: string;
    cooldownPeriod: number;
  };
  configuration: {
    confirmations: number;
    timeout: number;
    retryAttempts: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Bridge Transactions Collection

```typescript
interface IBridgeTransaction extends Document {
  _id: ObjectId;
  bridgeTxId: string;
  bridgeId: string;
  sourceNetwork: string;
  targetNetwork: string;
  sourceTxHash: string;
  targetTxHash?: string;
  from: string;
  to: string;
  token: {
    symbol: string;
    address: string;
    amount: string;
    decimals: number;
  };
  fees: {
    bridgeFee: string;
    gasFee: string;
    totalFee: string;
  };
  status: 'initiated' | 'source_confirmed' | 'target_initiated' | 'target_confirmed' | 'completed' | 'failed';
  confirmations: {
    sourceConfirmations: number;
    targetConfirmations: number;
  };
  timeline: Array<{
    stage: string;
    timestamp: Date;
    txHash?: string;
    metadata: Record<string, any>;
  }>;
  retryCount: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 6. Token and Incentive Collections

### 6.1 Token Staking Collection

```typescript
interface ITokenStaking extends Document {
  _id: ObjectId;
  stakingId: string;
  staker: ObjectId;
  organization: ObjectId;
  token: {
    symbol: string;
    address: string;
    amount: string;
    decimals: number;
  };
  stakingContract: {
    network: string;
    address: string;
  };
  lockPeriod: number; // in seconds
  rewardRate: number;
  startDate: Date;
  endDate: Date;
  rewards: {
    claimed: string;
    pending: string;
    total: string;
  };
  status: 'active' | 'unlocked' | 'withdrawn';
  unstakeRequest?: {
    requestedAt: Date;
    unlockDate: Date;
    amount: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 Reward Distribution Collection

```typescript
interface IRewardDistribution extends Document {
  _id: ObjectId;
  distributionId: string;
  type: 'training_participation' | 'model_validation' | 'marketplace_sale' | 'staking' | 'referral';
  recipient: ObjectId;
  organization: ObjectId;
  amount: string;
  token: {
    symbol: string;
    address: string;
    decimals: number;
  };
  reason: string;
  metadata: Record<string, any>;
  blockchain: {
    network: string;
    transactionHash: string;
    blockNumber: number;
  };
  status: 'pending' | 'distributed' | 'failed';
  distributedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 7. Analytics and Monitoring Collections

### 7.1 Blockchain Analytics Collection

```typescript
interface IBlockchainAnalytics extends Document {
  _id: ObjectId;
  date: Date;
  network: string;
  metrics: {
    transactionCount: number;
    gasUsed: string;
    averageGasPrice: string;
    networkUtilization: number;
    activeAddresses: number;
    contractInteractions: number;
  };
  performance: {
    averageBlockTime: number;
    blockSize: number;
    transactionThroughput: number;
    networkLatency: number;
  };
  economics: {
    totalValueLocked: string;
    marketCap: string;
    tradingVolume: string;
    feeRevenue: string;
  };
  createdAt: Date;
}
```

### 7.2 Smart Contract Events Collection

```typescript
interface ISmartContractEvent extends Document {
  _id: ObjectId;
  eventId: string;
  network: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  eventName: string;
  eventData: Record<string, any>;
  indexedFields: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processingAttempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 8. Indexes and Performance Optimization

### 8.1 Critical Indexes

```typescript
// Blockchain Networks
db.blockchainNetworks.createIndex({ networkId: 1 }, { unique: true });
db.blockchainNetworks.createIndex({ isActive: 1, isTestnet: 1 });

// Smart Contracts
db.smartContracts.createIndex({ contractId: 1 }, { unique: true });
db.smartContracts.createIndex({ network: 1, type: 1 });
db.smartContracts.createIndex({ address: 1, network: 1 }, { unique: true });

// Blockchain Transactions
db.blockchainTransactions.createIndex({ txHash: 1 }, { unique: true });
db.blockchainTransactions.createIndex({ network: 1, blockNumber: -1 });
db.blockchainTransactions.createIndex({ from: 1, to: 1 });
db.blockchainTransactions.createIndex({ status: 1, timestamp: -1 });

// Model Registry
db.modelRegistry.createIndex({ modelId: 1 }, { unique: true });
db.blockchainTransactions.createIndex({ owner: 1, organization: 1 });
db.modelRegistry.createIndex({ 'blockchain.network': 1, 'blockchain.tokenId': 1 });

// Cross-Chain Bridges
db.crossChainBridges.createIndex({ bridgeId: 1 }, { unique: true });
db.crossChainBridges.createIndex({ sourceNetwork: 1, targetNetwork: 1, type: 1 });

// Analytics Collections
db.blockchainAnalytics.createIndex({ date: 1, network: 1 }, { unique: true });
db.smartContractEvents.createIndex({ network: 1, contractAddress: 1, blockNumber: -1 });
```

### 8.2 Aggregation Pipelines

```typescript
// Daily Transaction Volume
const dailyVolumePipeline = [
  {
    $match: {
      timestamp: {
        $gte: new Date('2024-01-01'),
        $lt: new Date('2024-02-01')
      }
    }
  },
  {
    $group: {
      _id: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        network: '$network'
      },
      count: { $sum: 1 },
      totalValue: { $sum: { $toDecimal: '$value' } }
    }
  },
  { $sort: { '_id.date': 1 } }
];

// Model Performance Analytics
const modelPerformancePipeline = [
  {
    $match: {
      'performance.accuracy': { $exists: true }
    }
  },
  {
    $group: {
      _id: '$framework',
      avgAccuracy: { $avg: '$performance.accuracy' },
      avgLatency: { $avg: '$performance.latency' },
      modelCount: { $sum: 1 }
    }
  }
];
```

## 9. Data Retention and Cleanup Policies

### 9.1 Retention Policies

```typescript
interface RetentionPolicy {
  collection: string;
  retentionDays: number;
  archiveCollection?: string;
  cleanupSchedule: 'daily' | 'weekly' | 'monthly';
  criteria: Record<string, any>;
}

// Example retention policies
const retentionPolicies: RetentionPolicy[] = [
  {
    collection: 'blockchainTransactions',
    retentionDays: 90,
    archiveCollection: 'archivedTransactions',
    cleanupSchedule: 'daily',
    criteria: { status: 'confirmed' }
  },
  {
    collection: 'smartContractEvents',
    retentionDays: 180,
    cleanupSchedule: 'weekly',
    criteria: { processed: true }
  },
  {
    collection: 'bridgeTransactions',
    retentionDays: 365,
    cleanupSchedule: 'monthly',
    criteria: { status: { $in: ['completed', 'failed'] } }
  }
];
```

This comprehensive database schema provides a solid foundation for the blockchain integration, supporting all aspects of model provenance, decentralized AI, smart contract interactions, and cross-chain operations while ensuring optimal performance and data integrity.