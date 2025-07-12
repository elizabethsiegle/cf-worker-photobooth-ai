// File: src/templates/photoBoothApp.ts
// Main photo booth application template with drawing mode toggle

import { getPhotoBoothCSS } from '../assets/styles';
import { getPhotoBoothJS } from '../assets/photoBooth';

export function servePhotoBoothApp(corsHeaders: Record<string, string>): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Face Detection Photo Booth with Drawing</title>
  <script type="module">
    import * as mpVision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';
    window.mpVision = mpVision;
  </script>
  <style>
    ${getPhotoBoothCSS()}
  </style>
</head>
<body>
  <div class="photo-booth">
    <h1 class="title">🎭 Cloudflare AI Photo Booth 🎨📸</h1>
    
    <div class="status" id="status">Loading camera and face detection...</div>
    
    <div class="camera-container">
      <div class="video-wrapper">
        <video id="video" autoplay playsinline></video>
        <canvas id="overlay-canvas"></canvas>
        <canvas id="drawing-canvas"></canvas>
      </div>
    </div>

    <div class="controls">
      <div class="accessories-panel">
        <div class="panel-title">🎭 Face Accessories</div>
        
        <div class="checkbox-section">
          <label>
            <input type="checkbox" id="show-face-boxes" checked>
            📦 Show Face Detection Boxes
          </label>
        </div>
        
        <div class="accessory-category">
          <div class="category-title">🎩 Hats & Hair</div>
          <div class="accessory-grid">
            <button class="accessory-btn" data-type="hat" data-item="🎩">🎩</button>
            <button class="accessory-btn" data-type="hat" data-item="👑">👑</button>
            <button class="accessory-btn" data-type="hat" data-item="🧢">🧢</button>
            <button class="accessory-btn" data-type="hat" data-item="🎓">🎓</button>
            <button class="accessory-btn" data-type="hat" data-item="🎪">🎪</button>
          </div>
        </div>

        <div class="accessory-category">
          <div class="category-title">🕶️ Glasses & Eyes</div>
          <div class="accessory-grid">
            <button class="accessory-btn" data-type="glasses" data-item="🕶️">🕶️</button>
            <button class="accessory-btn" data-type="glasses" data-item="👓">👓</button>
            <button class="accessory-btn" data-type="glasses" data-item="🥽">🥽</button>
          </div>
        </div>

        <div class="accessory-category">
          <div class="category-title">😄 Face Emojis</div>
          <div class="accessory-grid">
            <button class="accessory-btn" data-type="face" data-item="😀">😀</button>
            <button class="accessory-btn" data-type="face" data-item="🤡">🤡</button>
            <button class="accessory-btn" data-type="face" data-item="👹">👹</button>
            <button class="accessory-btn" data-type="face" data-item="👺">👺</button>
            <button class="accessory-btn" data-type="face" data-item="🎭">🎭</button>
            <button class="accessory-btn" data-type="face" data-item="💀">💀</button>
          </div>
        </div>

        <div class="accessory-category">
          <div class="category-title">🎉 Fun Extras</div>
          <div class="accessory-grid">
            <button class="accessory-btn" data-type="extra" data-item="🦄">🦄</button>
            <button class="accessory-btn" data-type="extra" data-item="🐸">🐸</button>
            <button class="accessory-btn" data-type="extra" data-item="🎈">🎈</button>
            <button class="accessory-btn" data-type="extra" data-item="⭐">⭐</button>
            <button class="accessory-btn" data-type="extra" data-item="🌟">🌟</button>
            <button class="accessory-btn" data-type="extra" data-item="✨">✨</button>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" id="capture-btn">📸 Capture Photo</button>
        <button class="btn btn-mode" id="drawing-mode-btn">🎨 Drawing Mode: OFF</button>
        <button class="btn btn-secondary" id="clear-accessories-btn">🗑️ Clear Accessories</button>
        <button class="btn btn-warning" id="clear-drawing-btn">🎨 Clear Drawing</button>
        <button class="btn btn-warning" id="clear-all-btn">🧹 Clear Everything</button>
        <button class="btn btn-secondary" id="download-btn" style="display: none;">💾 Download</button>
        <button class="btn btn-success" id="upload-btn" style="display: none;">☁️ Save to Cloudflare R2</button>
        <button class="btn btn-success" id="share-btn" style="display: none;">🔗 Share Photo</button>
        <button class="btn btn-secondary" id="gallery-btn">🖼️ View Gallery</button>
      </div>

      <div class="drawing-panel">
        <div class="panel-title">🎨 Drawing Tools</div>
        
        <div class="drawing-section">
          <div class="category-title" id="drawing-status">🎭 Accessory Mode Active</div>
          <div style="text-align: center; font-size: 0.85rem; color: #666; margin-bottom: 15px;">
            Use the "Drawing Mode" button to switch between moving accessories and drawing
          </div>
        </div>
        
        <div class="drawing-section">
          <div class="category-title">🎨 Colors</div>
          <div class="color-palette">
            <div class="color-btn selected" style="background: #000000" data-color="#000000"></div>
            <div class="color-btn" style="background: #ff0000" data-color="#ff0000"></div>
            <div class="color-btn" style="background: #00ff00" data-color="#00ff00"></div>
            <div class="color-btn" style="background: #0000ff" data-color="#0000ff"></div>
            <div class="color-btn" style="background: #ffff00" data-color="#ffff00"></div>
            <div class="color-btn" style="background: #ff00ff" data-color="#ff00ff"></div>
            <div class="color-btn" style="background: #00ffff" data-color="#00ffff"></div>
            <div class="color-btn" style="background: #ffffff; border-color: #000" data-color="#ffffff"></div>
            <div class="color-btn" style="background: #8b4513" data-color="#8b4513"></div>
            <div class="color-btn" style="background: #ffa500" data-color="#ffa500"></div>
          </div>
        </div>
        
        <div class="drawing-section">
          <div class="category-title">🖌️ Brush Size</div>
          <div class="brush-size">
            <input type="range" id="brush-size" min="2" max="50" value="10">
            <div class="brush-preview" id="brush-preview"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="captured-photo-container" id="captured-photo-container">
      <canvas id="captured-photo"></canvas>
    </div>
    
    <div class="share-section" id="share-section">
      <h3>📤 Photo Shared!</h3>
      <p>Your photo has been saved to the cloud. Share this link:</p>
      <div class="share-url" id="share-url"></div>
      <button class="btn btn-secondary" onclick="copyShareUrl()">📋 Copy Link</button>
    </div>

    <div class="gallery-section">
      <h3>🖼️ Recent Photos</h3>
      <div class="gallery-grid" id="gallery-grid"></div>
    </div>
  </div>

  <div class="footer">
    made w/ <span class="heart">♥</span> in sf🌉 w/ <a href="https://workers.cloudflare.com" target="_blank">cloudflare workers</a>, <a href="https://mediapipe.dev" target="_blank">mediapipe, <a href="https://developers.cloudflare.com/r2/">Cloudflare R2</a>. Code on GitHub👩🏻‍💻 <a href="https://github.com/elizabethsiegle/cf-worker-photobooth-ai" target="_blank">here</a>
  </div>

  <script>
    ${getPhotoBoothJS()}
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      ...corsHeaders
    }
  });
}