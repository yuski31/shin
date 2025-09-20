import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MedicalImage from '@/models/healthcare/MedicalImage';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const modality = searchParams.get('modality');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectToDatabase();

    let query: any = {};

    if (patientId) {
      query.patientId = patientId;
    }

    if (modality) {
      query['dicomMetadata.modality'] = modality;
    }

    const images = await MedicalImage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('patientId', 'name email')
      .lean();

    const total = await MedicalImage.countDocuments(query);

    return NextResponse.json({
      images,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    console.error('Get medical images error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const organizationId = formData.get('organizationId') as string;

    if (!file || !patientId || !organizationId) {
      return NextResponse.json({
        error: 'File, patient ID, and organization ID are required'
      }, { status: 400 });
    }

    await connectToDatabase();

    // In a real implementation, this would:
    // 1. Parse DICOM file
    // 2. Extract metadata
    // 3. Store image data securely
    // 4. Run AI analysis
    // 5. Create audit trail

    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const medicalImage = new MedicalImage({
      imageId,
      patientId,
      studyId: `study_${Date.now()}`,
      seriesId: `series_${Date.now()}`,
      sopInstanceId: `sop_${Date.now()}`,

      dicomMetadata: {
        modality: 'CT', // Would be extracted from DICOM
        bodyPart: 'CHEST',
        studyDescription: 'Chest CT Scan',
        seriesDescription: 'Axial',
        imageType: ['ORIGINAL', 'PRIMARY'],
        acquisitionDate: new Date(),
        acquisitionTime: new Date().toTimeString(),
        pixelSpacing: [0.5, 0.5],
        sliceThickness: 1.0,
        imagePosition: [0, 0, 0],
        imageOrientation: [1, 0, 0, 0, 1, 0]
      },

      imageData: {
        width: 512,
        height: 512,
        pixelData: Buffer.from('mock_pixel_data'), // Would be actual image data
        format: 'DICOM',
        compression: 'NONE'
      },

      analysisResults: {
        segmentation: {},
        anomalyDetection: {},
        diagnosticFindings: {},
        confidenceScores: new Map(),
        processingMetadata: {
          modelVersion: '1.0.0',
          processingTime: 1500,
          qualityScore: 0.95
        }
      },

      accessControl: {
        organizationId,
        authorizedUsers: [session.user.id],
        accessLevel: 'WRITE',
        encryptionKey: 'mock_encryption_key'
      },

      auditTrail: [{
        action: 'UPLOAD',
        userId: session.user.id,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }]
    });

    const savedImage = await medicalImage.save();

    // Populate patient information
    await savedImage.populate('patientId', 'name email');

    return NextResponse.json({
      success: true,
      image: savedImage
    }, { status: 201 });

  } catch (error) {
    console.error('Upload medical image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}