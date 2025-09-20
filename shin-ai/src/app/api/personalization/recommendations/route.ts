import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PersonalizationService } from '@/lib/personalization';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'content' | 'feature' | 'workflow' | 'social' | 'learning_path' || 'content';
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeInsights = searchParams.get('insights') === 'true';

    // Initialize personalization service with basic config
    const personalizationService = new PersonalizationService({
      aiProvider: {
        name: 'OpenAI',
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-3.5-turbo', 'gpt-4'],
        features: ['chat', 'embeddings'],
        rateLimits: { requestsPerMinute: 60, tokensPerMinute: 100000 },
        userId: session.user.id,
        organization: 'shin-ai',
        baseUrl: 'https://api.openai.com/v1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      providerAdapter: {} as any,
      enableRealTime: false,
      batchSize: 50,
      updateInterval: 10,
      enableCaching: true,
      cacheTTL: 300,
    });

    // Get recommendations based on type
    let recommendations = [];
    let insights = [];

    switch (type) {
      case 'content':
        recommendations = await personalizationService.getContentRecommendations(session.user.id, { maxItems: limit });
        break;
      case 'feature':
        recommendations = await personalizationService.getFeatureRecommendations(session.user.id);
        break;
      case 'workflow':
        recommendations = await personalizationService.getWorkflowRecommendations(session.user.id);
        break;
      default:
        recommendations = await personalizationService.getContentRecommendations(session.user.id, { maxItems: limit });
    }

    if (includeInsights) {
      insights = await personalizationService.getRecommendationInsights(session.user.id);
    }

    return NextResponse.json({
      recommendations,
      insights: includeInsights ? insights : undefined,
      metadata: {
        type,
        count: recommendations.length,
        userId: session.user.id,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, context, filters, algorithms } = body;

    // Initialize personalization service
    const personalizationService = new PersonalizationService({
      aiProvider: {
        name: 'OpenAI',
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-3.5-turbo', 'gpt-4'],
        features: ['chat', 'embeddings'],
        rateLimits: { requestsPerMinute: 60, tokensPerMinute: 100000 },
        userId: session.user.id,
        organization: 'shin-ai',
        baseUrl: 'https://api.openai.com/v1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      providerAdapter: {} as any,
      enableRealTime: false,
      batchSize: 50,
      updateInterval: 10,
      enableCaching: true,
      cacheTTL: 300,
    });

    // Get custom recommendations
    const recommendations = await personalizationService.getRecommendations({
      userId: session.user.id,
      type: type || 'content',
      context,
      filters,
      algorithms,
    });

    return NextResponse.json({
      recommendations,
      metadata: {
        type: type || 'content',
        count: recommendations.length,
        userId: session.user.id,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}