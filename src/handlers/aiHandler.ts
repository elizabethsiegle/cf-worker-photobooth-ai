// File: handlers/aiHandler.ts
// Workers AI integration for creative filename generation and haiku creation

import { createErrorResponse, createSuccessResponse } from '../utils/helpers';

export interface Env {
  AI: Ai;
  [key: string]: any;
}

interface PhotoMetadata {
  accessories: {
    hat?: string;
    glasses?: string;
    face?: string;
    extra?: string;
  };
  filter: string;
  hasDrawing?: boolean;
}

export async function generateCreativeFilename(
  env: Env,
  metadata: PhotoMetadata
): Promise<string> {
  try {
    const accessoryList = Object.values(metadata.accessories)
      .filter(Boolean)
      .join(', ') || 'no accessories';
    
    const messages = [
      {
        role: "system",
        content: "You are a creative assistant that generates fun, short, and memorable filenames for photos. Respond with only 2-3 words separated by hyphens, suitable for a filename. Be creative but appropriate. Examples: 'cosmic-cowboy-vibes', 'vintage-smile-magic', 'dreamy-hat-portrait'"
      },
      {
        role: "user",
        content: `Generate a creative filename for a photo with these elements:
- Accessories: ${accessoryList}
- Filter: ${metadata.filter}
- Has drawing: ${metadata.hasDrawing ? 'yes' : 'no'}

Make it fun and memorable!`
      }
    ];

    const response = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
    
    // Clean up the response to ensure it's filename-safe
    let filename = response.response || 'awesome-photo';
    filename = filename.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    // Ensure it's not too long and add timestamp for uniqueness
    filename = filename.substring(0, 30);
    const timestamp = Date.now().toString(36);
    
    return `${filename}-${timestamp}`;
    
  } catch (error) {
    console.error('AI filename generation error:', error);
    // Fallback to timestamp-based naming
    return `photo-${Date.now()}`;
  }
}

export async function generatePhotoHaiku(
  env: Env,
  metadata: PhotoMetadata,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const accessoryList = Object.values(metadata.accessories)
      .filter(Boolean)
      .join(', ') || 'a natural face';
    
    const filterDescription = getFilterDescription(metadata.filter);
    
    const messages = [
      {
        role: "system",
        content: "You are a poetic AI that creates beautiful haikus about photos. A haiku has exactly 3 lines with 5-7-5 syllables. Focus on the visual elements, mood, and feeling of the photo. Be creative and evocative. Respond with only the haiku, no additional text."
      },
      {
        role: "user",
        content: `Create a haiku about a photo booth picture with these elements:
- Accessories worn: ${accessoryList}
- Visual filter: ${filterDescription}
- Has custom drawing: ${metadata.hasDrawing ? 'yes' : 'no'}

Capture the playful, creative spirit of a photo booth moment!`
      }
    ];

    const response = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
    
    const haiku = response.response || 
      "Smiling faces shine\nThrough digital magic lens\nMemories captured";
    
    return createSuccessResponse({ 
      haiku: haiku.trim(),
      metadata: metadata 
    }, corsHeaders);
    
  } catch (error) {
    console.error('AI haiku generation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Haiku generation failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function handleHaikuRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const metadata = await request.json() as PhotoMetadata;
    
    if (!metadata.accessories || typeof metadata.filter !== 'string') {
      return createErrorResponse('Invalid photo metadata provided', 400, corsHeaders);
    }
    
    return await generatePhotoHaiku(env, metadata, corsHeaders);
    
  } catch (error) {
    console.error('Haiku request error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Request processing failed: ${errorMessage}`, 500, corsHeaders);
  }
}

function getFilterDescription(filter: string): string {
  const descriptions: Record<string, string> = {
    'none': 'crisp and natural colors',
    'sepia': 'warm sepia tones, nostalgic amber hues',
    'grayscale': 'classic black and white, timeless monochrome',
    'vintage': 'aged vintage look, retro film aesthetic', 
    'warm': 'golden warm tones, sunset-like glow',
    'cool': 'cool blue tones, icy winter feel',
    'dramatic': 'high contrast drama, bold shadows',
    'dreamy': 'soft dreamy blur, ethereal atmosphere'
  };
  
  return descriptions[filter] || 'artistic filtered effect';
}