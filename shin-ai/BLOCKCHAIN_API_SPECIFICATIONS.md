# Blockchain API Specifications
## Shin AI Platform - Phase 14.3

## Overview

This document defines the comprehensive API specifications for blockchain services, including model provenance, decentralized AI, smart contract interactions, and cross-chain operations.

## 1. Base API Configuration

### 1.1 Authentication and Authorization

All blockchain API endpoints require authentication using the existing NextAuth.js system with additional blockchain-specific scopes:

```typescript
interface BlockchainAuthScopes {
  scopes: [
    'blockchain:read',
    'blockchain:write',
    'models:register',
    'models:verify',
    'marketplace:trade',
    'staking:manage',
    'contracts:deploy',
    'crosschain:bridge'
  ];
}
```

### 1.2 Request/Response Format

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface FilterParams {
  network?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

## 2. Model Provenance APIs

### 2.1 Model Registration API

#### Register New Model
```typescript
POST /api/blockchain/models/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "modelId": "model_12345",
  "name": "Advanced Sentiment Classifier",
  "description": "BERT-based sentiment analysis model",
  "version": "1.0.0",
  "framework": "pytorch",
  "architecture": "bert-base-uncased",
  "trainingData": {
    "datasetId": "sentiment_dataset_v2",
    "dataHash": "0x1234...",
    "merkleRoot": "0x5678...",
    "dataSources": [
      {
        "source": "twitter_api",
        "hash": "0xabcd...",
        "size": 1000000,
        "format": "json",
        "license": "CC-BY-4.0"
      }
    ],
    "preprocessing": [
      {
        "step": "tokenization",
        "parameters": {"max_length": 512},
        "hash": "0xefgh..."
      }
    ]
  },
  "performance": {
    "accuracy": 0.92,
    "precision": 0.89,
    "recall": 0.91,
    "f1Score": 0.90,
    "latency": 45.2,
    "throughput": 1200
  },
  "accessControl": {
    "isPublic": false,
    "allowedOrganizations": ["org_123", "org_456"],
    "license": "MIT",
    "price": 100,
    "currency": "USDC"
  },
  "network": "ethereum",
  "options": {
    "createNFT": true,
    "enableMarketplace": true,
    "ipfsPin": true
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "modelId": "model_12345",
    "transactionHash": "0x1234567890abcdef...",
    "blockNumber": 18500000,
    "contractAddress": "0xabcdef1234567890...",
    "tokenId": 1,
    "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "merkleRoot": "0x5678...",
    "verificationHash": "0x9abc..."
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_12345",
    "gasUsed": "210000"
  }
}
```

#### Verify Model Provenance
```typescript
GET /api/blockchain/models/{modelId}/verify
Authorization: Bearer <token>

Query Parameters:
- network: ethereum (optional)
- includeAuditTrail: true (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "modelId": "model_12345",
    "isValid": true,
    "verificationDetails": {
      "merkleProof": ["0x1234...", "0x5678...", "0x9abc..."],
      "trainingDataHash": "0xdef0...",
      "modelHash": "0x1234...",
      "blockchainVerification": {
        "network": "ethereum",
        "contractAddress": "0xabcdef...",
        "transactionHash": "0x123456...",
        "blockNumber": 18500000
      },
      "ipfsVerification": {
        "modelHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "metadataHash": "QmYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
        "contentVerified": true
      }
    },
    "auditTrail": [
      {
        "eventType": "model_registered",
        "timestamp": "2024-01-15T10:30:00Z",
        "actor": "0x1234...abcd",
        "action": "Model registration",
        "metadata": {
          "transactionHash": "0x123456...",
          "blockNumber": 18500000
        }
      }
    ],
    "consensusValidation": {
      "validators": ["0xvalidator1...", "0xvalidator2..."],
      "signatures": ["0xsig1...", "0xsig2..."],
      "consensusReached": true,
      "timestamp": "2024-01-15T10:35:00Z"
    }
  }
}
```

### 2.2 Training Data APIs

#### Upload Training Data
```typescript
POST /api/blockchain/training-data/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- datasetId: sentiment_dataset_v2
- files: [file1.json, file2.json, ...]
- metadata: {
    "description": "Twitter sentiment dataset",
    "license": "CC-BY-4.0",
    "preprocessing": [...]
  }

Response: 201 Created
{
  "success": true,
  "data": {
    "datasetId": "sentiment_dataset_v2",
    "dataHash": "0x1234...",
    "merkleRoot": "0x5678...",
    "ipfsHashes": ["QmXXX...", "QmYYY..."],
    "fileCount": 2,
    "totalSize": 2048000
  }
}
```

#### Verify Training Data
```typescript
POST /api/blockchain/training-data/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "datasetId": "sentiment_dataset_v2",
  "merkleRoot": "0x5678...",
  "proofs": ["0x1234...", "0x5678...", "0x9abc..."],
  "dataSamples": [
    {
      "index": 0,
      "data": "...",
      "expectedHash": "0xdef0..."
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "isValid": true,
    "verificationDetails": {
      "merkleProofValid": true,
      "sampleVerification": [true, true, true],
      "overallIntegrity": 0.98
    }
  }
}
```

## 3. Decentralized AI APIs

### 3.1 Federated Learning APIs

#### Initiate Training Session
```typescript
POST /api/blockchain/federated-learning/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "modelId": "model_12345",
  "trainingConfig": {
    "rounds": 10,
    "epochsPerRound": 5,
    "batchSize": 32,
    "learningRate": 0.001,
    "targetAccuracy": 0.95,
    "privacyBudget": 0.1
  },
  "participantCriteria": {
    "minStake": 1000,
    "minReputation": 0.8,
    "maxParticipants": 50,
    "geographicDistribution": "global"
  },
  "rewardStructure": {
    "baseReward": 100,
    "accuracyBonus": 50,
    "speedBonus": 25,
    "consistencyBonus": 25
  },
  "network": "ethereum"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "trainingId": "training_12345",
    "coordinatorAddress": "0x1234...abcd",
    "smartContractAddress": "0x5678...efgh",
    "transactionHash": "0x9abc...ijkl",
    "estimatedDuration": 86400,
    "requiredStake": 1000
  }
}
```

#### Join Training Session
```typescript
POST /api/blockchain/federated-learning/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "trainingId": "training_12345",
  "nodeConfig": {
    "endpoint": "https://node1.shin-ai.com",
    "computePower": 8,
    "memory": 32,
    "supportedFrameworks": ["pytorch", "tensorflow"],
    "maxModelSize": 1000000000
  },
  "stakeAmount": 1000,
  "network": "ethereum"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "participantId": "participant_123",
    "stakeTransactionHash": "0x1234...abcd",
    "coordinatorEndpoint": "https://coordinator.shin-ai.com",
    "initialModelHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

### 3.2 Model Marketplace APIs

#### List Model for Sale
```typescript
POST /api/blockchain/marketplace/list
Authorization: Bearer <token>
Content-Type: application/json

{
  "modelId": "model_12345",
  "pricing": {
    "price": 1000,
    "currency": "USDC",
    "tokenAddress": "0xa0b86a33e6b6eb3d...",
    "priceType": "fixed"
  },
  "royalties": {
    "percentage": 5,
    "recipient": "0x1234...abcd"
  },
  "terms": {
    "license": "MIT",
    "usageRestrictions": ["commercial_use", "modification_allowed"],
    "supportLevel": "basic",
    "duration": 365
  },
  "network": "ethereum",
  "options": {
    "createNFT": true,
    "enableAuction": false,
    "autoRelist": true
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "listingId": "listing_12345",
    "tokenId": 1,
    "nftContractAddress": "0x5678...efgh",
    "transactionHash": "0x9abc...ijkl",
    "marketplaceUrl": "https://marketplace.shin-ai.com/listing/12345"
  }
}
```

#### Purchase Model
```typescript
POST /api/blockchain/marketplace/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "listingId": "listing_12345",
  "buyerAddress": "0x9876...wxyz",
  "payment": {
    "tokenAddress": "0xa0b86a33e6b6eb3d...",
    "amount": 1000,
    "currency": "USDC"
  },
  "escrowOptions": {
    "useEscrow": true,
    "disputePeriod": 7,
    "arbitrationRequired": true
  },
  "network": "ethereum"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "purchaseId": "purchase_12345",
    "escrowId": "escrow_12345",
    "transactionHash": "0x1234...abcd",
    "status": "pending_escrow",
    "accessCredentials": {
      "modelDownloadUrl": "https://ipfs.shin-ai.com/QmXXX...",
      "decryptionKey": "encrypted_key_123",
      "accessToken": "access_token_456"
    }
  }
}
```

## 4. Smart Contract APIs

### 4.1 SLA Management APIs

#### Create SLA Contract
```typescript
POST /api/blockchain/sla/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Model Access SLA",
  "description": "Service level agreement for premium model access",
  "serviceProvider": "0x1234...abcd",
  "consumer": "0x5678...efgh",
  "modelId": "model_12345",
  "terms": {
    "performanceMetrics": [
      {
        "name": "accuracy",
        "threshold": 0.9,
        "unit": "percentage",
        "penaltyRate": 0.1,
        "rewardRate": 0.05
      },
      {
        "name": "latency",
        "threshold": 100,
        "unit": "milliseconds",
        "penaltyRate": 0.05,
        "rewardRate": 0.02
      }
    ],
    "duration": 2592000, // 30 days
    "paymentSchedule": "monthly",
    "autoRenewal": true
  },
  "pricing": {
    "basePrice": 500,
    "currency": "USDC",
    "paymentTerms": {
      "dueDate": "2024-02-15",
      "lateFee": 0.02
    }
  },
  "monitoring": {
    "oracleAddress": "0xfeed...face",
    "dataFeeds": ["accuracy_feed", "latency_feed"],
    "monitoringInterval": 3600,
    "alertThresholds": {
      "accuracy": 0.85,
      "latency": 150
    }
  },
  "network": "ethereum"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "slaId": "sla_12345",
    "contractAddress": "0x9abc...def0",
    "transactionHash": "0x1234...5678",
    "oracleJobId": "oracle_job_123",
    "monitoringDashboard": "https://monitoring.shin-ai.com/sla/12345"
  }
}
```

#### Monitor SLA Performance
```typescript
GET /api/blockchain/sla/{slaId}/performance
Authorization: Bearer <token>

Query Parameters:
- period: 30d (optional)
- includeDetails: true (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "slaId": "sla_12345",
    "overallCompliance": 0.95,
    "performanceMetrics": [
      {
        "name": "accuracy",
        "currentValue": 0.92,
        "threshold": 0.9,
        "compliance": true,
        "trend": "stable",
        "history": [...]
      },
      {
        "name": "latency",
        "currentValue": 85,
        "threshold": 100,
        "compliance": true,
        "trend": "improving",
        "history": [...]
      }
    ],
    "penalties": {
      "total": 25,
      "currency": "USDC",
      "breakdown": [...]
    },
    "rewards": {
      "total": 50,
      "currency": "USDC",
      "breakdown": [...]
    },
    "nextEvaluation": "2024-01-15T12:00:00Z"
  }
}
```

### 4.2 Escrow Management APIs

#### Create Escrow
```typescript
POST /api/blockchain/escrow/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "model_sale",
  "buyer": "0x1234...abcd",
  "seller": "0x5678...efgh",
  "amount": 1000,
  "currency": "USDC",
  "tokenAddress": "0xa0b8...6a33",
  "modelId": "model_12345",
  "conditions": {
    "releaseConditions": [
      {
        "type": "performance_based",
        "parameters": {
          "accuracyThreshold": 0.9,
          "evaluationPeriod": 7
        }
      },
      {
        "type": "time_based",
        "parameters": {
          "releaseTime": 1640995200,
          "canEarlyRelease": true
        }
      }
    ],
    "disputePeriod": 604800, // 7 days
    "arbitrationRequired": true
  },
  "multiSig": {
    "signers": ["0x1234...abcd", "0x5678...efgh", "0x9abc...def0"],
    "requiredSignatures": 2
  },
  "network": "ethereum"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "escrowId": "escrow_12345",
    "contractAddress": "0xdef0...1234",
    "transactionHash": "0x5678...9abc",
    "status": "created",
    "depositDeadline": "2024-01-15T18:00:00Z"
  }
}
```

#### Release Escrow Funds
```typescript
POST /api/blockchain/escrow/{escrowId}/release
Authorization: Bearer <token>
Content-Type: application/json

{
  "releaseType": "partial",
  "amount": 800,
  "reason": "Performance milestone achieved",
  "evidence": [
    {
      "type": "performance_report",
      "hash": "0x1234...",
      "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  ],
  "signatures": [
    {
      "signer": "0x1234...abcd",
      "signature": "0xsig1..."
    },
    {
      "signer": "0x5678...efgh",
      "signature": "0xsig2..."
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "releaseId": "release_12345",
    "transactionHash": "0x9abc...def0",
    "amountReleased": 800,
    "remainingAmount": 200,
    "recipient": "0x5678...efgh",
    "status": "partial_release"
  }
}
```

## 5. Cross-Chain APIs

### 5.1 Bridge Operations

#### Initiate Cross-Chain Transfer
```typescript
POST /api/blockchain/bridge/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "sourceNetwork": "ethereum",
  "targetNetwork": "polygon",
  "token": {
    "symbol": "USDC",
    "address": "0xa0b86a33e6b6eb3d...",
    "amount": 1000,
    "decimals": 6
  },
  "recipient": "0x1234...abcd",
  "bridgeType": "axelar",
  "options": {
    "useNativeBridge": false,
    "maxSlippage": 0.005,
    "deadline": 1640995200
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "bridgeTxId": "bridge_12345",
    "sourceTxHash": "0x1234...5678",
    "estimatedTargetTxHash": "0x9abc...def0",
    "estimatedDuration": 300,
    "fees": {
      "bridgeFee": 5,
      "gasFee": 15,
      "totalFee": 20
    },
    "status": "source_initiated"
  }
}
```

#### Check Bridge Status
```typescript
GET /api/blockchain/bridge/{bridgeTxId}/status
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "bridgeTxId": "bridge_12345",
    "sourceNetwork": "ethereum",
    "targetNetwork": "polygon",
    "status": "target_confirmed",
    "progress": [
      {
        "stage": "source_initiated",
        "timestamp": "2024-01-15T10:00:00Z",
        "txHash": "0x1234...5678"
      },
      {
        "stage": "source_confirmed",
        "timestamp": "2024-01-15T10:05:00Z",
        "confirmations": 12
      },
      {
        "stage": "target_initiated",
        "timestamp": "2024-01-15T10:10:00Z",
        "txHash": "0x9abc...def0"
      },
      {
        "stage": "target_confirmed",
        "timestamp": "2024-01-15T10:15:00Z",
        "confirmations": 32
      }
    ],
    "completionTime": "2024-01-15T10:15:00Z"
  }
}
```

## 6. Token and Staking APIs

### 6.1 Staking Management

#### Stake Tokens
```typescript
POST /api/blockchain/staking/stake
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": {
    "symbol": "SHIN",
    "address": "0x1234...abcd",
    "amount": 1000,
    "decimals": 18
  },
  "lockPeriod": 2592000, // 30 days
  "stakingContract": {
    "network": "ethereum",
    "address": "0x5678...efgh"
  },
  "options": {
    "autoRestake": true,
    "compoundRewards": true
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "stakingId": "staking_12345",
    "transactionHash": "0x9abc...def0",
    "stakedAmount": 1000,
    "lockPeriod": 2592000,
    "rewardRate": 0.12,
    "unlockDate": "2024-02-14T10:00:00Z",
    "expectedRewards": 120
  }
}
```

#### Claim Rewards
```typescript
POST /api/blockchain/staking/claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "stakingId": "staking_12345",
  "amount": 120,
  "options": {
    "restake": false,
    "compound": true
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "claimId": "claim_12345",
    "transactionHash": "0x1234...5678",
    "claimedAmount": 120,
    "recipient": "0x9876...wxyz",
    "newStakeAmount": 1000,
    "updatedRewardRate": 0.12
  }
}
```

## 7. Analytics and Reporting APIs

### 7.1 Blockchain Analytics

#### Get Network Analytics
```typescript
GET /api/blockchain/analytics/networks
Authorization: Bearer <token>

Query Parameters:
- network: ethereum (optional)
- period: 24h (optional)
- metrics: transactions,gas,performance (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "networks": [
      {
        "network": "ethereum",
        "metrics": {
          "transactionCount": 1250000,
          "gasUsed": "150000000000",
          "averageGasPrice": "25000000000",
          "networkUtilization": 0.75,
          "activeAddresses": 450000
        },
        "performance": {
          "averageBlockTime": 12.5,
          "blockSize": 85000,
          "transactionThroughput": 15.2,
          "networkLatency": 45
        },
        "economics": {
          "totalValueLocked": "25000000000",
          "marketCap": "300000000000",
          "tradingVolume": "1500000000",
          "feeRevenue": "45000000"
        }
      }
    ],
    "summary": {
      "totalTransactions": 1250000,
      "totalValueLocked": "25000000000",
      "averageUtilization": 0.75
    }
  }
}
```

### 7.2 Model Performance Analytics

#### Get Model Analytics
```typescript
GET /api/blockchain/analytics/models
Authorization: Bearer <token>

Query Parameters:
- modelId: model_12345 (optional)
- period: 30d (optional)
- metrics: performance,usage,market (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "models": [
      {
        "modelId": "model_12345",
        "performance": {
          "accuracy": 0.92,
          "precision": 0.89,
          "recall": 0.91,
          "f1Score": 0.90,
          "latency": 45.2,
          "throughput": 1200
        },
        "usage": {
          "totalInferences": 150000,
          "uniqueUsers": 450,
          "averageDailyUsage": 5000,
          "peakUsage": 12000
        },
        "market": {
          "listingPrice": 1000,
          "tradingVolume": 50000,
          "royaltyEarned": 2500,
          "marketRank": 15
        },
        "trends": {
          "accuracy": "stable",
          "usage": "increasing",
          "price": "stable"
        }
      }
    ],
    "summary": {
      "totalModels": 1250,
      "activeModels": 890,
      "totalValue": 1250000,
      "averagePerformance": 0.88
    }
  }
}
```

## 8. Error Handling and Status Codes

### 8.1 Standard Error Responses

```typescript
// Authentication Error
401 Unauthorized
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid or expired token",
    "details": {
      "reason": "token_expired",
      "expiresAt": "2024-01-15T09:00:00Z"
    }
  }
}

// Validation Error
400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_001",
    "message": "Invalid request parameters",
    "details": {
      "field": "amount",
      "reason": "must be greater than 0",
      "provided": -100
    }
  }
}

// Blockchain Error
502 Bad Gateway
{
  "success": false,
  "error": {
    "code": "BLOCKCHAIN_001",
    "message": "Blockchain network error",
    "details": {
      "network": "ethereum",
      "reason": "network_congestion",
      "retryAfter": 30
    }
  }
}

// Rate Limiting
429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_001",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": "2024-01-15T11:00:00Z"
    }
  }
}
```

### 8.2 Status Codes Reference

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET/PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required/failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | External service error |
| 503 | Service Unavailable | Service temporarily unavailable |

This comprehensive API specification provides a complete interface for all blockchain operations, ensuring consistent, secure, and well-documented access to the Shin AI Platform's blockchain functionality.