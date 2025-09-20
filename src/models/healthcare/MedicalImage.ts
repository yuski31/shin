import mongoose, { Document, ObjectId } from 'mongoose';

export interface IMedicalImage extends Document {
  _id: ObjectId;
  imageId: string;
  patientId: ObjectId;
  studyId: string;
  seriesId: string;
  sopInstanceId: string;

  // DICOM metadata
  dicomMetadata: {
    modality: string;
    bodyPart: string;
    studyDescription: string;
    seriesDescription: string;
    imageType: string[];
    acquisitionDate: Date;
    acquisitionTime: string;
    pixelSpacing: number[];
    sliceThickness: number;
    imagePosition: number[];
    imageOrientation: number[];
  };

  // Image data
  imageData: {
    width: number;
    height: number;
    pixelData: Buffer;
    format: string;
    compression: string;
  };

  // AI analysis results
  analysisResults: {
    segmentation: any;
    anomalyDetection: any;
    diagnosticFindings: any;
    confidenceScores: Map<string, number>;
    processingMetadata: {
      modelVersion: string;
      processingTime: number;
      qualityScore: number;
    };
  };

  // Access control
  accessControl: {
    organizationId: ObjectId;
    authorizedUsers: ObjectId[];
    accessLevel: string;
    encryptionKey: string;
  };

  // Audit trail
  auditTrail: Array<{
    action: string;
    userId: ObjectId;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const MedicalImageSchema = new mongoose.Schema<IMedicalImage>({
  imageId: {
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
  studyId: {
    type: String,
    required: true,
    index: true
  },
  seriesId: {
    type: String,
    required: true,
    index: true
  },
  sopInstanceId: {
    type: String,
    required: true,
    unique: true
  },

  dicomMetadata: {
    modality: String,
    bodyPart: String,
    studyDescription: String,
    seriesDescription: String,
    imageType: [String],
    acquisitionDate: Date,
    acquisitionTime: String,
    pixelSpacing: [Number],
    sliceThickness: Number,
    imagePosition: [Number],
    imageOrientation: [Number]
  },

  imageData: {
    width: Number,
    height: Number,
    pixelData: Buffer,
    format: String,
    compression: String
  },

  analysisResults: {
    segmentation: mongoose.Schema.Types.Mixed,
    anomalyDetection: mongoose.Schema.Types.Mixed,
    diagnosticFindings: mongoose.Schema.Types.Mixed,
    confidenceScores: mongoose.Schema.Types.Mixed,
    processingMetadata: {
      modelVersion: String,
      processingTime: Number,
      qualityScore: Number
    }
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
    accessLevel: {
      type: String,
      enum: ['READ', 'WRITE', 'ADMIN'],
      default: 'READ'
    },
    encryptionKey: String
  },

  auditTrail: [{
    action: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
MedicalImageSchema.index({ patientId: 1, studyId: 1 });
MedicalImageSchema.index({ 'dicomMetadata.modality': 1, createdAt: -1 });
MedicalImageSchema.index({ 'analysisResults.processingMetadata.modelVersion': 1 });

export default mongoose.models.MedicalImage || mongoose.model<IMedicalImage>('MedicalImage', MedicalImageSchema);