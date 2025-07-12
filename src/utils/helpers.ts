// File: utils/helpers.ts
// Utility helper functions for the photo booth application

import { KV_NAMESPACE } from './constants';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function createSuccessResponse(data: any, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export function createErrorResponse(message: string, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export async function updateAnalytics(env: any, action: 'upload' | 'share' | 'view'): Promise<void> {
  try {
    const analyticsData = await env[KV_NAMESPACE].get('analytics');
    const analytics = analyticsData ? JSON.parse(analyticsData) : {
      totalUploads: 0,
      totalShares: 0,
      totalViews: 0,
      lastUpdated: new Date().toISOString()
    };

    switch (action) {
      case 'upload':
        analytics.totalUploads++;
        break;
      case 'share':
        analytics.totalShares++;
        break;
      case 'view':
        analytics.totalViews++;
        break;
    }

    analytics.lastUpdated = new Date().toISOString();
    await env[KV_NAMESPACE].put('analytics', JSON.stringify(analytics));
    
    console.log(`Analytics updated: ${action}, Total uploads: ${analytics.totalUploads}`);
  } catch (error) {
    console.error('Analytics update error:', error);
    // Don't throw - analytics failures shouldn't break the main functionality
  }
}