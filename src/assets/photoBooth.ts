// File: src/assets/photoBooth.ts
// Frontend JavaScript for the photo booth application with AI haiku generation

export function getPhotoBoothJS(): string {
    return `
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
  
          this.accessoryStates = {};
          this.selectedOverlay = null;
          this.dragOffset = { x: 0, y: 0 };
          this.isDragging = false;
          this.resizeHandleSize = 28;
          this.resizeMode = false;
          this.resizeStart = null;
          this.dragStart = null;
  
          this.isDrawing = false;
          this.drawingMode = false;
          this.drawingColor = '#000000';
          this.brushSize = 10;
          this.lastDrawPoint = null;
  
          this.selectedFilter = 'none';
          this.hasDrawing = false;
  
          this.init();
        }
  
        log(message) {
          console.log(message);
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
            this.updateStatus('Ready! 🎭 Accessory mode active - select emojis and drag to position. Toggle drawing mode to draw! 😊', 'ready');
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
          this.drawingCtx.fillStyle = this.drawingColor;
          this.updateBrushPreview();
        }
  
        setupEventListeners() {
          this.log('Setting up event listeners...');
          
          document.getElementById('show-face-boxes').addEventListener('change', (e) => {
            this.showFaceBoxes = e.target.checked;
            this.log('Face boxes toggle: ' + this.showFaceBoxes);
          });
          
          document.querySelectorAll('.accessory-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const type = e.target.dataset.type;
              const item = e.target.dataset.item;
              
              document.querySelectorAll('[data-type="' + type + '"]').forEach(b => 
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
  
          document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
              e.target.classList.add('selected');
              this.drawingColor = e.target.dataset.color;
              this.updateBrushPreview();
              this.log('Selected color: ' + this.drawingColor);
            });
          });
  
          document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.updateBrushPreview();
          });
  
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const filterType = e.target.dataset.filter;
              this.selectFilter(filterType);
            });
          });
  
          document.getElementById('capture-btn').addEventListener('click', () => {
            this.log('Capture button clicked');
            this.capturePhoto();
          });
  
          document.getElementById('drawing-mode-btn').addEventListener('click', () => {
            this.toggleDrawingMode();
          });
          
          document.getElementById('clear-accessories-btn').addEventListener('click', () => {
            this.log('Clear accessories button clicked');
            this.clearAccessories();
          });
          
          document.getElementById('clear-drawing-btn').addEventListener('click', () => {
            this.log('Clear drawing button clicked');
            this.clearDrawing();
          });
          
          const clearAllBtn = document.getElementById('clear-all-btn');
          if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
              this.log('Clear all button clicked');
              this.clearAll();
            });
          }
          
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
          
          // NEW: AI Haiku generation button
          document.getElementById('haiku-btn').addEventListener('click', () => {
            this.log('Haiku button clicked');
            this.generateHaiku();
          });
          
          document.getElementById('gallery-btn').addEventListener('click', () => {
            this.log('Gallery button clicked');
            this.loadGallery();
          });
  
          this.overlayCanvas.addEventListener('mousedown', this.onOverlayPointerDown.bind(this));
          this.overlayCanvas.addEventListener('mousemove', this.onOverlayPointerMove.bind(this));
          this.overlayCanvas.addEventListener('mouseup', this.onOverlayPointerUp.bind(this));
          this.overlayCanvas.addEventListener('mouseleave', this.onOverlayPointerUp.bind(this));
          this.overlayCanvas.addEventListener('wheel', this.onWheel.bind(this));
          this.overlayCanvas.addEventListener('touchstart', this.onOverlayPointerDown.bind(this));
          this.overlayCanvas.addEventListener('touchmove', this.onOverlayPointerMove.bind(this));
          this.overlayCanvas.addEventListener('touchend', this.onOverlayPointerUp.bind(this));
          this.overlayCanvas.addEventListener('mousemove', this.onCursorFeedback.bind(this));
          
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
  
        selectFilter(filterType) {
          this.selectedFilter = filterType;
          
          // Update UI - remove selected from all buttons
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('selected');
          });
          
          // Add selected to clicked button
          const selectedBtn = document.querySelector('[data-filter="' + filterType + '"]');
          if (selectedBtn) {
            selectedBtn.classList.add('selected');
          }
          
          // Apply filter to video preview
          this.applyFilterToVideo();
          
          this.log('Selected filter: ' + filterType);
        }
  
        applyFilterToVideo() {
          // Remove all existing filter classes
          const filterClasses = ['filter-none', 'filter-sepia', 'filter-grayscale', 'filter-vintage', 'filter-warm', 'filter-cool', 'filter-dramatic', 'filter-dreamy'];
          filterClasses.forEach(cls => {
            this.video.classList.remove(cls);
          });
          
          // Add new filter class
          this.video.classList.add('filter-' + this.selectedFilter);
          
          this.log('Applied filter to video: filter-' + this.selectedFilter);
        }
  
        toggleDrawingMode() {
          this.drawingMode = !this.drawingMode;
          const button = document.getElementById('drawing-mode-btn');
          const canvas = this.drawingCanvas;
          const statusIndicator = document.getElementById('drawing-status');
          
          if (this.drawingMode) {
            canvas.classList.add('drawing-mode');
            button.textContent = '🎨 Drawing Mode: ON';
            button.classList.add('active');
            statusIndicator.textContent = '🎨 Drawing Mode Active';
            statusIndicator.style.color = '#28a745';
            this.updateStatus('🎨 Drawing mode enabled! Click and drag to draw. Toggle off to move accessories.', 'ready');
          } else {
            canvas.classList.remove('drawing-mode');
            button.textContent = '🎨 Drawing Mode: OFF';
            button.classList.remove('active');
            statusIndicator.textContent = '🎭 Accessory Mode Active';
            statusIndicator.style.color = '#555';
            this.updateStatus('🎭 Accessory mode enabled! Click and drag emojis to move them.', 'ready');
          }
          
          this.log('Drawing mode: ' + (this.drawingMode ? 'ON' : 'OFF'));
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
          
          if (this.showFaceBoxes) {
            this.drawFaceBoxes();
          }
          
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
            
            this.overlayCtx.strokeRect(bbox.originX, bbox.originY, bbox.width, bbox.height);
            
            this.overlayCtx.fillText(
              'Face ' + (faceId + 1), 
              bbox.originX, 
              bbox.originY - 5
            );
            
            if (detection.confidence) {
              this.overlayCtx.fillText(
                (detection.confidence * 100).toFixed(0) + '%', 
                bbox.originX, 
                bbox.originY + bbox.height + 20
              );
            }
            
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
          if (!this.drawingMode) return;
          
          this.isDrawing = true;
          this.hasDrawing = true;
          const pos = this.getCanvasPos(e, this.drawingCanvas);
          this.lastDrawPoint = pos;
          
          this.drawingCtx.strokeStyle = this.drawingColor;
          this.drawingCtx.lineWidth = this.brushSize;
          this.drawingCtx.fillStyle = this.drawingColor;
          this.drawingCtx.beginPath();
          this.drawingCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, 2 * Math.PI);
          this.drawingCtx.fill();
          
          e.preventDefault();
        }
  
        onDrawingMove(e) {
          if (!this.drawingMode || !this.isDrawing) return;
          
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
          if (!this.drawingMode) return;
          
          this.isDrawing = false;
          this.lastDrawPoint = null;
        }
  
        clearDrawing() {
          this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
          this.hasDrawing = false;
          this.log('Drawing cleared');
        }
  
        capturePhoto() {
          this.log('Capturing photo...');
          const canvas = this.capturedCanvas;
          const ctx = this.capturedCtx;
          const container = document.getElementById('captured-photo-container');
          
          canvas.width = this.video.videoWidth;
          canvas.height = this.video.videoHeight;
          
          // Clear any existing filter on the context
          ctx.filter = 'none';
          
          // Create a temporary canvas for applying filters to video
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = this.video.videoWidth;
          tempCanvas.height = this.video.videoHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          // Apply filter to temp canvas if needed
          if (this.selectedFilter !== 'none') {
            tempCtx.filter = this.getFilterCSS(this.selectedFilter);
          }
          
          // Draw video with filter to temp canvas
          tempCtx.drawImage(this.video, 0, 0);
          
          // Draw the filtered video to main canvas
          ctx.drawImage(tempCanvas, 0, 0);
          
          // Reset filter for overlays (we want accessories and drawings without filter)
          ctx.filter = 'none';
          
          // Draw accessories
          ctx.drawImage(this.overlayCanvas, 0, 0);
          
          // Draw user drawings
          ctx.drawImage(this.drawingCanvas, 0, 0);
          
          // Remove all existing filter classes from captured canvas
          const filterClasses = ['filter-none', 'filter-sepia', 'filter-grayscale', 'filter-vintage', 'filter-warm', 'filter-cool', 'filter-dramatic', 'filter-dreamy'];
          filterClasses.forEach(cls => {
            canvas.classList.remove(cls);
          });
          
          // Show the centered photo container
          container.classList.add('show');
          
          document.getElementById('download-btn').style.display = 'block';
          document.getElementById('upload-btn').style.display = 'block';
          document.getElementById('share-btn').style.display = 'none';
          document.getElementById('haiku-btn').style.display = 'block'; // Show AI haiku button
          
          this.updateStatus('Photo captured with ' + (this.selectedFilter === 'none' ? 'no filter' : this.selectedFilter + ' filter') + '! 📸 Upload to cloud to share it!', 'ready');
          this.log('Photo captured successfully with filter: ' + this.selectedFilter);
        }
  
        getFilterCSS(filterType) {
          const filters = {
            'sepia': 'sepia(1) contrast(1.15) brightness(1.1) saturate(1.2)',
            'grayscale': 'grayscale(1) contrast(1.2) brightness(1.05)',
            'vintage': 'sepia(0.6) contrast(1.3) brightness(1.15) hue-rotate(-15deg) saturate(1.4)',
            'warm': 'hue-rotate(-20deg) saturate(1.4) brightness(1.15) contrast(1.1)',
            'cool': 'hue-rotate(20deg) saturate(1.3) brightness(1.08) contrast(1.15)',
            'dramatic': 'contrast(1.6) brightness(0.95) saturate(1.4)',
            'dreamy': 'blur(0.8px) brightness(1.25) saturate(0.85) contrast(0.9) hue-rotate(5deg)'
          };
          return filters[filterType] || 'none';
        }
  
        downloadPhoto() {
          this.log('Downloading photo...');
          const link = document.createElement('a');
          link.download = 'photobooth-' + Date.now() + '.png';
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
            formData.append('filter', this.selectedFilter);
            formData.append('hasDrawing', this.hasDrawing.toString());
            
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
            this.updateStatus('Photo uploaded successfully! ✅ Creative filename: ' + result.filename, 'ready');
            this.loadGallery();
            
          } catch (error) {
            console.error('Upload error:', error);
            this.log('Upload error: ' + error.message);
            this.updateStatus('Upload failed ❌: ' + error.message, 'error');
          }
        }
  
        // NEW: AI Haiku Generation
        async generateHaiku() {
          try {
            this.log('Generating AI haiku...');
            this.updateStatus('🤖 AI is composing a haiku about your photo...', 'loading');
            
            const metadata = {
              accessories: this.selectedAccessories,
              filter: this.selectedFilter,
              hasDrawing: this.hasDrawing
            };
            
            const response = await fetch('/api/haiku', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metadata)
            });
            
            this.log('Haiku response status: ' + response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              this.log('Haiku error response: ' + errorText);
              throw new Error('Haiku generation failed');
            }
            
            const result = await response.json();
            this.log('Haiku result: ' + JSON.stringify(result));
            
            // Display the haiku
            this.displayHaiku(result.haiku);
            this.updateStatus('🎌 AI haiku generated! ✨', 'ready');
            
          } catch (error) {
            console.error('Haiku generation error:', error);
            this.log('Haiku error: ' + error.message);
            this.updateStatus('Haiku generation failed ❌: ' + error.message, 'error');
          }
        }
  
        displayHaiku(haiku) {
          const haikuContainer = document.getElementById('haiku-container');
          const haikuText = document.getElementById('haiku-text');
          
          haikuText.textContent = haiku;
          haikuContainer.style.display = 'block';
          
          // Add a nice animation
          haikuContainer.style.opacity = '0';
          haikuContainer.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            haikuContainer.style.transition = 'all 0.5s ease';
            haikuContainer.style.opacity = '1';
            haikuContainer.style.transform = 'translateY(0)';
          }, 100);
          
          this.log('Haiku displayed: ' + haiku);
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
            const shareUrl = window.location.origin + '/share/' + result.shareId;
            
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
            
            gallery.innerHTML = photos.map(photo => 
              '<div class="gallery-item" onclick="window.open(' + "'/api/photo/" + photo.id + "'" + ', ' + "'_blank'" + ')">' +
                '<img src="' + '/api/photo/' + photo.id + '" alt="Photo" loading="lazy" onerror="this.src=' + "'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22120%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f0f0f0%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22>📷</text></svg>'" + '">' +
              '</div>'
            ).join('');
            
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
          
          const container = document.getElementById('captured-photo-container');
          if (container) {
            container.classList.remove('show');
          }
          document.getElementById('download-btn').style.display = 'none';
          document.getElementById('upload-btn').style.display = 'none';
          document.getElementById('share-btn').style.display = 'none';
          document.getElementById('haiku-btn').style.display = 'none';
          document.getElementById('share-section').style.display = 'none';
          document.getElementById('haiku-container').style.display = 'none';
          
          this.log('Accessories cleared successfully');
        }
  
        clearAll() {
          this.log('Clearing everything...');
          this.clearAccessories();
          this.clearDrawing();
          
          this.selectFilter('none');
          
          this.updateStatus('Everything cleared! 🧹 Ready for a new photo!', 'ready');
          this.log('Everything cleared successfully');
        }
  
        updateStatus(message, type) {
          this.status.textContent = message;
          this.status.className = 'status ' + type;
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
  
      function copyHaiku() {
        const haikuText = document.getElementById('haiku-text').textContent;
        navigator.clipboard.writeText(haikuText).then(() => {
          alert('Haiku copied to clipboard! 🎌');
        });
      }
  
      window.addEventListener('load', () => {
        new CloudPhotoBooth();
      });
    `;
  }