import mongoose, { Document, ObjectId } from 'mongoose';

export interface IStory extends Document {
  _id: ObjectId;
  organizationId: ObjectId;
  title: string;
  content: StoryContent;
  insights: Insight[];
  visualizations: Visualization[];
  narrativeArc: StoryArc;
  audience: Audience;
  status: 'draft' | 'review' | 'published' | 'archived';
  version: number;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryContent {
  sections: StorySection[];
  narrative: string;
  keyMessages: string[];
  callToAction?: string;
  summary: string;
}

export interface StorySection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'introduction' | 'analysis' | 'findings' | 'conclusion' | 'recommendations';
  insights: string[]; // Insight IDs
  visualizations: string[]; // Visualization IDs
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  data: any;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags: string[];
  source: string;
  timestamp: Date;
}

export interface Visualization {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  data: any;
  config: VisualizationConfig;
  interactive: boolean;
  thumbnail?: string;
  createdAt: Date;
}

export interface StoryArc {
  structure: ArcStructure;
  tension: TensionPoint[];
  climax: ClimaxPoint;
  resolution: ResolutionPoint;
  pacing: PacingStrategy;
}

export interface Audience {
  type: 'executive' | 'technical' | 'business' | 'general';
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  interests: string[];
  preferences: AudiencePreferences;
}

export type InsightType =
  | 'trend'
  | 'anomaly'
  | 'correlation'
  | 'pattern'
  | 'outlier'
  | 'forecast'
  | 'comparison'
  | 'summary';

export type VisualizationType =
  | 'chart'
  | 'graph'
  | 'table'
  | 'map'
  | 'timeline'
  | 'dashboard'
  | 'infographic'
  | 'interactive';

export interface VisualizationConfig {
  framework: 'plotly' | 'd3' | 'chartjs' | 'custom';
  dimensions: {
    width: number;
    height: number;
  };
  theme: 'light' | 'dark' | 'auto';
  responsive: boolean;
  animations: boolean;
}

export interface ArcStructure {
  introduction: ArcPoint;
  risingAction: ArcPoint[];
  climax: ArcPoint;
  fallingAction: ArcPoint[];
  resolution: ArcPoint;
}

export interface ArcPoint {
  id: string;
  title: string;
  content: string;
  duration: number; // in seconds for presentations
  emphasis: 'low' | 'medium' | 'high';
}

export interface TensionPoint {
  id: string;
  title: string;
  description: string;
  intensity: number;
  position: number; // position in the story arc (0-1)
}

export interface ClimaxPoint {
  id: string;
  title: string;
  content: string;
  revelation: string;
  impact: string;
}

export interface ResolutionPoint {
  id: string;
  title: string;
  content: string;
  outcome: string;
  nextSteps: string[];
}

export interface PacingStrategy {
  overall: number; // overall pace (1-10)
  sectionPacing: Record<string, number>;
  emphasisPoints: string[];
  transitions: TransitionStrategy[];
}

export interface TransitionStrategy {
  from: string;
  to: string;
  type: 'fade' | 'slide' | 'zoom' | 'cut';
  duration: number;
}

export interface AudiencePreferences {
  detailLevel: 'high' | 'medium' | 'low';
  technicalDepth: 'high' | 'medium' | 'low';
  visualStyle: 'minimal' | 'balanced' | 'rich';
  interactionLevel: 'passive' | 'interactive' | 'immersive';
}

const StorySchema = new mongoose.Schema<IStory>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    sections: [{
      id: String,
      title: String,
      content: String,
      order: Number,
      type: {
        type: String,
        enum: ['introduction', 'analysis', 'findings', 'conclusion', 'recommendations']
      },
      insights: [String],
      visualizations: [String]
    }],
    narrative: String,
    keyMessages: [String],
    callToAction: String,
    summary: String
  },
  insights: [{
    id: String,
    type: String,
    title: String,
    description: String,
    data: mongoose.Schema.Types.Mixed,
    confidence: Number,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    category: String,
    tags: [String],
    source: String,
    timestamp: Date
  }],
  visualizations: [{
    id: String,
    type: String,
    title: String,
    description: String,
    data: mongoose.Schema.Types.Mixed,
    config: mongoose.Schema.Types.Mixed,
    interactive: Boolean,
    thumbnail: String,
    createdAt: Date
  }],
  narrativeArc: {
    structure: mongoose.Schema.Types.Mixed,
    tension: [mongoose.Schema.Types.Mixed],
    climax: mongoose.Schema.Types.Mixed,
    resolution: mongoose.Schema.Types.Mixed,
    pacing: mongoose.Schema.Types.Mixed
  },
  audience: {
    type: {
      type: String,
      enum: ['executive', 'technical', 'business', 'general']
    },
    knowledgeLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    interests: [String],
    preferences: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  version: {
    type: Number,
    default: 1
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
StorySchema.index({ organizationId: 1, status: 1 });
StorySchema.index({ createdBy: 1, createdAt: -1 });
StorySchema.index({ 'insights.type': 1, 'insights.impact': 1 });

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);