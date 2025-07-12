// File: handlers/galleryHandler.ts
// Simplified gallery handler matching original working implementation

import { createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, BUCKET_NAME } from '../utils/constants';

export async function handleGallery(
  request: Request,
  env: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '12');
    
    console.log(`Loading gallery with limit: ${limit}`);
    
    // Check if R2 bucket is properly bound
    const bucket = env[BUCKET_NAME] || env.PHOTOBOOTH_PHOTOS;
    if (!bucket) {
      console.error('R2 bucket not found. Available bindings:', Object.keys(env));
      return createErrorResponse('Storage not configured properly', 500, corsHeaders);
    }
    
    // List objects from R2 bucket - minimal approach
    const listResult = await bucket.list({
      limit: Math.min(limit, 50)
    });
    
    if (!listResult || !listResult.objects) {
      console.log('No objects found in bucket');
      return createSuccessResponse({ photos: [] }, corsHeaders);
    }

    console.log(`Raw R2 objects found: ${listResult.objects.length}`);
    listResult.objects.forEach((obj:any) => {
      console.log(`- ${obj.key} (${obj.size} bytes, uploaded: ${obj.uploaded})`);
    });
    
    // Simple mapping - just return all objects as photos
    const photos = listResult.objects
      .sort((a:any, b:any) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
      .slice(0, limit)
      .map((obj:any) => ({
        id: obj.key,
        uploadedAt: obj.uploaded,
        size: obj.size
      }));
    
    console.log(`Returning ${photos.length} photos to frontend`);
    
    return createSuccessResponse({ 
      photos,
      total: photos.length,
      hasMore: listResult.truncated || false
    }, corsHeaders);
    
  } catch (error) {
    console.error('Gallery error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Gallery loading failed: ${errorMessage}`, 500, corsHeaders);
  }
}