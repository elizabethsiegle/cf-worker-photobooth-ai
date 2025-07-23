// File: handlers/deleteHandler.ts
// Handler for deleting photos from R2 storage

import { createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, BUCKET_NAME, KV_NAMESPACE } from '../utils/constants';

export async function handleDeletePhoto(
  pathname: string,
  env: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Extract photo ID from path like /api/delete-photo/photo-123.png
    const photoId = pathname.split('/').pop();
    
    if (!photoId) {
      return createErrorResponse(ERROR_MESSAGES.PHOTO_ID_REQUIRED, 400, corsHeaders);
    }
    
    console.log(`Attempting to delete photo: ${photoId}`);
    
    // Check if R2 bucket is properly bound
    const bucket = env[BUCKET_NAME] || env.PHOTOBOOTH_PHOTOS;
    if (!bucket) {
      console.error('R2 bucket not found. Available bindings:', Object.keys(env));
      return createErrorResponse('Storage not configured properly', 500, corsHeaders);
    }
    
    // Check if photo exists before attempting deletion
    const photoExists = await bucket.head(photoId);
    if (!photoExists) {
      console.log(`Photo not found for deletion: ${photoId}`);
      return createErrorResponse(ERROR_MESSAGES.PHOTO_NOT_FOUND, 404, corsHeaders);
    }
    
    // Delete from R2
    await bucket.delete(photoId);
    console.log(`Photo deleted from R2: ${photoId}`);
    
    // Also try to delete any associated haiku from KV
    try {
      const kv = env[KV_NAMESPACE] || env.PHOTO_BOOTH_KV;
      if (kv) {
        await kv.delete(`haiku:${photoId}`);
        console.log(`Associated haiku deleted for: ${photoId}`);
      }
    } catch (kvError) {
      console.warn(`Failed to delete haiku for ${photoId}:`, kvError);
      // Don't fail the request if haiku deletion fails
    }
    
    // Also try to delete any associated share links
    try {
      const kv = env[KV_NAMESPACE] || env.PHOTO_BOOTH_KV;
      if (kv) {
        // Note: This is a simple approach. In a real system, you'd want to index shares by photoId
        // For now, we'll just note that shares might become broken
        console.log(`Note: Any share links for ${photoId} will become broken`);
      }
    } catch (kvError) {
      console.warn(`Failed to clean up shares for ${photoId}:`, kvError);
    }
    
    return createSuccessResponse({ 
      success: true, 
      photoId,
      message: `Photo ${photoId} deleted successfully`
    }, corsHeaders);
    
  } catch (error) {
    console.error('Photo deletion error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Photo deletion failed: ${errorMessage}`, 500, corsHeaders);
  }
}