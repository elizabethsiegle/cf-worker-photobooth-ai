// File: src/assets/styles.ts
// Enhanced CSS styles for the photo booth application with improved design

export function getPhotoBoothCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
  
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 20px 100px 20px; /* Extra bottom padding for footer */
        position: relative;
      }
  
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
  
      .photo-booth {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 
          0 32px 64px rgba(0, 0, 0, 0.12),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        max-width: 1400px;
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
  
      .title {
        text-align: center;
        margin-bottom: 40px;
        color: #2d3748;
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: none;
        letter-spacing: -0.02em;
      }
  
      .camera-container {
        position: relative;
        display: flex;
        justify-content: center;
        margin-bottom: 40px;
      }
  
      .video-wrapper {
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      }
  
      #video {
        width: 640px;
        height: 480px;
        object-fit: cover;
        display: block;
      }
  
      #overlay-canvas, #drawing-canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: auto;
      }
  
      #drawing-canvas {
        z-index: 10;
        pointer-events: none;
      }
  
      #drawing-canvas.drawing-mode {
        pointer-events: auto;
      }
  
      .controls {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 40px;
        align-items: start;
      }
  
      .accessories-panel, .drawing-panel {
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 24px;
        max-height: 520px;
        overflow-y: auto;
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.08),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
  
      .panel-title {
        font-weight: 700;
        margin-bottom: 24px;
        color: #2d3748;
        font-size: 1.4rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
  
      .accessory-category, .drawing-section {
        margin-bottom: 28px;
      }
  
      .category-title {
        font-weight: 600;
        margin-bottom: 16px;
        color: #4a5568;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
  
      .accessory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
        gap: 12px;
      }
  
      .accessory-btn {
        width: 64px;
        height: 64px;
        border: 2px solid transparent;
        border-radius: 16px;
        background: linear-gradient(135deg, #ffffff, #f7fafc);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.2rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.08),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
      }
  
      .accessory-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        opacity: 0;
        transition: opacity 0.3s ease;
      }
  
      .accessory-btn:hover {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 
          0 12px 24px rgba(0, 0, 0, 0.12),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .accessory-btn:hover::before {
        opacity: 1;
      }
  
      .accessory-btn.selected {
        border-color: #667eea;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        transform: scale(1.1);
        box-shadow: 
          0 8px 24px rgba(102, 126, 234, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .color-palette {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-bottom: 20px;
      }
  
      .color-btn {
        width: 44px;
        height: 44px;
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.1),
          inset 0 1px 2px rgba(255, 255, 255, 0.2);
      }
  
      .color-btn.selected {
        border-color: #2d3748;
        transform: scale(1.15);
        box-shadow: 
          0 6px 16px rgba(0, 0, 0, 0.15),
          0 0 0 2px #2d3748;
      }
  
      .brush-size {
        margin-bottom: 20px;
      }
  
      .brush-size input {
        width: 100%;
        margin-bottom: 12px;
        accent-color: #667eea;
      }
  
      .brush-preview {
        width: 64px;
        height: 64px;
        border: 2px dashed rgba(102, 126, 234, 0.3);
        border-radius: 50%;
        margin: 0 auto;
        position: relative;
        background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.8));
      }
  
      .brush-preview::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: var(--brush-color, #000);
        width: var(--brush-size, 10px);
        height: var(--brush-size, 10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
  
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 280px;
      }
  
      .btn {
        padding: 16px 28px;
        border: none;
        border-radius: 16px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
      }
  
      .btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
        opacity: 0;
        transition: opacity 0.3s ease;
      }
  
      .btn:hover::before {
        opacity: 1;
      }
  
      .btn-primary {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        box-shadow: 
          0 8px 24px rgba(102, 126, 234, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
  
      .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 
          0 12px 32px rgba(102, 126, 234, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .btn-secondary {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        color: white;
        box-shadow: 
          0 8px 24px rgba(245, 87, 108, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
  
      .btn-secondary:hover {
        transform: translateY(-3px);
        box-shadow: 
          0 12px 32px rgba(245, 87, 108, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .btn-success {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        color: white;
        box-shadow: 
          0 8px 24px rgba(79, 172, 254, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
  
      .btn-success:hover {
        transform: translateY(-3px);
        box-shadow: 
          0 12px 32px rgba(79, 172, 254, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .btn-mode {
        background: linear-gradient(135deg, #17a2b8, #138496);
        color: white;
        box-shadow: 
          0 8px 24px rgba(23, 162, 184, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
  
      .btn-mode:hover {
        transform: translateY(-3px);
        box-shadow: 
          0 12px 32px rgba(23, 162, 184, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .btn-mode.active {
        background: linear-gradient(135deg, #28a745, #20c997);
        box-shadow: 
          0 8px 24px rgba(40, 167, 69, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
  
      .btn-warning {
        background: linear-gradient(135deg, #ff9a56, #ff6b6b);
        color: white;
        box-shadow: 
          0 8px 24px rgba(255, 154, 86, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }
  
      .btn-warning:hover {
        transform: translateY(-3px);
        box-shadow: 
          0 12px 32px rgba(255, 154, 86, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .checkbox-section {
        margin-bottom: 24px;
        padding: 20px;
        background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.8));
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
  
      .checkbox-section label {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        color: #4a5568;
        cursor: pointer;
        font-size: 0.95rem;
      }
  
      .checkbox-section input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #667eea;
      }
  
      .status {
        text-align: center;
        margin-bottom: 32px;
        font-weight: 600;
        color: #4a5568;
        font-size: 1.1rem;
        padding: 16px 24px;
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
  
      .status.ready {
        color: #38a169;
        background: linear-gradient(135deg, rgba(72, 187, 120, 0.1), rgba(56, 161, 105, 0.1));
      }
  
      .status.loading {
        color: #ed8936;
        background: linear-gradient(135deg, rgba(237, 137, 54, 0.1), rgba(251, 211, 141, 0.1));
      }
  
      .status.error {
        color: #e53e3e;
        background: linear-gradient(135deg, rgba(229, 62, 62, 0.1), rgba(254, 178, 178, 0.1));
      }
  
      .captured-photo-container {
        display: none;
        margin: 40px 0;
        text-align: center;
      }
  
      .captured-photo-container.show {
        display: block;
      }
  
      #captured-photo {
        max-width: 100%;
        max-height: 600px;
        border-radius: 20px;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      }
  
      .share-section {
        margin-top: 32px;
        padding: 28px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
        backdrop-filter: blur(10px);
        border-radius: 20px;
        text-align: center;
        display: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }
  
      .share-section h3 {
        color: #2d3748;
        margin-bottom: 16px;
        font-weight: 700;
      }
  
      .share-url {
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
        backdrop-filter: blur(10px);
        padding: 16px;
        border-radius: 12px;
        margin: 16px 0;
        word-break: break-all;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
  
      .gallery-section {
        margin-top: 40px;
        padding: 32px;
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
        backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }
  
      .gallery-section h3 {
        color: #2d3748;
        margin-bottom: 24px;
        font-weight: 700;
        font-size: 1.3rem;
      }
  
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
  
      .gallery-item {
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 
          0 8px 20px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
  
      .gallery-item:hover {
        transform: translateY(-8px) scale(1.05);
        box-shadow: 
          0 16px 32px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.2);
      }
  
      .gallery-item img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
      }
  
      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, rgba(45, 55, 72, 0.98), rgba(26, 32, 44, 0.98));
        backdrop-filter: blur(20px);
        color: white;
        text-align: center;
        padding: 20px 20px;
        font-size: 0.95rem;
        font-weight: 500;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
  
      .footer a {
        color: #667eea;
        text-decoration: none;
        transition: color 0.3s ease;
        font-weight: 600;
      }
  
      .footer a:hover {
        color: #764ba2;
        text-decoration: underline;
      }
  
      .heart {
        color: #e53e3e;
        animation: heartbeat 2s ease-in-out infinite;
        display: inline-block;
        font-size: 1.1em;
        margin: 0 2px;
      }
  
      @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
  
      @media (max-width: 1200px) {
        .controls {
          grid-template-columns: 1fr;
          gap: 24px;
        }
        
        .accessories-panel, .drawing-panel {
          max-height: 320px;
        }
        
        .action-buttons {
          min-width: auto;
        }
      }
  
      @media (max-width: 768px) {
        body {
          padding: 15px 15px 100px 15px;
        }
        
        .photo-booth {
          padding: 24px;
        }
        
        #video {
          width: 100%;
          max-width: 480px;
          height: auto;
        }
        
        .title {
          font-size: 2.2rem;
        }
        
        .controls {
          gap: 20px;
        }
        
        .footer {
          font-size: 0.8rem;
          padding: 12px 15px;
        }
      }
  
      @media (max-width: 480px) {
        .title {
          font-size: 1.8rem;
        }
        
        .accessory-btn {
          width: 56px;
          height: 56px;
          font-size: 1.8rem;
        }
        
        .color-btn {
          width: 36px;
          height: 36px;
        }
      }
    `;
  }
