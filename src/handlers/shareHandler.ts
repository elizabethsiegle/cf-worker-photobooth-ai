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

    const photoExists = await env[BUCKET_NAME].head(photoId);
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

    await env[KV_NAMESPACE].put(`share:${shareId}`, JSON.stringify(shareData));
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
    
    const shareData = await env[KV_NAMESPACE].get(`share:${shareId}`);
    if (!shareData) {
      return new Response(ERROR_MESSAGES.SHARE_NOT_FOUND, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const { photoId } = JSON.parse(shareData);
    
    const updatedShareData = JSON.parse(shareData);
    updatedShareData.views++;
    await env[KV_NAMESPACE].put(`share:${shareId}`, JSON.stringify(updatedShareData));
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