import mongoose, { Document, ObjectId } from 'mongoose';

export interface IGenomicSequence extends Document {
  _id: ObjectId;
  sequenceId: string;
  patientId: ObjectId;
  sampleId: string;

  // Sequence data
  sequenceData: {
    sequence: string;
    qualityScores: number[];
    readLength: number;
    coverage: number;
    referenceGenome: string;
    chromosome: string;
    position: number;
    strand: string;
  };

  // Variant analysis
  variantAnalysis: {
    variants: Array<{
      chromosome: string;
      position: number;
      reference: string;
      alternate: string;
      variantType: string;
      quality: number;
      depth: number;
      alleleFrequency: number;
      pathogenicityScore: number;
      clinicalSignificance: string;
    }>;
    structuralVariants: any[];
    copyNumberVariants: any[];
  };

  // Protein analysis
  proteinAnalysis: {
    predictedStructure: any;
    foldingConfidence: number;
    functionalDomains: any[];
    mutationImpacts: any[];
  };

  // Access control and compliance
  accessControl: {
    organizationId: ObjectId;
    authorizedUsers: ObjectId[];
    consentFormId: ObjectId;
    dataUseRestrictions: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const GenomicSequenceSchema = new mongoose.Schema<IGenomicSequence>({
  sequenceId: {
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
  sampleId: {
    type: String,
    required: true,
    index: true
  },

  sequenceData: {
    sequence: String,
    qualityScores: [Number],
    readLength: Number,
    coverage: Number,
    referenceGenome: String,
    chromosome: String,
    position: Number,
    strand: {
      type: String,
      enum: ['+', '-']
    }
  },

  variantAnalysis: {
    variants: [{
      chromosome: String,
      position: Number,
      reference: String,
      alternate: String,
      variantType: String,
      quality: Number,
      depth: Number,
      alleleFrequency: Number,
      pathogenicityScore: Number,
      clinicalSignificance: String
    }],
    structuralVariants: mongoose.Schema.Types.Mixed,
    copyNumberVariants: mongoose.Schema.Types.Mixed
  },

  proteinAnalysis: {
    predictedStructure: mongoose.Schema.Types.Mixed,
    foldingConfidence: Number,
    functionalDomains: [mongoose.Schema.Types.Mixed],
    mutationImpacts: [mongoose.Schema.Types.Mixed]
  },

  accessControl: {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    authorizedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    consentFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsentForm'
    },
    dataUseRestrictions: [String]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
GenomicSequenceSchema.index({ patientId: 1, chromosome: 1 });
GenomicSequenceSchema.index({ 'variantAnalysis.variants.variantType': 1 });
GenomicSequenceSchema.index({ 'variantAnalysis.variants.pathogenicityScore': -1 });

export default mongoose.models.GenomicSequence || mongoose.model<IGenomicSequence>('GenomicSequence', GenomicSequenceSchema);