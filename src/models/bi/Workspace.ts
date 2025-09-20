import mongoose, { Document, ObjectId } from 'mongoose';

export interface IWorkspace extends Document {
  _id: ObjectId;
  organizationId: ObjectId;
  name: string;
  description: string;
  type: 'personal' | 'team' | 'organization';
  members: WorkspaceMember[];
  permissions: WorkspacePermissions;
  content: WorkspaceContent[];
  activity: WorkspaceActivity[];
  settings: WorkspaceSettings;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: ObjectId;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  permissions: MemberPermissions;
}

export interface WorkspacePermissions {
  visibility: 'private' | 'team' | 'organization' | 'public';
  allowGuests: boolean;
  requireApproval: boolean;
  maxMembers: number;
  featureAccess: string[];
}

export interface WorkspaceContent {
  id: string;
  type: 'dashboard' | 'story' | 'dataset' | 'query' | 'visualization' | 'document';
  title: string;
  description?: string;
  content: any;
  metadata: ContentMetadata;
  version: number;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceActivity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'comment' | 'share' | 'export';
  userId: ObjectId;
  contentId?: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface WorkspaceSettings {
  notifications: NotificationSettings;
  collaboration: CollaborationSettings;
  privacy: PrivacySettings;
  integrations: IntegrationSettings;
}

export interface MemberPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
}

export interface ContentMetadata {
  tags: string[];
  category: string;
  size: number;
  lastAccessed: Date;
  accessCount: number;
  isFavorite: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  types: string[];
}

export interface CollaborationSettings {
  realTime: boolean;
  comments: boolean;
  annotations: boolean;
  versionControl: boolean;
  approvalWorkflow: boolean;
}

export interface PrivacySettings {
  dataRetention: number; // days
  exportRestrictions: string[];
  sharingRestrictions: string[];
  auditLogging: boolean;
}

export interface IntegrationSettings {
  externalTools: string[];
  apiAccess: boolean;
  webhookUrls: string[];
  dataSources: string[];
}

const WorkspaceSchema = new mongoose.Schema<IWorkspace>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['personal', 'team', 'organization'],
    required: true,
    index: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    permissions: mongoose.Schema.Types.Mixed
  }],
  permissions: {
    visibility: {
      type: String,
      enum: ['private', 'team', 'organization', 'public'],
      default: 'private'
    },
    allowGuests: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 50
    },
    featureAccess: [String]
  },
  content: [{
    id: String,
    type: {
      type: String,
      enum: ['dashboard', 'story', 'dataset', 'query', 'visualization', 'document']
    },
    title: String,
    description: String,
    content: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    version: {
      type: Number,
      default: 1
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  activity: [{
    id: String,
    type: {
      type: String,
      enum: ['create', 'update', 'delete', 'comment', 'share', 'export']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contentId: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    notifications: mongoose.Schema.Types.Mixed,
    collaboration: mongoose.Schema.Types.Mixed,
    privacy: mongoose.Schema.Types.Mixed,
    integrations: mongoose.Schema.Types.Mixed
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
WorkspaceSchema.index({ organizationId: 1, type: 1 });
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ createdBy: 1, createdAt: -1 });
WorkspaceSchema.index({ 'activity.timestamp': -1 });

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);