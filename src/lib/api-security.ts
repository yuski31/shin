import { NextRequest } from 'next/server';
import { apiKeyService } from './database';
import connectDB from './mongodb';
import ApiKey, { verifyApiKey } from '@/models/ApiKey';
import UsageEvent from '@/models/UsageEvent';
import Organization from '@/models/Organization';

export interface ApiKeyAuthResult {
  isValid: boolean;
  apiKey?: any;
  organization?: any;
  error?: string;
}

export interface UsageTrackingData {
  organization: string;
  apiKey?: string;
  provider: string;
  model: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    endpoint?: string;
    statusCode?: number;
    errorMessage?: string;
  };
}

/**
 * Authenticate API key from request headers
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');

    let apiKey: string | null = null;

    // Extract API key from Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.slice(7);
    }
    // Extract API key from X-API-Key header
    else if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    }

    if (!apiKey) {
      return {
        isValid: false,
        error: 'Missing API key. Provide it in Authorization header (Bearer) or X-API-Key header',
      };
    }

    await connectDB();

    // Find and validate API key
    const apiKeyDoc = await (ApiKey as any).findByKey(apiKey);
    if (!apiKeyDoc) {
      return {
        isValid: false,
        error: 'Invalid API key',
      };
    }

    // Check if key is active
    if (!apiKeyDoc.isActive) {
      return {
        isValid: false,
        error: 'API key is inactive',
      };
    }

    // Get organization
    const organization = await Organization.findById(apiKeyDoc.organization);
    if (!organization || !organization.isActive) {
      return {
        isValid: false,
        error: 'Organization is inactive',
      };
    }

    // Check IP restrictions
    const clientIP = getClientIP(request);
    if (!apiKeyDoc.isIpAllowed(clientIP)) {
      return {
        isValid: false,
        error: 'IP address not allowed',
      };
    }

    // Check rate limits (simplified implementation)
    if (apiKeyDoc.rateLimit) {
      // This would need Redis or similar for production rate limiting
      // For now, we'll just validate the key is properly configured
    }

    return {
      isValid: true,
      apiKey: apiKeyDoc,
      organization,
    };

  } catch (error) {
    console.error('API key authentication error:', error);
    return {
      isValid: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Track API usage
 */
export async function trackUsage(data: UsageTrackingData): Promise<void> {
  try {
    await connectDB();

    const usageEvent = new UsageEvent({
      organization: data.organization,
      apiKey: data.apiKey,
      provider: data.provider,
      modelName: data.model,
      requestCount: data.requestCount,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      cost: data.cost,
      latency: data.latency,
      timestamp: new Date(),
      metadata: data.metadata,
    });

    await usageEvent.save();

    // Update API key usage
    if (data.apiKey) {
      const apiKey = await (ApiKey as any).findById(data.apiKey);
      if (apiKey) {
        await apiKey.incrementUsage();
      }
    }

  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't throw error to avoid breaking the main flow
  }
}

/**
 * Check if organization has exceeded quotas
 */
export async function checkQuotas(
  organizationId: string,
  requestCount: number = 1,
  tokens: number = 0
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    await connectDB();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return { allowed: false, reason: 'Organization not found' };
    }

    // Check daily quotas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await (UsageEvent as any).aggregate([
      {
        $match: {
          organization: organizationId,
          timestamp: { $gte: today, $lt: new Date() }
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

    if (todayStats.totalRequests + requestCount > organization.quotas.requestsPerDay) {
      return {
        allowed: false,
        reason: `Daily request quota exceeded (${organization.quotas.requestsPerDay})`,
      };
    }

    if (todayStats.totalTokens + tokens > organization.quotas.tokensPerDay) {
      return {
        allowed: false,
        reason: `Daily token quota exceeded (${organization.quotas.tokensPerDay})`,
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Quota check error:', error);
    return { allowed: false, reason: 'Quota check failed' };
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default IP (this should be improved for production)
  return 'unknown';
}

/**
 * Validate API key scopes
 */
export function validateScopes(
  apiKeyScopes: string[],
  requiredScopes: string[]
): { valid: boolean; missingScopes?: string[] } {
  const missingScopes = requiredScopes.filter(scope => !apiKeyScopes.includes(scope));

  return {
    valid: missingScopes.length === 0,
    missingScopes: missingScopes.length > 0 ? missingScopes : undefined,
  };
}

/**
 * Detect suspicious activity
 */
export async function detectSuspiciousActivity(
  apiKeyId: string,
  request: NextRequest
): Promise<{ suspicious: boolean; reason?: string }> {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check for rapid requests from same IP (simplified)
    const recentRequests = await (UsageEvent as any).find({
      apiKey: apiKeyId,
      'metadata.ipAddress': clientIP,
      timestamp: { $gte: new Date(Date.now() - 60 * 1000) }, // Last minute
    });

    if (recentRequests.length > 100) {
      return {
        suspicious: true,
        reason: 'Unusual request frequency detected',
      };
    }

    // Check for requests from many different IPs in short time
    const recentRequestsByIP = await (UsageEvent as any).distinct('metadata.ipAddress', {
      apiKey: apiKeyId,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    });

    if (recentRequestsByIP.length > 50) {
      return {
        suspicious: true,
        reason: 'Requests from too many different IP addresses',
      };
    }

    return { suspicious: false };

  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    return { suspicious: false };
  }
}