import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityVulnerability {
  id: string; // CVE ID or custom identifier
  type: 'injection' | 'xss' | 'csrf' | 'auth' | 'crypto' | 'config' | 'dependency' | 'custom';
  category: 'owasp' | 'cwe' | 'sans' | 'custom';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  codeSnippet?: string;
  cwe?: string; // CWE identifier
  cve?: string; // CVE identifier
  cvss?: number; // CVSS score (0-10)
  references: string[]; // URLs to documentation
  tags: string[];
  metadata: {
    scanner: string; // Tool name
    scannerVersion: string;
    rule: string; // Rule identifier
    confidence: number; // 0-1 score
    createdAt: Date;
    falsePositive?: boolean;
    falsePositiveReason?: string;
    remediation?: {
      effort: 'low' | 'medium' | 'high';
      complexity: 'low' | 'medium' | 'high';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      estimatedTime: number; // hours
    };
  };
}

export interface ISecurityScan extends Document {
  workspaceId: mongoose.Types.ObjectId;
  codeVersionId: mongoose.Types.ObjectId;
  scanId: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type: 'sast' | 'dast' | 'dependency' | 'container' | 'infrastructure' | 'custom';
  tool: string; // Scanner tool name
  toolVersion: string;
  vulnerabilities: ISecurityVulnerability[];
  summary: {
    totalVulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    falsePositives: number;
    confirmed: number;
    riskScore: number; // 0-100
    complianceScore: number; // 0-100
    scanCoverage: number; // percentage
  };
  configuration: {
    scanRules: Record<string, any>;
    excludePatterns: string[];
    includePatterns: string[];
    thresholds: {
      maxCritical: number;
      maxHigh: number;
      minComplianceScore: number;
    };
    customChecks: string[];
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    completedAt?: Date;
    duration?: number; // milliseconds
    triggeredBy: 'manual' | 'commit' | 'push' | 'schedule' | 'pr' | 'deployment';
    commitHash?: string;
    branch?: string;
    pullRequest?: string;
    target: 'code' | 'dependencies' | 'infrastructure' | 'container';
    environment: 'development' | 'staging' | 'production';
    baselineScanId?: string; // Previous scan for comparison
    tags: string[];
    labels: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SecurityVulnerabilitySchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['injection', 'xss', 'csrf', 'auth', 'crypto', 'config', 'dependency', 'custom'],
    required: true,
  },
  category: {
    type: String,
    enum: ['owasp', 'cwe', 'sans', 'custom'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  impact: {
    type: String,
    required: true,
  },
  recommendation: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  line: {
    type: Number,
    required: true,
  },
  column: {
    type: Number,
    required: true,
  },
  endLine: Number,
  endColumn: Number,
  codeSnippet: String,
  cwe: String,
  cve: String,
  cvss: Number,
  references: [String],
  tags: [String],
  metadata: {
    scanner: String,
    scannerVersion: String,
    rule: String,
    confidence: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    falsePositive: Boolean,
    falsePositiveReason: String,
    remediation: {
      effort: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      complexity: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      estimatedTime: Number,
    },
  },
}, { _id: true });

const SecurityScanSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  codeVersionId: {
    type: Schema.Types.ObjectId,
    ref: 'CodeVersion',
    required: true,
  },
  scanId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['sast', 'dast', 'dependency', 'container', 'infrastructure', 'custom'],
    required: true,
  },
  tool: {
    type: String,
    required: true,
  },
  toolVersion: {
    type: String,
    required: true,
  },
  vulnerabilities: [SecurityVulnerabilitySchema],
  summary: {
    totalVulnerabilities: {
      type: Number,
      default: 0,
    },
    critical: {
      type: Number,
      default: 0,
    },
    high: {
      type: Number,
      default: 0,
    },
    medium: {
      type: Number,
      default: 0,
    },
    low: {
      type: Number,
      default: 0,
    },
    info: {
      type: Number,
      default: 0,
    },
    falsePositives: {
      type: Number,
      default: 0,
    },
    confirmed: {
      type: Number,
      default: 0,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    complianceScore: {
      type: Number,
      default: 100,
    },
    scanCoverage: {
      type: Number,
      default: 100,
    },
  },
  configuration: {
    scanRules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    excludePatterns: [String],
    includePatterns: [String],
    thresholds: {
      maxCritical: {
        type: Number,
        default: 0,
      },
      maxHigh: {
        type: Number,
        default: 5,
      },
      minComplianceScore: {
        type: Number,
        default: 80,
      },
    },
    customChecks: [String],
  },
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    duration: Number,
    triggeredBy: {
      type: String,
      enum: ['manual', 'commit', 'push', 'schedule', 'pr', 'deployment'],
      default: 'manual',
    },
    commitHash: String,
    branch: String,
    pullRequest: String,
    target: {
      type: String,
      enum: ['code', 'dependencies', 'infrastructure', 'container'],
      default: 'code',
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
    },
    baselineScanId: String,
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
SecurityScanSchema.index({ workspaceId: 1 });
SecurityScanSchema.index({ codeVersionId: 1 });
SecurityScanSchema.index({ scanId: 1 }, { unique: true });
SecurityScanSchema.index({ 'metadata.createdBy': 1 });
SecurityScanSchema.index({ status: 1 });
SecurityScanSchema.index({ type: 1 });
SecurityScanSchema.index({ 'metadata.createdAt': -1 });
SecurityScanSchema.index({ 'summary.riskScore': -1 });

// Pre-save middleware to generate scanId
SecurityScanSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isNew && !doc.scanId) {
    doc.scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to add vulnerability
SecurityScanSchema.methods.addVulnerability = function(vulnerability: Omit<ISecurityVulnerability, 'metadata'> & { metadata?: { scanner?: string; scannerVersion?: string; rule?: string; confidence?: number; falsePositive?: boolean; falsePositiveReason?: string; remediation?: any } }): void {
  this.vulnerabilities.push({
    ...vulnerability,
    metadata: {
      scanner: vulnerability.metadata?.scanner || this.tool,
      scannerVersion: vulnerability.metadata?.scannerVersion || this.toolVersion,
      rule: vulnerability.metadata?.rule || 'unknown',
      confidence: vulnerability.metadata?.confidence || 1.0,
      createdAt: new Date(),
      falsePositive: vulnerability.metadata?.falsePositive || false,
      falsePositiveReason: vulnerability.metadata?.falsePositiveReason,
      remediation: vulnerability.metadata?.remediation,
    },
  });

  this.updateSummary();
};

// Method to update summary
SecurityScanSchema.methods.updateSummary = function(): void {
  const vulnerabilities = this.vulnerabilities as ISecurityVulnerability[];
  this.summary.totalVulnerabilities = vulnerabilities.length;
  this.summary.critical = vulnerabilities.filter((v: ISecurityVulnerability) => v.severity === 'critical').length;
  this.summary.high = vulnerabilities.filter((v: ISecurityVulnerability) => v.severity === 'high').length;
  this.summary.medium = vulnerabilities.filter((v: ISecurityVulnerability) => v.severity === 'medium').length;
  this.summary.low = vulnerabilities.filter((v: ISecurityVulnerability) => v.severity === 'low').length;
  this.summary.info = vulnerabilities.filter((v: ISecurityVulnerability) => v.severity === 'info').length;
  this.summary.falsePositives = vulnerabilities.filter((v: ISecurityVulnerability) => v.metadata.falsePositive).length;
  this.summary.confirmed = vulnerabilities.filter((v: ISecurityVulnerability) => !v.metadata.falsePositive).length;

  // Calculate risk score (0-100, higher is worse)
  const criticalWeight = this.summary.critical * 25;
  const highWeight = this.summary.high * 10;
  const mediumWeight = this.summary.medium * 3;
  const lowWeight = this.summary.low * 1;

  this.summary.riskScore = Math.min(100, criticalWeight + highWeight + mediumWeight + lowWeight);

  // Calculate compliance score (0-100, higher is better)
  const maxScore = 100;
  const penalty = this.summary.riskScore;
  this.summary.complianceScore = Math.max(0, maxScore - penalty);
};

// Method to mark vulnerability as false positive
SecurityScanSchema.methods.markFalsePositive = function(vulnerabilityId: string, reason: string): boolean {
  const vulnerability = this.vulnerabilities.find((v: ISecurityVulnerability) => v.id === vulnerabilityId);
  if (vulnerability) {
    vulnerability.metadata.falsePositive = true;
    vulnerability.metadata.falsePositiveReason = reason;
    this.updateSummary();
    return true;
  }
  return false;
};

// Method to complete scan
SecurityScanSchema.methods.complete = function(duration: number): void {
  this.status = 'completed';
  this.metadata.completedAt = new Date();
  this.metadata.duration = duration;
  this.updateSummary();
};

// Method to fail scan
SecurityScanSchema.methods.fail = function(error: string): void {
  this.status = 'failed';
  // Could add error field to metadata
};

// Static method to find scans by workspace
SecurityScanSchema.statics.findByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({ workspaceId, status: { $ne: 'deleted' } })
    .sort({ 'metadata.createdAt': -1 });
};

// Static method to find critical vulnerabilities
SecurityScanSchema.statics.findCriticalVulnerabilities = function(workspaceId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { workspaceId, status: 'completed' } },
    { $unwind: '$vulnerabilities' },
    { $match: { 'vulnerabilities.severity': { $in: ['critical', 'high'] }, 'vulnerabilities.metadata.falsePositive': { $ne: true } } },
    {
      $project: {
        scanId: 1,
        scanTitle: '$title',
        vulnerability: '$vulnerabilities',
        riskScore: '$summary.riskScore'
      }
    }
  ]);
};

// Static method to get scan statistics
SecurityScanSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { workspaceId, 'metadata.createdAt': { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$metadata.createdAt' } },
          type: '$type'
        },
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$summary.riskScore' },
        totalVulnerabilities: { $sum: '$summary.totalVulnerabilities' },
        criticalVulnerabilities: { $sum: '$summary.critical' },
        avgDuration: { $avg: '$metadata.duration' }
      }
    }
  ]);
};

export default mongoose.models.SecurityScan || mongoose.model<ISecurityScan>('SecurityScan', SecurityScanSchema);