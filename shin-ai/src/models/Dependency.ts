import mongoose, { Document, Schema } from 'mongoose';

export interface IDependencyVersion {
  version: string;
  build?: string;
  channel: string;
  checksum?: string;
  size?: number; // bytes
  installedAt?: Date;
  isDefault: boolean;
}

export interface IDependency extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  type: 'conda' | 'pip' | 'apt' | 'npm' | 'custom';
  description?: string;
  category: 'core' | 'development' | 'optional' | 'system';
  versions: IDependencyVersion[];
  currentVersion?: string;
  metadata: {
    author?: string;
    homepage?: string;
    license?: string;
    documentation?: string;
    repository?: string;
    issues?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastUpdated: Date;
    lastUsed?: Date;
    usageCount: number;
    compatibility: {
      pythonVersions?: string[];
      os?: string[];
      architectures?: string[];
    };
    conflicts?: string[]; // Package names that conflict with this
    dependencies?: string[]; // Package names this depends on
    tags: string[];
    labels: Record<string, string>;
  };
  configuration: {
    autoUpdate: boolean;
    updatePolicy: 'patch' | 'minor' | 'major' | 'none';
    installOptions?: Record<string, any>;
    environmentVariables?: Record<string, string>;
    postInstallScript?: string;
  };
  status: 'available' | 'installing' | 'updating' | 'removing' | 'failed' | 'unavailable';
  isLocked: boolean;
  lockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DependencyVersionSchema = new Schema({
  version: {
    type: String,
    required: true,
  },
  build: String,
  channel: {
    type: String,
    default: 'conda-forge',
  },
  checksum: String,
  size: Number,
  installedAt: Date,
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const DependencySchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['conda', 'pip', 'apt', 'npm', 'custom'],
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  category: {
    type: String,
    enum: ['core', 'development', 'optional', 'system'],
    default: 'optional',
  },
  versions: [DependencyVersionSchema],
  currentVersion: String,
  metadata: {
    author: String,
    homepage: String,
    license: String,
    documentation: String,
    repository: String,
    issues: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    lastUsed: Date,
    usageCount: {
      type: Number,
      default: 0,
    },
    compatibility: {
      pythonVersions: [String],
      os: [String],
      architectures: [String],
    },
    conflicts: [String],
    dependencies: [String],
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
  },
  configuration: {
    autoUpdate: {
      type: Boolean,
      default: true,
    },
    updatePolicy: {
      type: String,
      enum: ['patch', 'minor', 'major', 'none'],
      default: 'minor',
    },
    installOptions: {
      type: Schema.Types.Mixed,
    },
    environmentVariables: {
      type: Map,
      of: String,
    },
    postInstallScript: String,
  },
  status: {
    type: String,
    enum: ['available', 'installing', 'updating', 'removing', 'failed', 'unavailable'],
    default: 'available',
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockReason: String,
}, {
  timestamps: true,
});

// Indexes for better query performance
DependencySchema.index({ workspaceId: 1 });
DependencySchema.index({ workspaceId: 1, type: 1 });
DependencySchema.index({ workspaceId: 1, category: 1 });
DependencySchema.index({ name: 1, type: 1 }, { unique: true });
DependencySchema.index({ 'metadata.createdBy': 1 });
DependencySchema.index({ 'metadata.tags': 1 });
DependencySchema.index({ status: 1 });

// Pre-save middleware to update lastUpdated
DependencySchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isModified() && !doc.isNew) {
    doc.metadata.lastUpdated = new Date();
  }
  next();
});

// Method to add version
DependencySchema.methods.addVersion = function(version: Omit<IDependencyVersion, 'isDefault'>): void {
  // Set isDefault to false for all existing versions
  this.versions.forEach((v: IDependencyVersion) => {
    v.isDefault = false;
  });

  // Add new version
  this.versions.push({
    ...version,
    isDefault: true,
  });

  this.currentVersion = version.version;
  this.metadata.lastUpdated = new Date();
};

// Method to set current version
DependencySchema.methods.setCurrentVersion = function(version: string): boolean {
  const versionExists = this.versions.some((v: IDependencyVersion) => v.version === version);
  if (versionExists) {
    // Update isDefault flags
    this.versions.forEach((v: IDependencyVersion) => {
      v.isDefault = v.version === version;
    });

    this.currentVersion = version;
    this.metadata.lastUpdated = new Date();
    return true;
  }
  return false;
};

// Method to remove version
DependencySchema.methods.removeVersion = function(version: string): boolean {
  const initialLength = this.versions.length;
  this.versions = this.versions.filter((v: IDependencyVersion) => v.version !== version);

  if (this.versions.length < initialLength) {
    // If we removed the current version, set a new default
    if (this.currentVersion === version && this.versions.length > 0) {
      this.versions[0].isDefault = true;
      this.currentVersion = this.versions[0].version;
    }

    this.metadata.lastUpdated = new Date();
    return true;
  }
  return false;
};

// Method to update usage
DependencySchema.methods.updateUsage = function(): void {
  this.metadata.usageCount += 1;
  this.metadata.lastUsed = new Date();
};

// Method to lock dependency
DependencySchema.methods.lock = function(reason: string): void {
  this.isLocked = true;
  this.lockReason = reason;
};

// Method to unlock dependency
DependencySchema.methods.unlock = function(): void {
  this.isLocked = false;
  this.lockReason = undefined;
};

// Method to check compatibility
DependencySchema.methods.isCompatible = function(
  pythonVersion?: string,
  os?: string,
  architecture?: string
): boolean {
  const { compatibility } = this.metadata;

  if (pythonVersion && compatibility.pythonVersions) {
    if (!compatibility.pythonVersions.includes(pythonVersion)) {
      return false;
    }
  }

  if (os && compatibility.os) {
    if (!compatibility.os.includes(os)) {
      return false;
    }
  }

  if (architecture && compatibility.architectures) {
    if (!compatibility.architectures.includes(architecture)) {
      return false;
    }
  }

  return true;
};

// Static method to find dependencies by workspace
DependencySchema.statics.findByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({ workspaceId, status: { $ne: 'deleted' } });
};

// Static method to find dependencies by type
DependencySchema.statics.findByType = function(type: IDependency['type']) {
  return this.find({ type, status: { $ne: 'deleted' } });
};

// Static method to find dependencies by category
DependencySchema.statics.findByCategory = function(category: IDependency['category']) {
  return this.find({ category, status: { $ne: 'deleted' } });
};

// Static method to find outdated dependencies
DependencySchema.statics.findOutdated = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({
    workspaceId,
    status: 'available',
    'configuration.autoUpdate': true,
    'configuration.updatePolicy': { $ne: 'none' }
  }).then((dependencies: IDependency[]) => {
    // This would integrate with package managers to check for updates
    // For now, return dependencies that haven't been updated recently
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    return dependencies.filter((dep: IDependency) =>
      dep.metadata.lastUpdated < cutoffDate
    );
  });
};

// Static method to get dependency statistics
DependencySchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { workspaceId, status: { $ne: 'deleted' }, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
          category: '$category'
        },
        count: { $sum: 1 },
        totalUsage: { $sum: '$metadata.usageCount' },
        lockedCount: {
          $sum: { $cond: ['$isLocked', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to find conflicting dependencies
DependencySchema.statics.findConflicts = function(workspaceId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { workspaceId, status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: '$metadata.conflicts',
        conflictingPackages: { $push: '$name' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);
};

export default mongoose.models.Dependency || mongoose.model<IDependency>('Dependency', DependencySchema);