import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApiKey, { generateApiKey } from '@/models/ApiKey';
import Organization from '@/models/Organization';

// POST /api/keys/[keyId]/rotate - Rotate API key
export async function POST(
  request: NextRequest,
  { params }: { params: { keyId: string } }
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

    // Check if organization allows key rotation
    if (!organization.settings.allowApiKeys) {
      return NextResponse.json(
        { error: 'API key rotation is disabled for this organization' },
        { status: 400 }
      );
    }

    // Generate new key
    const { key, hash, prefix } = generateApiKey();

    // Update the API key with new hash and prefix
    apiKey.keyHash = hash;
    apiKey.keyPrefix = prefix;
    apiKey.lastUsedAt = null; // Reset last used
    apiKey.usageCount = 0; // Reset usage count
    await apiKey.save();

    // Return the new key (only once)
    const keyWithoutHash = `${prefix}${key.slice(11)}`;

    return NextResponse.json({
      id: apiKey._id,
      name: apiKey.name,
      key: keyWithoutHash, // Only return the new key once
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      isActive: apiKey.isActive,
      message: 'API key rotated successfully. Save this new key - it will not be shown again.',
    });

  } catch (error) {
    console.error('Error rotating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}