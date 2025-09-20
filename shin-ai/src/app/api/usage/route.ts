import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import UsageEvent from '@/models/UsageEvent';
import Organization from '@/models/Organization';

// GET /api/usage - Get usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '7d'; // Default to 7 days

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

    // Calculate date range
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Use period parameter
      end = new Date();
      switch (period) {
        case '1d':
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Get usage statistics
    const UsageEventModel = require('@/models/UsageEvent').default;
    const stats = await UsageEventModel.getOrganizationStats(organization._id, start, end);

    // Get daily usage breakdown
    const dailyUsage = await UsageEventModel.getDailyUsage(organization._id, start, end);

    // Get provider usage breakdown
    const providerUsage = await UsageEventModel.getProviderUsage(organization._id, start, end);

    // Calculate quota usage
    const quotaUsage = {
      requests: {
        used: stats.totalRequests,
        limit: organization.quotas.requestsPerDay,
        percentage: Math.round((stats.totalRequests / organization.quotas.requestsPerDay) * 100),
      },
      tokens: {
        used: stats.totalTokens,
        limit: organization.quotas.tokensPerDay,
        percentage: Math.round((stats.totalTokens / organization.quotas.tokensPerDay) * 100),
      },
    };

    return NextResponse.json({
      organization: {
        id: organization._id,
        name: organization.name,
        plan: organization.plan,
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: stats,
      quotaUsage,
      dailyUsage,
      providerUsage,
    });

  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}