import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import UsageEvent from '@/models/UsageEvent';

// GET /api/quotas - Get current quotas and usage
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

    // Calculate current usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const UsageEventModel = require('@/models/UsageEvent').default;
    const todayStats = await UsageEventModel.getOrganizationStats(organization._id, today, tomorrow);

    // Calculate monthly usage
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthStats = await UsageEventModel.getOrganizationStats(organization._id, firstDayOfMonth, firstDayOfNextMonth);

    // Get plan-specific quotas
    const getQuotasForPlan = (plan: string) => {
      switch (plan) {
        case 'free':
          return {
            requestsPerDay: 100,
            tokensPerDay: 10000,
            requestsPerMonth: 3000,
            tokensPerMonth: 300000,
          };
        case 'starter':
          return {
            requestsPerDay: 10000,
            tokensPerDay: 1000000,
            requestsPerMonth: 300000,
            tokensPerMonth: 30000000,
          };
        case 'professional':
          return {
            requestsPerDay: 100000,
            tokensPerDay: 10000000,
            requestsPerMonth: 3000000,
            tokensPerMonth: 300000000,
          };
        case 'enterprise':
          return {
            requestsPerDay: organization.quotas.requestsPerDay,
            tokensPerDay: organization.quotas.tokensPerDay,
            requestsPerMonth: organization.quotas.requestsPerMonth,
            tokensPerMonth: organization.quotas.tokensPerMonth,
          };
        default:
          return {
            requestsPerDay: 100,
            tokensPerDay: 10000,
            requestsPerMonth: 3000,
            tokensPerMonth: 300000,
          };
      }
    };

    const quotas = getQuotasForPlan(organization.plan);

    const quotasData = {
      organization: {
        id: organization._id,
        name: organization.name,
        plan: organization.plan,
      },
      daily: {
        requests: {
          used: todayStats.totalRequests,
          limit: quotas.requestsPerDay,
          remaining: Math.max(0, quotas.requestsPerDay - todayStats.totalRequests),
          percentage: Math.round((todayStats.totalRequests / quotas.requestsPerDay) * 100),
        },
        tokens: {
          used: todayStats.totalTokens,
          limit: quotas.tokensPerDay,
          remaining: Math.max(0, quotas.tokensPerDay - todayStats.totalTokens),
          percentage: Math.round((todayStats.totalTokens / quotas.tokensPerDay) * 100),
        },
      },
      monthly: {
        requests: {
          used: monthStats.totalRequests,
          limit: quotas.requestsPerMonth,
          remaining: Math.max(0, quotas.requestsPerMonth - monthStats.totalRequests),
          percentage: Math.round((monthStats.totalRequests / quotas.requestsPerMonth) * 100),
        },
        tokens: {
          used: monthStats.totalTokens,
          limit: quotas.tokensPerMonth,
          remaining: Math.max(0, quotas.tokensPerMonth - monthStats.totalTokens),
          percentage: Math.round((monthStats.totalTokens / quotas.tokensPerMonth) * 100),
        },
      },
      resetTime: {
        daily: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        monthly: firstDayOfNextMonth.toISOString(),
      },
    };

    return NextResponse.json(quotasData);

  } catch (error) {
    console.error('Error fetching quotas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}