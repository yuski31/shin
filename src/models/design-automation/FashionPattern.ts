import mongoose, { Document, Schema } from 'mongoose';

export type PatternType = 'garment' | 'accessory' | 'footwear' | 'textile' | 'embroidery' | 'print';

export type GarmentCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'underwear' | 'swimwear' | 'activewear';

export type SizeRange = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'custom';

export interface IPatternPiece {
  name: string;
  type: 'main' | 'facing' | 'lining' | 'interfacing' | 'fusible';
  material: string;
  dimensions: {
    width: number;
    height: number;
    units: 'cm' | 'in';
  };
  seamAllowance: number;
  grainline: {
    angle: number;
    direction: 'straight' | 'bias';
  };
  notches: Array<{
    position: { x: number; y: number };
    type: 'single' | 'double' | 'triple';
  }>;
  drillHoles: Array<{
    position: { x: number; y: number };
    diameter: number;
  }>;
  annotations: string[];
}

export interface IFashionPattern extends Document {
  name: string;
  description: string;
  type: PatternType;
  category: GarmentCategory;
  project: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  patternPieces: IPatternPiece[];
  sizes: SizeRange[];
  measurements: {
    bust?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
    sleeve?: number;
    shoulder?: number;
    neck?: number;
    [key: string]: number | undefined;
  };
  materials: Array<{
    name: string;
    type: 'fabric' | 'notions' | 'interfacing' | 'lining';
    quantity: number;
    units: 'meters' | 'yards' | 'pieces';
    color?: string;
    supplier?: string;
  }>;
  construction: {
    steps: Array<{
      order: number;
      instruction: string;
      tools: string[];
      timeEstimate: number; // in minutes
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>;
    techniques: string[];
    tips: string[];
  };
  variations: Array<{
    name: string;
    description: string;
    modifications: Record<string, any>;
  }>;
  metadata: {
    style: string;
    season: string[];
    targetAudience: string[];
    priceRange: 'budget' | 'mid-range' | 'premium' | 'luxury';
    productionMethod: 'handmade' | 'machine' | 'mixed';
    tags: string[];
    trendScore: number;
    sustainability: {
      score: number;
      certifications: string[];
      materials: string[];
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
    makes: number;
    favorites: number;
  };
  versions: mongoose.Types.ObjectId[];
  currentVersion: mongoose.Types.ObjectId;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatternPieceSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['main', 'facing', 'lining', 'interfacing', 'fusible'],
    required: true,
  },
  material: {
    type: String,
    required: true,
  },
  dimensions: {
    width: {
      type: Number,
      required: true,
      min: 0,
    },
    height: {
      type: Number,
      required: true,
      min: 0,
    },
    units: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm',
    },
  },
  seamAllowance: {
    type: Number,
    default: 1.5,
    min: 0,
  },
  grainline: {
    angle: {
      type: Number,
      default: 0,
    },
    direction: {
      type: String,
      enum: ['straight', 'bias'],
      default: 'straight',
    },
  },
  notches: [{
    position: {
      x: Number,
      y: Number,
    },
    type: {
      type: String,
      enum: ['single', 'double', 'triple'],
      default: 'single',
    },
  }],
  drillHoles: [{
    position: {
      x: Number,
      y: Number,
    },
    diameter: {
      type: Number,
      default: 0.3,
    },
  }],
  annotations: [String],
}, { _id: true });

const FashionPatternSchema: Schema = new Schema({
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
    enum: ['garment', 'accessory', 'footwear', 'textile', 'embroidery', 'print'],
    required: true,
  },
  category: {
    type: String,
    enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'underwear', 'swimwear', 'activewear'],
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
  patternPieces: [PatternPieceSchema],
  sizes: [{
    type: String,
    enum: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'custom'],
  }],
  measurements: Schema.Types.Mixed,
  materials: [{
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['fabric', 'notions', 'interfacing', 'lining'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    units: {
      type: String,
      enum: ['meters', 'yards', 'pieces'],
      required: true,
    },
    color: String,
    supplier: String,
  }],
  construction: {
    steps: [{
      order: {
        type: Number,
        required: true,
      },
      instruction: {
        type: String,
        required: true,
      },
      tools: [String],
      timeEstimate: Number,
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate',
      },
    }],
    techniques: [String],
    tips: [String],
  },
  variations: [{
    name: String,
    description: String,
    modifications: Schema.Types.Mixed,
  }],
  metadata: {
    style: String,
    season: [String],
    targetAudience: [String],
    priceRange: {
      type: String,
      enum: ['budget', 'mid-range', 'premium', 'luxury'],
      default: 'mid-range',
    },
    productionMethod: {
      type: String,
      enum: ['handmade', 'machine', 'mixed'],
      default: 'mixed',
    },
    tags: [String],
    trendScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    sustainability: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      certifications: [String],
      materials: [String],
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
    makes: {
      type: Number,
      default: 0,
    },
    favorites: {
      type: Number,
      default: 0,
    },
  },
  versions: [{
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  }],
  currentVersion: {
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,
}, {
  timestamps: true,
});

// Indexes for better query performance
FashionPatternSchema.index({ project: 1 });
FashionPatternSchema.index({ organization: 1 });
FashionPatternSchema.index({ createdBy: 1 });
FashionPatternSchema.index({ type: 1 });
FashionPatternSchema.index({ category: 1 });
FashionPatternSchema.index({ 'metadata.tags': 1 });
FashionPatternSchema.index({ 'metadata.style': 1 });
FashionPatternSchema.index({ 'metadata.trendScore': -1 });
FashionPatternSchema.index({ isPublished: 1 });
FashionPatternSchema.index({ organization: 1, isPublished: 1 });

// Virtual for piece count
FashionPatternSchema.virtual('pieceCount').get(function(this: IFashionPattern) {
  return this.patternPieces.length;
});

// Virtual for material count
FashionPatternSchema.virtual('materialCount').get(function(this: IFashionPattern) {
  return this.materials.length;
});

// Virtual for construction step count
FashionPatternSchema.virtual('stepCount').get(function(this: IFashionPattern) {
  return this.construction.steps.length;
});

// Method to calculate total material cost
FashionPatternSchema.methods.calculateTotalCost = function(): number {
  return this.materials.reduce((total: number, material: any) => {
    return total + (material.cost || 0) * material.quantity;
  }, 0);
};

// Method to get pattern pieces by type
FashionPatternSchema.methods.getPiecesByType = function(type: string): IPatternPiece[] {
  return this.patternPieces.filter((piece: IPatternPiece) => piece.type === type);
};

// Method to publish pattern
FashionPatternSchema.methods.publish = function(): Promise<IFashionPattern> {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

export default mongoose.models.FashionPattern || mongoose.model<IFashionPattern>('FashionPattern', FashionPatternSchema);