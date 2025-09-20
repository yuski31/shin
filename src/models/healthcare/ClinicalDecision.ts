import mongoose, { Document, ObjectId } from 'mongoose';

export interface IClinicalDecision extends Document {
  _id: ObjectId;
  decisionId: string;
  patientId: ObjectId;
  condition: string;
  recommendedTreatments: Array<{
    treatment: string;
    confidence: number;
    evidenceLevel: string;
    rationale: string;
    alternatives: any[];
  }>;
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDrugInteraction extends Document {
  _id: ObjectId;
  interactionId: string;
  drugs: string[];
  interactionType: string;
  severity: string;
  description: string;
  management: string;
  evidence: any[];
  createdAt: Date;
}

export interface IClinicalTrial extends Document {
  _id: ObjectId;
  trialId: string;
  title: string;
  condition: string;
  phase: string;
  eligibilityCriteria: any;
  locations: Array<{
    facility: string;
    city: string;
    state: string;
    country: string;
    distance: number;
  }>;
  status: string;
  contactInfo: any;
  updatedAt: Date;
}

const ClinicalDecisionSchema = new mongoose.Schema<IClinicalDecision>({
  decisionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condition: {
    type: String,
    required: true,
    index: true
  },
  recommendedTreatments: [{
    treatment: String,
    confidence: Number,
    evidenceLevel: String,
    rationale: String,
    alternatives: [mongoose.Schema.Types.Mixed]
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

const DrugInteractionSchema = new mongoose.Schema<IDrugInteraction>({
  interactionId: {
    type: String,
    required: true,
    unique: true
  },
  drugs: [String],
  interactionType: {
    type: String,
    enum: ['SYNERGISTIC', 'ANTAGONISTIC', 'ADDITIVE']
  },
  severity: {
    type: String,
    enum: ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']
  },
  description: String,
  management: String,
  evidence: [mongoose.Schema.Types.Mixed]
}, {
  timestamps: true
});

const ClinicalTrialSchema = new mongoose.Schema<IClinicalTrial>({
  trialId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  condition: String,
  phase: String,
  eligibilityCriteria: mongoose.Schema.Types.Mixed,
  locations: [{
    facility: String,
    city: String,
    state: String,
    country: String,
    distance: Number
  }],
  status: {
    type: String,
    enum: ['RECRUITING', 'ACTIVE', 'COMPLETED', 'SUSPENDED', 'TERMINATED', 'WITHDRAWN']
  },
  contactInfo: mongoose.Schema.Types.Mixed,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ClinicalDecisionSchema.index({ patientId: 1, condition: 1 });
ClinicalDecisionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
DrugInteractionSchema.index({ drugs: 1 });
ClinicalTrialSchema.index({ condition: 1, status: 1 });
ClinicalTrialSchema.index({ 'locations.city': 1, 'locations.state': 1 });

export default {
  ClinicalDecision: mongoose.models.ClinicalDecision || mongoose.model<IClinicalDecision>('ClinicalDecision', ClinicalDecisionSchema),
  DrugInteraction: mongoose.models.DrugInteraction || mongoose.model<IDrugInteraction>('DrugInteraction', DrugInteractionSchema),
  ClinicalTrial: mongoose.models.ClinicalTrial || mongoose.model<IClinicalTrial>('ClinicalTrial', ClinicalTrialSchema)
};