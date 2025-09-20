import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageSettings: boolean;
    canViewAnalytics: boolean;
  };
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface IWorkspaceSettings {
  isPublic: boolean;
  allowGuestAccess: boolean;
  requireApproval: boolean;
  maxMembers: number;
  defaultResourceAllocation: {
    cpu: number;
    memory: number;
    storage: number;
  };
  autoSave: boolean;
  autoSaveInterval: number; // minutes
}

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  settings: IWorkspaceSettings;
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
  metadata: {
    createdWithTemplate?: string;
    lastActivityAt: Date;
    totalSessions: number;
    totalFiles: number;
    storageUsed: number; // bytes
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor', 'viewer'],
    default: 'viewer',
  },
  permissions: {
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canInvite: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const WorkspaceSettingsSchema = new Schema({
  isPublic: {
    type: Boolean,
    default: false,
  },
  allowGuestAccess: {
    type: Boolean,
    default: false,
  },
  requireApproval: {
    type: Boolean,
    default: true,
  },
  maxMembers: {
    type: Number,
    default: 50,
  },
  defaultResourceAllocation: {
    cpu: { type: Number, default: 2 },
    memory: { type: Number, default: 4 }, // GB
    storage: { type: Number, default: 10 }, // GB
  },
  autoSave: {
    type: Boolean,
    default: true,
  },
  autoSaveInterval: {
    type: Number,
    default: 5, // minutes
  },
});

const WorkspaceSchema: Schema = new Schema({
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
  description: {
    type: String,
    maxlength: 500,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [WorkspaceMemberSchema],
  settings: {
    type: WorkspaceSettingsSchema,
    default: () => ({
      isPublic: false,
      allowGuestAccess: false,
      requireApproval: true,
      maxMembers: 50,
      defaultResourceAllocation: {
        cpu: 2,
        memory: 4,
        storage: 10,
      },
      autoSave: true,
      autoSaveInterval: 5,
    }),
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  metadata: {
    createdWithTemplate: String,
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
WorkspaceSchema.index({ slug: 1 }, { unique: true });
WorkspaceSchema.index({ organizationId: 1 });
WorkspaceSchema.index({ ownerId: 1 });
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ status: 1 });
WorkspaceSchema.index({ tags: 1 });
WorkspaceSchema.index({ 'metadata.lastActivityAt': -1 });

// Pre-save middleware to generate slug from name
WorkspaceSchema.pre('save', function(next) {
  const doc = this as IWorkspace;
  if (doc.isNew && !doc.slug) {
    doc.slug = doc.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Method to check if user is member of workspace
WorkspaceSchema.methods.isMember = function(userId: mongoose.Types.ObjectId): boolean {
  return this.members.some((member: IWorkspaceMember) =>
    member.userId.toString() === userId.toString()
  );
};

// Method to get user's role in workspace
WorkspaceSchema.methods.getUserRole = function(userId: mongoose.Types.ObjectId): string | null {
  const member = this.members.find((member: IWorkspaceMember) =>
    member.userId.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Method to get user's permissions in workspace
WorkspaceSchema.methods.getUserPermissions = function(userId: mongoose.Types.ObjectId): IWorkspaceMember['permissions'] | null {
  const member = this.members.find((member: IWorkspaceMember) =>
    member.userId.toString() === userId.toString()
  );
  return member ? member.permissions : null;
};

// Method to update member activity
WorkspaceSchema.methods.updateMemberActivity = function(userId: mongoose.Types.ObjectId): void {
  const member = this.members.find((member: IWorkspaceMember) =>
    member.userId.toString() === userId.toString()
  );
  if (member) {
    member.lastActiveAt = new Date();
    this.metadata.lastActivityAt = new Date();
  }
};

// Static method to find workspaces by organization
WorkspaceSchema.statics.findByOrganization = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({ organizationId, status: 'active' });
};

// Static method to find workspaces by user
WorkspaceSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    'members.userId': userId,
    status: 'active'
  });
};

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);