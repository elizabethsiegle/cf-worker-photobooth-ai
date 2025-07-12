export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  export async function updateAnalytics(env: any, action: string): Promise<void> {
    try {
      const analytics = await env.PHOTOBOOTH_KV.get('analytics');
      const data = analytics ? JSON.parse(analytics) : {
        totalUploads: 0,
        totalShares: 0,
        totalViews: 0
      };
  
      switch (action) {
        case 'upload':
          data.totalUploads++;
          break;
        case 'share':
          data.totalShares++;
          break;
        case 'view':
          data.totalViews++;
          break;
      }
  
      data.lastUpdated = new Date().toISOString();
      await env.PHOTOBOOTH_KV.put('analytics', JSON.stringify(data));
    } catch (error) {
      console.error('Analytics update error:', error);
    }
  }
  
  export function createErrorResponse(
    message: string, 
    status: number, 
    corsHeaders: Record<string, string>
  ): Response {
    return new Response(
      JSON.stringify({ error: message }), 
      {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
  
  export function createSuccessResponse(
    data: any, 
    corsHeaders: Record<string, string>
  ): Response {
    return new Response(
      JSON.stringify(data), 
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }