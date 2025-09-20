import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApiKey, { API_KEY_SCOPES } from '@/models/ApiKey';
import Organization from '@/models/Organization';

// POST /api/keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, expiresAt, organizationId } = body;

    if (!name || !scopes || !Array.isArray(scopes)) {
      return NextResponse.json(
        { error: 'Missing required fields: name and scopes are required' },
        { status: 400 }
      );
    }

    // Validate scopes
    const invalidScopes = scopes.filter((scope: string) => !API_KEY_SCOPES.includes(scope as any));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user's organizations
    const user = await require('mongoose').model('User').findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let organization;
    if (organizationId) {
      // Use specified organization
      organization = await Organization.findOne({
        _id: organizationId,
        members: { $elemMatch: { userId: session.user.id } }
      });

      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      // Use user's default organization
      organization = await Organization.findById(user.defaultOrganization);
      if (!organization) {
        return NextResponse.json(
          { error: 'No default organization found. Please specify an organizationId.' },
          { status: 400 }
        );
      }
    }

    // Check if organization has reached API key limit
    const existingKeys = await ApiKey.countDocuments({ organization: organization._id, isActive: true });
    if (existingKeys >= organization.settings.maxApiKeys) {
      return NextResponse.json(
        { error: `Maximum API keys limit reached (${organization.settings.maxApiKeys})` },
        { status: 400 }
      );
    }

    // Create API key
    const apiKeyData = {
      organization: organization._id,
      name,
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    const apiKey = new ApiKey(apiKeyData);
    await apiKey.save();

    // Return the full key only once (for display purposes)
    const { key, hash, prefix } = require('@/models/ApiKey').generateApiKey();
    const keyWithoutHash = `${prefix}${key.slice(11)}`;

    return NextResponse.json({
      id: apiKey._id,
      name: apiKey.name,
      key: keyWithoutHash, // Only return the key once
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      isActive: apiKey.isActive,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/keys - List organization's API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    await connectDB();

    // Get user's organizations
    const user = await require('mongoose').model('User').findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let organization;
    if (organizationId) {
      // Use specified organization
      organization = await Organization.findOne({
        _id: organizationId,
        members: { $elemMatch: { userId: session.user.id } }
      });

      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      // Use user's default organization
      organization = await Organization.findById(user.defaultOrganization);
      if (!organization) {
        return NextResponse.json(
          { error: 'No default organization found' },
          { status: 400 }
        );
      }
    }

    // Get API keys for the organization
    const apiKeys = await ApiKey.find({ organization: organization._id })
      .sort({ createdAt: -1 })
      .select('-keyHash'); // Don't return the hash

    // Mask the keys for display (show only prefix + last 4 characters)
    const maskedKeys = apiKeys.map(key => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      maskedKey: `${key.keyPrefix}...${key.keyPrefix.slice(-4)}`,
      scopes: key.scopes,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      usageCount: key.usageCount,
    }));

    return NextResponse.json(maskedKeys);

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}