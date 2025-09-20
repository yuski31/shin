import mongoose, { Document, Schema } from 'mongoose';

export interface IUserIdentity extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  identityType: 'user' | 'service' | 'device';
  status: 'active' | 'suspended' | 'revoked';
  authentication: {
    methods: string[];
    lastLoginAt?: Date;
    failedAttempts: number;
    mfaEnabled: boolean;
    mfaMethods: string[];
  };
  authorization: {
    roles: string[];
    permissions: string[];
    groups: mongoose.Types.ObjectId[];
    policies: mongoose.Types.ObjectId[];
  };
  behavioralProfile: {
    baseline: {
      loginTimes: string[];
      devicePatterns: string[];
      locationPatterns: string[];
      accessPatterns: string[];
    };
    current: {
      riskScore: number;
      anomalyScore: number;
      trustScore: number;
    };
    lastUpdated: Date;
  };
  sessionHistory: {
    sessionId: string;
    startedAt: Date;
    endedAt?: Date;
    deviceInfo: {
      type: string;
      fingerprint: string;
      location: {
        ip: string;
        country: string;
        region: string;
        city: string;
      };
    };
    activities: {
      action: string;
      resource: string;
      timestamp: Date;
      riskLevel: 'low' | 'medium' | 'high';
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserIdentitySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  identityType: {
    type: String,
    enum: ['user', 'service', 'device'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'revoked'],
    default: 'active',
  },
  authentication: {
    methods: [String],
    lastLoginAt: Date,
    failedAttempts: {
      type: Number,
      default: 0,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaMethods: [String],
  },
  authorization: {
    roles: [String],
    permissions: [String],
    groups: [{
      type: Schema.Types.ObjectId,
      ref: 'UserGroup',
    }],
    policies: [{
      type: Schema.Types.ObjectId,
      ref: 'SecurityPolicy',
    }],
  },
  behavioralProfile: {
    baseline: {
      loginTimes: [String],
      devicePatterns: [String],
      locationPatterns: [String],
      accessPatterns: [String],
    },
    current: {
      riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      anomalyScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trustScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  sessionHistory: [{
    sessionId: String,
    startedAt: Date,
    endedAt: Date,
    deviceInfo: {
      type: String,
      fingerprint: String,
      location: {
        ip: String,
        country: String,
        region: String,
        city: String,
      },
    },
    activities: [{
      action: String,
      resource: String,
      timestamp: Date,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
    }],
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
UserIdentitySchema.index({ userId: 1, organization: 1 });
UserIdentitySchema.index({ 'behavioralProfile.current.riskScore': -1 });
UserIdentitySchema.index({ 'behavioralProfile.current.trustScore': -1 });
UserIdentitySchema.index({ status: 1 });
UserIdentitySchema.index({ 'sessionHistory.startedAt': -1 });

export default mongoose.models.UserIdentity || mongoose.model<IUserIdentity>('UserIdentity', UserIdentitySchema);