// File: utils/constants.ts
// Application constants and configuration

export const BUCKET_NAME = 'PHOTOBOOTH_PHOTOS';
export const KV_NAMESPACE = 'PHOTO_BOOTH_KV';

export const ERROR_MESSAGES = {
  NO_FILE_PROVIDED: 'No photo file provided',
  PHOTO_ID_REQUIRED: 'Photo ID is required',
  PHOTO_NOT_FOUND: 'Photo not found',
  SHARE_NOT_FOUND: 'Share not found',
  UPLOAD_FAILED: 'Photo upload failed',
  INVALID_REQUEST: 'Invalid request format'
};

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export const AI_CONFIG = {
  MODEL: '@cf/meta/llama-4-scout-17b-16e-instruct',
  MAX_FILENAME_LENGTH: 30,
  FALLBACK_FILENAME: 'awesome-photo'
};