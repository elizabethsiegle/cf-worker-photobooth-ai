export const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  export const ERROR_MESSAGES = {
    R2_NOT_CONFIGURED: 'R2 bucket not configured',
    KV_NOT_CONFIGURED: 'KV namespace not configured',
    NO_PHOTO_PROVIDED: 'No photo provided',
    PHOTO_ID_REQUIRED: 'Photo ID required',
    PHOTO_NOT_FOUND: 'Photo not found',
    SHARE_NOT_FOUND: 'Share not found',
  } as const;
  
  export const BUCKET_NAME = 'PHOTOBOOTH_PHOTOS';
  export const KV_NAMESPACE = 'PHOTOBOOTH_KV';