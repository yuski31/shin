import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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

    // Connect to MongoDB
    await connectDB();

    // Get user from database
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let organization;
    if (organizationId) {
      // Use specified organization - check if user is a member
      organization = await Organization.findById(organizationId);
      if (!organization || !organization.isActive) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }

      // Check if user is a member
      const isMember = organization.members.some((member: any) => member.userId === session.user.id);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      // Use user's default organization
      if (!user.defaultOrganization) {
        return NextResponse.json(
          { error: 'No default organization found' },
          { status: 400 }
        );
      }

      organization = await Organization.findById(user.defaultOrganization);
      if (!organization || !organization.isActive) {
        return NextResponse.json(
          { error: 'Default organization not found' },
          { status: 400 }
        );
      }
    }

    // Calculate current usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's usage stats
    const todayStats = await UsageEvent.aggregate([
      {
        $match: {
          organization: organization._id,
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: '$requestCount' },
          totalTokens: { $sum: '$inputTokens' }
        }
      }
    ]).then((result: any[]) => result[0] || { totalRequests: 0, totalTokens: 0 });

    // Calculate monthly usage
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthStats = await UsageEvent.aggregate([
      {
        $match: {
          organization: organization._id,
          createdAt: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: '$requestCount' },
          totalTokens: { $sum: '$inputTokens' }
        }
      }
    ]).then((result: any[]) => result[0] || { totalRequests: 0, totalTokens: 0 });

    // Get plan-specific quotas
    const getQuotasForPlan = (plan: string, customQuotas?: any) => {
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
            requestsPerDay: customQuotas?.requestsPerDay || 100000,
            tokensPerDay: customQuotas?.tokensPerDay || 10000000,
            requestsPerMonth: customQuotas?.requestsPerMonth || 3000000,
            tokensPerMonth: customQuotas?.tokensPerMonth || 300000000,
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

    const quotas = getQuotasForPlan(organization.subscription?.plan || 'free', organization.quotas);

    const quotasData = {
      organization: {
        id: organization._id,
        name: organization.name,
        plan: organization.subscription?.plan || 'free',
      },
      daily: {
        requests: {
          used: todayStats.totalRequests || 0,
          limit: quotas.requestsPerDay,
          remaining: Math.max(0, quotas.requestsPerDay - (todayStats.totalRequests || 0)),
          percentage: Math.round(((todayStats.totalRequests || 0) / quotas.requestsPerDay) * 100),
        },
        tokens: {
          used: todayStats.totalTokens || 0,
          limit: quotas.tokensPerDay,
          remaining: Math.max(0, quotas.tokensPerDay - (todayStats.totalTokens || 0)),
          percentage: Math.round(((todayStats.totalTokens || 0) / quotas.tokensPerDay) * 100),
        },
      },
      monthly: {
        requests: {
          used: monthStats.totalRequests || 0,
          limit: quotas.requestsPerMonth,
          remaining: Math.max(0, quotas.requestsPerMonth - (monthStats.totalRequests || 0)),
          percentage: Math.round(((monthStats.totalRequests || 0) / quotas.requestsPerMonth) * 100),
        },
        tokens: {
          used: monthStats.totalTokens || 0,
          limit: quotas.tokensPerMonth,
          remaining: Math.max(0, quotas.tokensPerMonth - (monthStats.totalTokens || 0)),
          percentage: Math.round(((monthStats.totalTokens || 0) / quotas.tokensPerMonth) * 100),
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