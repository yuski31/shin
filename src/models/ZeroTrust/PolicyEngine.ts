import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityPolicy extends Document {
  organization: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  policyType: 'access_control' | 'data_protection' | 'threat_detection' | 'compliance';
  status: 'active' | 'draft' | 'archived';
  priority: number;
  conditions: {
    subject?: {
      roles?: string[];
      attributes?: Record<string, any>;
      riskScore?: {
        min?: number;
        max?: number;
      };
    };
    resource?: {
      type?: string;
      classification?: string;
      location?: string;
    };
    action?: {
      method?: string;
      endpoint?: string;
      parameters?: Record<string, any>;
    };
    context?: {
      timeOfDay?: string[];
      location?: string[];
      deviceType?: string[];
      networkType?: string[];
    };
  };
  effect: 'allow' | 'deny' | 'challenge' | 'monitor';
  obligations?: Array<{
    type: 'log' | 'encrypt' | 'tokenize' | 'notify' | 'transform';
    parameters: Record<string, any>;
  }>;
  advice?: Array<{
    type: 'warning' | 'suggestion' | 'requirement';
    message: string;
  }>;
  target: {
    services: string[];
    endpoints: string[];
    resources: string[];
  };
  exceptions?: Array<{
    condition: string;
    effect: 'allow' | 'deny';
    reason: string;
  }>;
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    version: number;
    tags: string[];
    complianceFrameworks: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

const SecurityPolicySchema: Schema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  policyType: {
    type: String,
    enum: ['access_control', 'data_protection', 'threat_detection', 'compliance'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'draft',
  },
  priority: {
    type: Number,
    default: 100,
    min: 1,
    max: 1000,
  },
  conditions: {
    subject: {
      roles: [String],
      attributes: Schema.Types.Mixed,
      riskScore: {
        min: Number,
        max: Number,
      },
    },
    resource: {
      type: String,
      classification: String,
      location: String,
    },
    action: {
      method: String,
      endpoint: String,
      parameters: Schema.Types.Mixed,
    },
    context: {
      timeOfDay: [String],
      location: [String],
      deviceType: [String],
      networkType: [String],
    },
  },
  effect: {
    type: String,
    enum: ['allow', 'deny', 'challenge', 'monitor'],
    required: true,
  },
  obligations: [{
    type: {
      type: String,
      enum: ['log', 'encrypt', 'tokenize', 'notify', 'transform'],
    },
    parameters: Schema.Types.Mixed,
  }],
  advice: [{
    type: {
      type: String,
      enum: ['warning', 'suggestion', 'requirement'],
    },
    message: String,
  }],
  target: {
    services: [String],
    endpoints: [String],
    resources: [String],
  },
  exceptions: [{
    condition: String,
    effect: {
      type: String,
      enum: ['allow', 'deny'],
    },
    reason: String,
  }],
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: [String],
    complianceFrameworks: [String],
  },
  effectiveFrom: Date,
  effectiveTo: Date,
}, {
  timestamps: true,
});

// Indexes for better query performance
SecurityPolicySchema.index({ organization: 1, status: 1 });
SecurityPolicySchema.index({ policyType: 1, priority: -1 });
SecurityPolicySchema.index({ 'conditions.subject.roles': 1 });
SecurityPolicySchema.index({ 'target.services': 1 });
SecurityPolicySchema.index({ effectiveFrom: 1, effectiveTo: 1 });

export default mongoose.models.SecurityPolicy || mongoose.model<ISecurityPolicy>('SecurityPolicy', SecurityPolicySchema);