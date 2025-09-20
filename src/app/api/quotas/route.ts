import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService, userService, usageEventService } from '@/lib/database';
import { executeQuery } from '@/lib/postgresql';

// GET /api/quotas - Get current quotas and usage
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get user from database
    const userResult = await userService.findById(session.user.id);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.data;

    let organization;
    if (organizationId) {
      // Use specified organization - check if user is a member
      const orgResult = await organizationService.findById(organizationId);
      if (!orgResult.success || !orgResult.data) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }

      organization = orgResult.data;

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
      if (!user.metadata?.defaultOrganization) {
        return NextResponse.json(
          { error: 'No default organization found' },
          { status: 400 }
        );
      }

      const orgResult = await organizationService.findById(user.metadata.defaultOrganization);
      if (!orgResult.success || !orgResult.data) {
        return NextResponse.json(
          { error: 'Default organization not found' },
          { status: 400 }
        );
      }

      organization = orgResult.data;
    }

    // Calculate current usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's usage stats
    const todayStatsQuery = `
      SELECT
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens
      FROM usage_events
      WHERE created_at >= $1 AND created_at < $2
    `;
    const todayStatsResult = await executeQuery(todayStatsQuery, [today, tomorrow]);
    const todayStats = todayStatsResult.rows[0];

    // Calculate monthly usage
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthStatsResult = await executeQuery(todayStatsQuery, [firstDayOfMonth, firstDayOfNextMonth]);
    const monthStats = monthStatsResult.rows[0];

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

    const quotas = getQuotasForPlan(organization.plan, organization.quotas);

    const quotasData = {
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
      },
      daily: {
        requests: {
          used: parseInt(todayStats.total_requests) || 0,
          limit: quotas.requestsPerDay,
          remaining: Math.max(0, quotas.requestsPerDay - (parseInt(todayStats.total_requests) || 0)),
          percentage: Math.round(((parseInt(todayStats.total_requests) || 0) / quotas.requestsPerDay) * 100),
        },
        tokens: {
          used: parseInt(todayStats.total_tokens) || 0,
          limit: quotas.tokensPerDay,
          remaining: Math.max(0, quotas.tokensPerDay - (parseInt(todayStats.total_tokens) || 0)),
          percentage: Math.round(((parseInt(todayStats.total_tokens) || 0) / quotas.tokensPerDay) * 100),
        },
      },
      monthly: {
        requests: {
          used: parseInt(monthStats.total_requests) || 0,
          limit: quotas.requestsPerMonth,
          remaining: Math.max(0, quotas.requestsPerMonth - (parseInt(monthStats.total_requests) || 0)),
          percentage: Math.round(((parseInt(monthStats.total_requests) || 0) / quotas.requestsPerMonth) * 100),
        },
        tokens: {
          used: parseInt(monthStats.total_tokens) || 0,
          limit: quotas.tokensPerMonth,
          remaining: Math.max(0, quotas.tokensPerMonth - (parseInt(monthStats.total_tokens) || 0)),
          percentage: Math.round(((parseInt(monthStats.total_tokens) || 0) / quotas.tokensPerMonth) * 100),
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