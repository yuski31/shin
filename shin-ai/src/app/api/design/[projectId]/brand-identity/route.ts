import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { DesignProject, BrandIdentity } from '@/models/design-automation';

// GET /api/design/[projectId]/brand-identity - Get brand identity for a project
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

    await connectDB();

    // Check if project exists and user can access it
    const project = await DesignProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.canUserAccess(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const brandIdentity = await BrandIdentity.findOne({ project: projectId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    if (!brandIdentity) {
      return NextResponse.json({ error: 'Brand identity not found' }, { status: 404 });
    }

    return NextResponse.json(brandIdentity);
  } catch (error) {
    console.error('Error fetching brand identity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/design/[projectId]/brand-identity - Create or update brand identity
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
      colors,
      primaryColors,
      typography,
      brandGuidelines,
      metadata,
      aiMetadata
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description' },
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

    // Check if brand identity already exists for this project
    let brandIdentity = await BrandIdentity.findOne({ project: projectId });

    if (brandIdentity) {
      // Update existing brand identity
      Object.assign(brandIdentity, {
        name,
        description,
        colors: colors || brandIdentity.colors,
        primaryColors: primaryColors || brandIdentity.primaryColors,
        typography: typography || brandIdentity.typography,
        brandGuidelines: { ...brandIdentity.brandGuidelines, ...brandGuidelines },
        metadata: { ...brandIdentity.metadata, ...metadata },
        aiMetadata: { ...brandIdentity.aiMetadata, ...aiMetadata },
      });

      await brandIdentity.save();
    } else {
      // Create new brand identity
      brandIdentity = new BrandIdentity({
        name,
        description,
        project: projectId,
        organization: project.organization,
        createdBy: session.user.id,
        colors: colors || [],
        primaryColors: primaryColors || {
          primary: '#000000',
          secondary: '#666666',
          accent: '#0066CC',
        },
        typography: typography || {
          family: 'Inter',
          weights: [400, 500, 600, 700],
          styles: ['normal'],
          sizes: {
            display: '3rem',
            heading1: '2.5rem',
            heading2: '2rem',
            heading3: '1.5rem',
            heading4: '1.25rem',
            heading5: '1rem',
            heading6: '0.875rem',
            body: '1rem',
            caption: '0.75rem',
            button: '0.875rem',
          },
          lineHeights: {
            display: 1.2,
            heading1: 1.2,
            heading2: 1.3,
            heading3: 1.4,
            heading4: 1.4,
            heading5: 1.5,
            heading6: 1.5,
            body: 1.6,
            caption: 1.4,
            button: 1.2,
          },
          letterSpacing: {
            display: '-0.02em',
            heading1: '-0.02em',
            heading2: '-0.01em',
            heading3: '0em',
            heading4: '0em',
            heading5: '0em',
            heading6: '0em',
            body: '0em',
            caption: '0.05em',
            button: '0.05em',
          },
        },
        brandGuidelines: {
          voice: 'Professional and approachable',
          personality: ['innovative', 'reliable', 'user-focused'],
          dos: ['Use consistent branding', 'Maintain professional tone'],
          donts: ['Use inconsistent colors', 'Mix different font families'],
          usageRules: {},
          ...brandGuidelines,
        },
        assets: {
          logoFiles: [],
          brandBook: '',
          styleGuide: '',
          templates: [],
        },
        metadata: {
          industry: 'Technology',
          targetAudience: ['Professionals', 'Developers'],
          brandValues: ['Innovation', 'Quality', 'User Experience'],
          competitors: [],
          inspiration: [],
          tags: [],
          ...metadata,
        },
        aiMetadata: {
          generated: false,
          ...aiMetadata,
        },
        versions: [],
        isPublished: false,
      });

      await brandIdentity.save();
    }

    // Populate the brand identity
    await brandIdentity.populate('createdBy', 'name email avatar');

    return NextResponse.json(brandIdentity, { status: brandIdentity.isNew ? 201 : 200 });
  } catch (error) {
    console.error('Error creating/updating brand identity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/design/[projectId]/brand-identity - Delete brand identity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    await connectDB();

    // Check if project exists and user can access it
    const project = await DesignProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.canUserAccess(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const brandIdentity = await BrandIdentity.findOneAndDelete({ project: projectId });

    if (!brandIdentity) {
      return NextResponse.json({ error: 'Brand identity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand identity deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand identity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}