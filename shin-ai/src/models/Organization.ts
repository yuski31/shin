import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganizationMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface IOrganizationQuotas {
  requestsPerDay: number;
  tokensPerDay: number;
  requestsPerMonth: number;
  tokensPerMonth: number;
}

export interface IOrganizationSettings {
  allowApiKeys: boolean;
  allowIpWhitelisting: boolean;
  allowRateLimiting: boolean;
  maxApiKeys: number;
  autoRotateKeys: boolean;
  keyRotationDays: number;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  members: IOrganizationMember[];
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  quotas: IOrganizationQuotas;
  settings: IOrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const OrganizationQuotasSchema = new Schema({
  requestsPerDay: {
    type: Number,
    default: 100,
  },
  tokensPerDay: {
    type: Number,
    default: 10000,
  },
  requestsPerMonth: {
    type: Number,
    default: 3000,
  },
  tokensPerMonth: {
    type: Number,
    default: 300000,
  },
});

const OrganizationSettingsSchema = new Schema({
  allowApiKeys: {
    type: Boolean,
    default: true,
  },
  allowIpWhitelisting: {
    type: Boolean,
    default: false,
  },
  allowRateLimiting: {
    type: Boolean,
    default: true,
  },
  maxApiKeys: {
    type: Number,
    default: 5,
  },
  autoRotateKeys: {
    type: Boolean,
    default: false,
  },
  keyRotationDays: {
    type: Number,
    default: 90,
  },
});

const OrganizationSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [OrganizationMemberSchema],
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free',
  },
  quotas: {
    type: OrganizationQuotasSchema,
    default: () => ({
      requestsPerDay: 100,
      tokensPerDay: 10000,
      requestsPerMonth: 3000,
      tokensPerMonth: 300000,
    }),
  },
  settings: {
    type: OrganizationSettingsSchema,
    default: () => ({
      allowApiKeys: true,
      allowIpWhitelisting: false,
      allowRateLimiting: true,
      maxApiKeys: 5,
      autoRotateKeys: false,
      keyRotationDays: 90,
    }),
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ owner: 1 });
OrganizationSchema.index({ 'members.userId': 1 });
OrganizationSchema.index({ plan: 1 });
OrganizationSchema.index({ isActive: 1 });

// Pre-save middleware to set default quotas based on plan
OrganizationSchema.pre('save', function(next) {
  const org = this as any;

  switch (org.plan) {
    case 'free':
      org.quotas = {
        requestsPerDay: 100,
        tokensPerDay: 10000,
        requestsPerMonth: 3000,
        tokensPerMonth: 300000,
      };
      org.settings.maxApiKeys = 2;
      break;
    case 'starter':
      org.quotas = {
        requestsPerDay: 10000,
        tokensPerDay: 1000000,
        requestsPerMonth: 300000,
        tokensPerMonth: 30000000,
      };
      org.settings.maxApiKeys = 10;
      break;
    case 'professional':
      org.quotas = {
        requestsPerDay: 100000,
        tokensPerDay: 10000000,
        requestsPerMonth: 3000000,
        tokensPerMonth: 300000000,
      };
      org.settings.maxApiKeys = 50;
      break;
    case 'enterprise':
      // Enterprise quotas are custom, keep existing values
      org.settings.maxApiKeys = 100;
      break;
  }

  next();
});

// Method to check if user is member of organization
OrganizationSchema.methods.isMember = function(userId: mongoose.Types.ObjectId): boolean {
  return this.members.some((member: IOrganizationMember) =>
    member.userId.toString() === userId.toString()
  );
};

// Method to get user's role in organization
OrganizationSchema.methods.getUserRole = function(userId: mongoose.Types.ObjectId): string | null {
  const member = this.members.find((member: IOrganizationMember) =>
    member.userId.toString() === userId.toString()
  );
  return member ? member.role : null;
};

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);