# Zero-Trust Security Database Schema Design
## Phase 14.1 - Shin AI Platform

## Overview

This document defines the comprehensive database schema for the Zero-Trust Security Architecture, including security policies, threat intelligence, audit logs, and supporting data structures. All schemas are designed for MongoDB with Mongoose ODM integration.

## Core Security Collections

### 1. Security Policies Collection

#### Policy Definition Schema
```typescript
interface ISecurityPolicy {
  id: string;
  organizationId: ObjectId;
  name: string;
  description: string;
  policyType: 'access_control' | 'network' | 'data_protection' | 'threat_detection' | 'compliance';
  category: 'identity' | 'network' | 'data' | 'application' | 'infrastructure';
  priority: number; // 1-100, higher = more restrictive
  conditions: {
    userRoles: string[];
    userGroups: ObjectId[];
    resourceTypes: string[];
    resourceIds: ObjectId[];
    timeRestrictions: TimeRestriction[];
    locationRestrictions: LocationRestriction[];
    riskThresholds: RiskThreshold[];
    customConditions: CustomCondition[];
  };
  actions: {
    allow: boolean;
    requireMFA: boolean;
    requireApproval: boolean;
    logAccess: boolean;
    encryptData: boolean;
    notifyOnViolation: boolean;
    quarantineOnThreat: boolean;
  };
  enforcement: {
    mode: 'enforce' | 'monitor' | 'disabled';
    scope: 'global' | 'organization' | 'department' | 'user';
    exceptions: PolicyException[];
  };
  compliance: {
    standards: string[]; // SOC2, GDPR, ISO27001, etc.
    controls: string[];
    evidenceRequired: boolean;
  };
  lifecycle: {
    status: 'draft' | 'active' | 'inactive' | 'deprecated';
    createdBy: ObjectId;
    approvedBy?: ObjectId;
    createdAt: Date;
    approvedAt?: Date;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    reviewDate: Date;
    version: number;
  };
  metadata: {
    tags: string[];
    businessJustification: string;
    riskAssessment: string;
    changeHistory: PolicyChange[];
  };
}
```

#### Policy Change Tracking
```typescript
interface PolicyChange {
  id: string;
  timestamp: Date;
  userId: ObjectId;
  changeType: 'create' | 'update' | 'activate' | 'deactivate' | 'delete';
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  reason: string;
  approvedBy?: ObjectId;
}
```

### 2. Threat Intelligence Collection

#### Threat Intelligence Schema
```typescript
interface IThreatIntelligence {
  id: string;
  organizationId: ObjectId;
  source: {
    name: string;
    type: 'commercial' | 'open_source' | 'government' | 'internal' | 'community';
    feedUrl?: string;
    lastUpdated: Date;
    updateFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    confidence: number; // 0-100
  };
  threat: {
    id: string;
    name: string;
    type: 'malware' | 'phishing' | 'c2' | 'exploit' | 'campaign' | 'actor' | 'infrastructure';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    description: string;
    tags: string[];
  };
  indicators: {
    file: {
      hashes: {
        md5?: string[];
        sha1?: string[];
        sha256?: string[];
        sha512?: string[];
      };
      names: string[];
      sizes: number[];
      types: string[];
    };
    network: {
      ipAddresses: string[];
      domains: string[];
      urls: string[];
      emailAddresses: string[];
      asn: string[];
    };
    behavioral: {
      patterns: BehavioralPattern[];
      signatures: string[];
      heuristics: Heuristic[];
    };
    registry: {
      keys: string[];
      values: string[];
    };
  };
  timeline: {
    firstSeen: Date;
    lastSeen: Date;
    validFrom: Date;
    validUntil?: Date;
  };
  context: {
    targetSectors: string[];
    targetRegions: string[];
    motivation: string[];
    attribution: string[];
    relatedThreats: string[];
  };
  metadata: {
    externalIds: Record<string, string>;
    references: string[];
    rawData: Record<string, any>;
    enrichment: EnrichmentData;
  };
  status: 'active' | 'inactive' | 'expired' | 'false_positive';
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Audit Logs Collection

#### Security Audit Log Schema
```typescript
interface ISecurityAuditLog {
  id: string;
  organizationId: ObjectId;
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'policy_violation' | 'threat_detected' | 'configuration_change' | 'user_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'compliance' | 'operational' | 'performance';
  source: {
    service: string;
    component: string;
    instance: string;
    ipAddress: string;
    userAgent?: string;
  };
  actor: {
    type: 'user' | 'service' | 'system' | 'api_key';
    id: ObjectId | string;
    name: string;
    roles: string[];
    permissions: string[];
  };
  target: {
    type: 'user' | 'resource' | 'data' | 'policy' | 'system';
    id: ObjectId | string;
    name: string;
    resourceType?: string;
    sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
  };
  action: {
    name: string;
    description: string;
    parameters: Record<string, any>;
    result: 'success' | 'failure' | 'partial' | 'error';
    errorMessage?: string;
    duration: number; // milliseconds
  };
  context: {
    sessionId?: string;
    requestId?: string;
    correlationId?: string;
    riskScore?: number;
    location?: GeoLocation;
    deviceFingerprint?: string;
    behavioralProfile?: BehavioralProfile;
  };
  compliance: {
    standards: string[];
    controls: string[];
    evidence: string[];
    retentionRequired: boolean;
    retentionPeriod: number; // days
  };
  metadata: {
    tags: string[];
    customFields: Record<string, any>;
    rawData: Record<string, any>;
  };
}
```

### 4. Risk Assessment Collection

#### Risk Assessment Schema
```typescript
interface IRiskAssessment {
  id: string;
  organizationId: ObjectId;
  assessmentType: 'user' | 'session' | 'request' | 'resource' | 'comprehensive';
  subject: {
    type: 'user' | 'service' | 'api_key' | 'session';
    id: ObjectId | string;
    name: string;
  };
  context: {
    ipAddress: string;
    userAgent: string;
    location: GeoLocation;
    timestamp: Date;
    sessionId?: string;
    requestId?: string;
  };
  factors: {
    identity: {
      authenticationAge: number; // minutes
      mfaStatus: boolean;
      deviceFamiliarity: number; // 0-100
      behaviorAnomaly: number; // 0-100
    };
    contextual: {
      timeOfDay: number; // 0-100
      geographicConsistency: number; // 0-100
      networkType: number; // 0-100
      accessPattern: number; // 0-100
    };
    behavioral: {
      typingPatternDeviation: number; // 0-100
      navigationAnomaly: number; // 0-100
      interactionPatternDeviation: number; // 0-100
      historicalBehaviorScore: number; // 0-100
    };
    threat: {
      threatIntelMatch: number; // 0-100
      reputationScore: number; // 0-100
      suspiciousActivityScore: number; // 0-100
      knownAttackPatternMatch: number; // 0-100
    };
  };
  scores: {
    identityScore: number; // 0-100
    contextualScore: number; // 0-100
    behavioralScore: number; // 0-100
    threatScore: number; // 0-100
    compositeScore: number; // 0-100
    confidence: number; // 0-100
  };
  decision: {
    action: 'allow' | 'deny' | 'challenge' | 'escalate' | 'monitor';
    requiredChallenges: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    justification: string;
    confidence: number; // 0-100
  };
  model: {
    version: string;
    algorithm: string;
    features: string[];
    lastTrained: Date;
  };
  createdAt: Date;
}
```

### 5. Behavioral Profiles Collection

#### User Behavioral Profile Schema
```typescript
interface IUserBehavioralProfile {
  id: string;
  userId: ObjectId;
  organizationId: ObjectId;
  profileType: 'authentication' | 'application_usage' | 'data_access' | 'comprehensive';
  baseline: {
    typingPatterns: {
      averageSpeed: number;
      errorRate: number;
      commonPauses: number[];
      rhythmPattern: number[];
    };
    navigationPatterns: {
      commonPaths: string[];
      averageSessionTime: number;
      preferredFeatures: string[];
      pageViewSequence: string[];
    };
    interactionPatterns: {
      mouseSpeed: number;
      clickFrequency: number;
      scrollBehavior: string;
      gesturePatterns: string[];
    };
    timePatterns: {
      loginHours: number[];
      activeDays: number[];
      sessionDuration: number;
      breakPatterns: number[];
    };
    accessPatterns: {
      resourceTypes: string[];
      sensitivityLevels: string[];
      accessFrequency: Record<string, number>;
      unusualAccessScore: number;
    };
  };
  deviations: {
    recentTypingDeviation: number;
    navigationAnomalyScore: number;
    interactionPatternDeviation: number;
    timeBasedAnomalyScore: number;
    accessPatternDeviation: number;
  };
  riskThresholds: {
    typingDeviationThreshold: number;
    navigationAnomalyThreshold: number;
    interactionDeviationThreshold: number;
    timeAnomalyThreshold: number;
    accessDeviationThreshold: number;
  };
  model: {
    version: string;
    lastUpdated: Date;
    trainingDataPoints: number;
    accuracy: number;
    confidence: number;
  };
  status: 'active' | 'training' | 'suspended' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Incident Management Collection

#### Security Incident Schema
```typescript
interface ISecurityIncident {
  id: string;
  organizationId: ObjectId;
  incidentId: string; // Human-readable identifier
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'phishing' | 'unauthorized_access' | 'data_breach' | 'policy_violation' | 'threat_detected';
  detection: {
    method: 'automated' | 'manual' | 'threat_intelligence' | 'user_report';
    timestamp: Date;
    confidence: number; // 0-100
    source: string;
  };
  affectedAssets: {
    type: 'user' | 'service' | 'data' | 'infrastructure' | 'application';
    id: ObjectId | string;
    name: string;
    sensitivity: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }[];
  timeline: {
    detectedAt: Date;
    reportedAt: Date;
    investigatingAt?: Date;
    containedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
  };
  assignment: {
    assignedTo: ObjectId;
    assignedAt: Date;
    escalatedTo?: ObjectId;
    escalatedAt?: Date;
  };
  response: {
    actionsTaken: IncidentAction[];
    automatedResponse: boolean;
    playbookUsed?: string;
    effectiveness: number; // 0-100
  };
  impact: {
    businessImpact: string;
    financialImpact?: number;
    reputationImpact: 'low' | 'medium' | 'high' | 'critical';
    regulatoryImpact: boolean;
    affectedUsers: number;
    dataCompromised: boolean;
  };
  compliance: {
    reportRequired: boolean;
    reportingDeadline?: Date;
    regulatoryBodies: string[];
    evidenceCollected: string[];
  };
  communication: {
    internalNotifications: CommunicationLog[];
    externalNotifications: CommunicationLog[];
    stakeholderUpdates: CommunicationLog[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Indexes and Performance Optimization

### Critical Indexes
```typescript
// Security Policies
SecurityPolicySchema.index({ organizationId: 1, policyType: 1, status: 1 });
SecurityPolicySchema.index({ organizationId: 1, priority: -1, effectiveFrom: 1 });
SecurityPolicySchema.index({ 'conditions.userRoles': 1, 'conditions.resourceTypes': 1 });

// Threat Intelligence
ThreatIntelligenceSchema.index({ organizationId: 1, 'threat.severity': 1, status: 1 });
ThreatIntelligenceSchema.index({ 'indicators.network.ipAddresses': 1 });
ThreatIntelligenceSchema.index({ 'indicators.file.hashes.sha256': 1 });
ThreatIntelligenceSchema.index({ 'timeline.lastSeen': -1 });

// Audit Logs
SecurityAuditLogSchema.index({ organizationId: 1, timestamp: -1 });
SecurityAuditLogSchema.index({ 'actor.id': 1, eventType: 1, timestamp: -1 });
SecurityAuditLogSchema.index({ 'target.id': 1, action: 1, timestamp: -1 });

// Risk Assessments
RiskAssessmentSchema.index({ organizationId: 1, 'subject.id': 1, timestamp: -1 });
RiskAssessmentSchema.index({ 'scores.compositeScore': -1, timestamp: -1 });

// Behavioral Profiles
UserBehavioralProfileSchema.index({ userId: 1, organizationId: 1, status: 1 });
UserBehavioralProfileSchema.index({ 'model.lastUpdated': -1 });

// Incidents
SecurityIncidentSchema.index({ organizationId: 1, status: 1, priority: -1 });
SecurityIncidentSchema.index({ 'timeline.detectedAt': -1 });
```

### Partitioning Strategy
```typescript
// Time-based partitioning for audit logs
const auditLogPartitioning = {
  partitionBy: 'timestamp',
  partitionSize: 'monthly', // or 'yearly' for larger datasets
  retentionPolicy: {
    active: '2 years',
    archive: '7 years',
    delete: '10 years'
  }
};

// Organization-based partitioning for multi-tenant data
const organizationPartitioning = {
  partitionBy: 'organizationId',
  subPartitionBy: 'timestamp',
  subPartitionSize: 'monthly'
};
```

## Data Retention Policies

### Security Data Retention
```typescript
const retentionPolicies = {
  // Audit logs - Keep for compliance
  securityAuditLogs: {
    active: '2 years',
    coldStorage: '5 years',
    legalHold: '7 years'
  },

  // Authentication events - Keep for security analysis
  authenticationEvents: {
    active: '1 year',
    coldStorage: '3 years'
  },

  // Threat intelligence - Keep based on validity
  threatIntelligence: {
    active: 'validUntil field',
    expired: '90 days after expiry'
  },

  // Risk assessments - Keep for trend analysis
  riskAssessments: {
    active: '2 years',
    coldStorage: '5 years'
  },

  // Behavioral profiles - Keep for continuous learning
  behavioralProfiles: {
    active: 'user active period + 1 year',
    inactive: '2 years after last activity'
  }
};
```

This comprehensive database schema provides the foundation for all Zero-Trust security functionality, ensuring data integrity, performance, and compliance requirements are met.