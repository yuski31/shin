import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { DesignTemplate } from '@/models/design-automation';

// GET /api/design/templates - Get all design templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const license = searchParams.get('license');
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();

    let query: any = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (license) {
      query['metadata.license'] = license;
    }

    if (organizationId) {
      query.organization = organizationId;
    }

    const templates = await DesignTemplate.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('organization', 'name slug')
      .sort({ 'metadata.popularity': -1, 'metadata.rating': -1 })
      .limit(limit)
      .skip(offset);

    const total = await DesignTemplate.countDocuments(query);

    return NextResponse.json({
      templates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching design templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/design/templates - Create a new design template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      type,
      organizationId,
      thumbnailUrl,
      previewUrl,
      downloadUrl,
      compatibility,
      configuration,
      content,
      metadata
    } = body;

    if (!name || !description || !category || !thumbnailUrl || !downloadUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, category, thumbnailUrl, downloadUrl' },
        { status: 400 }
      );
    }

    const validCategories = ['ui-component', 'wireframe', 'brand-kit', 'floor-plan', 'pattern-block', 'presentation', 'social-media', 'email', 'dashboard', 'landing-page'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid template category' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user's organizations
    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let organizationIdToUse;
    if (organizationId) {
      // Use specified organization
      if (!user.organizations.includes(organizationId) && user.defaultOrganization?.toString() !== organizationId) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }
      organizationIdToUse = organizationId;
    } else {
      // Use user's default organization
      organizationIdToUse = user.defaultOrganization;
      if (!organizationIdToUse) {
        return NextResponse.json(
          { error: 'No default organization found. Please specify an organizationId.' },
          { status: 400 }
        );
      }
    }

    const template = new DesignTemplate({
      name,
      description,
      category,
      type: type || 'static',
      organization: organizationIdToUse,
      createdBy: session.user.id,
      thumbnailUrl,
      previewUrl,
      downloadUrl,
      compatibility: compatibility || ['universal'],
      configuration: {
        variables: [],
        styles: {},
        components: [],
        dependencies: [],
        ...configuration,
      },
      content,
      metadata: {
        version: '1.0.0',
        author: user.name,
        license: 'free',
        tags: [],
        industry: [],
        useCase: [],
        difficulty: 'intermediate',
        timeEstimate: 30,
        popularity: 0,
        rating: 0,
        reviews: 0,
        ...metadata,
      },
      aiMetadata: {
        generated: false,
      },
      usage: {
        downloads: 0,
        views: 0,
        forks: 0,
        favorites: 0,
      },
      permissions: {
        isPublic: true,
        allowedUsers: [],
        allowedOrganizations: [],
      },
      versions: [],
      isPublished: false,
    });

    await template.save();

    // Populate the created template
    await template.populate('createdBy', 'name email avatar');
    await template.populate('organization', 'name slug');

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating design template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}