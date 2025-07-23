// File: src/assets/styles.ts
// CSS styles for the photo booth application

export function getPhotoBoothCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .photo-booth {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .status {
      text-align: center;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .status.ready {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status.loading {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .camera-container {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;
    }

    .video-wrapper {
      position: relative;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    #video {
      display: block;
      width: 640px;
      height: 480px;
      object-fit: cover;
    }

    #overlay-canvas, #drawing-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    #drawing-canvas.drawing-mode {
      pointer-events: auto;
      cursor: crosshair;
    }

    #overlay-canvas {
      pointer-events: auto;
    }

    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }

    .accessories-panel, .drawing-panel {
      background: #f8f9fa;
      border-radius: 15px;
      padding: 20px;
      border: 1px solid #dee2e6;
    }

    .panel-title {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      color: #495057;
    }

    .category-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 15px 0 10px 0;
      color: #6c757d;
    }

    .accessory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
      gap: 8px;
      margin-bottom: 15px;
    }

    .accessory-btn {
      padding: 10px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      background: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accessory-btn:hover {
      border-color: #007bff;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,123,255,0.3);
    }

    .accessory-btn.selected {
      border-color: #007bff;
      background: #e3f2fd;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,123,255,0.3);
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      text-decoration: none;
      display: block;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .btn-primary {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-warning {
      background: #ffc107;
      color: #212529;
    }

    .btn-mode {
      background: #17a2b8;
      color: white;
    }

    .btn-mode.active {
      background: #28a745;
      animation: pulse 2s infinite;
    }

    .btn-trash-toggle {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      position: relative;
      overflow: hidden;
    }

    .btn-trash-toggle.active {
      background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
      animation: pulse 2s infinite;
    }

    .btn-trash-toggle::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.5s ease;
    }

    .btn-trash-toggle:hover::before {
      left: 100%;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
      100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
    }

    .checkbox-section {
      margin-bottom: 20px;
    }

    .checkbox-section label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #495057;
      cursor: pointer;
    }

    .checkbox-section input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

    .color-palette {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 15px;
    }

    .color-btn {
      width: 40px;
      height: 40px;
      border: 3px solid #fff;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .color-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .color-btn.selected {
      border-color: #007bff;
      transform: scale(1.15);
      box-shadow: 0 0 0 3px rgba(0,123,255,0.3);
    }

    .brush-size {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .brush-size input[type="range"] {
      flex: 1;
    }

    .brush-preview {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--brush-color, #000);
      width: var(--brush-size, 10px);
      height: var(--brush-size, 10px);
      min-width: 10px;
      min-height: 10px;
      max-width: 50px;
      max-height: 50px;
      transition: all 0.3s ease;
    }

    .captured-photo-container {
      display: none;
      text-align: center;
      margin-bottom: 30px;
    }

    .captured-photo-container.show {
      display: block;
    }

    #captured-photo {
      max-width: 100%;
      height: auto;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .share-section {
      display: none;
      text-align: center;
      background: #e3f2fd;
      padding: 20px;
      border-radius: 15px;
      margin-bottom: 30px;
      border: 2px solid #2196f3;
    }

    .share-url {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      word-break: break-all;
      font-family: monospace;
      border: 1px solid #dee2e6;
    }

    .gallery-section {
      text-align: center;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 15px;
      margin-top: 20px;
    }

    .gallery-item {
      aspect-ratio: 4/3;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .gallery-item:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* NEW: Text Edit Panel Styles */
    .text-edit-panel {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      z-index: 1000;
      min-width: 400px;
      max-width: 500px;
      border: 3px solid #ff9800;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .text-edit-panel::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: -1;
      backdrop-filter: blur(5px);
    }

    .edit-panel-header {
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: #ff9800;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ff9800;
    }

    .edit-form-group {
      margin-bottom: 20px;
    }

    .edit-form-group label {
      display: block;
      font-weight: 600;
      color: #495057;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .edit-text-input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
    }

    .edit-text-input:focus {
      outline: none;
      border-color: #ff9800;
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }

    .edit-color-input {
      width: 60px;
      height: 40px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .edit-color-input:hover {
      border-color: #ff9800;
      transform: scale(1.05);
    }

    .edit-font-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 8px;
    }

    .edit-font-btn {
      padding: 8px 12px;
      border: 2px solid #dee2e6;
      border-radius: 6px;
      background: white;
      color: #495057;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }

    .edit-font-btn:hover {
      border-color: #ff9800;
      background: rgba(255, 152, 0, 0.1);
      transform: translateY(-1px);
    }

    .edit-font-btn.selected {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
      border-color: #f57c00;
      box-shadow: 0 3px 10px rgba(255, 152, 0, 0.3);
    }

    .edit-font-btn[data-font="Arial"] {
      font-family: Arial, sans-serif;
    }

    .edit-font-btn[data-font="Comic Sans MS"] {
      font-family: "Comic Sans MS", cursive, sans-serif;
    }

    .edit-font-btn[data-font="Times New Roman"] {
      font-family: "Times New Roman", serif;
    }

    .edit-font-btn[data-font="Courier New"] {
      font-family: "Courier New", monospace;
    }

    .edit-font-btn[data-font="Georgia"] {
      font-family: Georgia, serif;
    }

    .edit-font-btn[data-font="Verdana"] {
      font-family: Verdana, sans-serif;
    }

    .edit-actions {
      display: flex;
      gap: 15px;
      margin-top: 25px;
      justify-content: center;
    }

    .btn-edit {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 120px;
    }

    .btn-edit:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .btn-edit-apply {
      background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
      color: white;
    }

    .btn-edit-cancel {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #6c757d;
      font-size: 0.9rem;
      background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
      backdrop-filter: blur(10px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .footer a {
      color: #007bff;
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    .heart {
      color: #e74c3c;
      animation: heartbeat 1.5s ease-in-out infinite;
    }

    @keyframes heartbeat {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .controls {
        grid-template-columns: 1fr 1fr;
      }
      
      .gallery-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media (max-width: 768px) {
      .photo-booth {
        padding: 20px;
      }

      .title {
        font-size: 2rem;
      }

      #video {
        width: 100%;
        max-width: 480px;
        height: auto;
      }

      .controls {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .accessory-grid {
        grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
      }

      .color-palette {
        grid-template-columns: repeat(5, 1fr);
      }

      .color-btn {
        width: 35px;
        height: 35px;
      }
      
      .gallery-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .text-edit-panel {
        min-width: 90vw;
        max-width: 90vw;
        padding: 20px;
      }

      .edit-font-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .photo-booth {
        padding: 15px;
      }

      .title {
        font-size: 1.5rem;
      }

      .accessory-btn {
        font-size: 1.2rem;
        padding: 8px;
      }

      .btn {
        font-size: 0.9rem;
        padding: 10px 16px;
      }
      
      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .text-edit-panel {
        min-width: 95vw;
        max-width: 95vw;
        padding: 15px;
      }

      .edit-actions {
        flex-direction: column;
      }
    }
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

    /* NEW: Capture Confirmation Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: none;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .capture-confirmation-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
      padding: 30px 40px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
      width: 90%;
      z-index: 10001;
      display: none;
      opacity: 0;
      transition: all 0.3s ease;
    }

    .capture-confirmation-modal h2 {
      margin: 0 0 15px 0;
      font-size: 2rem;
      font-weight: bold;
    }

    .capture-confirmation-modal p {
      margin: 0 0 20px 0;
      font-size: 1.1rem;
      line-height: 1.4;
    }

    .modal-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-modal {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-modal-primary {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
    }

    .btn-modal-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    }

    .btn-modal-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn-modal-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .capture-success-icon {
      font-size: 4rem;
      margin-bottom: 15px;
      animation: bounceIn 0.6s ease;
    }

    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); }
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

    /* Text Edit Panel Styles */
    .text-edit-panel {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #ff9800;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      max-width: 400px;
      width: 90%;
    }

    .edit-panel-header {
      font-size: 1.2rem;
      font-weight: bold;
      color: #ff9800;
      margin-bottom: 20px;
      text-align: center;
    }

    .edit-form-group {
      margin-bottom: 15px;
    }

    .edit-form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #333;
    }

    .edit-text-input {
      width: 100%;
      padding: 10px;
      border: 2px solid #ff9800;
      border-radius: 6px;
      font-size: 1rem;
    }

    .edit-color-input {
      width: 100%;
      height: 40px;
      border: 2px solid #ff9800;
      border-radius: 6px;
      cursor: pointer;
    }

    .edit-font-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .edit-font-btn {
      padding: 8px 12px;
      border: 2px solid #ff9800;
      border-radius: 6px;
      background: white;
      color: #ff9800;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }

    .edit-font-btn:hover {
      background: rgba(255, 152, 0, 0.1);
    }

    .edit-font-btn.selected {
      background: #ff9800;
      color: white;
    }

    .edit-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 20px;
    }

    .btn-edit {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-edit-apply {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
    }

    .btn-edit-cancel {
      background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
      color: white;
    }

    .btn-edit:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  `;
}