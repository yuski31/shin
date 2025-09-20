import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { contentFactory } from '@/lib/content-generation/content-factory';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';

// POST /api/content/generate - Generate content
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const {
      type,
      title,
      description,
      prompt,
      templateId,
      presetId,
      parameters,
      options
    } = body;

    // Validate required fields
    if (!type || !title || !prompt) {
      return NextResponse.json(
        { error: 'Type, title, and prompt are required' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ['text', 'image', 'video', 'audio', 'code', 'batch'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Prepare generation request
    const generationRequest = {
      userId: session.user.id,
      organizationId: session.user.organizationId || 'default',
      type,
      title,
      description,
      prompt,
      templateId,
      presetId,
      parameters,
      options
    };

    // Generate content using factory
    const result = await contentFactory.generateContent(generationRequest);

    // Return response
    if (result.success) {
      return NextResponse.json({
        success: true,
        contentId: result.contentId,
        jobId: result.jobId,
        status: result.status,
        result: result.result,
        usage: result.usage
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          status: result.status
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/content/generate - Get generation status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get content ID from query parameters
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Get generation status
    const status = await contentFactory.getGenerationStatus(contentId);

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Get generation status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/content/generate - Cancel generation
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get content ID from query parameters
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Cancel generation
    const cancelled = await contentFactory.cancelGeneration(contentId);

    return NextResponse.json({
      success: true,
      cancelled
    });

  } catch (error) {
    console.error('Cancel generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}