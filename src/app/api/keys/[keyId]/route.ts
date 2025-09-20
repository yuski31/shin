import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import Organization from '@/models/Organization';

// DELETE /api/keys/[keyId] - Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string  }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyId } = params;

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the API key and verify user has access
    const apiKey = await ApiKey.findById(keyId).populate('organization');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the organization
    const organization = await Organization.findOne({
      _id: apiKey.organization._id,
      members: { $elemMatch: { userId: session.user.id } }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Access denied to this API key' },
        { status: 403 }
      );
    }

    // Soft delete - mark as inactive
    apiKey.isActive = false;
    await apiKey.save();

    return NextResponse.json({
      message: 'API key revoked successfully',
      id: apiKey._id,
      name: apiKey.name,
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}