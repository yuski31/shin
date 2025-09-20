# Zero-Trust Security API Specifications
## Phase 14.1 - Shin AI Platform

## Overview

This document defines the comprehensive REST API specifications for the Zero-Trust Security Architecture, including all security services, policy enforcement, threat intelligence, and monitoring endpoints. All APIs follow RESTful conventions and include proper authentication, authorization, and error handling.

## Base URL and Authentication

### Base URL
```
https://api.shin-ai.com/security/v1
```

### Authentication
All security API endpoints require authentication using:
- **API Key Authentication**: `X-API-Key` header with valid API key
- **Bearer Token Authentication**: `Authorization: Bearer <token>` header
- **Session-based Authentication**: For user-specific operations

### Common Headers
```http
Content-Type: application/json
X-API-Key: sk-shin-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Authorization: Bearer <jwt_token>
X-Organization-ID: <organization_id>
X-Request-ID: <unique_request_id>
```

## API Endpoints

### 1. Identity & Access Management APIs

#### 1.1 Continuous Authentication API
```http
# Validate user session with behavioral data
POST /api/security/auth/validate-session
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "sessionId": "sess_123456789",
  "behavioralData": {
    "typingSpeed": 45.2,
    "mouseMovements": [...],
    "navigationPath": ["/dashboard", "/projects", "/settings"],
    "interactionPatterns": {...}
  },
  "contextualData": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 100
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

Response: 200 OK
{
  "valid": true,
  "riskScore": 15,
  "challenges": [],
  "sessionExtended": true,
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

#### 1.2 Risk Assessment API
```http
# Assess risk for user action
POST /api/security/risk/assess
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_123",
  "action": "data_access",
  "resource": {
    "type": "document",
    "id": "doc_456",
    "sensitivity": "confidential"
  },
  "context": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "location": {...},
    "timestamp": "2024-01-15T10:30:00Z",
    "sessionId": "sess_123456789"
  }
}

Response: 200 OK
{
  "assessmentId": "risk_123456789",
  "riskScore": 25,
  "riskLevel": "low",
  "factors": {
    "identity": 10,
    "contextual": 15,
    "behavioral": 20,
    "threat": 5
  },
  "decision": {
    "action": "allow",
    "challenges": [],
    "justification": "Normal user behavior pattern detected"
  },
  "confidence": 0.95
}
```

#### 1.3 Adaptive MFA API
```http
# Get appropriate MFA challenge type
GET /api/security/mfa/challenge-type/{userId}
Authorization: Bearer <token>

Response: 200 OK
{
  "challengeType": "multi_factor",
  "factors": [
    {
      "type": "push_notification",
      "target": "user_mobile_device",
      "priority": 1
    },
    {
      "type": "authenticator_app",
      "target": "user_phone",
      "priority": 2
    }
  ],
  "reason": "High-value resource access detected",
  "expiresAt": "2024-01-15T10:35:00Z"
}

# Initiate MFA challenge
POST /api/security/mfa/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_123",
  "challengeType": "multi_factor",
  "targetFactors": ["push_notification", "authenticator_app"],
  "context": {
    "reason": "Sensitive data access",
    "riskScore": 25,
    "ipAddress": "192.168.1.100"
  }
}

Response: 200 OK
{
  "challengeId": "mfa_123456789",
  "factors": [
    {
      "id": "push_001",
      "type": "push_notification",
      "status": "pending",
      "expiresAt": "2024-01-15T10:35:00Z"
    }
  ],
  "expiresAt": "2024-01-15T10:35:00Z"
}
```

### 2. Policy Management APIs

#### 2.1 Security Policy API
```http
# Create security policy
POST /api/security/policies
Authorization: Bearer <token>
X-API-Key: <admin_api_key>
Content-Type: application/json

{
  "name": "Confidential Data Access Policy",
  "description": "Controls access to confidential data",
  "policyType": "access_control",
  "category": "data",
  "priority": 80,
  "conditions": {
    "userRoles": ["data_analyst", "data_scientist"],
    "resourceTypes": ["database", "document"],
    "timeRestrictions": [
      {
        "type": "business_hours",
        "timezone": "America/New_York"
      }
    ],
    "riskThresholds": [
      {
        "type": "composite_risk",
        "maxScore": 30
      }
    ]
  },
  "actions": {
    "allow": true,
    "requireMFA": true,
    "requireApproval": false,
    "logAccess": true,
    "encryptData": true
  },
  "enforcement": {
    "mode": "enforce",
    "scope": "organization"
  },
  "compliance": {
    "standards": ["SOC2", "GDPR"],
    "controls": ["AC-3", "AU-2"]
  }
}

Response: 201 Created
{
  "policyId": "policy_123456789",
  "name": "Confidential Data Access Policy",
  "status": "active",
  "version": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "effectiveFrom": "2024-01-15T10:30:00Z"
}
```

#### 2.2 Policy Evaluation API
```http
# Evaluate policies for request
POST /api/security/policies/evaluate
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_123",
  "action": "read",
  "resource": {
    "type": "document",
    "id": "doc_456",
    "classification": "confidential"
  },
  "context": {
    "ipAddress": "192.168.1.100",
    "timestamp": "2024-01-15T10:30:00Z",
    "sessionId": "sess_123456789"
  }
}

Response: 200 OK
{
  "evaluationId": "eval_123456789",
  "decision": "allow",
  "matchedPolicies": [
    {
      "policyId": "policy_123456789",
      "name": "Confidential Data Access Policy",
      "priority": 80,
      "conditions": ["user_role", "time_restriction", "risk_threshold"],
      "actions": ["require_mfa", "log_access", "encrypt_data"]
    }
  ],
  "requiredActions": [
    {
      "type": "mfa_challenge",
      "parameters": {
        "factors": ["push_notification"],
        "timeout": 300
      }
    }
  ],
  "auditLogId": "audit_123456789"
}
```

### 3. Threat Intelligence APIs

#### 3.1 Threat Intelligence API
```http
# Get threat indicators
GET /api/security/threat-intelligence/indicators
Authorization: Bearer <token>
Content-Type: application/json

Query Parameters:
- type: malware, phishing, c2, exploit
- confidence: 0-100
- severity: low, medium, high, critical
- limit: 1-1000
- offset: 0-10000
- dateFrom: 2024-01-01T00:00:00Z
- dateTo: 2024-01-15T23:59:59Z

Response: 200 OK
{
  "indicators": [
    {
      "id": "threat_123456789",
      "type": "malware",
      "name": "Emotet Trojan",
      "severity": "high",
      "confidence": 95,
      "indicators": {
        "file": {
          "hashes": {
            "sha256": ["abc123..."]
          }
        },
        "network": {
          "ipAddresses": ["192.168.1.100"],
          "domains": ["malicious-domain.com"]
        }
      },
      "firstSeen": "2024-01-10T00:00:00Z",
      "lastSeen": "2024-01-15T10:00:00Z",
      "tags": ["banking", "credential_theft", "persistence"]
    }
  ],
  "totalCount": 150,
  "hasMore": true,
  "nextOffset": 100
}
```

#### 3.2 IOC Detection API
```http
# Scan for indicators of compromise
POST /api/security/ioc/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "scanType": "comprehensive",
  "targets": [
    {
      "type": "file",
      "path": "/app/uploads/document.pdf",
      "hash": "abc123def456..."
    },
    {
      "type": "network",
      "ipAddress": "192.168.1.100",
      "domain": "example.com"
    }
  ],
  "scanDepth": "deep",
  "includeThreatIntel": true,
  "correlationEnabled": true
}

Response: 200 OK
{
  "scanId": "scan_123456789",
  "status": "completed",
  "detections": [
    {
      "type": "file_hash_match",
      "indicator": {
        "type": "file_hash",
        "value": "abc123def456...",
        "context": "SHA256 hash match"
      },
      "matchedThreat": {
        "threatId": "threat_123456789",
        "name": "Emotet Trojan",
        "confidence": 95,
        "severity": "high"
      },
      "affectedAssets": [
        {
          "type": "file",
          "id": "file_456",
          "name": "document.pdf"
        }
      ],
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "totalScanned": 2,
    "detectionsFound": 1,
    "highSeverity": 1,
    "mediumSeverity": 0,
    "lowSeverity": 0
  }
}
```

### 4. Micro-segmentation APIs

#### 4.1 Network Policy API
```http
# Create network policy
POST /api/security/network-policies
Authorization: Bearer <token>
X-API-Key: <admin_api_key>
Content-Type: application/json

{
  "name": "AI Service Isolation",
  "description": "Isolates AI services from general network",
  "policyType": "kubernetes_network_policy",
  "source": {
    "services": ["ai-service", "ml-pipeline"],
    "namespaces": ["ai-production"],
    "labels": {
      "app": "ai-service"
    }
  },
  "destination": {
    "services": ["database", "cache"],
    "namespaces": ["data-services"],
    "labels": {
      "component": "database"
    }
  },
  "rules": {
    "protocols": ["TCP"],
    "ports": [5432, 6379],
    "actions": ["allow", "log", "encrypt"]
  },
  "conditions": {
    "timeWindows": [
      {
        "start": "09:00",
        "end": "17:00",
        "timezone": "UTC",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      }
    ],
    "riskThresholds": [30]
  }
}

Response: 201 Created
{
  "policyId": "netpol_123456789",
  "name": "AI Service Isolation",
  "status": "active",
  "appliedTo": {
    "namespaces": ["ai-production"],
    "services": ["ai-service", "ml-pipeline"]
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 4.2 Data Classification API
```http
# Classify data automatically
POST /api/security/data/classify
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "customerName": "John Doe",
    "email": "john.doe@example.com",
    "ssn": "123-45-6789",
    "creditCard": "4111-1111-1111-1111",
    "medicalHistory": "Patient has diabetes...",
    "financialData": {
      "accountBalance": 50000,
      "transactionHistory": [...]
    }
  },
  "context": {
    "source": "user_input",
    "application": "customer_portal",
    "userId": "user_123",
    "organizationId": "org_456"
  },
  "classificationRules": {
    "useDefaults": true,
    "customRules": [
      {
        "fieldPattern": "ssn|social_security",
        "classification": "restricted"
      }
    ]
  }
}

Response: 200 OK
{
  "classificationId": "class_123456789",
  "dataClassification": {
    "customerName": "confidential",
    "email": "internal",
    "ssn": "restricted",
    "creditCard": "restricted",
    "medicalHistory": "restricted",
    "financialData": {
      "accountBalance": "confidential",
      "transactionHistory": "confidential"
    }
  },
  "protectionRequirements": {
    "encryptionRequired": ["ssn", "creditCard", "medicalHistory"],
    "accessLogging": ["ssn", "creditCard", "medicalHistory"],
    "approvalRequired": ["ssn", "medicalHistory"],
    "tokenization": ["ssn", "creditCard"]
  },
  "complianceFlags": ["GDPR", "HIPAA", "PCI-DSS"]
}
```

### 5. Monitoring & Observability APIs

#### 5.1 Security Events API
```http
# Get security events
GET /api/security/events
Authorization: Bearer <token>
Content-Type: application/json

Query Parameters:
- eventType: authentication, authorization, data_access, threat_detected
- severity: low, medium, high, critical
- organizationId: org_123
- userId: user_456
- dateFrom: 2024-01-01T00:00:00Z
- dateTo: 2024-01-15T23:59:59Z
- limit: 1-1000
- offset: 0-10000

Response: 200 OK
{
  "events": [
    {
      "eventId": "event_123456789",
      "timestamp": "2024-01-15T10:30:00Z",
      "eventType": "threat_detected",
      "severity": "high",
      "category": "security",
      "source": {
        "service": "threat_intelligence",
        "component": "ioc_detection",
        "ipAddress": "192.168.1.100"
      },
      "actor": {
        "type": "system",
        "id": "system",
        "name": "Threat Detection Engine"
      },
      "target": {
        "type": "file",
        "id": "file_456",
        "name": "malicious_document.pdf"
      },
      "action": {
        "name": "malware_detected",
        "description": "Malware signature match detected",
        "result": "blocked",
        "parameters": {
          "signature": "Emotet.Trojan",
          "confidence": 95
        }
      },
      "context": {
        "riskScore": 85,
        "location": {
          "country": "US",
          "region": "CA",
          "city": "San Francisco"
        }
      }
    }
  ],
  "totalCount": 1250,
  "summary": {
    "bySeverity": {
      "low": 800,
      "medium": 300,
      "high": 120,
      "critical": 30
    },
    "byType": {
      "authentication": 500,
      "authorization": 200,
      "data_access": 400,
      "threat_detected": 150
    }
  }
}
```

#### 5.2 Compliance Reporting API
```http
# Generate compliance report
POST /api/security/compliance/report
Authorization: Bearer <token>
X-API-Key: <admin_api_key>
Content-Type: application/json

{
  "reportType": "soc2_type2",
  "standards": ["SOC2", "GDPR", "ISO27001"],
  "dateRange": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-31T23:59:59Z"
  },
  "scope": {
    "organizationId": "org_123",
    "services": ["api_gateway", "authentication", "data_processing"],
    "regions": ["us-west-2", "eu-west-1"]
  },
  "format": "json",
  "includeEvidence": true
}

Response: 200 OK
{
  "reportId": "report_123456789",
  "status": "generating",
  "estimatedCompletion": "2024-01-15T10:45:00Z",
  "progress": 0
}

# Get report status
GET /api/security/compliance/report/{reportId}
Authorization: Bearer <token>

Response: 200 OK
{
  "reportId": "report_123456789",
  "status": "completed",
  "progress": 100,
  "result": {
    "reportType": "soc2_type2",
    "standards": ["SOC2", "GDPR", "ISO27001"],
    "overallCompliance": 0.95,
    "controls": [
      {
        "controlId": "CC6.1",
        "name": "Logical Access Security",
        "status": "compliant",
        "evidence": [
          {
            "type": "policy",
            "id": "policy_123",
            "description": "Access Control Policy"
          },
          {
            "type": "audit_log",
            "id": "audit_456",
            "description": "Access control audit logs"
          }
        ]
      }
    ],
    "findings": [
      {
        "severity": "medium",
        "control": "CC6.1",
        "description": "Missing MFA enforcement for admin accounts",
        "recommendation": "Implement MFA for all admin accounts",
        "deadline": "2024-02-15T00:00:00Z"
      }
    ]
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "SECURITY_VALIDATION_FAILED",
    "message": "Security policy validation failed",
    "details": {
      "policyId": "policy_123",
      "violation": "insufficient_privileges",
      "requiredRole": "admin",
      "userRole": "user"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "correlationId": "corr_987654321"
  },
  "retry": {
    "allowed": true,
    "after": 30000,
    "maxAttempts": 3
  }
}
```

### Common HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 2024-01-15T11:00:00Z
X-RateLimit-Retry-After: 600
```

### Rate Limit Rules
- **Authentication endpoints**: 10 requests per minute per user
- **Policy management**: 100 requests per minute per organization
- **Threat intelligence**: 1000 requests per minute per organization
- **Event queries**: 500 requests per minute per user

This comprehensive API specification provides all the interfaces needed for the Zero-Trust Security Architecture, ensuring consistent, secure, and well-documented access to security services.