import { generateId, updateAnalytics, createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, BUCKET_NAME, KV_NAMESPACE } from '../utils/constants';

export async function handlePhotoUpload(
  request: Request, 
  env: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log('Upload request received');
    
    if (!env[BUCKET_NAME]) {
      console.error(`R2 bucket ${BUCKET_NAME} not found`);
      return createErrorResponse(ERROR_MESSAGES.R2_NOT_CONFIGURED, 500, corsHeaders);
    }
    
    if (!env[KV_NAMESPACE]) {
      console.error(`KV namespace ${KV_NAMESPACE} not found`);
      return createErrorResponse(ERROR_MESSAGES.KV_NOT_CONFIGURED, 500, corsHeaders);
    }
    
    const formData = await request.formData();
    const photoFile = formData.get('photo') as File;
    const accessories = JSON.parse((formData.get('accessories') as string) || '{}');
    
    console.log('Form data parsed, photo file size:', photoFile?.size || 'null');
    
    if (!photoFile) {
      return createErrorResponse(ERROR_MESSAGES.NO_PHOTO_PROVIDED, 400, corsHeaders);
    }

    const photoId = generateId();
    const timestamp = new Date().toISOString();
    
    console.log('Generated photo ID:', photoId);
    
    try {
      await env[BUCKET_NAME].put(photoId, photoFile.stream(), {
        httpMetadata: {
          contentType: 'image/png',
        },
        customMetadata: {
          uploadTime: timestamp,
          accessories: JSON.stringify(accessories)
        }
      });
      console.log('Photo uploaded to R2 successfully');
    } catch (err) {
      console.error('R2 upload error:', err);
      return createErrorResponse(`R2 upload failed: ${err}`, 500, corsHeaders);
    }

    const metadata = {
      id: photoId,
      timestamp,
      accessories,
      size: photoFile.size,
      type: photoFile.type
    };
    
    try {
      await env[KV_NAMESPACE].put(`photo:${photoId}`, JSON.stringify(metadata));
      console.log('Metadata stored in KV successfully');
    } catch (err) {
      console.error('KV storage error:', err);
      return createErrorResponse(`KV storage failed: ${err}`, 500, corsHeaders);
    }
    
    await updateAnalytics(env, 'upload');

    return createSuccessResponse({ 
      success: true, 
      photoId,
      message: 'Photo uploaded successfully' 
    }, corsHeaders);

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Upload failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function handleGetPhoto(
  pathname: string, 
  env: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const photoId = pathname.split('/').pop();
    console.log('Fetching photo:', photoId);
    
    const photo = await env[BUCKET_NAME].get(photoId);
    if (!photo) {
      console.log('Photo not found in R2:', photoId);
      return new Response(ERROR_MESSAGES.PHOTO_NOT_FOUND, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    return new Response(photo.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Photo retrieval error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Photo retrieval failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function handleGetGallery(
  searchParams: URLSearchParams, 
  env: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log('Gallery request received');
    
    if (!env[KV_NAMESPACE]) {
      console.error('KV namespace not available');
      return createErrorResponse(ERROR_MESSAGES.KV_NOT_CONFIGURED, 500, corsHeaders);
    }
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor') || undefined;
    
    console.log('Gallery request - limit:', limit, 'cursor:', cursor);
    
    const photos = [];
    const listOpts: any = { prefix: 'photo:', limit };
    if (cursor) listOpts.cursor = cursor;
    
    console.log('Listing KV keys with options:', listOpts);
    
    const { keys, list_complete, cursor: nextCursor } = await env[KV_NAMESPACE].list(listOpts);
    
    console.log('KV list result - keys count:', keys.length, 'list_complete:', list_complete);
    
    for (const key of keys) {
      try {
        const metadata = await env[KV_NAMESPACE].get(key.name);
        if (metadata) {
          photos.push(JSON.parse(metadata));
        }
      } catch (err) {
        console.error('Error parsing metadata for key:', key.name, err);
      }
    }
    
    photos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    console.log('Gallery returning photos:', photos.length);
    
    return createSuccessResponse({
      photos: photos.slice(0, limit),
      nextCursor: list_complete ? null : nextCursor
    }, corsHeaders);
    
  } catch (error) {
    console.error('Gallery error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Gallery retrieval failed: ${errorMessage}`, 500, corsHeaders);
  }
}
