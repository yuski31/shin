import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

export interface IApiKey extends Document {
  organization: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  usageCount: number;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

// Available scopes
export const API_KEY_SCOPES = [
  'chat:read',
  'chat:write',
  'providers:read',
  'providers:write',
  'usage:read',
  'admin'
] as const;

export type ApiKeyScope = typeof API_KEY_SCOPES[number];

// Generate a cryptographically secure API key
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32);
  const key = `sk-shin-${randomBytes.toString('hex')}`;
  const hash = CryptoJS.SHA256(key).toString();
  const prefix = key.substring(0, 11); // "sk-shin-" + first 4 chars

  return { key, hash, prefix };
}

// Validate API key format
export function validateApiKeyFormat(key: string): boolean {
  return /^sk-shin-[a-f0-9]{64}$/.test(key);
}

// Hash an API key (for storage)
export function hashApiKey(key: string): string {
  return CryptoJS.SHA256(key).toString();
}

// Verify an API key against its hash
export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash;
}

const ApiKeySchema: Schema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  keyHash: {
    type: String,
    required: true,
  },
  keyPrefix: {
    type: String,
    required: true,
    maxlength: 11,
  },
  scopes: [{
    type: String,
    enum: API_KEY_SCOPES,
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  ipWhitelist: [{
    type: String,
    validate: {
      validator: function(v: string) {
        // Basic IP address validation
        return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v);
      },
      message: 'Invalid IP address format'
    }
  }],
  ipBlacklist: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v);
      },
      message: 'Invalid IP address format'
    }
  }],
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60,
      min: 1,
      max: 1000,
    },
    requestsPerHour: {
      type: Number,
      default: 1000,
      min: 1,
      max: 10000,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ApiKeySchema.index({ organization: 1 });
ApiKeySchema.index({ keyPrefix: 1 });
ApiKeySchema.index({ isActive: 1 });
ApiKeySchema.index({ expiresAt: 1 });
ApiKeySchema.index({ organization: 1, isActive: 1 });

// Pre-save middleware to generate key details
ApiKeySchema.pre('save', function(next) {
  const apiKey = this as any;

  if (apiKey.isNew && !apiKey.keyHash) {
    const { key, hash, prefix } = generateApiKey();
    apiKey.keyHash = hash;
    apiKey.keyPrefix = prefix;
  }

  next();
});

// Method to check if key has specific scope
ApiKeySchema.methods.hasScope = function(scope: ApiKeyScope): boolean {
  return this.scopes.includes(scope);
};

// Method to check if key has any of the required scopes
ApiKeySchema.methods.hasAnyScope = function(requiredScopes: ApiKeyScope[]): boolean {
  return requiredScopes.some((scope: ApiKeyScope) => this.scopes.includes(scope));
};

// Method to check if key has all required scopes
ApiKeySchema.methods.hasAllScopes = function(requiredScopes: ApiKeyScope[]): boolean {
  return requiredScopes.every((scope: ApiKeyScope) => this.scopes.includes(scope));
};

// Method to increment usage count
ApiKeySchema.methods.incrementUsage = function(): Promise<IApiKey> {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// Method to check if IP is allowed
ApiKeySchema.methods.isIpAllowed = function(ip: string): boolean {
  // Check blacklist first
  if (this.ipBlacklist && this.ipBlacklist.length > 0) {
    const isBlacklisted = this.ipBlacklist.some((blacklistedIp: string) => {
      if (blacklistedIp.includes('/')) {
        // CIDR notation - simplified check
        return ip.startsWith(blacklistedIp.split('/')[0]);
      }
      return ip === blacklistedIp;
    });

    if (isBlacklisted) {
      return false;
    }
  }

  // Check whitelist if it exists
  if (this.ipWhitelist && this.ipWhitelist.length > 0) {
    const isWhitelisted = this.ipWhitelist.some((whitelistedIp: string) => {
      if (whitelistedIp.includes('/')) {
        // CIDR notation - simplified check
        return ip.startsWith(whitelistedIp.split('/')[0]);
      }
      return ip === whitelistedIp;
    });

    return isWhitelisted;
  }

  // If no whitelist/blacklist, allow all IPs
  return true;
};

// Static method to find API key by key (for authentication)
ApiKeySchema.statics.findByKey = async function(key: string): Promise<IApiKey | null> {
  if (!validateApiKeyFormat(key)) {
    return null;
  }

  const hash = hashApiKey(key);
  const prefix = key.substring(0, 11);

  const apiKey = await this.findOne({
    keyHash: hash,
    keyPrefix: prefix,
    isActive: true,
  }).populate('organization');

  if (apiKey && apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    // Key has expired, deactivate it
    apiKey.isActive = false;
    await apiKey.save();
    return null;
  }

  return apiKey;
};

export default mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);