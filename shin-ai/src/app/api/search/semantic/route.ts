import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { KnowledgeDocument, KnowledgeConcept, KnowledgeInsight } from '@/models/knowledge';
import { providerFactory } from '@/lib/providers/provider-factory';
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
      query,
      organizationId,
      domain,
      limit = 20,
      threshold = 0.7,
      includeDocuments = true,
      includeConcepts = true,
      includeInsights = true,
      providerConfig
    } = body;

    if (!query || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: query, organizationId' },
        { status: 400 }
      );
    }

    const results = {
      documents: [] as any[],
      concepts: [] as any[],
      insights: [] as any[],
      totalResults: 0,
      processingTime: 0,
    };

    const startTime = Date.now();

    try {
      // Initialize AI provider for semantic search
      const provider = providerFactory.createProvider(providerConfig as ProviderConfig, {
        type: 'openai',
        baseUrl: providerConfig?.baseUrl,
        apiKey: providerConfig?.apiKey,
      });

      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query, provider);

      // Search documents
      if (includeDocuments) {
        const documents = await searchDocuments(
          query,
          queryEmbedding,
          organizationId,
          domain,
          limit,
          threshold
        );
        results.documents = documents;
      }

      // Search concepts
      if (includeConcepts) {
        const concepts = await searchConcepts(
          query,
          queryEmbedding,
          organizationId,
          domain,
          limit,
          threshold
        );
        results.concepts = concepts;
      }

      // Search insights
      if (includeInsights) {
        const insights = await searchInsights(
          query,
          queryEmbedding,
          organizationId,
          domain,
          limit,
          threshold
        );
        results.insights = insights;
      }

      results.totalResults = results.documents.length + results.concepts.length + results.insights.length;
      results.processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: results,
      });

    } catch (searchError) {
      console.error('Error during semantic search:', searchError);

      // Fallback to text-based search
      return NextResponse.json({
        success: true,
        data: await fallbackTextSearch(
          query,
          organizationId,
          domain,
          limit,
          results
        ),
        fallback: true,
      });
    }

  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateEmbedding(text: string, provider: any): Promise<number[]> {
  try {
    // Use the provider to generate embeddings
    const response = await provider.generateEmbedding({
      input: text,
      model: 'text-embedding-ada-002', // OpenAI's embedding model
    });

    return response.embedding || response.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return a simple hash-based embedding as fallback
    return simpleHashEmbedding(text);
  }
}

async function searchDocuments(
  query: string,
  queryEmbedding: number[],
  organizationId: string,
  domain?: string,
  limit: number = 20,
  threshold: number = 0.7
): Promise<any[]> {
  try {
    // For now, use text-based search with MongoDB text search
    // In production, you'd use a vector database like Pinecone or Weaviate
    const searchQuery: any = {
      organizationId,
      processingStatus: 'completed',
      $text: { $search: query }
    };

    if (domain) {
      searchQuery['metadata.tags'] = domain;
    }

    const documents = await KnowledgeDocument.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('uploadedBy', 'name email')
    .lean();

    return documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      content: doc.content.substring(0, 500) + '...',
      type: doc.type,
      source: doc.source,
      relevance: doc.score || 0.5,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt,
      conceptCount: doc.extractedConcepts?.length || 0,
      topicCount: doc.topics?.length || 0,
    }));

  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

async function searchConcepts(
  query: string,
  queryEmbedding: number[],
  organizationId: string,
  domain?: string,
  limit: number = 20,
  threshold: number = 0.7
): Promise<any[]> {
  try {
    const searchQuery: any = {
      organizationId,
      $text: { $search: query }
    };

    if (domain) {
      searchQuery.domain = domain;
    }

    const concepts = await KnowledgeConcept.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

    return concepts.map(concept => ({
      id: concept._id,
      name: concept.name,
      description: concept.description,
      domain: concept.domain,
      confidence: concept.confidence,
      frequency: concept.frequency,
      relevance: concept.score || 0.5,
      createdAt: concept.createdAt,
    }));

  } catch (error) {
    console.error('Error searching concepts:', error);
    return [];
  }
}

async function searchInsights(
  query: string,
  queryEmbedding: number[],
  organizationId: string,
  domain?: string,
  limit: number = 20,
  threshold: number = 0.7
): Promise<any[]> {
  try {
    const searchQuery: any = {
      organizationId,
      $text: { $search: query }
    };

    if (domain) {
      searchQuery.domain = domain;
    }

    const insights = await KnowledgeInsight.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('sourceDocuments', 'title')
    .lean();

    return insights.map(insight => ({
      id: insight._id,
      title: insight.title,
      content: insight.content.substring(0, 300) + '...',
      type: insight.type,
      confidence: insight.confidence,
      impact: insight.impact,
      domain: insight.domain,
      relevance: insight.score || 0.5,
      sourceDocuments: insight.sourceDocuments,
      createdAt: insight.createdAt,
    }));

  } catch (error) {
    console.error('Error searching insights:', error);
    return [];
  }
}

async function fallbackTextSearch(
  query: string,
  organizationId: string,
  domain?: string,
  limit: number = 20,
  results: any
): Promise<any> {
  const fallbackResults = { ...results };

  // Simple text-based search across all content types
  const searchRegex = new RegExp(query, 'i');

  // Search documents
  const documents = await KnowledgeDocument.find({
    organizationId,
    processingStatus: 'completed',
    $or: [
      { title: searchRegex },
      { content: searchRegex },
      { 'metadata.tags': domain }
    ]
  })
  .limit(Math.ceil(limit / 3))
  .populate('uploadedBy', 'name email')
  .lean();

  fallbackResults.documents = documents.map(doc => ({
    id: doc._id,
    title: doc.title,
    content: doc.content.substring(0, 500) + '...',
    type: doc.type,
    source: doc.source,
    relevance: 0.6, // Default relevance for fallback
    uploadedBy: doc.uploadedBy,
    createdAt: doc.createdAt,
  }));

  // Search concepts
  const concepts = await KnowledgeConcept.find({
    organizationId,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      ...(domain ? [{ domain }] : [])
    ]
  })
  .limit(Math.ceil(limit / 3))
  .lean();

  fallbackResults.concepts = concepts.map(concept => ({
    id: concept._id,
    name: concept.name,
    description: concept.description,
    domain: concept.domain,
    confidence: concept.confidence,
    frequency: concept.frequency,
    relevance: 0.6,
    createdAt: concept.createdAt,
  }));

  // Search insights
  const insights = await KnowledgeInsight.find({
    organizationId,
    $or: [
      { title: searchRegex },
      { content: searchRegex },
      ...(domain ? [{ domain }] : [])
    ]
  })
  .limit(Math.ceil(limit / 3))
  .populate('sourceDocuments', 'title')
  .lean();

  fallbackResults.insights = insights.map(insight => ({
    id: insight._id,
    title: insight.title,
    content: insight.content.substring(0, 300) + '...',
    type: insight.type,
    confidence: insight.confidence,
    impact: insight.impact,
    domain: insight.domain,
    relevance: 0.6,
    sourceDocuments: insight.sourceDocuments,
    createdAt: insight.createdAt,
  }));

  fallbackResults.totalResults = fallbackResults.documents.length +
                                 fallbackResults.concepts.length +
                                 fallbackResults.insights.length;

  return fallbackResults;
}

// Simple hash-based embedding for fallback
function simpleHashEmbedding(text: string): number[] {
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Generate a simple 384-dimensional embedding (OpenAI ada-002 dimensions)
  const embedding: number[] = [];
  for (let i = 0; i < 384; i++) {
    embedding.push((hash * (i + 1)) % 1000 / 1000);
  }

  return embedding;
}