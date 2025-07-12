// File: handlers/uploadHandler.ts
// Updated upload handler with AI-powered creative filename generation

import { generateId, updateAnalytics, createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, BUCKET_NAME } from '../utils/constants';
import { generateCreativeFilename, Env } from './aiHandler';

export async function handleUpload(
  request: Request, 
  env: Env, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const formData = await request.formData();
    const photoFile = formData.get('photo') as File;
    const accessoriesData = formData.get('accessories') as string;
    const filterData = formData.get('filter') as string;
    const hasDrawingData = formData.get('hasDrawing') as string;
    
    if (!photoFile) {
      return createErrorResponse(ERROR_MESSAGES.NO_FILE_PROVIDED, 400, corsHeaders);
    }

    // Parse metadata for AI filename generation
    let accessories = {};
    try {
      accessories = accessoriesData ? JSON.parse(accessoriesData) : {};
    } catch (e) {
      console.warn('Failed to parse accessories data:', e);
    }

    const metadata = {
      accessories,
      filter: filterData || 'none',
      hasDrawing: hasDrawingData === 'true'
    };

    // Generate creative filename using AI (Llama 4 Scout)
    const creativeFilename = await generateCreativeFilename(env, metadata);
    const photoId = `${creativeFilename}.png`;
    
    console.log(`Generated AI filename: ${photoId}`);

    // Convert file to ArrayBuffer for R2 storage
    const arrayBuffer = await photoFile.arrayBuffer();
    
    // Prepare metadata for R2 object
    const r2Metadata = {
      'uploaded-at': new Date().toISOString(),
      'accessories': accessoriesData || '{}',
      'filter': filterData || 'none',
      'has-drawing': hasDrawingData || 'false',
      'ai-generated-name': 'true',
      'ai-model': '@cf/meta/llama-4-scout-17b-16e-instruct',
      'original-size': arrayBuffer.byteLength.toString()
    };

    // Check if R2 bucket is properly bound
    const bucket = env[BUCKET_NAME] || env.PHOTOBOOTH_PHOTOS;
    if (!bucket) {
      console.error('R2 bucket not found. Available bindings:', Object.keys(env));
      return createErrorResponse('Storage not configured properly', 500, corsHeaders);
    }

    // Upload to R2 with AI-generated creative filename
    const uploadResult = await bucket.put(photoId, arrayBuffer, {
      httpMetadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000' // 1 year cache
      },
      customMetadata: r2Metadata
    });

    if (!uploadResult) {
      return createErrorResponse('Failed to upload photo to storage', 500, corsHeaders);
    }

    // Update analytics
    await updateAnalytics(env, 'upload');

    console.log(`Photo uploaded successfully: ${photoId}, Size: ${arrayBuffer.byteLength} bytes`);

    return createSuccessResponse({ 
      success: true, 
      photoId,
      filename: creativeFilename,
      aiGenerated: true,
      metadata: {
        size: arrayBuffer.byteLength,
        uploadedAt: new Date().toISOString(),
        aiModel: '@cf/meta/llama-4-scout-17b-16e-instruct'
      }
    }, corsHeaders);

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Upload failed: ${errorMessage}`, 500, corsHeaders);
  }
}