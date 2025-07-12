// File: handlers/aiHandler.ts
// Enhanced Workers AI integration with text overlay support for creative filename generation and haiku creation

import { createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { ERROR_MESSAGES, KV_NAMESPACE } from '../utils/constants';

export interface Env {
  AI: Ai;
  [key: string]: any;
}

interface TextOverlay {
  id: number;
  content: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  scale: number;
  rotation: number;
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
  textOverlays?: TextOverlay[];
  textCount?: number;
}

export async function generateCreativeFilename(
  env: Env,
  metadata: PhotoMetadata
): Promise<string> {
  try {
    const accessoryList = Object.values(metadata.accessories)
      .filter(Boolean)
      .join(', ') || 'no accessories';
    
    // NEW: Include text overlay information
    const textInfo = metadata.textOverlays && metadata.textOverlays.length > 0
      ? `Text overlays: ${metadata.textOverlays.map(t => t.content).join(', ')}`
      : metadata.textCount && metadata.textCount > 0
        ? `Has ${metadata.textCount} custom text element(s)`
        : 'no text overlays';
    
    const messages = [
      {
        role: "system",
        content: "You are a creative assistant that generates fun, short, and memorable filenames for photos. Respond with only 2-3 words separated by hyphens, suitable for a filename. Be creative but appropriate. Examples: 'cosmic-cowboy-vibes', 'vintage-smile-magic', 'dreamy-hat-portrait', 'epic-text-moment'"
      },
      {
        role: "user",
        content: `Generate a creative filename for a photo with these elements:
- Accessories: ${accessoryList}
- Filter: ${metadata.filter}
- Has drawing: ${metadata.hasDrawing ? 'yes' : 'no'}
- Text content: ${textInfo}

Make it fun and memorable, considering all the creative elements!`
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
  corsHeaders: Record<string, string>,
  photoId?: string
): Promise<Response> {
  try {
    const accessoryList = Object.values(metadata.accessories)
      .filter(Boolean)
      .join(', ') || 'a natural face';
    
    const filterDescription = getFilterDescription(metadata.filter);
    
    // NEW: Enhanced text overlay description for haiku context
    let textDescription = '';
    if (metadata.textOverlays && metadata.textOverlays.length > 0) {
      const textContents = metadata.textOverlays.map(t => t.content).join(', ');
      textDescription = `Custom text displayed: "${textContents}"`;
    } else if (metadata.textCount && metadata.textCount > 0) {
      textDescription = `${metadata.textCount} custom text element(s) added to the photo`;
    } else {
      textDescription = 'no custom text overlays';
    }
    
    const messages = [
      {
        role: "system",
        content: "You are a poetic AI that creates beautiful haikus about photos. A haiku has exactly 3 lines with 5-7-5 syllables. Focus on the visual elements, mood, and feeling of the photo, including any text overlays or messages. Be creative and evocative. Respond with only the haiku, no additional text."
      },
      {
        role: "user",
        content: `Create a haiku about a photo booth picture with these elements:
- Accessories worn: ${accessoryList}
- Visual filter: ${filterDescription}
- Has custom drawing: ${metadata.hasDrawing ? 'yes' : 'no'}
- Text elements: ${textDescription}

Capture the playful, creative spirit of a photo booth moment, including any meaningful text or messages!`
      }
    ];

    const response = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
    
    const haiku = response.response || 
      "Smiling faces shine\nThrough digital magic lens\nMemories captured";
    
    // Save haiku to KV if photoId is provided
    if (photoId) {
      try {
        const kv = env[KV_NAMESPACE] || env.PHOTO_BOOTH_KV;
        if (kv) {
          const haikuData = {
            haiku: haiku.trim(),
            photoId: photoId,
            createdAt: new Date().toISOString(),
            metadata: metadata
          };
          
          await kv.put(`haiku:${photoId}`, JSON.stringify(haikuData));
          console.log(`Haiku saved to KV for photo: ${photoId}`);
        }
      } catch (kvError) {
        console.error('Failed to save haiku to KV:', kvError);
        // Don't fail the request if KV save fails
      }
    }
    
    return createSuccessResponse({ 
      haiku: haiku.trim(),
      photoId: photoId,
      savedToKV: !!photoId,
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
    const requestData = await request.json() as PhotoMetadata & { photoId?: string };
    
    if (!requestData.accessories || typeof requestData.filter !== 'string') {
      return createErrorResponse('Invalid photo metadata provided', 400, corsHeaders);
    }
    
    return await generatePhotoHaiku(env, requestData, corsHeaders, requestData.photoId);
    
  } catch (error) {
    console.error('Haiku request error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Request processing failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function getHaikuForPhoto(
  photoId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Check if KV is properly bound
    const kv = env[KV_NAMESPACE] || env.PHOTO_BOOTH_KV;
    if (!kv) {
      return createErrorResponse('KV storage not configured properly', 500, corsHeaders);
    }

    const haikuData = await kv.get(`haiku:${photoId}`);
    
    if (!haikuData) {
      return createErrorResponse('No haiku found for this photo', 404, corsHeaders);
    }

    const parsedData = JSON.parse(haikuData);
    
    return createSuccessResponse({
      haiku: parsedData.haiku,
      photoId: parsedData.photoId,
      createdAt: parsedData.createdAt,
      metadata: parsedData.metadata
    }, corsHeaders);

  } catch (error) {
    console.error('Haiku retrieval error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Haiku retrieval failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function interpretFilterDescription(
  description: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const messages = [
      {
        role: "system",
        content: "You are an AI that interprets photo filter requests. Given a text description, respond with ONLY one of these exact filter names: none, sepia, grayscale, vintage, warm, cool, dramatic, dreamy. Choose the filter that best matches the mood or style described."
      },
      {
        role: "user",
        content: `What filter should be applied for this description: "${description}"

Examples:
- "make this look sad" → grayscale
- "vintage vibes" → vintage
- "warm and cozy" → warm
- "dramatic and moody" → dramatic
- "soft and ethereal" → dreamy
- "cool and calm" → cool
- "old timey" → sepia
- "normal" → none

Respond with only the filter name.`
      }
    ];

    const response = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
    
    let filterName = (response.response || 'none').toLowerCase().trim();
    
    // Validate the filter name
    const validFilters = ['none', 'sepia', 'grayscale', 'vintage', 'warm', 'cool', 'dramatic', 'dreamy'];
    if (!validFilters.includes(filterName)) {
      filterName = 'none';
    }
    
    console.log(`AI interpreted "${description}" as filter: ${filterName}`);
    
    return createSuccessResponse({ 
      filter: filterName,
      description: description,
      interpretation: `Applied ${filterName} filter for "${description}"`
    }, corsHeaders);
    
  } catch (error) {
    console.error('Filter interpretation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Filter interpretation failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function handleFilterInterpretation(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { description } = await request.json() as { description: string };
    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return createErrorResponse('Valid description is required', 400, corsHeaders);
    }
    
    return await interpretFilterDescription(description.trim(), env, corsHeaders);
    
  } catch (error) {
    console.error('Filter interpretation request error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Request processing failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function parseTextCommand(
  command: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a text command parser for a photo booth app. Parse user commands and extract:
1. content: The actual text/emoji to display
2. position: "face-relative" or "absolute" 
3. targetFace: 0-based index if targeting specific person (0=first, 1=second, etc.) or null
4. offsetX, offsetY: positioning offset in pixels
5. positionDescription: human-readable position description
6. fontFamily: font name if specified
7. color: hex color if specified
8. fontSize: size in pixels if specified

Position mappings:
- "top of/above/over head/face" → offsetX: 0, offsetY: -80
- "left of head/face" → offsetX: -80, offsetY: 0  
- "right of head/face" → offsetX: 80, offsetY: 0
- "below/under/bottom of head/face" → offsetX: 0, offsetY: 60
- "on head/face" → offsetX: 0, offsetY: 0

Font mappings:
- "comic sans" → "Comic Sans MS"
- "arial" → "Arial"
- "times" → "Times New Roman"
- "courier" → "Courier New"
- "georgia" → "Georgia"
- "verdana" → "Verdana"

Respond with valid JSON only. Examples:

Input: "write 'hello' in comic sans on top of my head"
Output: {"content":"hello","position":"face-relative","targetFace":0,"offsetX":0,"offsetY":-80,"positionDescription":"above","fontFamily":"Comic Sans MS"}

Input: "put 🔥 left of the 2nd person"  
Output: {"content":"🔥","position":"face-relative","targetFace":1,"offsetX":-80,"offsetY":0,"positionDescription":"left of"}

Input: "add COOL text"
Output: {"content":"COOL text","position":"absolute","targetFace":null}`
      },
      {
        role: "user",
        content: `Parse this command: "${command}"`
      }
    ];

    const response = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
    
    let parsedResult;
    try {
      // Clean the response and parse JSON
      let jsonStr = response.response.trim();
      
      // Remove any markdown code blocks
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any text before the first {
      const jsonStart = jsonStr.indexOf('{');
      if (jsonStart > 0) {
        jsonStr = jsonStr.substring(jsonStart);
      }
      
      // Remove any text after the last }
      const jsonEnd = jsonStr.lastIndexOf('}');
      if (jsonEnd < jsonStr.length - 1) {
        jsonStr = jsonStr.substring(0, jsonEnd + 1);
      }
      
      parsedResult = JSON.parse(jsonStr);
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', response.response);
      
      // Fallback parsing
      parsedResult = {
        content: command,
        position: command.toLowerCase().includes('head') || command.toLowerCase().includes('face') ? 'face-relative' : 'absolute',
        targetFace: command.toLowerCase().includes('head') || command.toLowerCase().includes('face') ? 0 : null
      };
    }
    
    // Validate and set defaults
    const result = {
      content: parsedResult.content || command,
      position: parsedResult.position === 'face-relative' ? 'face-relative' : 'absolute',
      targetFace: typeof parsedResult.targetFace === 'number' ? parsedResult.targetFace : null,
      offsetX: typeof parsedResult.offsetX === 'number' ? parsedResult.offsetX : undefined,
      offsetY: typeof parsedResult.offsetY === 'number' ? parsedResult.offsetY : undefined,
      positionDescription: parsedResult.positionDescription || undefined,
      fontFamily: parsedResult.fontFamily || undefined,
      color: parsedResult.color || undefined,
      fontSize: typeof parsedResult.fontSize === 'number' ? parsedResult.fontSize : undefined
    };
    
    console.log(`Parsed command "${command}" ->`, result);
    
    return createSuccessResponse(result, corsHeaders);
    
  } catch (error) {
    console.error('Text command parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Text parsing failed: ${errorMessage}`, 500, corsHeaders);
  }
}

export async function handleTextCommandParsing(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { command } = await request.json() as { command: string };
    
    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return createErrorResponse('Valid command is required', 400, corsHeaders);
    }
    
    return await parseTextCommand(command.trim(), env, corsHeaders);
    
  } catch (error) {
    console.error('Text command parsing request error:', error);
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