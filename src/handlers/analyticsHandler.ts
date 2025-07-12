import { createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, KV_NAMESPACE } from '../utils/constants';

export async function handleAnalytics(
  env: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const analytics = await env[KV_NAMESPACE].get('analytics');
    const data = analytics ? JSON.parse(analytics) : {
      totalUploads: 0,
      totalShares: 0,
      totalViews: 0,
      lastUpdated: new Date().toISOString()
    };

    return createSuccessResponse(data, corsHeaders);

  } catch (error) {
    console.error('Analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Analytics retrieval failed: ${errorMessage}`, 500, corsHeaders);
  }
}