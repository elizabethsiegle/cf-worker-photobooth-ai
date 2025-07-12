// File: handlers/photoHandler.ts
// Handler for retrieving individual photos from R2

import { ERROR_MESSAGES, BUCKET_NAME } from '../utils/constants';

export async function handlePhoto(
  pathname: string,
  env: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Extract photo ID from path like /api/photo/photo-123.png
    const photoId = pathname.split('/').pop();
    
    if (!photoId) {
      return new Response(ERROR_MESSAGES.PHOTO_ID_REQUIRED, {
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`Retrieving photo: ${photoId}`);
    
    // Check if R2 bucket is properly bound
    const bucket = env[BUCKET_NAME] || env.PHOTOBOOTH_PHOTOS;
    if (!bucket) {
      console.error('R2 bucket not found. Available bindings:', Object.keys(env));
      return new Response('Storage not configured properly', {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Get photo from R2
    const photoObject = await bucket.get(photoId);
    
    if (!photoObject) {
      console.log(`Photo not found: ${photoId}`);
      return new Response(ERROR_MESSAGES.PHOTO_NOT_FOUND, {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Return the photo with proper headers
    const headers = {
      'Content-Type': photoObject.httpMetadata?.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': photoObject.httpEtag || '',
      ...corsHeaders
    };
    
    console.log(`Photo retrieved successfully: ${photoId}`);
    
    return new Response(photoObject.body, { headers });
    
  } catch (error) {
    console.error('Photo retrieval error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Photo retrieval failed: ${errorMessage}`, {
      status: 500,
      headers: corsHeaders
    });
  }
}