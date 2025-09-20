import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { DesignProject } from '@/models/design-automation';

// GET /api/design - Get all design projects for the authenticated user or organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // Filter by design type
    const status = searchParams.get('status'); // Filter by project status
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();

    let query: any = {};

    if (organizationId) {
      query.organization = organizationId;
    } else {
      // Get user's organizations
      const User = (await import('@/models/User')).default;
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const organizationIds = user.organizations || [];
      if (user.defaultOrganization) {
        organizationIds.push(user.defaultOrganization);
      }
      query.organization = { $in: organizationIds };
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const projects = await DesignProject.find(query)
      .populate('owner', 'name email avatar')
      .populate('organization', 'name slug')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await DesignProject.countDocuments(query);

    return NextResponse.json({
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching design projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/design - Create a new design project
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
      type,
      organizationId,
      settings = {},
      metadata = {}
    } = body;

    if (!name || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, type' },
        { status: 400 }
      );
    }

    const validTypes = ['ui-ux', 'brand-identity', 'architecture-cad', 'fashion-product', 'mixed'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid design type' },
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

    const project = new DesignProject({
      name,
      description,
      type,
      organization: organizationIdToUse,
      owner: session.user.id,
      collaborators: [session.user.id], // Owner is automatically a collaborator
      settings: {
        isPublic: false,
        allowComments: true,
        requireApproval: false,
        autoSave: true,
        ...settings,
      },
      metadata: {
        tags: [],
        category: 'general',
        priority: 'medium',
        ...metadata,
      },
    });

    await project.save();

    // Populate the created project
    await project.populate('owner', 'name email avatar');
    await project.populate('organization', 'name slug');

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating design project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}