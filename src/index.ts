// File: src/index.ts
// Main Worker entry point with AI haiku generation endpoint

import { handleUpload } from './handlers/uploadHandler';
import { handleGallery } from './handlers/galleryHandler';
import { handleCreateShare, handleSharePage } from './handlers/shareHandler';
import { handleAnalytics } from './handlers/analyticsHandler';
import { handleHaikuRequest } from './handlers/aiHandler';
import { handlePhoto } from './handlers/photoHandler';
import { servePhotoBoothApp } from './templates/photoBoothApp';
import { CORS_HEADERS } from './utils/constants';

export interface Env {
  AI: Ai;
  PHOTO_BOOTH_KV: KVNamespace;
  PHOTOBOOTH_PHOTOS: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    try {
      // Main photo booth application
      if (pathname === '/' || pathname === '/index.html') {
        return servePhotoBoothApp(CORS_HEADERS);
      }

      // API Routes
      if (pathname.startsWith('/api/')) {
        
        // Photo upload with AI filename generation
        if (pathname === '/api/upload' && method === 'POST') {
          return handleUpload(request, env, CORS_HEADERS);
        }

        // Gallery listing
        if (pathname === '/api/gallery' && method === 'GET') {
          return handleGallery(request, env, CORS_HEADERS);
        }

        // Photo retrieval
        if (pathname.startsWith('/api/photo/') && method === 'GET') {
          return handlePhoto(pathname, env, CORS_HEADERS);
        }

        // Share creation
        if (pathname === '/api/share' && method === 'POST') {
          return handleCreateShare(request, env, CORS_HEADERS);
        }

        // Analytics
        if (pathname === '/api/analytics' && method === 'GET') {
          return handleAnalytics(env, CORS_HEADERS);
        }

        // AI Haiku generation - NEW ENDPOINT
        if (pathname === '/api/haiku' && method === 'POST') {
          return handleHaikuRequest(request, env, CORS_HEADERS);
        }
      }

      // Share page routes
      if (pathname.startsWith('/share/')) {
        return handleSharePage(pathname, env, CORS_HEADERS, request);
      }

      // 404 for unknown routes
      return new Response('Not Found', { 
        status: 404, 
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error('Worker error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return new Response(`Internal Server Error: ${errorMessage}`, {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  },
};