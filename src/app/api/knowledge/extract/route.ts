import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { KnowledgeExtractionService } from '@/lib/knowledge-extraction/knowledge-extraction-service';
import { KnowledgeDocument } from '@/models/knowledge';
import { ProviderConfig } from '@/lib/providers/base-provider';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      source,
      metadata,
      organizationId,
      providerConfig
    } = body;

    // Validate required fields
    if (!title || !content || !type || !source || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, type, source, organizationId' },
        { status: 400 }
      );
    }

    // Initialize knowledge extraction service
    const extractionService = new KnowledgeExtractionService(
      providerConfig as ProviderConfig,
      {
        maxConceptsPerDocument: 50,
        minConceptConfidence: 0.3,
        topicModelingThreshold: 0.5,
        insightGenerationEnabled: true,
        expertIdentificationEnabled: true,
        trendAnalysisEnabled: true,
      }
    );

    // Process the document
    const result = await extractionService.processDocument(
      {
        title,
        content,
        type,
        source,
        metadata,
      },
      organizationId,
      (session.user as any).id
    );

    return NextResponse.json({
      success: true,
      data: {
        document: {
          id: result.document._id,
          title: result.document.title,
          type: result.document.type,
          processingStatus: result.document.processingStatus,
          createdAt: result.document.createdAt,
        },
        concepts: result.concepts.map(c => ({
          name: c.name,
          description: c.description,
          confidence: c.confidence,
          domain: c.domain,
        })),
        topics: result.topics.map(t => ({
          name: t.name,
          description: t.description,
          confidence: t.confidence,
          keywords: t.metadata?.keywords || [],
        })),
        insights: result.insights.map(i => ({
          id: i._id,
          title: i.title,
          type: i.type,
          confidence: i.confidence,
          impact: i.impact,
        })),
        processingTime: result.processingTime,
        metadata: result.metadata,
      },
    });

  } catch (error) {
    console.error('Error in knowledge extraction:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const query: any = { organizationId };
    if (status) {
      query.processingStatus = status;
    }

    const documents = await KnowledgeDocument.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('uploadedBy', 'name email')
      .lean();

    const total = await KnowledgeDocument.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc._id,
          title: doc.title,
          type: doc.type,
          source: doc.source,
          processingStatus: doc.processingStatus,
          uploadedBy: doc.uploadedBy,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          conceptCount: doc.extractedConcepts?.length || 0,
          topicCount: doc.topics?.length || 0,
          insightCount: doc.insights?.length || 0,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}