// File: src/templates/photoBoothApp.ts
// Enhanced photo booth template with Models & Mules event theme and Twitter sharing

import { getPhotoBoothCSS } from '../assets/styles';
import { getPhotoBoothJS } from '../assets/photoBooth';

export function servePhotoBoothApp(corsHeaders: Record<string, string>): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Models & Mules Photo Booth 🐴🍹</title>
  <script type="module">
    import * as mpVision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';
    window.mpVision = mpVision;
  </script>
  <style>
    ${getPhotoBoothCSS()}
    
    /* Models & Mules Event Styling */
    .event-header {
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #87ceeb 100%);
      color: white;
      text-align: center;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    
    .event-title {
      font-size: 2.5rem;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      margin-bottom: 10px;
    }
    
    .event-subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    
    /* Event Frame Overlay */
    .event-frame-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10;
      opacity: 1;
    }
    
    .event-frame-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: linear-gradient(180deg, rgba(255,107,53,0.95) 0%, rgba(247,147,30,0.8) 50%, rgba(135,206,235,0.6) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 15px 15px 0 0;
    }
    
    .event-frame-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: linear-gradient(0deg, rgba(135,206,235,0.95) 0%, rgba(30,144,255,0.8) 50%, rgba(255,107,53,0.6) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0 0 15px 15px;
    }
    
    .event-frame-left {
      position: absolute;
      top: 80px;
      bottom: 60px;
      left: 0;
      width: 40px;
      background: linear-gradient(90deg, rgba(135,206,235,0.8) 0%, rgba(30,144,255,0.4) 100%);
    }
    
    .event-frame-right {
      position: absolute;
      top: 80px;
      bottom: 60px;
      right: 0;
      width: 40px;
      background: linear-gradient(270deg, rgba(135,206,235,0.8) 0%, rgba(30,144,255,0.4) 100%);
    }
    
    .event-title-text {
      font-size: 2.2rem;
      font-weight: bold;
      color: white;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
      font-family: 'Arial Black', Arial, sans-serif;
      letter-spacing: 2px;
    }
    
    .event-subtitle-text {
      font-size: 1rem;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      font-weight: bold;
    }
    
    /* Decorative wave elements */
    .wave-decoration {
      position: absolute;
      width: 100%;
      height: 20px;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0,10 Q25,0 50,10 T100,10 V20 H0 Z" fill="rgba(135,206,235,0.3)"/></svg>') repeat-x;
      animation: wave 3s ease-in-out infinite;
    }
    
    .wave-decoration.top {
      bottom: -10px;
    }
    
    .wave-decoration.bottom {
      top: -10px;
      transform: rotate(180deg);
    }
    
    @keyframes wave {
      0%, 100% { transform: translateX(0) scaleY(1); }
      50% { transform: translateX(-10px) scaleY(1.1); }
    }
    
    .models-mules-panel {
      background: linear-gradient(135deg, #87ceeb 0%, #f7931e 100%);
      border: 3px solid #ff6b35;
      border-radius: 15px;
      margin-bottom: 20px;
    }
    
    .models-mules-panel .panel-title {
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      font-weight: bold;
    }
    
    .mule-overlay-btn {
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      color: white;
      border: none;
      padding: 15px 25px;
      border-radius: 10px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      margin: 5px;
      transition: all 0.3s ease;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
    
    .mule-overlay-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .mule-overlay-btn.active {
      background: linear-gradient(135deg, #87ceeb 0%, #4682b4 100%);
      box-shadow: 0 0 15px rgba(135, 206, 235, 0.5);
    }
    
    .tweet-btn {
      background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .tweet-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(29, 161, 242, 0.3);
    }
    
    .mule-themed-accessories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }
    
    .mule-accessory-btn {
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid #ff6b35;
      border-radius: 10px;
      padding: 10px;
      font-size: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .mule-accessory-btn:hover {
      background: #ff6b35;
      transform: scale(1.1);
    }
    
    .mule-accessory-btn.selected {
      background: #f7931e;
      border-color: #87ceeb;
    }
  </style>
</head>
<body>
  <div class="photo-booth">
    <!-- Event Header -->
    <div class="event-header">
      <div class="event-title">🐴 MODELS & MULES 🍹</div>
      <div class="event-subtitle">Strike a pose with your favorite cocktail mule!</div>
    </div>
    
    <h1 class="title">🎭 AI Photo Booth 🤖🎨📸📝</h1>
    
    <div class="status" id="status">Loading camera and face detection...</div>
    
    <div class="camera-container">
      <div class="video-wrapper">
        <video id="video" autoplay playsinline></video>
        <canvas id="overlay-canvas"></canvas>
        <canvas id="drawing-canvas"></canvas>
        
        <!-- Models & Mules Event Frame Overlay -->
        <div class="event-frame-overlay" id="event-frame-overlay">
          <div class="event-frame-top">
            <div class="event-title-text">🐴 MODELS & MULES 🍹</div>
            <div class="wave-decoration top"></div>
          </div>
          <div class="event-frame-bottom">
            <div class="event-subtitle-text">🌊 STRIKE A POSE WITH YOUR MULE! 🌊</div>
            <div class="wave-decoration bottom"></div>
          </div>
          <div class="event-frame-left"></div>
          <div class="event-frame-right"></div>
        </div>
      </div>
    </div>

    <div class="controls">
              <!-- Models & Mules Special Panel -->
      <div class="models-mules-panel">
        <div class="panel-title">🐴 Models & Mules Event Specials 🍹</div>
        
        <div class="event-overlay-section" style="padding: 15px;">
          <div style="margin-bottom: 15px;">
            <button class="mule-overlay-btn" onclick="addRandomEventText()">
              📝 Add Event Text
            </button>
          </div>
          
          <div class="category-title" style="color: white; margin-bottom: 10px;">🍹 Mule-Themed Accessories</div>
          <div style="text-align: center; margin-bottom: 10px; color: white; font-size: 0.9rem;">
            ✨ Event frame is automatically applied to all photos! ✨
          </div>
          <div class="mule-themed-accessories">
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="🐴">🐴</button>
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="🍹">🍹</button>
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="🥃">🥃</button>
            <button class="mule-accessory-btn accessory-btn" data-type="hat" data-item="🤠">🤠</button>
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="🌊">🌊</button>
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="⭐">⭐</button>
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="🎉">🎉</button>
            <button class="mule-accessory-btn accessory-btn" data-type="extra" data-item="🏝️">🏝️</button>
          </div>
        </div>
      </div>

      <div class="accessories-panel">
        <div class="panel-title">🎭 Face Accessories</div>
        
        <div class="checkbox-section">
          <label>
            <input type="checkbox" id="show-face-boxes">
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
            <button class="accessory-btn" data-type="hat" data-item="🤠">🤠</button>
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

      <!-- Text Overlay Panel -->
      <div class="text-panel">
        <div class="panel-title">📝 Text Overlays</div>
        
        <div class="text-instructions">
          💡 <strong>Smart Text Controls:</strong><br>
          • Just type text → adds to top-left<br>
          • "write 'HELLO' in comic sans on my head" → custom font on face<br>
          • <strong>Double-click text</strong> → edit content, color, font, size<br>
          • <strong>Drag to trash</strong> → delete text/emojis<br>
          • "place text left of the 2nd person" → targets specific person<br>
          • All text is draggable and editable after placement!
        </div>
        
        <div class="text-input-section">
          <div class="text-input-container">
            <input 
              type="text" 
              id="text-input" 
              placeholder="Try: 'MODELS & MULES' or 'I survived the mule madness!'"
              class="text-input"
            >
            <button id="add-text-btn" class="btn-add-text">📝 Add Text</button>
          </div>
          
          <div class="text-preview" id="text-preview">Sample Text</div>
        </div>
        
        <div class="drawing-section">
          <div class="category-title">🎨 Text Colors</div>
          <div class="text-color-palette">
            <div class="text-color-btn selected" style="background: #ffffff; border-color: #000" data-color="#ffffff"></div>
            <div class="text-color-btn" style="background: #000000" data-color="#000000"></div>
            <div class="text-color-btn" style="background: #ff0000" data-color="#ff0000"></div>
            <div class="text-color-btn" style="background: #00ff00" data-color="#00ff00"></div>
            <div class="text-color-btn" style="background: #0000ff" data-color="#0000ff"></div>
            <div class="text-color-btn" style="background: #ffff00" data-color="#ffff00"></div>
            <div class="text-color-btn" style="background: #ff00ff" data-color="#ff00ff"></div>
            <div class="text-color-btn" style="background: #00ffff" data-color="#00ffff"></div>
            <div class="text-color-btn" style="background: #ffa500" data-color="#ffa500"></div>
            <div class="text-color-btn" style="background: #8b4513" data-color="#8b4513"></div>
          </div>
        </div>
        
        <div class="drawing-section">
          <div class="category-title">🔤 Font Family</div>
          <div class="font-grid">
            <button class="font-btn selected" data-font="Arial">Arial</button>
            <button class="font-btn" data-font="Comic Sans MS">Comic Sans</button>
            <button class="font-btn" data-font="Times New Roman">Times</button>
            <button class="font-btn" data-font="Courier New">Courier</button>
            <button class="font-btn" data-font="Georgia">Georgia</button>
            <button class="font-btn" data-font="Verdana">Verdana</button>
          </div>
        </div>
        
        <div class="drawing-section">
          <div class="category-title">📏 Text Size</div>
          <div class="text-size-container">
            <span style="font-size: 12px;">A</span>
            <input type="range" id="text-size" class="text-size-slider" min="12" max="72" value="24">
            <span style="font-size: 24px;">A</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" id="capture-btn">📸 Capture Photo</button>
        <button class="btn btn-mode" id="drawing-mode-btn">🎨 Drawing Mode: OFF</button>
        
        <div class="filter-section">
          <div class="category-title">🎨 Photo Filters</div>
          
          <!-- AI Filter Description Input -->
          <div class="ai-filter-section">
            <div class="filter-description-container">
              <input 
                type="text" 
                id="filter-description" 
                placeholder="Describe the mood... (e.g., 'tropical vibes', 'sunset glow')"
                class="filter-description-input"
              >
              <button id="apply-description-btn" class="btn-ai-filter">🤖 Apply</button>
            </div>
            <div class="filter-interpretation" id="filter-interpretation" style="display: none;"></div>
          </div>
          
          <div class="filter-grid">
            <button class="filter-btn selected" data-filter="none">Original</button>
            <button class="filter-btn" data-filter="sepia">Sepia</button>
            <button class="filter-btn" data-filter="grayscale">B&W</button>
            <button class="filter-btn" data-filter="vintage">Vintage</button>
            <button class="filter-btn" data-filter="warm">Warm</button>
            <button class="filter-btn" data-filter="cool">Cool</button>
            <button class="filter-btn" data-filter="dramatic">Dramatic</button>
            <button class="filter-btn" data-filter="dreamy">Dreamy</button>
          </div>
        </div>
        
        <button class="btn btn-secondary" id="clear-accessories-btn">🗑️ Clear Accessories</button>
        <button class="btn btn-warning" id="clear-drawing-btn">🎨 Clear Drawing</button>
        <button class="btn btn-warning" id="clear-text-btn">📝 Clear Text</button>
        <button class="btn btn-warning" id="clear-all-btn">🧹 Clear Everything</button>
        <button class="btn btn-secondary" id="download-btn" style="display: none;">💾 Download</button>
        <button class="btn btn-success" id="upload-btn" style="display: none;">☁️ Manual Save</button>
        <button class="btn btn-ai" id="haiku-btn" style="display: none; background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%); color: white;">🤖 Generate AI Haiku</button>
        
        <!-- Twitter Share Button - FIXED -->
        <button class="tweet-btn" id="tweet-btn" onclick="shareToTwitter()">
          🐦 Tweet My Mule
        </button>
        
        <button class="btn btn-success" id="share-btn" style="display: none;">🔗 Share Photo</button>
        <button class="btn btn-secondary" id="gallery-btn">🖼️ View Gallery</button>
      </div>

      <div class="drawing-panel">
        <div class="panel-title">🎨 Drawing Tools</div>
        
        <div class="drawing-section">
          <div class="category-title" id="drawing-status">🎭 Accessory Mode Active</div>
          <div style="text-align: center; font-size: 0.85rem; color: #666; margin-bottom: 15px;">
            Use the "Drawing Mode" button to switch between moving accessories/text and drawing<br>
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
    
    <!-- AI Haiku Display -->
    <div class="haiku-container" id="haiku-container">
      <div class="haiku-title">
        🤖 AI Generated Haiku 🎌
      </div>
      <div class="haiku-text" id="haiku-text"></div>
      <div class="haiku-actions">
        <button class="btn-haiku" onclick="copyHaiku()">📋 Copy Haiku</button>
        <button class="btn-haiku" id="add-haiku-btn" style="display: none; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); margin-left: 10px;">📝 Add to Photo</button>
      </div>
    </div>
    
    <!-- Text Edit Panel -->
    <div class="text-edit-panel" id="text-edit-panel">
      <div class="edit-panel-header">✏️ Edit Text</div>
      
      <div class="edit-form-group">
        <label for="edit-text-content">Text Content:</label>
        <input type="text" id="edit-text-content" class="edit-text-input" placeholder="Enter text content">
      </div>
      
      <div class="edit-form-group">
        <label for="edit-text-color">Text Color:</label>
        <input type="color" id="edit-text-color" class="edit-color-input" value="#ffffff">
      </div>
      
      <div class="edit-form-group">
        <label for="edit-text-size">Text Size:</label>
        <input type="range" id="edit-text-size" min="12" max="72" value="24" class="text-size-slider">
      </div>
      
      <div class="edit-form-group">
        <label>Font Family:</label>
        <div class="edit-font-grid">
          <button class="edit-font-btn selected" data-font="Arial">Arial</button>
          <button class="edit-font-btn" data-font="Comic Sans MS">Comic</button>
          <button class="edit-font-btn" data-font="Times New Roman">Times</button>
          <button class="edit-font-btn" data-font="Courier New">Courier</button>
          <button class="edit-font-btn" data-font="Georgia">Georgia</button>
          <button class="edit-font-btn" data-font="Verdana">Verdana</button>
        </div>
      </div>
      
      <div class="edit-actions">
        <button class="btn-edit btn-edit-apply" id="apply-edit-btn">✅ Apply</button>
        <button class="btn-edit btn-edit-cancel" id="cancel-edit-btn">❌ Cancel</button>
      </div>
    </div>

    <!-- Capture Confirmation Modal -->
    <div class="modal-overlay" id="modal-overlay"></div>
    <div class="capture-confirmation-modal" id="capture-confirmation-modal">
      <div class="capture-success-icon">📸✨</div>
      <h2>Mule-tastic Photo Captured!</h2>
      <p>Your Models & Mules photo has been captured and is being auto-saved to the cloud.</p>
      <div class="modal-buttons">
        <button class="btn-modal btn-modal-primary" id="view-last-photo-btn">📷 View Photo</button>
        <button class="btn-modal btn-modal-secondary" id="close-confirmation-btn">✖️ Close</button>
      </div>
    </div>
    
    <div class="share-section" id="share-section">
      <h3>📤 Photo Shared!</h3>
      <p>Your Models & Mules photo has been saved to the cloud. Share this link:</p>
      <div class="share-url" id="share-url"></div>
      <button class="btn btn-secondary" onclick="copyShareUrl()">📋 Copy Link</button>
    </div>

    <div class="gallery-section">
      <h3>🖼️ Recent Photos</h3>
      <p style="text-align: center; color: #666; font-size: 0.9rem; margin-bottom: 15px;">
        Click on any photo to open it and check the URL for sharing! You can also click "Tweet the mule" to tweet it after you took a pic. 🐦
      </p>
      <div class="gallery-grid" id="gallery-grid"></div>
    </div>
  </div>

  <div class="footer">
    made w/ <span class="heart">♥</span> for models & mules event 🐴🍹 using <a href="https://workers.cloudflare.com" target="_blank"> cloudflare workers</a>, <a href="https://developers.cloudflare.com/r2/"> cloudflare r2</a>, <a href="https://developers.cloudflare.com/kv/"> cloudflare kv</a>, <a href="https://developers.cloudflare.com/workers-ai/models/"> workers ai🤖</a>, <a href="https://mediapipe.dev" target="_blank"> mediapipe</a>. Code <a href="https://github.com/elizabethsiegle/cf-worker-photobooth-ai">here👩🏻‍💻</a>
  </div>

  <script>
    ${getPhotoBoothJS()}
  </script>
  
  <script>
    // ===== FIXED TWITTER INTEGRATION =====
    
    // Main Twitter sharing function - FIXED
    function shareToTwitter() {
      const photoContainer = document.getElementById('captured-photo-container');
      const hasCapturedPhoto = photoContainer && photoContainer.classList.contains('show');
      
      if (!hasCapturedPhoto) {
        // No photo captured - tweet about the event
        const eventTweetText = "Having a blast at Models & Mules! @openaidevs @digitalocean @cloudflaredev #ModelsAndMules";
        const twitterUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(eventTweetText);
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        
        // Update status
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Twitter opened! Share about the Models & Mules event! 🐦✨';
        statusEl.className = 'status ready';
        return;
      }
      
      // Photo captured - get the photo ID and create shareable link
      let photoId = window.lastPhotoId || window.selectedPhotoForTweet;
      
      if (photoId) {
        // Tweet with link to photo on your site
        const photoViewUrl = window.location.origin + '/api/photo/' + photoId;
        const photoTweetText = "Just struck a pose @ Models & Mules w/ @cloudflaredev @openaidevs @digitalocean! 🐴🍹📸 Check out my photo:";
        const twitterUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(photoTweetText) + "&url=" + encodeURIComponent(photoViewUrl);
        
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        
        // Update status
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Twitter opened with your photo link! 🐦✨';
        statusEl.className = 'status ready';
      } else {
        // Fallback: download photo and tweet manually
        downloadAndTweetInstructions();
      }
    }
    
    function downloadAndTweetInstructions() {
      // Trigger download of current photo
      const downloadBtn = document.getElementById('download-btn');
      if (downloadBtn) {
        downloadBtn.click();
      }
      
      // Open Twitter with text
      const tweetText = "Just took this amazing photo at Models & Mules! 🐴🍹📸 #ModelsAndMules #PhotoBooth #MuleLife";
      const twitterUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetText);
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      
      // Show instructions
      setTimeout(() => {
        alert('📸 Photo downloaded! Now attach it to your tweet on Twitter. 🐦');
      }, 1000);
      
      // Update status
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Download started! Attach the image to your tweet. 📸🐦';
      statusEl.className = 'status ready';
    }
    
    // Debug function - FIXED
    function debugTwitter() {
      console.log('=== TWITTER DEBUG ===');
      console.log('Selected photo for tweet:', window.selectedPhotoForTweet);
      console.log('Last photo ID:', window.lastPhotoId);
      console.log('Captured photo container:', document.getElementById('captured-photo-container'));
      console.log('Tweet button element:', document.getElementById('tweet-btn'));
      
      // Test the function
      shareToTwitter();
    }
    
    // ===== MODELS & MULES EVENT FUNCTIONS =====
    
    let eventOverlayActive = false;
    let photoBoothInstance = null;
    
    function toggleEventOverlay() {
      const btn = document.getElementById('event-overlay-btn');
      const frameOverlay = document.getElementById('event-frame-overlay');
      
      console.log('Toggle button clicked, eventOverlayActive:', eventOverlayActive);
      console.log('Frame overlay element:', frameOverlay);
      
      if (!eventOverlayActive) {
        // Show the frame overlay
        eventOverlayActive = true;
        btn.classList.add('active');
        btn.textContent = '🐴 Remove Event Frame';
        
        frameOverlay.classList.add('active');
        
        console.log('Frame overlay should now be visible');
        
        // Update status
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Models & Mules frame overlay added! 🐴🍹 Perfect for photos!';
        statusEl.className = 'status ready';
        
      } else {
        // Hide the frame overlay
        eventOverlayActive = false;
        btn.classList.remove('active');
        btn.textContent = '🐴 Add Models & Mules Frame';
        
        frameOverlay.classList.remove('active');
        
        console.log('Frame overlay should now be hidden');
        
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Event frame overlay removed! 🗑️';
        statusEl.className = 'status ready';
      }
    }
    
    // Function to draw the Models & Mules frame directly on canvas
    function drawEventFrameOnCanvas(canvas, ctx) {
      const width = canvas.width;
      const height = canvas.height;
      
      // Save canvas state
      ctx.save();
      
      // Draw top bar background
      const topHeight = 80;
      const topGradient = ctx.createLinearGradient(0, 0, 0, topHeight);
      topGradient.addColorStop(0, 'rgba(255,107,53,0.95)');
      topGradient.addColorStop(0.5, 'rgba(247,147,30,0.8)');
      topGradient.addColorStop(1, 'rgba(135,206,235,0.6)');
      
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, topHeight);
      
      // Draw bottom bar background
      const bottomHeight = 60;
      const bottomGradient = ctx.createLinearGradient(0, height - bottomHeight, 0, height);
      bottomGradient.addColorStop(0, 'rgba(135,206,235,0.95)');
      bottomGradient.addColorStop(0.5, 'rgba(30,144,255,0.8)');
      bottomGradient.addColorStop(1, 'rgba(255,107,53,0.6)');
      
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);
      
      // Draw side bars
      const sideWidth = 40;
      const leftGradient = ctx.createLinearGradient(0, 0, sideWidth, 0);
      leftGradient.addColorStop(0, 'rgba(135,206,235,0.8)');
      leftGradient.addColorStop(1, 'rgba(30,144,255,0.4)');
      
      ctx.fillStyle = leftGradient;
      ctx.fillRect(0, topHeight, sideWidth, height - topHeight - bottomHeight);
      
      const rightGradient = ctx.createLinearGradient(width - sideWidth, 0, width, 0);
      rightGradient.addColorStop(0, 'rgba(135,206,235,0.8)');
      rightGradient.addColorStop(1, 'rgba(30,144,255,0.4)');
      
      ctx.fillStyle = rightGradient;
      ctx.fillRect(width - sideWidth, topHeight, sideWidth, height - topHeight - bottomHeight);
      
      // Draw top text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      
      const topText = '🐴 MODELS & MULES 🍹';
      ctx.strokeText(topText, width / 2, topHeight / 2);
      ctx.fillText(topText, width / 2, topHeight / 2);
      
      // Draw bottom text
      ctx.font = 'bold 20px Arial';
      const bottomText = '🌊 STRIKE A POSE WITH YOUR MULE! 🌊';
      ctx.strokeText(bottomText, width / 2, height - bottomHeight / 2);
      ctx.fillText(bottomText, width / 2, height - bottomHeight / 2);
      
      // Restore canvas state
      ctx.restore();
    }
    
    // Override the photo capture to include frame BEFORE upload
    function enhancePhotoCaptureWithFrame() {
      // Wait for photo booth to be ready and find the instance
      setTimeout(() => {
        // Try to find the CloudPhotoBooth instance
        const findPhotoBoothInstance = () => {
          // Look for signs the photo booth is ready
          const video = document.getElementById('video');
          const overlayCanvas = document.getElementById('overlay-canvas');
          const capturedCanvas = document.getElementById('captured-photo');
          
          if (video && overlayCanvas && capturedCanvas && video.srcObject) {
            // Try to access the instance through various means
            if (window.globalPhotoBoothInstance) {
              return window.globalPhotoBoothInstance;
            }
            
            // Create a wrapper that can override capture
            return {
              video: video,
              overlayCanvas: overlayCanvas,
              capturedCanvas: capturedCanvas,
              drawingCanvas: document.getElementById('drawing-canvas')
            };
          }
          return null;
        };
        
        const checkAndOverride = () => {
          const instance = findPhotoBoothInstance();
          if (instance) {
            console.log('Found photo booth elements, setting up frame capture override');
            
            // Override the capture button to include frame in the capture process
            const captureBtn = document.getElementById('capture-btn');
            if (captureBtn) {
              // Remove existing event listeners by cloning the button
              const newCaptureBtn = captureBtn.cloneNode(true);
              captureBtn.parentNode.replaceChild(newCaptureBtn, captureBtn);
              
              // Add our custom capture handler
              newCaptureBtn.addEventListener('click', () => {
                customCaptureWithFrame(instance);
              });
              
              console.log('Capture button overridden with frame-enabled capture');
            }
          } else {
            // Try again in a bit
            setTimeout(checkAndOverride, 1000);
          }
        };
        
        checkAndOverride();
      }, 2000);
    }
    
    // Custom capture function that includes the frame
    async function customCaptureWithFrame(photoBoothElements) {
      console.log('Custom capture with frame starting...');
      
      const video = photoBoothElements.video;
      const overlayCanvas = photoBoothElements.overlayCanvas;
      const drawingCanvas = photoBoothElements.drawingCanvas;
      const capturedCanvas = photoBoothElements.capturedCanvas;
      
      if (!video || !capturedCanvas) {
        console.error('Missing required elements for capture');
        return;
      }
      
      // Update status
      const statusEl = document.getElementById('status');
      statusEl.textContent = '📸 Capturing photo with Models & Mules frame...';
      statusEl.className = 'status loading';
      
      // Set canvas dimensions
      capturedCanvas.width = video.videoWidth;
      capturedCanvas.height = video.videoHeight;
      
      const ctx = capturedCanvas.getContext('2d');
      
      // Step 1: Draw the video
      ctx.drawImage(video, 0, 0);
      
      // Step 2: Draw overlays (accessories, text, etc.)
      if (overlayCanvas) {
        ctx.drawImage(overlayCanvas, 0, 0);
      }
      
      // Step 3: Draw any drawings
      if (drawingCanvas) {
        ctx.drawImage(drawingCanvas, 0, 0);
      }
      
      // Step 4: Draw the Models & Mules frame ON TOP
      drawEventFrameOnCanvas(capturedCanvas, ctx);
      
      // Step 5: Show the captured photo
      const container = document.getElementById('captured-photo-container');
      if (container) {
        container.classList.add('show');
      }
      
      // Step 6: Show action buttons
      document.getElementById('download-btn').style.display = 'block';
      document.getElementById('upload-btn').style.display = 'block';
      document.getElementById('haiku-btn').style.display = 'block';
      
      // Step 7: Upload the enhanced photo
      try {
        const blob = await new Promise(resolve => 
          capturedCanvas.toBlob(resolve, 'image/png', 0.9)
        );
        
        if (blob) {
          const formData = new FormData();
          formData.append('photo', blob, 'models-mules-photo.png');
          formData.append('accessories', JSON.stringify({}));
          formData.append('filter', 'none');
          formData.append('hasDrawing', 'false');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            window.lastPhotoId = result.photoId;
            
            statusEl.textContent = '✅ Photo with Models & Mules frame saved! Filename: ' + result.filename;
            statusEl.className = 'status ready';
            
            // Reload gallery to show new photo
            setTimeout(() => {
              // Manually reload gallery and set up click handlers
              fetch('/api/gallery?limit=12')
                .then(response => response.json())
                .then(data => {
                  const gallery = document.getElementById('gallery-grid');
                  if (data.photos && data.photos.length > 0) {
                    gallery.innerHTML = data.photos.map(photo => 
                      '<div class="gallery-item" data-photo-id="' + photo.id + '">' +
                        '<img src="/api/photo/' + photo.id + '" alt="Photo" loading="lazy">' +
                      '</div>'
                    ).join('');
                    
                    // Set up click handlers for gallery items
                    updateGalleryClickHandlers();
                    
                    console.log('Gallery reloaded with', data.photos.length, 'photos');
                  }
                })
                .catch(error => {
                  console.error('Gallery reload error:', error);
                });
            }, 1500);
            
            console.log('Photo with frame uploaded successfully:', result.photoId);
          } else {
            throw new Error('Upload failed');
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        statusEl.textContent = 'Upload failed, but photo captured with frame! Use download button.';
        statusEl.className = 'status error';
      }
    }

    function addRandomEventText() {
      const eventPhrases = [
        'I survived the Mule Madness!',
        'Models & Mules 2024 🐴',
        'Mule Life',
        'Cheers to Mules! 🍹',
        'Party Animal 🐴',
        'Mule-tastic Night!',
        'Living my best mule life 🐴',
        'Cocktail hour champion 🍹',
        'Models & Mules forever!'
      ];
      
      const randomPhrase = eventPhrases[Math.floor(Math.random() * eventPhrases.length)];
      
      const textInput = document.getElementById('text-input');
      const originalValue = textInput.value;
      
      textInput.value = randomPhrase;
      
      const addTextBtn = document.getElementById('add-text-btn');
      addTextBtn.click();
      
      // Restore original input value
      setTimeout(() => {
        textInput.value = originalValue;
      }, 100);
      
      setTimeout(() => {
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Event text "' + randomPhrase + '" added! 🎉 Drag to reposition or double-click to edit.';
        statusEl.className = 'status ready';
      }, 1000);
    }
    
    // Function to handle gallery photo clicks
    function handleGalleryPhotoClick(photoId) {
      console.log('Gallery photo clicked:', photoId);
      
      // Open the photo in new tab (keep existing behavior)
      window.open('/api/photo/' + photoId, '_blank');
      
      // Store the photo ID for tweeting
      window.selectedPhotoForTweet = photoId;
      console.log('Stored photo ID for tweeting:', photoId);
      
      // Show the tweet button
      const tweetBtn = document.getElementById('tweet-btn');
      if (tweetBtn) {
        tweetBtn.style.display = 'inline-flex';
        console.log('Tweet button should now be visible');
      } else {
        console.error('Tweet button not found!');
      }
      
      // Update status
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Photo selected! Click "🐦 Tweet My Mule" to share this photo. 📸✨';
      statusEl.className = 'status ready';
      
      console.log('Gallery photo click handled successfully');
    }
    
    function updateGalleryClickHandlers() {
  console.log('=== SETTING UP GALLERY HANDLERS ===');
  
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) {
    console.error('Gallery grid not found!');
    return;
  }
  
  // CRITICAL: Remove ALL existing event listeners by cloning
  const newGalleryGrid = galleryGrid.cloneNode(true);
  galleryGrid.parentNode.replaceChild(newGalleryGrid, galleryGrid);
  
  // SINGLE EVENT LISTENER - NO DUPLICATES
  newGalleryGrid.addEventListener('click', function(e) {
    console.log('SINGLE GALLERY CLICK:', e.target.tagName, e.target.className);
    
    // Photo/image clicked - ONLY OPEN ONCE
    const galleryItem = e.target.closest('.gallery-item');
    if (galleryItem) {
      e.stopPropagation();
      e.preventDefault();
      
      const photoId = galleryItem.dataset.photoId;
      console.log('PHOTO CLICKED - OPENING ONCE:', photoId);
      if (photoId) {
        // OPEN ONLY ONCE
        window.open('/api/photo/' + photoId, '_blank');
      }
    }
  });
  
  console.log('=== SINGLE GALLERY HANDLER SET ===');
}
    
    // Monitor for gallery updates
    function observeGalleryChanges() {
      const galleryGrid = document.getElementById('gallery-grid');
      if (!galleryGrid) return;
      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Gallery was updated, update click handlers
            setTimeout(updateGalleryClickHandlers, 100);
          }
        });
      });
      
      observer.observe(galleryGrid, { childList: true });
      
      // Also update handlers for any existing gallery items
      setTimeout(updateGalleryClickHandlers, 1000);
    }
    
    // Add missing global functions for onclick handlers
    function copyHaiku() {
      const haikuText = document.getElementById('haiku-text').textContent;
      navigator.clipboard.writeText(haikuText).then(() => {
        alert('Haiku copied to clipboard! 🎌');
      });
    }
    
    function copyShareUrl() {
      const shareUrl = document.getElementById('share-url').textContent;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share URL copied to clipboard! 📋');
      });
    }
    
    // Initialize when page loads
    window.addEventListener('load', () => {
      // Initialize gallery click monitoring
      observeGalleryChanges();
      
      // Enhance photo capture to include frame
      enhancePhotoCaptureWithFrame();
      
      // Store photo ID globally when photos are captured
      window.lastPhotoId = null;
      window.selectedPhotoForTweet = null; // For gallery-selected photos
      
      // Monitor for gallery button clicks to load gallery
      const galleryBtn = document.getElementById('gallery-btn');
      if (galleryBtn) {
        galleryBtn.addEventListener('click', () => {
          console.log('Gallery button clicked - will set up handlers after load');
          // Give the gallery time to load, then update handlers
          setTimeout(() => {
            console.log('Setting up gallery click handlers after gallery load');
            updateGalleryClickHandlers();
          }, 2000);
          
          // Also try again after a longer delay
          setTimeout(() => {
            console.log('Second attempt at setting up gallery click handlers');
            updateGalleryClickHandlers();
          }, 4000);
        });
      }
      
      // Also set up initial handlers for any existing gallery
      setTimeout(() => {
        console.log('Setting up initial gallery click handlers');
        updateGalleryClickHandlers();
      }, 5000);
      
      // Also monitor for upload responses to capture the photo ID
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
          // Check if this is an upload response
          if (args[0] === '/api/upload' && response.ok) {
            response.clone().json().then(data => {
              if (data.photoId) {
                window.lastPhotoId = data.photoId;
                console.log('Stored photo ID for Twitter sharing:', data.photoId);
              }
            }).catch(err => {
              console.log('Could not parse upload response for photo ID');
            });
          }
          return response;
        });
      };
    });
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