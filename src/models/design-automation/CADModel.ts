import mongoose, { Document, Schema } from 'mongoose';

export type CADModelType = 'floor-plan' | 'elevation' | 'section' | '3d-model' | 'structural' | 'mechanical' | 'electrical' | 'plumbing';

export type ModelFormat = 'dwg' | 'dxf' | 'rvt' | 'ifc' | 'obj' | 'fbx' | 'gltf' | 'glb' | 'stp' | 'iges' | 'sat';

export interface ICADModel extends Document {
  name: string;
  description: string;
  type: CADModelType;
  format: ModelFormat;
  project: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  fileUrl: string;
  thumbnailUrl?: string;
  geometry: {
    vertices: number;
    faces: number;
    edges: number;
    bounds: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
    units: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  };
  properties: {
    material?: string;
    thickness?: number;
    weight?: number;
    cost?: number;
    manufacturer?: string;
    specifications: Record<string, any>;
  };
  analysis: {
    structural?: {
      stress: number[];
      displacement: number[];
      safetyFactor: number;
    };
    thermal?: {
      temperature: number[];
      heatFlux: number[];
      conductivity: number;
    };
    fluid?: {
      velocity: number[];
      pressure: number[];
      flowRate: number;
    };
  };
  constraints: {
    dimensional: Array<{
      type: 'distance' | 'angle' | 'diameter' | 'radius';
      value: number;
      tolerance: number;
    }>;
    geometric: Array<{
      type: 'parallel' | 'perpendicular' | 'tangent' | 'coincident' | 'concentric';
      entities: string[];
    }>;
  };
  metadata: {
    version: string;
    software: string;
    scale: number;
    coordinateSystem: string;
    layers: string[];
    tags: string[];
    category: string;
    buildingCode: string;
    compliance: {
      status: 'compliant' | 'non-compliant' | 'pending-review';
      issues: string[];
      standards: string[];
    };
  };
  aiMetadata: {
    generated: boolean;
    prompt?: string;
    model?: string;
    parameters?: Record<string, any>;
    confidence?: number;
  };
  permissions: {
    isPublic: boolean;
    allowedUsers: mongoose.Types.ObjectId[];
    allowedOrganizations: mongoose.Types.ObjectId[];
  };
  usage: {
    downloads: number;
    views: number;
    analyses: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CADModelSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['floor-plan', 'elevation', 'section', '3d-model', 'structural', 'mechanical', 'electrical', 'plumbing'],
    required: true,
  },
  format: {
    type: String,
    enum: ['dwg', 'dxf', 'rvt', 'ifc', 'obj', 'fbx', 'gltf', 'glb', 'stp', 'iges', 'sat'],
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'DesignProject',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: String,
  geometry: {
    vertices: {
      type: Number,
      default: 0,
    },
    faces: {
      type: Number,
      default: 0,
    },
    edges: {
      type: Number,
      default: 0,
    },
    bounds: {
      min: {
        x: Number,
        y: Number,
        z: Number,
      },
      max: {
        x: Number,
        y: Number,
        z: Number,
      },
    },
    units: {
      type: String,
      enum: ['mm', 'cm', 'm', 'in', 'ft'],
      default: 'm',
    },
  },
  properties: {
    material: String,
    thickness: Number,
    weight: Number,
    cost: Number,
    manufacturer: String,
    specifications: Schema.Types.Mixed,
  },
  analysis: {
    structural: {
      stress: [Number],
      displacement: [Number],
      safetyFactor: Number,
    },
    thermal: {
      temperature: [Number],
      heatFlux: [Number],
      conductivity: Number,
    },
    fluid: {
      velocity: [Number],
      pressure: [Number],
      flowRate: Number,
    },
  },
  constraints: {
    dimensional: [{
      type: {
        type: String,
        enum: ['distance', 'angle', 'diameter', 'radius'],
      },
      value: Number,
      tolerance: Number,
    }],
    geometric: [{
      type: {
        type: String,
        enum: ['parallel', 'perpendicular', 'tangent', 'coincident', 'concentric'],
      },
      entities: [String],
    }],
  },
  metadata: {
    version: {
      type: String,
      default: '1.0.0',
    },
    software: String,
    scale: {
      type: Number,
      default: 1,
    },
    coordinateSystem: {
      type: String,
      default: 'WGS84',
    },
    layers: [String],
    tags: [String],
    category: {
      type: String,
      default: 'general',
    },
    buildingCode: String,
    compliance: {
      status: {
        type: String,
        enum: ['compliant', 'non-compliant', 'pending-review'],
        default: 'pending-review',
      },
      issues: [String],
      standards: [String],
    },
  },
  aiMetadata: {
    generated: {
      type: Boolean,
      default: false,
    },
    prompt: String,
    model: String,
    parameters: Schema.Types.Mixed,
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  permissions: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    allowedOrganizations: [{
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    }],
  },
  usage: {
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    analyses: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CADModelSchema.index({ project: 1 });
CADModelSchema.index({ organization: 1 });
CADModelSchema.index({ createdBy: 1 });
CADModelSchema.index({ type: 1 });
CADModelSchema.index({ 'metadata.tags': 1 });
CADModelSchema.index({ 'metadata.category': 1 });
CADModelSchema.index({ 'metadata.compliance.status': 1 });
CADModelSchema.index({ 'geometry.units': 1 });
CADModelSchema.index({ project: 1, type: 1 });
CADModelSchema.index({ organization: 1, type: 1 });

// Virtual for complexity score
CADModelSchema.virtual('complexityScore').get(function(this: ICADModel) {
  return this.geometry.vertices + this.geometry.faces + this.geometry.edges;
});

// Virtual for compliance status
CADModelSchema.virtual('isCompliant').get(function(this: ICADModel) {
  return this.metadata.compliance.status === 'compliant';
});

// Method to run structural analysis
CADModelSchema.methods.runStructuralAnalysis = function(): Promise<ICADModel> {
  this.usage.analyses += 1;
  // Implementation would integrate with finite element analysis tools
  return this.save();
};

// Method to check building code compliance
CADModelSchema.methods.checkCompliance = function(): Promise<ICADModel> {
  // Implementation would integrate with building code checking tools
  return this.save();
};

// Method to optimize material usage
CADModelSchema.methods.optimizeMaterials = function(): Promise<ICADModel> {
  // Implementation would run material optimization algorithms
  return this.save();
};

export default mongoose.models.CADModel || mongoose.model<ICADModel>('CADModel', CADModelSchema);