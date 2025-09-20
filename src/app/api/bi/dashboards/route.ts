import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Dashboard from '@/models/bi/Dashboard';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    let query: any = { organizationId, isActive: true };

    if (type) {
      query.type = type;
    }

    const dashboards = await Dashboard.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Dashboard.countDocuments(query);

    return NextResponse.json({
      dashboards,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    console.error('Get dashboards error:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      organizationId,
      layout,
      widgets = [],
      permissions
    } = body;

    if (!name || !type || !organizationId) {
      return NextResponse.json({
        error: 'Name, type, and organization ID are required'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Validate dashboard type
    const validTypes = ['executive', 'operational', 'strategic', 'tactical'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: 'Invalid dashboard type'
      }, { status: 400 });
    }

    // Create default layout if not provided
    const defaultLayout = {
      rows: [
        {
          id: 'row-1',
          height: 400,
          widgets: []
        }
      ],
      columns: 12,
      responsive: true
    };

    const dashboard = new Dashboard({
      organizationId,
      name: name.trim(),
      description: description?.trim() || '',
      type,
      layout: layout || defaultLayout,
      widgets,
      permissions: {
        view: ['admin', 'editor', 'viewer'],
        edit: ['admin', 'editor'],
        delete: ['admin'],
        share: ['admin', 'editor'],
        ...permissions
      },
      isActive: true,
      createdBy: session.user.id
    });

    const savedDashboard = await dashboard.save();

    // Populate the createdBy field
    await savedDashboard.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      dashboard: savedDashboard
    }, { status: 201 });

  } catch (error) {
    console.error('Create dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}