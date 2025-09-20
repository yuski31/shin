import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { DesignProject, DesignAsset } from '@/models/design-automation';

// GET /api/design/[projectId]/assets - Get all assets for a design project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by asset type
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();

    // Check if project exists and user can access it
    const project = await DesignProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.canUserAccess(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let query: any = { project: projectId };
    if (type) {
      query.type = type;
    }

    const assets = await DesignAsset.find(query)
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await DesignAsset.countDocuments(query);

    return NextResponse.json({
      assets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching design assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/design/[projectId]/assets - Create a new design asset
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const body = await request.json();
    const {
      name,
      description,
      type,
      format,
      fileUrl,
      thumbnailUrl,
      metadata = {},
      content = {},
      aiMetadata = {}
    } = body;

    if (!name || !description || !type || !format || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, type, format, fileUrl' },
        { status: 400 }
      );
    }

    const validTypes = ['wireframe', 'mockup', 'logo', 'color-palette', 'typography', 'floor-plan', '3d-model', 'pattern', 'texture', 'template'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid asset type' },
        { status: 400 }
      );
    }

    const validFormats = ['svg', 'png', 'jpg', 'pdf', 'ai', 'psd', 'fig', 'sketch', 'dwg', 'json', 'html', 'css', 'js'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid asset format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if project exists and user can access it
    const project = await DesignProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.canUserAccess(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const asset = new DesignAsset({
      name,
      description,
      type,
      format,
      project: projectId,
      organization: project.organization,
      createdBy: session.user.id,
      fileUrl,
      thumbnailUrl,
      metadata: {
        fileSize: 0,
        tags: [],
        category: 'general',
        isTemplate: false,
        ...metadata,
      },
      content,
      aiMetadata: {
        generated: false,
        ...aiMetadata,
      },
      permissions: {
        isPublic: false,
        allowedUsers: [],
        allowedOrganizations: [],
      },
      usage: {
        downloads: 0,
        views: 0,
        likes: 0,
        shares: 0,
      },
    });

    await asset.save();

    // Add asset to project
    project.assets.push(asset._id);
    await project.save();

    // Populate the created asset
    await asset.populate('createdBy', 'name email avatar');

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating design asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}