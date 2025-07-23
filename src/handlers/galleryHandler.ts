// File: handlers/galleryHandler.ts
// Updated gallery handler to display all photos without limit

import { createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { BUCKET_NAME } from '../utils/constants';

export async function handleGallery(
  request: Request,
  env: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log('Loading all photos from gallery');
    
    // Check if R2 bucket is properly bound
    const bucket = env[BUCKET_NAME] || env.PHOTOBOOTH_PHOTOS;
    if (!bucket) {
      console.error('R2 bucket not found. Available bindings:', Object.keys(env));
      return createErrorResponse('Storage not configured properly', 500, corsHeaders);
    }
    
    // List all objects from R2 bucket
    const listResult = await bucket.list();
    
    if (!listResult || !listResult.objects) {
      console.log('No objects found in bucket');
      return createSuccessResponse({ photos: [] }, corsHeaders);
    }

    console.log(`Raw R2 objects found: ${listResult.objects.length}`);
    listResult.objects.forEach((obj:any) => {
      console.log(`- ${obj.key} (${obj.size} bytes, uploaded: ${obj.uploaded})`);
    });
    
    // Simple mapping - return all objects as photos
    const photos = listResult.objects
      .sort((a:any, b:any) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
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