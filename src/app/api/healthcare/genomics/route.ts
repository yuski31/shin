import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import GenomicSequence from '@/models/healthcare/GenomicSequence';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const chromosome = searchParams.get('chromosome');
    const variantType = searchParams.get('variantType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectToDatabase();

    let query: any = {};

    if (patientId) {
      query.patientId = patientId;
    }

    if (chromosome) {
      query['sequenceData.chromosome'] = chromosome;
    }

    if (variantType) {
      query['variantAnalysis.variants.variantType'] = variantType;
    }

    const sequences = await GenomicSequence.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('patientId', 'name email')
      .lean();

    const total = await GenomicSequence.countDocuments(query);

    return NextResponse.json({
      sequences,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    console.error('Get genomic sequences error:', error);
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

    const body = await request.json();
    const {
      patientId,
      sampleId,
      sequenceData,
      variantAnalysis,
      proteinAnalysis,
      organizationId
    } = body;

    if (!patientId || !sampleId || !sequenceData || !organizationId) {
      return NextResponse.json({
        error: 'Patient ID, sample ID, sequence data, and organization ID are required'
      }, { status: 400 });
    }

    await connectToDatabase();

    // In a real implementation, this would:
    // 1. Validate sequence data format
    // 2. Run variant calling algorithms
    // 3. Perform protein folding prediction
    // 4. Calculate pathogenicity scores
    // 5. Generate clinical interpretations

    const sequenceId = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const genomicSequence = new GenomicSequence({
      sequenceId,
      patientId,
      sampleId,

      sequenceData: {
        sequence: sequenceData.sequence || 'ATCGATCGATCG',
        qualityScores: sequenceData.qualityScores || [30, 35, 40, 25, 30],
        readLength: sequenceData.readLength || 150,
        coverage: sequenceData.coverage || 30,
        referenceGenome: sequenceData.referenceGenome || 'GRCh38',
        chromosome: sequenceData.chromosome || '1',
        position: sequenceData.position || 1000000,
        strand: sequenceData.strand || '+'
      },

      variantAnalysis: {
        variants: variantAnalysis?.variants || [{
          chromosome: '1',
          position: 1000000,
          reference: 'A',
          alternate: 'T',
          variantType: 'SNV',
          quality: 60,
          depth: 45,
          alleleFrequency: 0.001,
          pathogenicityScore: 0.8,
          clinicalSignificance: 'PATHOGENIC'
        }],
        structuralVariants: variantAnalysis?.structuralVariants || [],
        copyNumberVariants: variantAnalysis?.copyNumberVariants || []
      },

      proteinAnalysis: {
        predictedStructure: proteinAnalysis?.predictedStructure || {},
        foldingConfidence: proteinAnalysis?.foldingConfidence || 0.85,
        functionalDomains: proteinAnalysis?.functionalDomains || [],
        mutationImpacts: proteinAnalysis?.mutationImpacts || []
      },

      accessControl: {
        organizationId,
        authorizedUsers: [session.user.id],
        consentFormId: null, // Would be linked to actual consent form
        dataUseRestrictions: ['RESEARCH_ONLY', 'HIPAA_PROTECTED']
      }
    });

    const savedSequence = await genomicSequence.save();

    // Populate patient information
    await savedSequence.populate('patientId', 'name email');

    return NextResponse.json({
      success: true,
      sequence: savedSequence
    }, { status: 201 });

  } catch (error) {
    console.error('Create genomic sequence error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}