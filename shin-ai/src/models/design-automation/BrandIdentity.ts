import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandColor {
  name: string;
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  usage: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
  description?: string;
}

export interface IBrandTypography {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  sizes: {
    display: string;
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
    heading5: string;
    heading6: string;
    body: string;
    caption: string;
    button: string;
  };
  lineHeights: {
    display: number;
    heading1: number;
    heading2: number;
    heading3: number;
    heading4: number;
    heading5: number;
    heading6: number;
    body: number;
    caption: number;
    button: number;
  };
  letterSpacing: {
    display: string;
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
    heading5: string;
    heading6: string;
    body: string;
    caption: string;
    button: string;
  };
}

export interface IBrandIdentity extends Document {
  name: string;
  description: string;
  project: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  colors: IBrandColor[];
  primaryColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: IBrandTypography;
  logoVariations: mongoose.Types.ObjectId[];
  brandGuidelines: {
    voice: string;
    personality: string[];
    dos: string[];
    donts: string[];
    usageRules: Record<string, any>;
  };
  assets: {
    logoFiles: string[];
    brandBook: string;
    styleGuide: string;
    templates: string[];
  };
  metadata: {
    industry: string;
    targetAudience: string[];
    brandValues: string[];
    competitors: string[];
    inspiration: string[];
    tags: string[];
  };
  aiMetadata: {
    generated: boolean;
    prompt?: string;
    model?: string;
    parameters?: Record<string, any>;
    confidence?: number;
  };
  versions: mongoose.Types.ObjectId[];
  currentVersion: mongoose.Types.ObjectId;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BrandColorSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  hex: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i,
  },
  rgb: {
    r: {
      type: Number,
      required: true,
      min: 0,
      max: 255,
    },
    g: {
      type: Number,
      required: true,
      min: 0,
      max: 255,
    },
    b: {
      type: Number,
      required: true,
      min: 0,
      max: 255,
    },
  },
  hsl: {
    h: {
      type: Number,
      required: true,
      min: 0,
      max: 360,
    },
    s: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    l: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  usage: {
    type: String,
    enum: ['primary', 'secondary', 'accent', 'neutral', 'semantic'],
    required: true,
  },
  description: String,
}, { _id: true });

const BrandTypographySchema = new Schema({
  family: {
    type: String,
    required: true,
  },
  weights: [{
    type: Number,
    enum: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  }],
  styles: [{
    type: String,
    enum: ['normal', 'italic'],
  }],
  sizes: {
    display: String,
    heading1: String,
    heading2: String,
    heading3: String,
    heading4: String,
    heading5: String,
    heading6: String,
    body: String,
    caption: String,
    button: String,
  },
  lineHeights: {
    display: Number,
    heading1: Number,
    heading2: Number,
    heading3: Number,
    heading4: Number,
    heading5: Number,
    heading6: Number,
    body: Number,
    caption: Number,
    button: Number,
  },
  letterSpacing: {
    display: String,
    heading1: String,
    heading2: String,
    heading3: String,
    heading4: String,
    heading5: String,
    heading6: String,
    body: String,
    caption: String,
    button: String,
  },
}, { _id: false });

const BrandIdentitySchema: Schema = new Schema({
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
  colors: [BrandColorSchema],
  primaryColors: {
    primary: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
    },
    secondary: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
    },
    accent: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
    },
  },
  typography: {
    type: BrandTypographySchema,
    required: true,
  },
  logoVariations: [{
    type: Schema.Types.ObjectId,
    ref: 'DesignAsset',
  }],
  brandGuidelines: {
    voice: {
      type: String,
      required: true,
    },
    personality: [String],
    dos: [String],
    donts: [String],
    usageRules: Schema.Types.Mixed,
  },
  assets: {
    logoFiles: [String],
    brandBook: String,
    styleGuide: String,
    templates: [String],
  },
  metadata: {
    industry: {
      type: String,
      trim: true,
    },
    targetAudience: [String],
    brandValues: [String],
    competitors: [String],
    inspiration: [String],
    tags: [String],
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
BrandIdentitySchema.index({ project: 1 });
BrandIdentitySchema.index({ organization: 1 });
BrandIdentitySchema.index({ createdBy: 1 });
BrandIdentitySchema.index({ 'metadata.industry': 1 });
BrandIdentitySchema.index({ 'metadata.tags': 1 });
BrandIdentitySchema.index({ isPublished: 1 });
BrandIdentitySchema.index({ organization: 1, isPublished: 1 });

// Virtual for color count
BrandIdentitySchema.virtual('colorCount').get(function(this: IBrandIdentity) {
  return this.colors.length;
});

// Virtual for logo variation count
BrandIdentitySchema.virtual('logoVariationCount').get(function(this: IBrandIdentity) {
  return this.logoVariations.length;
});

// Method to get color by usage
BrandIdentitySchema.methods.getColorByUsage = function(usage: string): IBrandColor | undefined {
  return this.colors.find((color: IBrandColor) => color.usage === usage);
};

// Method to get primary color palette
BrandIdentitySchema.methods.getPrimaryPalette = function(): IBrandColor[] {
  return this.colors.filter((color: IBrandColor) =>
    ['primary', 'secondary', 'accent'].includes(color.usage)
  );
};

// Method to publish brand identity
BrandIdentitySchema.methods.publish = function(): Promise<IBrandIdentity> {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Method to unpublish brand identity
BrandIdentitySchema.methods.unpublish = function(): Promise<IBrandIdentity> {
  this.isPublished = false;
  this.publishedAt = undefined;
  return this.save();
};

export default mongoose.models.BrandIdentity || mongoose.model<IBrandIdentity>('BrandIdentity', BrandIdentitySchema);