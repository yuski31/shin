import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { LearningPath, LearningContent, LearningCompetency } from '@/models/learning';
import { providerFactory } from '@/lib/providers/provider-factory';
import { ProviderConfig } from '@/lib/providers/base-provider';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || (session.user as any).id;
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

    const query: any = { userId, organizationId };
    if (status) {
      query.status = status;
    }

    const paths = await LearningPath.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('competencies', 'name description domain')
      .populate('contentItems.contentId', 'title type difficulty duration')
      .lean();

    const total = await LearningPath.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        paths: paths.map(path => ({
          id: path._id,
          title: path.title,
          description: path.description,
          progress: path.progress,
          status: path.status,
          competencies: path.competencies,
          contentItems: path.contentItems.map((item: any) => ({
            id: item.contentId._id,
            title: item.contentId.title,
            type: item.contentId.type,
            difficulty: item.contentId.difficulty,
            duration: item.contentId.duration,
            order: item.order,
            isCompleted: item.isCompleted,
            completedAt: item.completedAt,
            timeSpent: item.timeSpent,
            score: item.score,
          })),
          metadata: path.metadata,
          createdAt: path.createdAt,
          updatedAt: path.updatedAt,
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
    console.error('Error fetching learning paths:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      description,
      organizationId,
      competencies,
      skillGaps,
      providerConfig
    } = body;

    if (!title || !description || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, organizationId' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Generate personalized learning path using AI
    const learningPath = await generatePersonalizedLearningPath(
      userId,
      organizationId,
      competencies || [],
      skillGaps || [],
      providerConfig as ProviderConfig
    );

    // Create the learning path record
    const pathRecord = await LearningPath.create({
      ...learningPath,
      userId,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: pathRecord._id,
        title: pathRecord.title,
        description: pathRecord.description,
        progress: pathRecord.progress,
        status: pathRecord.status,
        contentItems: pathRecord.contentItems,
        competencies: pathRecord.competencies,
        skillGaps: pathRecord.skillGaps,
        metadata: pathRecord.metadata,
        createdAt: pathRecord.createdAt,
      },
    });

  } catch (error) {
    console.error('Error creating learning path:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generatePersonalizedLearningPath(
  userId: string,
  organizationId: string,
  competencies: string[],
  skillGaps: any[],
  providerConfig: ProviderConfig
): Promise<any> {
  try {
    const provider = providerFactory.createProvider(providerConfig, {
      type: 'openai',
      baseUrl: providerConfig.baseUrl,
      apiKey: providerConfig.apiKey,
    });

    // Get user's existing learning history
    const existingPaths = await LearningPath.find({ userId, organizationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get available content
    const availableContent = await LearningContent.find({
      organizationId,
      'metadata.isActive': true
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

    const prompt = `Generate a personalized learning path based on:

User Learning History:
${existingPaths.map(p => `- ${p.title}: ${p.progress}% complete`).join('\n')}

Target Competencies:
${competencies.join(', ')}

Skill Gaps:
${skillGaps.map(g => `- ${g.competencyId}: ${g.gapLevel}% gap, ${g.priority} priority`).join('\n')}

Available Content:
${availableContent.slice(0, 20).map(c => `- ${c.title} (${c.type}, ${c.difficulty}, ${c.duration}min)`).join('\n')}

Create a structured learning path with:
1. Title and description
2. Ordered content items with estimated time
3. Target competencies
4. Skill gaps being addressed
5. Estimated total duration
6. Difficulty progression

Return as JSON with this structure:
{
  "title": "Learning Path Title",
  "description": "Path description",
  "contentItems": [
    {
      "contentId": "content_id",
      "order": 1,
      "estimatedTime": 30,
      "difficulty": "beginner"
    }
  ],
  "competencies": ["comp_id1", "comp_id2"],
  "skillGaps": [...],
  "metadata": {
    "estimatedDuration": 300,
    "difficulty": "intermediate",
    "learningStyle": "mixed",
    "createdBy": "ai",
    "adaptive": true
  }
}`;

    const response = await provider.generateText({
      prompt,
      maxTokens: 2000,
      temperature: 0.3,
    });

    // Parse the response
    const pathData = parseLearningPathResponse(response);

    // Map content IDs to actual content
    const contentIds = pathData.contentItems.map((item: any) => item.contentId);
    const contentMap = new Map();

    const foundContent = await LearningContent.find({
      _id: { $in: contentIds },
      organizationId
    }).lean();

    foundContent.forEach(content => {
      contentMap.set(content._id.toString(), content);
    });

    // Create the learning path structure
    return {
      title: pathData.title,
      description: pathData.description,
      contentItems: pathData.contentItems.map((item: any) => ({
        contentId: contentMap.get(item.contentId)?._id || item.contentId,
        order: item.order,
        isCompleted: false,
        timeSpent: 0,
        estimatedTime: item.estimatedTime || 30,
      })),
      competencies: pathData.competencies || [],
      skillGaps: pathData.skillGaps || [],
      progress: 0,
      status: 'active',
      metadata: {
        estimatedDuration: pathData.metadata?.estimatedDuration || 300,
        difficulty: pathData.metadata?.difficulty || 'intermediate',
        learningStyle: pathData.metadata?.learningStyle || 'mixed',
        createdBy: 'ai',
        adaptive: true,
        lastActivity: new Date(),
      },
    };

  } catch (error) {
    console.error('Error generating personalized learning path:', error);

    // Return a basic learning path as fallback
    return {
      title: 'Personalized Learning Path',
      description: 'AI-generated learning path based on your goals',
      contentItems: [],
      competencies: competencies || [],
      skillGaps: skillGaps || [],
      progress: 0,
      status: 'active',
      metadata: {
        estimatedDuration: 300,
        difficulty: 'intermediate',
        learningStyle: 'mixed',
        createdBy: 'ai',
        adaptive: true,
        lastActivity: new Date(),
      },
    };
  }
}

function parseLearningPathResponse(response: string): any {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('Error parsing learning path response:', error);
    return {};
  }
}