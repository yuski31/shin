import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PersonalizationService } from '@/lib/personalization';

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
    const { behaviors, interactions } = body;

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

    // Track behaviors
    if (behaviors && Array.isArray(behaviors)) {
      for (const behavior of behaviors) {
        await personalizationService.trackUserBehavior({
          userId: session.user.id,
          action: behavior.action,
          targetType: behavior.targetType,
          targetId: behavior.targetId,
          context: behavior.context || {},
          metadata: behavior.metadata || {},
        });
      }
    }

    // Track interactions
    if (interactions && Array.isArray(interactions)) {
      for (const interaction of interactions) {
        await personalizationService.trackUserInteraction({
          userId: session.user.id,
          itemId: interaction.itemId,
          itemType: interaction.itemType,
          interactionType: interaction.interactionType,
          weight: interaction.weight || 1,
          context: interaction.context || {},
          metadata: interaction.metadata || {},
        });
      }
    }

    return NextResponse.json({
      message: 'Behavior and interactions tracked successfully',
      tracked: {
        behaviors: behaviors?.length || 0,
        interactions: interactions?.length || 0,
      },
    });

  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');

    // This would typically fetch from the database
    // For now, return a placeholder response
    return NextResponse.json({
      behaviors: [],
      interactions: [],
      summary: {
        totalBehaviors: 0,
        totalInteractions: 0,
        lastActivity: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching behavior data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}