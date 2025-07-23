// File: handlers/shareHandler.ts
// Complete share handler with KV storage and defensive binding checks

import { generateId, updateAnalytics, createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, BUCKET_NAME, KV_NAMESPACE } from '../utils/constants';
import { generateSharePageHTML } from '../templates/sharePage';

export async function handleCreateShare(
  request: Request, 
  env: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { photoId } = await request.json() as { photoId: string };
    
    if (!photoId) {
      return createErrorResponse(ERROR_MESSAGES.PHOTO_ID_REQUIRED, 400, corsHeaders);
    }

    // Check if R2 bucket is properly bound
    const bucket = env[BUCKET_NAME] || env.PHOTOBOOTH_PHOTOS;
    if (!bucket) {
      console.error('R2 bucket not found. Available bindings:', Object.keys(env));
      return createErrorResponse('Storage not configured properly', 500, corsHeaders);
    }

    // Check if KV is properly bound
    const kv = env[KV_NAMESPACE] || env.PHOTO_BOOTH_KV;
    if (!kv) {
      console.error('KV namespace not found. Available bindings:', Object.keys(env));
      return createErrorResponse('KV storage not configured properly', 500, corsHeaders);
    }

    // Verify photo exists
    const photoExists = await bucket.head(photoId);
    if (!photoExists) {
      return createErrorResponse(ERROR_MESSAGES.PHOTO_NOT_FOUND, 404, corsHeaders);
    }

    const shareId = generateId();
    const shareData = {
      shareId,
      photoId,
      createdAt: new Date().toISOString(),
      views: 0
    };

    await kv.put(`share:${shareId}`, JSON.stringify(shareData));
    await updateAnalytics(env, 'share');

    return createSuccessResponse({ 
      success: true, 
      shareId,
      shareUrl: `/share/${shareId}`
    }, corsHeaders);

  } catch (error) {
    console.error('Share creation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Share creation failed: ${errorMessage}`, 500, corsHeaders);
  }
}


export async function handleSharePage(
  pathname: string, 
  env: any, 
  corsHeaders: Record<string, string>, 
  request?: Request
): Promise<Response> {
  try {
    const shareId = pathname.split('/').pop();
    
    if (!shareId) {
      return new Response(ERROR_MESSAGES.SHARE_NOT_FOUND, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Check if KV is properly bound
    const kv = env[KV_NAMESPACE] || env.PHOTO_BOOTH_KV;
    if (!kv) {
      console.error('KV namespace not found. Available bindings:', Object.keys(env));
      return new Response('KV storage not configured properly', {
        status: 500,
        headers: corsHeaders
      });
    }
    
    const shareData = await kv.get(`share:${shareId}`);
    if (!shareData) {
      return new Response(ERROR_MESSAGES.SHARE_NOT_FOUND, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const { photoId } = JSON.parse(shareData);
    
    // Update view count
    const updatedShareData = JSON.parse(shareData);
    updatedShareData.views++;
    await kv.put(`share:${shareId}`, JSON.stringify(updatedShareData));
    await updateAnalytics(env, 'view');

    const baseUrl = request ? request.url.split('/share')[0] : '';
    const html = generateSharePageHTML(baseUrl, photoId);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html', ...corsHeaders }
    });

  } catch (error) {
    console.error('Share page error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Share page error: ${errorMessage}`, {
      status: 500,
      headers: corsHeaders
    });
  }
}