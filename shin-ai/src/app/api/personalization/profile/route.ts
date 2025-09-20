import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PersonalizationService } from '@/lib/personalization';
import { IAIProvider } from '@/models/AIProvider';
import { ProviderFactory } from '@/lib/providers/provider-factory';

// Initialize personalization service
const providerFactory = new ProviderFactory();
const openaiProvider = providerFactory.createProvider(
  {
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  {
    name: 'OpenAI',
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    models: ['gpt-3.5-turbo', 'gpt-4'],
    features: ['chat', 'embeddings'],
    rateLimits: { requestsPerMinute: 60, tokensPerMinute: 100000 },
  } as IAIProvider
);

const personalizationService = new PersonalizationService({
  aiProvider: {
    name: 'OpenAI',
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    models: ['gpt-3.5-turbo', 'gpt-4'],
    features: ['chat', 'embeddings'],
    rateLimits: { requestsPerMinute: 60, tokensPerMinute: 100000 },
  } as IAIProvider,
  providerAdapter: openaiProvider,
  enableRealTime: true,
  batchSize: 100,
  updateInterval: 5,
  enableCaching: true,
  cacheTTL: 300,
});

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
    const includeRecommendations = searchParams.get('recommendations') === 'true';
    const includeInsights = searchParams.get('insights') === 'true';
    const includeEngagement = searchParams.get('engagement') === 'true';

    // Get personalization profile
    const profile = await personalizationService.getPersonalizationProfile(session.user.id);

    if (!profile) {
      return NextResponse.json({
        message: 'No personalization data available yet',
        profile: null,
        recommendations: [],
        insights: ['Continue using the platform to build your personalization profile'],
        engagement: null,
        adaptiveUI: {
          theme: 'auto',
          layout: 'comfortable',
          shortcuts: [],
          accessibility: {
            fontSize: 'medium',
            animations: true,
            screenReader: false,
          },
        },
      });
    }

    const response: any = {
      profile: {
        behavioral: includeInsights ? profile.profile.behavioral : null,
        preferences: profile.profile.preferences,
        psychographics: profile.profile.psychographics,
        context: profile.profile.context,
      },
      confidence: profile.confidence,
      lastUpdated: profile.lastUpdated,
      adaptiveUI: profile.adaptiveUI,
    };

    // Add optional data based on query parameters
    if (includeRecommendations) {
      const [contentRecs, featureRecs, workflowRecs] = await Promise.all([
        personalizationService.getContentRecommendations(session.user.id),
        personalizationService.getFeatureRecommendations(session.user.id),
        personalizationService.getWorkflowRecommendations(session.user.id),
      ]);

      response.recommendations = {
        content: contentRecs,
        features: featureRecs,
        workflows: workflowRecs,
      };
    }

    if (includeInsights) {
      response.insights = profile.insights;
    }

    if (includeEngagement) {
      response.engagement = profile.engagement;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching personalization profile:', error);
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
    const { behaviors, interactions, context, preferences } = body;

    // Update personalization data
    const updateData = {
      userId: session.user.id,
      behaviors: behaviors || [],
      interactions: interactions || [],
      context: context || {},
      preferences: preferences || {},
    };

    const updatedProfile = await personalizationService.updatePersonalization(updateData);

    return NextResponse.json({
      message: 'Personalization profile updated successfully',
      profile: updatedProfile,
    });

  } catch (error) {
    console.error('Error updating personalization profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { behaviors, interactions, context, preferences } = body;

    // Track user behavior and interactions
    if (behaviors && Array.isArray(behaviors)) {
      for (const behavior of behaviors) {
        await personalizationService.trackUserBehavior({
          userId: session.user.id,
          action: behavior.action,
          targetType: behavior.targetType,
          targetId: behavior.targetId,
          context: behavior.context,
          metadata: behavior.metadata,
        });
      }
    }

    if (interactions && Array.isArray(interactions)) {
      for (const interaction of interactions) {
        await personalizationService.trackUserInteraction({
          userId: session.user.id,
          itemId: interaction.itemId,
          itemType: interaction.itemType,
          interactionType: interaction.interactionType,
          weight: interaction.weight,
          context: interaction.context,
          metadata: interaction.metadata,
        });
      }
    }

    // Update context if provided
    if (context) {
      await personalizationService.updateContext(session.user.id, context);
    }

    // Update preferences if provided
    if (preferences) {
      await personalizationService.updatePreferences(session.user.id, interactions || []);
    }

    return NextResponse.json({
      message: 'Personalization data tracked successfully',
    });

  } catch (error) {
    console.error('Error tracking personalization data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}