import { handlePhotoUpload, handleGetPhoto, handleGetGallery } from './handlers/photoHandler';
import { handleCreateShare, handleSharePage } from './handlers/shareHandler';
import { handleAnalytics } from './handlers/analyticsHandler';
import { servePhotoBoothApp } from './templates/photoBoothApp';
import { CORS_HEADERS } from './utils/constants';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // Route handling
      if (pathname === '/') {
        return servePhotoBoothApp(CORS_HEADERS);
      } else if (pathname === '/api/upload' && request.method === 'POST') {
        return handlePhotoUpload(request, env, CORS_HEADERS);
      } else if (pathname === '/api/share' && request.method === 'POST') {
        return handleCreateShare(request, env, CORS_HEADERS);
      } else if (pathname.startsWith('/api/photo/')) {
        return handleGetPhoto(pathname, env, CORS_HEADERS);
      } else if (pathname === '/api/gallery') {
        return handleGetGallery(searchParams, env, CORS_HEADERS);
      } else if (pathname === '/api/analytics') {
        return handleAnalytics(env, CORS_HEADERS);
      } else if (pathname.startsWith('/share/')) {
        return handleSharePage(pathname, env, CORS_HEADERS, request);
      } else {
        return new Response('Not Found', { 
          status: 404, 
          headers: CORS_HEADERS 
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          details: error instanceof Error ? error.message : String(error)
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        }
      );
    }
  }
};