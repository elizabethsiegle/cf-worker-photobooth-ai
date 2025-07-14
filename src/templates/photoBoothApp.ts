// File: src/templates/photoBoothApp.ts
// Enhanced photo booth template with text overlay system UI

import { getPhotoBoothCSS } from '../assets/styles';
import { getPhotoBoothJS } from '../assets/photoBooth';

export function servePhotoBoothApp(corsHeaders: Record<string, string>): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Face Detection Photo Booth with Drawing, Text & AI</title>
  <script type="module">
    import * as mpVision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';
    window.mpVision = mpVision;
  </script>
  <style>
    ${getPhotoBoothCSS()}
    
    /* Enhanced Filter Button Styles */
    .filter-section {
      margin: 15px 0;
      padding: 15px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 1px solid #dee2e6;
    }
    
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    
    .filter-btn {
      position: relative;
      padding: 8px 12px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      color: #495057;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .filter-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
      transition: left 0.5s ease;
    }
    
    .filter-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-color: #6c757d;
    }
    
    .filter-btn:hover::before {
      left: 100%;
    }
    
    .filter-btn.selected {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border-color: #0056b3;
      box-shadow: 0 4px 12px rgba(0,123,255,0.3);
      transform: translateY(-1px);
    }
    
    .filter-btn.selected::after {
      content: '✓';
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.7rem;
      color: #fff;
      font-weight: bold;
    }
    
    /* Individual filter button colors for visual distinction */
    .filter-btn[data-filter="sepia"] {
      background: linear-gradient(135deg, #d4a574 0%, #b8956a 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="sepia"]:not(.selected):hover {
      background: linear-gradient(135deg, #e0b285 0%, #c4a176 100%);
    }
    
    .filter-btn[data-filter="grayscale"] {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="grayscale"]:not(.selected):hover {
      background: linear-gradient(135deg, #78848e 0%, #545b62 100%);
    }
    
    .filter-btn[data-filter="vintage"] {
      background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="vintage"]:not(.selected):hover {
      background: linear-gradient(135deg, #9c5424 0%, #703b26 100%);
    }
    
    .filter-btn[data-filter="warm"] {
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="warm"]:not(.selected):hover {
      background: linear-gradient(135deg, #ff7846 0%, #f89d35 100%);
    }
    
    .filter-btn[data-filter="cool"] {
      background: linear-gradient(135deg, #4dabf7 0%, #228be6 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="cool"]:not(.selected):hover {
      background: linear-gradient(135deg, #74c0fc 0%, #339af0 100%);
    }
    
    .filter-btn[data-filter="dramatic"] {
      background: linear-gradient(135deg, #495057 0%, #212529 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="dramatic"]:not(.selected):hover {
      background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
    }
    
    .filter-btn[data-filter="dreamy"] {
      background: linear-gradient(135deg, #e056fd 0%, #9c88ff 100%);
      color: #fff;
    }
    
    .filter-btn[data-filter="dreamy"]:not(.selected):hover {
      background: linear-gradient(135deg, #e571fe 0%, #a99eff 100%);
    }
    
    /* CSS filter classes for captured photos */
    .filter-none {
      filter: none !important;
    }
    
    .filter-sepia {
      filter: sepia(1) contrast(1.15) brightness(1.1) saturate(1.2) !important;
    }
    
    .filter-grayscale {
      filter: grayscale(1) contrast(1.2) brightness(1.05) !important;
    }
    
    .filter-vintage {
      filter: sepia(0.6) contrast(1.3) brightness(1.15) hue-rotate(-15deg) saturate(1.4) !important;
    }
    
    .filter-warm {
      filter: hue-rotate(-20deg) saturate(1.4) brightness(1.15) contrast(1.1) !important;
    }
    
    .filter-cool {
      filter: hue-rotate(20deg) saturate(1.3) brightness(1.08) contrast(1.15) !important;
    }
    
    .filter-dramatic {
      filter: contrast(1.6) brightness(0.95) saturate(1.4) !important;
    }
    
    .filter-dreamy {
      filter: blur(0.8px) brightness(1.25) saturate(0.85) contrast(0.9) hue-rotate(5deg) !important;
    }
    
    /* AI Filter Description Styles */
    .ai-filter-section {
      margin-bottom: 15px;
      padding: 15px;
      background: linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(103, 58, 183, 0.05));
      border-radius: 12px;
      border: 2px solid rgba(156, 39, 176, 0.2);
    }
    
    .filter-description-container {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .filter-description-input {
      flex: 1;
      padding: 12px 15px;
      border: 2px solid rgba(156, 39, 176, 0.3);
      border-radius: 8px;
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
    }
    
    .filter-description-input:focus {
      outline: none;
      border-color: #9c27b0;
      box-shadow: 0 0 0 3px rgba(156, 39, 176, 0.1);
    }
    
    .filter-description-input::placeholder {
      color: #888;
      font-style: italic;
    }
    
    .btn-ai-filter {
      padding: 12px 20px;
      background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .btn-ai-filter:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
    }
    
    .btn-ai-filter:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .filter-interpretation {
      margin-top: 10px;
      padding: 10px;
      background: rgba(156, 39, 176, 0.1);
      border-radius: 6px;
      font-size: 0.85rem;
      color: #673ab7;
      font-weight: 500;
    }
    
    /* NEW: Text Overlay Styles */
    .text-panel {
      margin: 15px 0;
      padding: 15px;
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-radius: 12px;
      border: 2px solid #ff9800;
    }
    
    .text-input-section {
      margin-bottom: 15px;
    }
    
    .text-input-container {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .text-input {
      flex: 1;
      padding: 12px 15px;
      border: 2px solid #ff9800;
      border-radius: 8px;
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
    }
    
    .text-input:focus {
      outline: none;
      border-color: #f57c00;
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }
    
    .text-input::placeholder {
      color: #888;
      font-style: italic;
    }
    
    .btn-add-text {
      padding: 12px 20px;
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .btn-add-text:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }
    
    .text-instructions {
      font-size: 0.8rem;
      color: #e65100;
      margin-bottom: 10px;
      padding: 8px;
      background: rgba(255, 152, 0, 0.1);
      border-radius: 6px;
      line-height: 1.4;
    }
    
    .text-color-palette {
      display: flex;
      gap: 8px;
      margin: 10px 0;
      flex-wrap: wrap;
    }
    
    .text-color-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid #ddd;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .text-color-btn:hover {
      transform: scale(1.1);
      border-color: #ff9800;
    }
    
    .text-color-btn.selected {
      border-color: #ff9800;
      border-width: 4px;
      transform: scale(1.1);
      box-shadow: 0 3px 8px rgba(255, 152, 0, 0.3);
    }
    
    .text-size-container {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 10px 0;
    }
    
    .text-size-slider {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(90deg, #ffcc80 0%, #ff9800 100%);
      outline: none;
      cursor: pointer;
    }
    
    .text-size-slider::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ff9800;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    
    .text-size-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ff9800;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    
    .text-preview {
      font-family: Arial, sans-serif;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      padding: 8px;
      background: rgba(0,0,0,0.1);
      border-radius: 6px;
      text-align: center;
      margin: 8px 0;
      border: 1px dashed #ff9800;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* NEW: Font Selection Styles */
    .font-selection {
      margin: 10px 0;
    }
    
    .font-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    
    .font-btn {
      padding: 8px 12px;
      border: 2px solid #ff9800;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.9);
      color: #e65100;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .font-btn:hover {
      background: rgba(255, 152, 0, 0.1);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
    }
    
    .font-btn.selected {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      border-color: #f57c00;
      box-shadow: 0 3px 10px rgba(255, 152, 0, 0.3);
    }
    
    .font-btn[data-font="Arial"] {
      font-family: Arial, sans-serif;
    }
    
    .font-btn[data-font="Comic Sans MS"] {
      font-family: "Comic Sans MS", cursive, sans-serif;
    }
    
    .font-btn[data-font="Times New Roman"] {
      font-family: "Times New Roman", serif;
    }
    
    .font-btn[data-font="Courier New"] {
      font-family: "Courier New", monospace;
    }
    
    .font-btn[data-font="Georgia"] {
      font-family: Georgia, serif;
    }
    
    .font-btn[data-font="Verdana"] {
      font-family: Verdana, sans-serif;
    }
    .haiku-container {
      display: none;
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
      border: 2px solid #2196f3;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
      position: relative;
      overflow: hidden;
    }
    
    .haiku-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(33, 150, 243, 0.1), transparent);
      transform: rotate(45deg);
      animation: shimmer 3s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(100%) rotate(45deg); }
    }
    
    .haiku-title {
      font-size: 1.1rem;
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      z-index: 1;
    }
    
    .haiku-text {
      font-family: 'Georgia', serif;
      font-size: 1rem;
      line-height: 1.6;
      color: #333;
      white-space: pre-line;
      background: rgba(255, 255, 255, 0.8);
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      position: relative;
      z-index: 1;
      font-style: italic;
    }
    
    .haiku-actions {
      margin-top: 15px;
      position: relative;
      z-index: 1;
    }
    
    .btn-haiku {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    }
    
    .btn-haiku:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    }
  </style>
</head>
<body>
  <div class="photo-booth">
    <h1 class="title">🎭 AI Photo Booth 🤖🎨📸📝</h1>
    
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

      <!-- NEW: Text Overlay Panel -->
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
              placeholder="Try: 'write red AWESOME in comic sans on my head' or 'add 🔥 left of face'"
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
                placeholder="Describe the mood... (e.g., 'make this look sad', 'vintage vibes')"
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
        <button class="btn btn-success" id="upload-btn" style="display: none;">☁️ Save to Cloudflare R2</button>
        <button class="btn btn-ai" id="haiku-btn" style="display: none; background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%); color: white;">🤖 Generate AI Haiku</button>
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
    made w/ <span class="heart">♥</span> in sf🌉 w/ <a href="https://workers.cloudflare.com" target="_blank"> cloudflare workers</a>, <a href="https://developers.cloudflare.com/r2/"> cloudflare r2</a>, <a href="https://developers.cloudflare.com/kv/"> cloudflare kv</a>, <a href="https://developers.cloudflare.com/workers-ai/models/"> workers ai🤖</a>, <a href="https://mediapipe.dev" target="_blank"> mediapipe</a>. Code <a href="https://github.com/elizabethsiegle/cf-worker-photobooth-ai">here👩🏻‍💻</a>
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