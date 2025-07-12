// Cloudflare Worker for Face Detection Photo Booth with Drawing Canvas
// Requires: R2 bucket named 'photobooth-photos' and KV namespace 'PHOTOBOOTH_KV'

// Helper functions
function generateId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  async function updateAnalytics(env: any, action: string): Promise<void> {
	try {
	  const analytics = await env.PHOTOBOOTH_KV.get('analytics');
	  const data = analytics ? JSON.parse(analytics) : {
		totalUploads: 0,
		totalShares: 0,
		totalViews: 0
	  };
  
	  switch (action) {
		case 'upload':
		  data.totalUploads++;
		  break;
		case 'share':
		  data.totalShares++;
		  break;
		case 'view':
		  data.totalViews++;
		  break;
	  }
  
	  data.lastUpdated = new Date().toISOString();
	  await env.PHOTOBOOTH_KV.put('analytics', JSON.stringify(data));
	} catch (error) {
	  console.error('Analytics update error:', error);
	}
  }
  
  export default {
	  async fetch(request: any, env: any, ctx: any) {
		const url = new URL(request.url);
		const { pathname, searchParams } = url;
	
		// CORS headers for all responses
		const corsHeaders = {
		  'Access-Control-Allow-Origin': '*',
		  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};
	
		if (request.method === 'OPTIONS') {
		  return new Response(null, { headers: corsHeaders });
		}
	
		try {
		  // Route handling
		  if (pathname === '/') {
			return servePhotoBoothApp(corsHeaders);
		  } else if (pathname === '/api/upload' && request.method === 'POST') {
			return handlePhotoUpload(request, env, corsHeaders);
		  } else if (pathname === '/api/share' && request.method === 'POST') {
			return handleCreateShare(request, env, corsHeaders);
		  } else if (pathname.startsWith('/api/photo/')) {
			return handleGetPhoto(pathname, env, corsHeaders);
		  } else if (pathname === '/api/gallery') {
			return handleGetGallery(searchParams, env, corsHeaders);
		  } else if (pathname === '/api/analytics') {
			return handleAnalytics(env, corsHeaders);
		  } else if (pathname.startsWith('/share/')) {
			return handleSharePage(pathname, env, corsHeaders, request);
		  } else {
			return new Response('Not Found', { status: 404, headers: corsHeaders });
		  }
		} catch (error) {
		  console.error('Worker error:', error);
		  return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), { 
			status: 500, 
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
	  }
	};
	
	// Serve the main photo booth application
	function servePhotoBoothApp(corsHeaders: any) {
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
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}
	
			body {
				font-family: 'Arial', sans-serif;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				min-height: 100vh;
				display: flex;
				justify-content: center;
				align-items: center;
				padding: 20px;
			}
	
			.photo-booth {
				background: rgba(255, 255, 255, 0.95);
				border-radius: 20px;
				padding: 30px;
				box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
				max-width: 1400px;
				width: 100%;
			}
	
			.title {
				text-align: center;
				margin-bottom: 30px;
				color: #333;
				font-size: 2.5rem;
				font-weight: bold;
				text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
			}
	
			.camera-container {
				position: relative;
				display: flex;
				justify-content: center;
				margin-bottom: 30px;
			}
	
			.video-wrapper {
				position: relative;
				border-radius: 15px;
				overflow: hidden;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
			}
	
			#video {
				width: 640px;
				height: 480px;
				object-fit: cover;
			}
	
			#overlay-canvas, #drawing-canvas {
				position: absolute;
				top: 0;
				left: 0;
				pointer-events: auto;
			}
	
			#drawing-canvas {
				z-index: 10;
			}
	
			.controls {
				display: grid;
				grid-template-columns: 1fr auto 1fr;
				gap: 30px;
				align-items: start;
			}
	
			.accessories-panel {
				background: rgba(240, 240, 240, 0.8);
				border-radius: 15px;
				padding: 20px;
				max-height: 500px;
				overflow-y: auto;
			}
	
			.drawing-panel {
				background: rgba(240, 240, 240, 0.8);
				border-radius: 15px;
				padding: 20px;
				max-height: 500px;
				overflow-y: auto;
			}
	
			.panel-title {
				font-weight: bold;
				margin-bottom: 20px;
				color: #333;
				font-size: 1.3rem;
				text-align: center;
				text-transform: uppercase;
				letter-spacing: 1px;
			}
	
			.accessory-category, .drawing-section {
				margin-bottom: 25px;
			}
	
			.category-title {
				font-weight: bold;
				margin-bottom: 15px;
				color: #555;
				font-size: 1.1rem;
				text-transform: uppercase;
				letter-spacing: 1px;
			}
	
			.accessory-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
				gap: 10px;
			}
	
			.accessory-btn {
				width: 60px;
				height: 60px;
				border: 3px solid transparent;
				border-radius: 12px;
				background: white;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 2rem;
				transition: all 0.3s ease;
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
			}
	
			.accessory-btn:hover {
				transform: translateY(-2px);
				box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
			}
	
			.accessory-btn.selected {
				border-color: #667eea;
				background: linear-gradient(135deg, #667eea, #764ba2);
				color: white;
				transform: scale(1.1);
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
				border: 3px solid #ddd;
				border-radius: 50%;
				cursor: pointer;
				transition: all 0.2s ease;
			}
	
			.color-btn.selected {
				border-color: #333;
				transform: scale(1.1);
			}
	
			.brush-size {
				margin-bottom: 15px;
			}
	
			.brush-size input {
				width: 100%;
				margin-bottom: 10px;
			}
	
			.brush-preview {
				width: 60px;
				height: 60px;
				border: 2px dashed #ccc;
				border-radius: 50%;
				margin: 0 auto;
				position: relative;
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
			}
	
			.action-buttons {
				display: flex;
				flex-direction: column;
				gap: 15px;
			}
	
			.btn {
				padding: 15px 25px;
				border: none;
				border-radius: 12px;
				font-size: 1.1rem;
				font-weight: bold;
				cursor: pointer;
				transition: all 0.3s ease;
				text-transform: uppercase;
				letter-spacing: 1px;
			}
	
			.btn-primary {
				background: linear-gradient(135deg, #667eea, #764ba2);
				color: white;
				box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
			}
	
			.btn-primary:hover {
				transform: translateY(-3px);
				box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
			}
	
			.btn-secondary {
				background: linear-gradient(135deg, #f093fb, #f5576c);
				color: white;
				box-shadow: 0 8px 16px rgba(245, 87, 108, 0.3);
			}
	
			.btn-secondary:hover {
				transform: translateY(-3px);
				box-shadow: 0 12px 24px rgba(245, 87, 108, 0.4);
			}
	
			.btn-success {
				background: linear-gradient(135deg, #4facfe, #00f2fe);
				color: white;
				box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3);
			}
	
			.btn-success:hover {
				transform: translateY(-3px);
				box-shadow: 0 12px 24px rgba(79, 172, 254, 0.4);
			}
	
			.btn-warning {
				background: linear-gradient(135deg, #ff9a56, #ff6b6b);
				color: white;
				box-shadow: 0 8px 16px rgba(255, 154, 86, 0.3);
			}
	
			.btn-warning:hover {
				transform: translateY(-3px);
				box-shadow: 0 12px 24px rgba(255, 154, 86, 0.4);
			}
	
			.checkbox-section {
				margin-bottom: 20px;
				padding: 15px;
				background: rgba(255, 255, 255, 0.5);
				border-radius: 10px;
			}
	
			.checkbox-section label {
				display: flex;
				align-items: center;
				gap: 10px;
				font-weight: bold;
				color: #555;
				cursor: pointer;
			}
	
			.checkbox-section input[type="checkbox"] {
				width: 20px;
				height: 20px;
				cursor: pointer;
			}
	
			.status {
				text-align: center;
				margin-bottom: 20px;
				font-weight: bold;
				color: #666;
			}
	
			.status.ready {
				color: #4CAF50;
			}
	
			.status.loading {
				color: #FF9800;
			}
	
			.status.error {
				color: #f44336;
			}
	
			#captured-photo {
				max-width: 100%;
				border-radius: 15px;
				margin-top: 20px;
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
			}
	
			.share-section {
				margin-top: 20px;
				padding: 20px;
				background: rgba(240, 240, 240, 0.5);
				border-radius: 15px;
				text-align: center;
				display: none;
			}
	
			.share-url {
				background: white;
				padding: 10px;
				border-radius: 8px;
				margin: 10px 0;
				word-break: break-all;
				font-family: monospace;
			}
	
			.gallery-section {
				margin-top: 30px;
				padding: 20px;
				background: rgba(240, 240, 240, 0.5);
				border-radius: 15px;
			}
	
			.gallery-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
				gap: 15px;
				margin-top: 15px;
			}
	
			.gallery-item {
				border-radius: 10px;
				overflow: hidden;
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
				cursor: pointer;
				transition: transform 0.3s ease;
			}
	
			.gallery-item:hover {
				transform: scale(1.05);
			}
	
			.gallery-item img {
				width: 100%;
				height: 120px;
				object-fit: cover;
			}
	
			.debug-info {
				margin-top: 20px;
				padding: 15px;
				background: rgba(0, 0, 0, 0.1);
				border-radius: 10px;
				font-family: monospace;
				font-size: 12px;
				max-height: 200px;
				overflow-y: auto;
			}
	
			@media (max-width: 1200px) {
				.controls {
					grid-template-columns: 1fr;
					gap: 20px;
				}
				
				.accessories-panel, .drawing-panel {
					max-height: 300px;
				}
			}
	
			@media (max-width: 768px) {
				#video {
					width: 100%;
					max-width: 480px;
					height: auto;
				}
				
				.title {
					font-size: 2rem;
				}
			}
		</style>
	</head>
	<body>
		<div class="photo-booth">
			<h1 class="title">🎭 Cloud Photo Booth 🎨📸</h1>
			
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
					<button class="btn btn-secondary" id="clear-accessories-btn">🗑️ Clear Accessories</button>
					<button class="btn btn-warning" id="clear-drawing-btn">🎨 Clear Drawing</button>
					<button class="btn btn-secondary" id="download-btn" style="display: none;">💾 Download</button>
					<button class="btn btn-success" id="upload-btn" style="display: none;">☁️ Save to Cloudflare R2</button>
					<button class="btn btn-success" id="share-btn" style="display: none;">🔗 Share Photo</button>
					<button class="btn btn-secondary" id="gallery-btn">🖼️ View Gallery</button>
				</div>
	
				<div class="drawing-panel">
					<div class="panel-title">🎨 Drawing Tools</div>
					
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
	
			<canvas id="captured-photo" style="display: none;"></canvas>
			
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
	
		<script>
			class CloudPhotoBooth {
				constructor() {
					this.video = document.getElementById('video');
					this.overlayCanvas = document.getElementById('overlay-canvas');
					this.overlayCtx = this.overlayCanvas.getContext('2d');
					this.drawingCanvas = document.getElementById('drawing-canvas');
					this.drawingCtx = this.drawingCanvas.getContext('2d');
					this.capturedCanvas = document.getElementById('captured-photo');
					this.capturedCtx = this.capturedCanvas.getContext('2d');
					this.status = document.getElementById('status');
					this.debugInfo = document.getElementById('debug-info');
					
					this.faceDetector = null;
					this.selectedAccessories = {
						hat: null,
						glasses: null,
						face: null,
						extra: null
					};
					this.detectedFaces = [];
					this.isDetecting = false;
					this.lastPhotoId = null;
					this.showFaceBoxes = true;
  
					// Per-face, per-accessory state
					this.accessoryStates = {};
					this.selectedOverlay = null;
					this.dragOffset = { x: 0, y: 0 };
					this.isDragging = false;
					this.resizeHandleSize = 28;
					this.resizeMode = false;
					this.resizeStart = null;
					this.dragStart = null;
  
					// Drawing state
					this.isDrawing = false;
					this.drawingColor = '#000000';
					this.brushSize = 10;
					this.lastDrawPoint = null;
  
					this.init();
				}
  
				log(message) {
					console.log(message);
					if (this.debugInfo) {
						this.debugInfo.innerHTML += new Date().toLocaleTimeString() + ': ' + message + '<br>';
						this.debugInfo.scrollTop = this.debugInfo.scrollHeight;
					}
				}
	
				async init() {
					try {
						this.log('Initializing photo booth...');
						await this.setupCamera();
						await this.setupFaceDetection();
						this.setupEventListeners();
						this.setupDrawing();
						this.startDetection();
						this.loadGallery();
						this.updateStatus('Ready! Select accessories, draw, and smile! 😊', 'ready');
						this.log('Initialization complete!');
					} catch (error) {
						console.error('Initialization error:', error);
						this.log('Initialization error: ' + error.message);
						this.updateStatus('Error: ' + error.message, 'error');
					}
				}
	
				async setupCamera() {
					try {
						this.log('Setting up camera...');
						const stream = await navigator.mediaDevices.getUserMedia({
							video: { 
								width: 640, 
								height: 480,
								facingMode: 'user'
							}
						});
						this.video.srcObject = stream;
						
						return new Promise((resolve) => {
							this.video.onloadedmetadata = () => {
								this.overlayCanvas.width = this.video.videoWidth;
								this.overlayCanvas.height = this.video.videoHeight;
								this.drawingCanvas.width = this.video.videoWidth;
								this.drawingCanvas.height = this.video.videoHeight;
								this.log('Camera setup complete');
								resolve();
							};
						});
					} catch (error) {
						throw new Error('Camera access denied or not available');
					}
				}
	
				async setupFaceDetection() {
					try {
						this.log('Setting up face detection...');
						const filesetResolver = await window.mpVision.FilesetResolver.forVisionTasks(
						  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
						);
						this.faceDetector = await window.mpVision.FaceDetector.createFromOptions(
						  filesetResolver,
						  {
							  baseOptions: {
								  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
							  },
							  runningMode: 'VIDEO'
						  }
						);
						this.log('Face detection setup complete');
					} catch (error) {
						console.error('FaceDetector load error:', error);
						throw new Error('Failed to load face detection model: ' + (error && error.message ? error.message : error));
					}
				}
	
				setupDrawing() {
					this.log('Setting up drawing...');
					this.drawingCtx.lineCap = 'round';
					this.drawingCtx.lineJoin = 'round';
					this.updateBrushPreview();
				}
	
				setupEventListeners() {
					this.log('Setting up event listeners...');
					
					// Face detection checkbox
					document.getElementById('show-face-boxes').addEventListener('change', (e) => {
						this.showFaceBoxes = e.target.checked;
						this.log('Face boxes toggle: ' + this.showFaceBoxes);
					});
					
					// Accessory selection
					document.querySelectorAll('.accessory-btn').forEach(btn => {
						btn.addEventListener('click', (e) => {
							const type = e.target.dataset.type;
							const item = e.target.dataset.item;
							
							document.querySelectorAll(\`[data-type="\${type}"]\`).forEach(b => 
								b.classList.remove('selected')
							);
							
							if (this.selectedAccessories[type] === item) {
								this.selectedAccessories[type] = null;
							} else {
								this.selectedAccessories[type] = item;
								e.target.classList.add('selected');
							}
							this.log('Selected accessory: ' + type + ' = ' + item);
						});
					});
	
					// Color selection
					document.querySelectorAll('.color-btn').forEach(btn => {
						btn.addEventListener('click', (e) => {
							document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
							e.target.classList.add('selected');
							this.drawingColor = e.target.dataset.color;
							this.updateBrushPreview();
							this.log('Selected color: ' + this.drawingColor);
						});
					});
	
					// Brush size
					document.getElementById('brush-size').addEventListener('input', (e) => {
						this.brushSize = parseInt(e.target.value);
						this.updateBrushPreview();
					});
	
					// Action buttons
					document.getElementById('capture-btn').addEventListener('click', () => {
						this.log('Capture button clicked');
						this.capturePhoto();
					});
					
					document.getElementById('clear-accessories-btn').addEventListener('click', () => {
						this.log('Clear accessories button clicked');
						this.clearAccessories();
					});
					
					document.getElementById('clear-drawing-btn').addEventListener('click', () => {
						this.log('Clear drawing button clicked');
						this.clearDrawing();
					});
					
					document.getElementById('download-btn').addEventListener('click', () => {
						this.log('Download button clicked');
						this.downloadPhoto();
					});
					
					document.getElementById('upload-btn').addEventListener('click', () => {
						this.log('Upload button clicked');
						this.uploadPhoto();
					});
					
					document.getElementById('share-btn').addEventListener('click', () => {
						this.log('Share button clicked');
						this.sharePhoto();
					});
					
					document.getElementById('gallery-btn').addEventListener('click', () => {
						this.log('Gallery button clicked');
						this.loadGallery();
					});
  
					document.getElementById('debug-btn').addEventListener('click', () => {
						const debugDiv = document.getElementById('debug-info');
						debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
					});
  
					// Mouse/touch events for accessories
					this.overlayCanvas.addEventListener('mousedown', this.onOverlayPointerDown.bind(this));
					this.overlayCanvas.addEventListener('mousemove', this.onOverlayPointerMove.bind(this));
					this.overlayCanvas.addEventListener('mouseup', this.onOverlayPointerUp.bind(this));
					this.overlayCanvas.addEventListener('mouseleave', this.onOverlayPointerUp.bind(this));
					this.overlayCanvas.addEventListener('wheel', this.onWheel.bind(this));
					this.overlayCanvas.addEventListener('touchstart', this.onOverlayPointerDown.bind(this));
					this.overlayCanvas.addEventListener('touchmove', this.onOverlayPointerMove.bind(this));
					this.overlayCanvas.addEventListener('touchend', this.onOverlayPointerUp.bind(this));
					this.overlayCanvas.addEventListener('mousemove', this.onCursorFeedback.bind(this));
					
					// Drawing events
					this.drawingCanvas.addEventListener('mousedown', this.onDrawingStart.bind(this));
					this.drawingCanvas.addEventListener('mousemove', this.onDrawingMove.bind(this));
					this.drawingCanvas.addEventListener('mouseup', this.onDrawingEnd.bind(this));
					this.drawingCanvas.addEventListener('mouseleave', this.onDrawingEnd.bind(this));
					this.drawingCanvas.addEventListener('touchstart', this.onDrawingStart.bind(this));
					this.drawingCanvas.addEventListener('touchmove', this.onDrawingMove.bind(this));
					this.drawingCanvas.addEventListener('touchend', this.onDrawingEnd.bind(this));
					
					this.log('Event listeners setup complete');
				}
	
				updateBrushPreview() {
					const preview = document.getElementById('brush-preview');
					preview.style.setProperty('--brush-color', this.drawingColor);
					preview.style.setProperty('--brush-size', this.brushSize + 'px');
				}
	
				startDetection() {
					const detectFaces = () => {
						if (this.video.readyState >= 2 && !this.isDetecting) {
							this.isDetecting = true;
							
							try {
								const detections = this.faceDetector.detectForVideo(this.video, performance.now());
								this.detectedFaces = detections.detections;
								this.drawOverlays();
							} catch (error) {
								console.error('Detection error:', error);
							}
							
							this.isDetecting = false;
						}
						requestAnimationFrame(detectFaces);
					};
					detectFaces();
				}
	
				getLandmarkPosition(landmarks, type, bbox) {
					if (!landmarks || !Array.isArray(landmarks)) return { x: 0, y: 0, x2: 0, y2: 0 };
					
					switch (type) {
						case 'hat': {
							if (landmarks[0] && landmarks[1] && bbox) {
								const midX = (landmarks[0].x + landmarks[1].x) / 2;
								const midY = (landmarks[0].y + landmarks[1].y) / 2;
								return {
								  x: midX,
								  y: midY - bbox.height / this.overlayCanvas.height * 0.7,
								  x2: midX,
								  y2: midY - bbox.height / this.overlayCanvas.height * 0.7
								};
							}
							break;
						}
						case 'glasses': {
							if (landmarks[0] && landmarks[1]) {
								return {
								  x: landmarks[0].x,
								  y: landmarks[0].y,
								  x2: landmarks[1].x,
								  y2: landmarks[1].y
								};
							}
							break;
						}
						case 'face': {
							if (landmarks[2]) {
								return { x: landmarks[2].x, y: landmarks[2].y, x2: landmarks[2].x, y2: landmarks[2].y };
							}
							break;
						}
						case 'extra': {
							if (landmarks[6]) {
								return { x: landmarks[6].x + 0.15, y: landmarks[6].y, x2: landmarks[6].x + 0.15, y2: landmarks[6].y };
							} else if (bbox) {
								return {
								  x: (bbox.originX + bbox.width + 0.12 * this.overlayCanvas.width) / this.overlayCanvas.width,
								  y: (bbox.originY + bbox.height / 2) / this.overlayCanvas.height,
								  x2: (bbox.originX + bbox.width + 0.12 * this.overlayCanvas.width) / this.overlayCanvas.width,
								  y2: (bbox.originY + bbox.height / 2) / this.overlayCanvas.height
								};
							}
							break;
						}
					}
					
					if (landmarks[0] && landmarks[1]) {
						return {
							x: (landmarks[0].x + landmarks[1].x) / 2,
							y: (landmarks[0].y + landmarks[1].y) / 2,
							x2: (landmarks[0].x + landmarks[1].x) / 2,
							y2: (landmarks[0].y + landmarks[1].y) / 2
						};
					}
					return { x: 0, y: 0, x2: 0, y2: 0 };
				}
  
				drawOverlays() {
					this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
					this.ensureAccessoryStates();
					
					// Draw face detection boxes if enabled
					if (this.showFaceBoxes) {
						this.drawFaceBoxes();
					}
					
					// Draw accessories in order
					const drawOrder = ['face', 'hat', 'glasses', 'extra'];
					this.detectedFaces.forEach((detection, faceIdx) => {
						const bbox = detection.boundingBox;
						const landmarks = detection.keypoints;
						const faceId = detection.faceId || faceIdx;
						drawOrder.forEach(type => {
							this.drawAccessory(faceId, type, bbox, landmarks);
						});
					});
				}
	
				drawFaceBoxes() {
					this.overlayCtx.strokeStyle = '#00ff00';
					this.overlayCtx.lineWidth = 3;
					this.overlayCtx.font = '16px Arial';
					this.overlayCtx.fillStyle = '#00ff00';
					
					this.detectedFaces.forEach((detection, faceIdx) => {
						const bbox = detection.boundingBox;
						const faceId = detection.faceId || faceIdx;
						
						// Draw bounding box
						this.overlayCtx.strokeRect(bbox.originX, bbox.originY, bbox.width, bbox.height);
						
						// Draw face label
						this.overlayCtx.fillText(
							\`Face \${faceId + 1}\`, 
							bbox.originX, 
							bbox.originY - 5
						);
						
						// Draw confidence score
						if (detection.confidence) {
							this.overlayCtx.fillText(
								\`\${(detection.confidence * 100).toFixed(0)}%\`, 
								bbox.originX, 
								bbox.originY + bbox.height + 20
							);
						}
						
						// Draw landmarks
						if (detection.keypoints) {
							this.overlayCtx.fillStyle = '#ff0000';
							detection.keypoints.forEach((point, idx) => {
								const x = point.x * this.overlayCanvas.width;
								const y = point.y * this.overlayCanvas.height;
								this.overlayCtx.beginPath();
								this.overlayCtx.arc(x, y, 3, 0, 2 * Math.PI);
								this.overlayCtx.fill();
							});
							this.overlayCtx.fillStyle = '#00ff00';
						}
					});
				}
  
				ensureAccessoryStates() {
					this.detectedFaces.forEach((detection, faceIdx) => {
						const faceId = detection.faceId || faceIdx;
						if (!this.accessoryStates[faceId]) this.accessoryStates[faceId] = {};
						['hat', 'glasses', 'face', 'extra'].forEach(type => {
							if (!this.accessoryStates[faceId][type]) {
								this.accessoryStates[faceId][type] = {
									emoji: this.selectedAccessories[type],
									offsetX: 0,
									offsetY: 0,
									scale: 1.5,
									rotation: 0
								};
							} else {
								this.accessoryStates[faceId][type].emoji = this.selectedAccessories[type];
							}
						});
					});
				}
  
				drawAccessory(faceId, type, bbox, landmarks) {
					const state = this.accessoryStates[faceId] && this.accessoryStates[faceId][type];
					if (!state || !state.emoji) return;
					
					const ctx = this.overlayCtx;
					const base = this.getLandmarkPosition(landmarks, type, bbox);
					let x = base.x * this.overlayCanvas.width + state.offsetX;
					let y = base.y * this.overlayCanvas.height + state.offsetY;
					let fontSize;
					let rotation = state.rotation;
					
					if (type === 'face') {
						const pxWidth = bbox.width;
						const pxHeight = bbox.height;
						fontSize = Math.min(pxWidth, pxHeight) * 0.9 * state.scale;
					} else if (type === 'glasses' && base.x !== base.x2 && base.y !== base.y2) {
						const x1 = base.x * this.overlayCanvas.width;
						const y1 = base.y * this.overlayCanvas.height;
						const x2 = base.x2 * this.overlayCanvas.width;
						const y2 = base.y2 * this.overlayCanvas.height;
						x = (x1 + x2) / 2 + state.offsetX;
						y = (y1 + y2) / 2 + state.offsetY;
						fontSize = Math.hypot(x2 - x1, y2 - y1) * 1.6 * state.scale;
						rotation = Math.atan2(y2 - y1, x2 - x1) + state.rotation;
					} else if (type === 'extra') {
						fontSize = bbox.width * 0.5 * state.scale;
					} else {
						fontSize = bbox.width * 0.6 * state.scale;
					}
					
					ctx.save();
					ctx.font = fontSize + 'px Arial';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.translate(x, y);
					ctx.rotate(rotation);
					ctx.fillText(state.emoji, 0, 0);
					ctx.restore();
					
					const isSelected = this.selectedOverlay && this.selectedOverlay.faceId === faceId && this.selectedOverlay.type === type;
					if (isSelected) {
						ctx.save();
						ctx.strokeStyle = '#ff9800';
						ctx.lineWidth = 4;
						ctx.beginPath();
						ctx.arc(x, y, fontSize * 0.6, 0, 2 * Math.PI);
						ctx.stroke();
						ctx.restore();
						
						const handleRadius = Math.max(this.resizeHandleSize, fontSize * 0.12);
						const handleX = x + Math.cos(rotation) * fontSize * 0.55;
						const handleY = y + Math.sin(rotation) * fontSize * 0.55;
						
						ctx.save();
						ctx.beginPath();
						ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
						ctx.fillStyle = '#ff9800';
						ctx.fill();
						ctx.lineWidth = 3;
						ctx.strokeStyle = '#fff';
						ctx.stroke();
						ctx.restore();
					}
					
					state._drawnX = x;
					state._drawnY = y;
					state._drawnFontSize = fontSize;
					state._drawnRotation = rotation;
					state._handleX = x + Math.cos(rotation) * fontSize * 0.55;
					state._handleY = y + Math.sin(rotation) * fontSize * 0.55;
					state._handleRadius = Math.max(this.resizeHandleSize, fontSize * 0.12);
				}
	
				// Drawing functions
				getCanvasPos(e, canvas) {
					const rect = canvas.getBoundingClientRect();
					const scaleX = canvas.width / rect.width;
					const scaleY = canvas.height / rect.height;
					
					if (e.touches && e.touches.length > 0) {
						return {
							x: (e.touches[0].clientX - rect.left) * scaleX,
							y: (e.touches[0].clientY - rect.top) * scaleY
						};
					} else {
						return {
							x: (e.clientX - rect.left) * scaleX,
							y: (e.clientY - rect.top) * scaleY
						};
					}
				}
	
				onDrawingStart(e) {
					this.isDrawing = true;
					const pos = this.getCanvasPos(e, this.drawingCanvas);
					this.lastDrawPoint = pos;
					
					this.drawingCtx.strokeStyle = this.drawingColor;
					this.drawingCtx.lineWidth = this.brushSize;
					this.drawingCtx.beginPath();
					this.drawingCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, 2 * Math.PI);
					this.drawingCtx.fill();
					
					e.preventDefault();
				}
	
				onDrawingMove(e) {
					if (!this.isDrawing) return;
					
					const pos = this.getCanvasPos(e, this.drawingCanvas);
					
					if (this.lastDrawPoint) {
						this.drawingCtx.strokeStyle = this.drawingColor;
						this.drawingCtx.lineWidth = this.brushSize;
						this.drawingCtx.beginPath();
						this.drawingCtx.moveTo(this.lastDrawPoint.x, this.lastDrawPoint.y);
						this.drawingCtx.lineTo(pos.x, pos.y);
						this.drawingCtx.stroke();
					}
					
					this.lastDrawPoint = pos;
					e.preventDefault();
				}
	
				onDrawingEnd(e) {
					this.isDrawing = false;
					this.lastDrawPoint = null;
				}
	
				clearDrawing() {
					this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
					this.log('Drawing cleared');
				}
	
				capturePhoto() {
					this.log('Capturing photo...');
					const canvas = this.capturedCanvas;
					const ctx = this.capturedCtx;
					
					canvas.width = this.video.videoWidth;
					canvas.height = this.video.videoHeight;
					
					// Draw video
					ctx.drawImage(this.video, 0, 0);
					
					// Draw accessories
					ctx.drawImage(this.overlayCanvas, 0, 0);
					
					// Draw user drawings
					ctx.drawImage(this.drawingCanvas, 0, 0);
					
					canvas.style.display = 'block';
					document.getElementById('download-btn').style.display = 'block';
					document.getElementById('upload-btn').style.display = 'block';
					document.getElementById('share-btn').style.display = 'none';
					
					this.updateStatus('Photo captured! 📸 Upload to cloud to share it!', 'ready');
					this.log('Photo captured successfully');
				}
	
				downloadPhoto() {
					this.log('Downloading photo...');
					const link = document.createElement('a');
					link.download = \`photobooth-\${Date.now()}.png\`;
					link.href = this.capturedCanvas.toDataURL();
					link.click();
					this.log('Photo download initiated');
				}
	
				async uploadPhoto() {
					try {
						this.log('Starting photo upload...');
						this.updateStatus('Uploading to cloud... ☁️', 'loading');
						
						const blob = await new Promise(resolve => 
							this.capturedCanvas.toBlob(resolve, 'image/png')
						);
						
						this.log('Photo blob created, size: ' + blob.size + ' bytes');
						
						const formData = new FormData();
						formData.append('photo', blob, 'photo.png');
						formData.append('accessories', JSON.stringify(this.selectedAccessories));
						
						this.log('Sending upload request...');
						
						const response = await fetch('/api/upload', {
							method: 'POST',
							body: formData
						});
						
						this.log('Upload response status: ' + response.status);
						
						if (!response.ok) {
							const errorText = await response.text();
							this.log('Upload error response: ' + errorText);
							throw new Error('Upload failed: ' + response.status + ' - ' + errorText);
						}
						
						const result = await response.json();
						this.log('Upload result: ' + JSON.stringify(result));
						this.lastPhotoId = result.photoId;
						
						document.getElementById('share-btn').style.display = 'block';
						this.updateStatus('Photo uploaded successfully! ✅', 'ready');
						this.loadGallery();
						
					} catch (error) {
						console.error('Upload error:', error);
						this.log('Upload error: ' + error.message);
						this.updateStatus('Upload failed ❌: ' + error.message, 'error');
					}
				}
	
				async sharePhoto() {
					if (!this.lastPhotoId) {
						this.log('No photo ID available for sharing');
						return;
					}
					
					try {
						this.log('Creating share link for photo: ' + this.lastPhotoId);
						this.updateStatus('Creating share link... 🔗', 'loading');
						
						const response = await fetch('/api/share', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ photoId: this.lastPhotoId })
						});
						
						this.log('Share response status: ' + response.status);
						
						if (!response.ok) {
							const errorText = await response.text();
							this.log('Share error response: ' + errorText);
							throw new Error('Share creation failed');
						}
						
						const result = await response.json();
						this.log('Share result: ' + JSON.stringify(result));
						const shareUrl = \`\${window.location.origin}/share/\${result.shareId}\`;
						
						document.getElementById('share-url').textContent = shareUrl;
						document.getElementById('share-section').style.display = 'block';
						this.updateStatus('Share link created! 🎉', 'ready');
						
					} catch (error) {
						console.error('Share error:', error);
						this.log('Share error: ' + error.message);
						this.updateStatus('Share creation failed ❌', 'error');
					}
				}
	
				async loadGallery() {
					try {
						this.log('Loading gallery...');
						const response = await fetch('/api/gallery?limit=12');
						this.log('Gallery response status: ' + response.status);
						
						if (!response.ok) {
							const errorText = await response.text();
							this.log('Gallery error response: ' + errorText);
							throw new Error('Gallery request failed: ' + response.status);
						}
						
						const data = await response.json();
						this.log('Gallery data received: ' + JSON.stringify(data));
						
						if (data.error) {
							this.log('Gallery API error: ' + data.error);
							throw new Error(data.error);
						}
						
						const photos = data.photos || [];
						this.log('Gallery photos count: ' + photos.length);
						const gallery = document.getElementById('gallery-grid');
						
						if (photos.length === 0) {
							gallery.innerHTML = '<p style="text-align: center; color: #666;">No photos yet. Take your first photo! 📸</p>';
							this.log('Gallery is empty');
							return;
						}
						
						gallery.innerHTML = photos.map(photo => \`
							<div class="gallery-item" onclick="window.open('/api/photo/\${photo.id}', '_blank')">
								<img src="/api/photo/\${photo.id}" alt="Photo" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22120%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f0f0f0%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22>📷</text></svg>'">
							</div>
						\`).join('');
						
						this.log('Gallery updated successfully with ' + photos.length + ' photos');
						
					} catch (error) {
						console.error('Gallery load error:', error);
						this.log('Gallery load error: ' + error.message);
						const gallery = document.getElementById('gallery-grid');
						gallery.innerHTML = '<p style="text-align: center; color: #f44336;">Failed to load gallery: ' + error.message + '</p>';
					}
				}
	
				clearAccessories() {
					this.log('Clearing accessories...');
					this.selectedAccessories = {
						hat: null,
						glasses: null,
						face: null,
						extra: null
					};
					this.accessoryStates = {};
					document.querySelectorAll('.accessory-btn').forEach(btn => 
						btn.classList.remove('selected')
					);
					this.log('Accessories cleared successfully');
				}
	
				updateStatus(message, type) {
					this.status.textContent = message;
					this.status.className = \`status \${type}\`;
				}
  
				getPointerPos(e) {
					if (e.touches && e.touches.length > 0) {
						const rect = this.overlayCanvas.getBoundingClientRect();
						return {
							x: (e.touches[0].clientX - rect.left) * (this.overlayCanvas.width / rect.width),
							y: (e.touches[0].clientY - rect.top) * (this.overlayCanvas.height / rect.height)
						};
					} else {
						const rect = this.overlayCanvas.getBoundingClientRect();
						return {
							x: (e.clientX - rect.left) * (this.overlayCanvas.width / rect.width),
							y: (e.clientY - rect.top) * (this.overlayCanvas.height / rect.height)
						};
					}
				}
  
				onOverlayPointerDown(e) {
					const pos = this.getPointerPos(e);
					let found = null;
					let foundResize = null;
					
					for (const [faceId, types] of Object.entries(this.accessoryStates)) {
						for (const [type, state] of Object.entries(types)) {
							if (!state.emoji) continue;
							const x = state._drawnX;
							const y = state._drawnY;
							const fontSize = state._drawnFontSize;
							const rotation = state._drawnRotation;
							
							const handleX = x + Math.cos(rotation || 0) * fontSize * 0.55;
							const handleY = y + Math.sin(rotation || 0) * fontSize * 0.55;
							const distToHandle = Math.hypot(pos.x - handleX, pos.y - handleY);
							if (distToHandle < this.resizeHandleSize) {
								foundResize = { faceId, type };
							}
							
							const dist = Math.hypot(pos.x - x, pos.y - y);
							if (dist < fontSize * 0.6) {
								found = { faceId, type };
							}
						}
					}
					
					if (foundResize) {
						this.selectedOverlay = foundResize;
						this.resizeMode = true;
						const state = this.accessoryStates[foundResize.faceId][foundResize.type];
						const x = state._drawnX;
						const y = state._drawnY;
						const dx = pos.x - x;
						const dy = pos.y - y;
						this.resizeStart = {
						  x: pos.x,
						  y: pos.y,
						  scale: state.scale,
						  rotation: state.rotation || 0,
						  offsetX: state.offsetX,
						  offsetY: state.offsetY,
						  cx: x,
						  cy: y,
						  startAngle: Math.atan2(dy, dx),
						  startDist: Math.sqrt(dx * dx + dy * dy)
						};
						this.dragStart = { offsetX: state.offsetX, offsetY: state.offsetY };
						e.preventDefault();
						return;
					}
					
					if (found) {
						this.selectedOverlay = found;
						const state = this.accessoryStates[found.faceId][found.type];
						this.dragOffset = { x: pos.x - state._drawnX, y: pos.y - state._drawnY };
						this.isDragging = true;
						this.dragStart = { offsetX: state.offsetX, offsetY: state.offsetY };
						e.preventDefault();
					}
				}
  
				onOverlayPointerMove(e) {
					if (this.resizeMode && this.selectedOverlay) {
						const pos = this.getPointerPos(e);
						const state = this.accessoryStates[this.selectedOverlay.faceId][this.selectedOverlay.type];
						const x = state._drawnX;
						const y = state._drawnY;
						const dx = pos.x - x;
						const dy = pos.y - y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						
						let newScale = this.resizeStart.scale * (dist / (this.resizeStart.startDist || 1));
						newScale = Math.max(0.3, Math.min(4, newScale));
						state.scale = newScale;
						
						const angle = Math.atan2(dy, dx);
						state.rotation = this.resizeStart.rotation + (angle - this.resizeStart.startAngle);
						this.drawOverlays();
						e.preventDefault();
						return;
					}
					
					if (!this.isDragging || !this.selectedOverlay) return;
					
					const pos = this.getPointerPos(e);
					const state = this.accessoryStates[this.selectedOverlay.faceId][this.selectedOverlay.type];
					state.offsetX = this.dragStart.offsetX + (pos.x - state._drawnX);
					state.offsetY = this.dragStart.offsetY + (pos.y - state._drawnY);
					this.drawOverlays();
					e.preventDefault();
				}
  
				onOverlayPointerUp(e) {
					this.isDragging = false;
					this.resizeMode = false;
					this.selectedOverlay = null;
					this.drawOverlays();
				}
  
				onWheel(e) {
					if (!this.selectedOverlay) return;
					const state = this.accessoryStates[this.selectedOverlay.faceId][this.selectedOverlay.type];
					state.scale += e.deltaY < 0 ? 0.1 : -0.1;
					state.scale = Math.max(0.3, Math.min(4, state.scale));
					this.drawOverlays();
					e.preventDefault();
				}
  
				onCursorFeedback(e) {
					const pos = this.getPointerPos(e);
					let overHandle = false;
					for (const [faceId, types] of Object.entries(this.accessoryStates)) {
						for (const [type, state] of Object.entries(types)) {
							if (!state.emoji) continue;
							if (typeof state._handleX === 'number' && typeof state._handleY === 'number' && typeof state._handleRadius === 'number') {
								const dist = Math.hypot(pos.x - state._handleX, pos.y - state._handleY);
								if (dist < state._handleRadius) {
								  overHandle = true;
								}
							}
						}
					}
					this.overlayCanvas.style.cursor = overHandle ? 'nwse-resize' : '';
				}
			}
	
			function copyShareUrl() {
				const shareUrl = document.getElementById('share-url').textContent;
				navigator.clipboard.writeText(shareUrl).then(() => {
					alert('Share URL copied to clipboard! 📋');
				});
			}
	
			window.addEventListener('load', () => {
				new CloudPhotoBooth();
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
	
	// ... rest of the handlers remain the same
	async function handlePhotoUpload(request: any, env: any, corsHeaders: any) {
	  try {
		console.log('Upload request received');
		
		if (!env.PHOTOBOOTH_PHOTOS) {
		  console.error('R2 bucket PHOTOBOOTH_PHOTOS not found');
		  return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
		
		if (!env.PHOTOBOOTH_KV) {
		  console.error('KV namespace PHOTOBOOTH_KV not found');
		  return new Response(JSON.stringify({ error: 'KV namespace not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
		
		const formData = await request.formData();
		const photoFile = formData.get('photo');
		const accessories = JSON.parse(formData.get('accessories') || '{}');
		
		console.log('Form data parsed, photo file size:', photoFile ? photoFile.size : 'null');
		
		if (!photoFile) {
		  return new Response(JSON.stringify({ error: 'No photo provided' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
	
		const photoId = generateId();
		const timestamp = new Date().toISOString();
		
		console.log('Generated photo ID:', photoId);
		
		try {
		  await env.PHOTOBOOTH_PHOTOS.put(photoId, photoFile.stream(), {
			httpMetadata: {
			  contentType: 'image/png',
			},
			customMetadata: {
			  uploadTime: timestamp,
			  accessories: JSON.stringify(accessories)
			}
		  });
		  console.log('Photo uploaded to R2 successfully');
		} catch (err) {
		  console.error('R2 upload error:', err);
		  return new Response(JSON.stringify({ error: 'R2 upload failed: ' + err }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
	
		const metadata = {
		  id: photoId,
		  timestamp,
		  accessories,
		  size: photoFile.size,
		  type: photoFile.type
		};
		
		try {
		  await env.PHOTOBOOTH_KV.put(`photo:${photoId}`, JSON.stringify(metadata));
		  console.log('Metadata stored in KV successfully');
		} catch (err) {
		  console.error('KV storage error:', err);
		  return new Response(JSON.stringify({ error: 'KV storage failed: ' + err }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
		
		await updateAnalytics(env, 'upload');
	
		return new Response(JSON.stringify({ 
		  success: true, 
		  photoId,
		  message: 'Photo uploaded successfully' 
		}), {
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	
	  } catch (error) {
		console.error('Upload error:', error);
		return new Response(JSON.stringify({ error: 'Upload failed: ' + error }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	  }
	}
	
	async function handleCreateShare(request: any, env: any, corsHeaders: any) {
	  try {
		const { photoId } = await request.json();
		
		if (!photoId) {
		  return new Response(JSON.stringify({ error: 'Photo ID required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
	
		const photoExists = await env.PHOTOBOOTH_PHOTOS.head(photoId);
		if (!photoExists) {
		  return new Response(JSON.stringify({ error: 'Photo not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
	
		const shareId = generateId();
		const shareData = {
		  shareId,
		  photoId,
		  createdAt: new Date().toISOString(),
		  views: 0
		};
	
		await env.PHOTOBOOTH_KV.put(`share:${shareId}`, JSON.stringify(shareData));
		await updateAnalytics(env, 'share');
	
		return new Response(JSON.stringify({ 
		  success: true, 
		  shareId,
		  shareUrl: `/share/${shareId}`
		}), {
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	
	  } catch (error) {
		console.error('Share creation error:', error);
		return new Response(JSON.stringify({ error: 'Share creation failed: ' + error }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	  }
	}
	
	async function handleGetPhoto(pathname: string, env: any, corsHeaders: any) {
	  try {
		const photoId = pathname.split('/').pop();
		console.log('Fetching photo:', photoId);
		
		const photo = await env.PHOTOBOOTH_PHOTOS.get(photoId);
		if (!photo) {
		  console.log('Photo not found in R2:', photoId);
		  return new Response('Photo not found', { 
			status: 404, 
			headers: corsHeaders 
		  });
		}
	
		return new Response(photo.body, {
		  headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=86400',
			...corsHeaders
		  }
		});
	
	  } catch (error) {
		console.error('Photo retrieval error:', error);
		return new Response(JSON.stringify({ error: 'Photo retrieval failed: ' + error }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	  }
	}
	
	async function handleGetGallery(searchParams: any, env: any, corsHeaders: any) {
	  try {
		console.log('Gallery request received');
		
		if (!env.PHOTOBOOTH_KV) {
		  console.error('KV namespace not available');
		  return new Response(JSON.stringify({ error: 'KV namespace not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		  });
		}
		
		const limit = parseInt(searchParams.get('limit') || '20');
		const cursor = searchParams.get('cursor') || undefined;
		
		console.log('Gallery request - limit:', limit, 'cursor:', cursor);
		
		const photos = [];
		const listOpts: any = { prefix: 'photo:', limit };
		if (cursor) listOpts.cursor = cursor;
		
		console.log('Listing KV keys with options:', listOpts);
		
		const { keys, list_complete, cursor: nextCursor } = await env.PHOTOBOOTH_KV.list(listOpts);
		
		console.log('KV list result - keys count:', keys.length, 'list_complete:', list_complete);
		
		for (const key of keys) {
		  try {
			const metadata = await env.PHOTOBOOTH_KV.get(key.name);
			if (metadata) {
			  photos.push(JSON.parse(metadata));
			}
		  } catch (err) {
			console.error('Error parsing metadata for key:', key.name, err);
		  }
		}
		
		photos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
		
		console.log('Gallery returning photos:', photos.length);
		
		return new Response(JSON.stringify({
		  photos: photos.slice(0, limit),
		  nextCursor: list_complete ? null : nextCursor
		}), {
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
		
	  } catch (error) {
		console.error('Gallery error:', error);
		return new Response(JSON.stringify({ error: 'Gallery retrieval failed: ' + error }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	  }
	}
	
	async function handleAnalytics(env: any, corsHeaders: any) {
	  try {
		const analytics = await env.PHOTOBOOTH_KV.get('analytics');
		const data = analytics ? JSON.parse(analytics) : {
		  totalUploads: 0,
		  totalShares: 0,
		  totalViews: 0,
		  lastUpdated: new Date().toISOString()
		};
	
		return new Response(JSON.stringify(data), {
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	
	  } catch (error) {
		console.error('Analytics error:', error);
		return new Response(JSON.stringify({ error: 'Analytics retrieval failed: ' + error }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	  }
	}
	
	async function handleSharePage(pathname: string, env: any, corsHeaders: any, request?: any) {
	  try {
		const shareId = pathname.split('/').pop();
		
		const shareData = await env.PHOTOBOOTH_KV.get(`share:${shareId}`);
		if (!shareData) {
		  return new Response('Share not found', { 
			status: 404, 
			headers: corsHeaders 
		  });
		}
	
		const { photoId } = JSON.parse(shareData);
		
		const updatedShareData = JSON.parse(shareData);
		updatedShareData.views++;
		await env.PHOTOBOOTH_KV.put(`share:${shareId}`, JSON.stringify(updatedShareData));
		await updateAnalytics(env, 'view');
	
		const baseUrl = request ? request.url.split('/share')[0] : '';
		const html = `<!DOCTYPE html>
		<html>
		<head>
			<title>Shared Photo - Cloud Photo Booth</title>
			<meta property="og:title" content="Check out my photo booth picture!" />
			<meta property="og:image" content="${baseUrl}/api/photo/${photoId}" />
			<meta property="og:description" content="Made with Cloud Photo Booth" />
			<style>
				body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
				.container { background: white; border-radius: 20px; padding: 30px; max-width: 600px; margin: 0 auto; }
				img { max-width: 100%; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
				.btn { padding: 15px 25px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 12px; text-decoration: none; margin: 10px; display: inline-block; }
			</style>
		</head>
		<body>
			<div class="container">
				<h1>📸 Shared Photo</h1>
				<img src="/api/photo/${photoId}" alt="Shared photo" />
				<br>
				<a href="/" class="btn">Create Your Own!</a>
			</div>
		</body>
		</html>`;
	
		return new Response(html, {
		  headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	
	  } catch (error) {
		console.error('Share page error:', error);
		return new Response('Share page error: ' + error, {
		  status: 500,
		  headers: corsHeaders
		});
	  }
	}