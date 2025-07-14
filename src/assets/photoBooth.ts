// File: src/assets/photoBooth.ts
// Enhanced photo booth with auto-save and capture confirmation

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
        this.showFaceBoxes = false; //default to false

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

        // NEW: Text overlay system
        this.textOverlays = []; // For absolute positioned text
        this.textColor = '#ffffff';
        this.textSize = 24;
        this.textFont = 'Arial';
        this.nextTextId = 1;
        this.currentHaiku = null; // Store current haiku for adding to canvas
        this.showTrash = false; // Hide trash by default, show when dragging
        this.trashMode = 'auto'; // 'auto' (show when dragging), 'always', or 'never'
        this.selectedTextForEdit = null; // Currently selected text for editing

        // NEW: Auto-save and confirmation
        this.autoSave = true; // Enable auto-save by default
        this.isUploading = false; // Track upload state

        this.init();
      }

      log(message) {
        console.log(message);
      }

      // NEW: Show capture confirmation modal
      showCaptureConfirmation() {
        const modal = document.getElementById('capture-confirmation-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal && overlay) {
          overlay.style.display = 'block';
          modal.style.display = 'block';
          
          // Animate in
          setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
          }, 10);
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            this.hideCaptureConfirmation();
          }, 3000);
        }
      }

      // NEW: Hide capture confirmation modal
      hideCaptureConfirmation() {
        const modal = document.getElementById('capture-confirmation-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal && overlay) {
          modal.style.opacity = '0';
          modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
          overlay.style.opacity = '0';
          
          setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
          }, 300);
        }
      }

      async init() {
        try {
          console.log('Initializing photo booth...');
          await this.setupCamera();
          await this.setupFaceDetection();
          this.setupEventListeners();
          this.setupDrawing();
          this.startDetection();
          this.loadGallery();
          
          // Test canvas and context
          console.log('Testing canvas setup...');
          console.log('Canvas:', this.overlayCanvas);
          console.log('Context:', this.overlayCtx);
          console.log('Canvas dimensions:', this.overlayCanvas?.width, 'x', this.overlayCanvas?.height);
          
          // Force initial draw after a short delay
          setTimeout(() => {
            console.log('Doing initial draw with trash');
            console.log('showTrash at init:', this.showTrash);
            try {
              this.drawOverlays();
            } catch (error) {
              console.error('Error in initial draw:', error);
            }
          }, 200);
          
          this.updateStatus('Ready! 🎭 Accessory mode active - select emojis and drag to position. Toggle drawing mode to draw! 🗑️ Trash appears when dragging. 😊', 'ready');
          console.log('Initialization complete!');
        } catch (error) {
          console.error('Initialization error:', error);
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
        
        // NEW: Modal close button
        document.getElementById('close-confirmation-btn')?.addEventListener('click', () => {
          this.hideCaptureConfirmation();
        });

        // NEW: View last photo button
        document.getElementById('view-last-photo-btn')?.addEventListener('click', () => {
          this.hideCaptureConfirmation();
          this.scrollToPhoto();
        });

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

        // NEW: Text color selection
        document.querySelectorAll('.text-color-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.text-color-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            const newColor = e.target.dataset.color;
            this.textColor = newColor;
            this.updateTextPreview();
            
            // Update selected text overlay color if one is selected
            if (this.selectedOverlay && this.selectedOverlay.element) {
              const element = this.selectedOverlay.element;
              // Check if it's a text element (either absolute text or face-relative text)
              if (element.content || this.selectedOverlay.elementId.startsWith('text_')) {
                element.color = newColor;
                this.drawOverlays(); // Redraw to show the color change
                this.updateStatus('Text color updated to ' + newColor + '! 🎨', 'ready');
                this.log('Updated selected text color to: ' + newColor);
              }
            }
            
            this.log('Selected text color: ' + this.textColor);
          });
        });

        document.getElementById('brush-size').addEventListener('input', (e) => {
          this.brushSize = parseInt(e.target.value);
          this.updateBrushPreview();
        });

        // NEW: Text size slider
        document.getElementById('text-size').addEventListener('input', (e) => {
          const newSize = parseInt(e.target.value);
          this.textSize = newSize;
          this.updateTextPreview();
          
          // Update selected text overlay size if one is selected
          if (this.selectedOverlay && this.selectedOverlay.element) {
            const element = this.selectedOverlay.element;
            // Check if it's a text element (either absolute text or face-relative text)
            if (element.content || this.selectedOverlay.elementId.startsWith('text_')) {
              element.fontSize = newSize;
              this.drawOverlays(); // Redraw to show the size change
              this.updateStatus('Text size updated to ' + newSize + 'px! 📏', 'ready');
              this.log('Updated selected text size to: ' + newSize);
            }
          }
        });

        // NEW: Font selection
        document.querySelectorAll('.font-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            const newFont = e.target.dataset.font;
            this.textFont = newFont;
            this.updateTextPreview();
            
            // Update selected text overlay font if one is selected
            if (this.selectedOverlay && this.selectedOverlay.element) {
              const element = this.selectedOverlay.element;
              // Check if it's a text element (either absolute text or face-relative text)
              if (element.content || this.selectedOverlay.elementId.startsWith('text_')) {
                element.fontFamily = newFont;
                this.drawOverlays(); // Redraw to show the font change
                this.updateStatus('Text font updated to ' + newFont + '! ✍️', 'ready');
                this.log('Updated selected text font to: ' + newFont);
              }
            }
            
            this.log('Selected font: ' + this.textFont);
          });
        });

        // NEW: Add text button
        document.getElementById('add-text-btn').addEventListener('click', () => {
          this.addTextOverlay();
        });

        // NEW: Add haiku to canvas button
        document.getElementById('add-haiku-btn').addEventListener('click', () => {
          this.addHaikuToCanvas();
        });

        // NEW: Apply text edits
        document.getElementById('apply-edit-btn').addEventListener('click', () => {
          this.applyTextEdits();
        });

        // NEW: Cancel text editing
        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
          this.cancelTextEditing();
        });

        // NEW: Edit font selection
        document.querySelectorAll('.edit-font-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.edit-font-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
          });
        });

        // NEW: Text input enter key
        document.getElementById('text-input').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.addTextOverlay();
          }
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

        // NEW: Clear text button
        document.getElementById('clear-text-btn').addEventListener('click', () => {
          this.log('Clear text button clicked');
          this.clearText();
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
          this.log('Manual upload button clicked');
          this.uploadPhoto();
        });
        
        document.getElementById('share-btn').addEventListener('click', () => {
          this.log('Share button clicked');
          this.sharePhoto();
        });
        
        document.getElementById('haiku-btn').addEventListener('click', () => {
          this.log('Haiku button clicked');
          this.generateHaiku();
        });

        document.getElementById('apply-description-btn').addEventListener('click', () => {
          this.log('Apply description button clicked');
          this.applyFilterDescription();
        });

        document.getElementById('filter-description').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.applyFilterDescription();
          }
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
        this.overlayCanvas.addEventListener('dblclick', this.onOverlayDoubleClick.bind(this)); // NEW: Double-click for editing
        
        this.drawingCanvas.addEventListener('mousedown', this.onDrawingStart.bind(this));
        this.drawingCanvas.addEventListener('mousemove', this.onDrawingMove.bind(this));
        this.drawingCanvas.addEventListener('mouseup', this.onDrawingEnd.bind(this));
        this.drawingCanvas.addEventListener('mouseleave', this.onDrawingEnd.bind(this));
        this.drawingCanvas.addEventListener('touchstart', this.onDrawingStart.bind(this));
        this.drawingCanvas.addEventListener('touchmove', this.onDrawingMove.bind(this));
        this.drawingCanvas.addEventListener('touchend', this.onDrawingEnd.bind(this));
        
        this.log('Event listeners setup complete');
      }

      // NEW: Scroll to captured photo
      scrollToPhoto() {
        const photoContainer = document.getElementById('captured-photo-container');
        if (photoContainer) {
          photoContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }

      updateBrushPreview() {
        const preview = document.getElementById('brush-preview');
        preview.style.setProperty('--brush-color', this.drawingColor);
        preview.style.setProperty('--brush-size', this.brushSize + 'px');
      }

      // NEW: Update text preview
      updateTextPreview() {
        const preview = document.getElementById('text-preview');
        preview.style.color = this.textColor;
        preview.style.fontSize = this.textSize + 'px';
        preview.style.fontFamily = this.textFont;
        preview.textContent = document.getElementById('text-input').value || 'Sample Text';
      }

      // NEW: AI-powered text parsing using LLM
      async parseTextInputWithAI(text) {
        try {
          this.log('Parsing text with AI: ' + text);
          
          const response = await fetch('/api/parse-text-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: text })
          });
          
          if (!response.ok) {
            this.log('AI parsing failed, falling back to simple parsing');
            return this.parseTextInputSimple(text);
          }
          
          const result = await response.json();
          this.log('AI parsing result: ' + JSON.stringify(result));
          
          return {
            content: result.content || text,
            targetFace: result.targetFace,
            position: result.position,
            fontFamily: result.fontFamily || this.textFont,
            color: result.color || this.textColor,
            fontSize: result.fontSize || this.textSize
          };
          
        } catch (error) {
          this.log('AI parsing error: ' + error.message);
          return this.parseTextInputSimple(text);
        }
      }

      // Fallback simple text parsing
      parseTextInputSimple(text) {
        const result = {
          content: text,
          targetFace: null,
          position: 'absolute',
          fontFamily: this.textFont,
          color: this.textColor,
          fontSize: this.textSize
        };

        // Simple face detection
        if (text.toLowerCase().includes('face') || text.toLowerCase().includes('head')) {
          result.position = 'face-relative';
          result.targetFace = 0;
          
          // Try to extract quoted content
          const quotedMatch = text.match(/['"]([^'"]+)['"]/);
          if (quotedMatch) {
            result.content = quotedMatch[1];
          }
        }

        return result;
      }

      // NEW: Add text overlay
      async addTextOverlay() {
        const textInput = document.getElementById('text-input');
        const rawText = textInput.value.trim();
        
        if (!rawText) {
          this.updateStatus('Please enter some text to add 📝', 'error');
          return;
        }

        this.updateStatus('🤖 AI is interpreting your command...', 'loading');

        const parsed = await this.parseTextInputWithAI(rawText);
        this.log('Parsed text input:', parsed);

        if (parsed.position === 'face-relative') {
          this.addFaceRelativeText(parsed);
        } else {
          this.addAbsoluteText(parsed);
        }

        // Clear the input
        textInput.value = '';
        this.updateTextPreview();
      }

      // NEW: Add face-relative text (like accessories)
      addFaceRelativeText(parsed) {
        const targetFaceIndex = parsed.targetFace !== null ? parsed.targetFace : 0;
        
        if (this.detectedFaces.length === 0) {
          this.updateStatus('No faces detected! Please ensure your face is visible to add face-relative text.', 'error');
          return;
        }

        if (targetFaceIndex >= this.detectedFaces.length) {
          this.updateStatus('Face ' + (targetFaceIndex + 1) + ' not found! Only ' + this.detectedFaces.length + ' face(s) detected.', 'error');
          return;
        }

        // Use AI-determined positioning or fall back to manual detection
        let offsetX = 0;
        let offsetY = -60; // Default above head
        let positionDescription = 'above';

        if (parsed.offsetX !== undefined && parsed.offsetY !== undefined) {
          offsetX = parsed.offsetX;
          offsetY = parsed.offsetY;
          positionDescription = parsed.positionDescription || 'AI-positioned';
        } else {
          // Fallback to manual position detection
          const originalText = document.getElementById('text-input').value.toLowerCase();
          if (originalText.includes('left of')) {
            offsetX = -80;
            offsetY = 0;
            positionDescription = 'left of';
          } else if (originalText.includes('right of')) {
            offsetX = 80;
            offsetY = 0;
            positionDescription = 'right of';
          } else if (originalText.includes('below') || originalText.includes('under') || originalText.includes('bottom of')) {
            offsetX = 0;
            offsetY = 60;
            positionDescription = 'below';
          } else if (originalText.includes('above') || originalText.includes('over') || originalText.includes('top of')) {
            offsetX = 0;
            offsetY = -80;
            positionDescription = 'above';
          } else if (originalText.includes(' on ') || originalText.includes(' at ')) {
            offsetX = 0;
            offsetY = 0;
            positionDescription = 'on';
          }
        }

        // Add to accessory states as a text type
        const faceId = targetFaceIndex;
        if (!this.accessoryStates[faceId]) this.accessoryStates[faceId] = {};
        
        // Create a unique text key
        const textKey = 'text_' + this.nextTextId++;
        
        this.accessoryStates[faceId][textKey] = {
          type: 'text',
          content: parsed.content,
          offsetX: offsetX,
          offsetY: offsetY,
          scale: 1,
          rotation: 0,
          color: parsed.color || this.textColor,
          fontSize: parsed.fontSize || this.textSize,
          fontFamily: parsed.fontFamily || this.textFont
        };

        this.updateStatus('Added "' + parsed.content + '" ' + positionDescription + ' face ' + (targetFaceIndex + 1) + '! Drag to reposition. 📝', 'ready');
        this.log('Added face-relative text: ' + parsed.content + ' ' + positionDescription + ' face ' + (targetFaceIndex + 1));
      }

      // NEW: Add absolute positioned text
      addAbsoluteText(parsed) {
        const textOverlay = {
          id: this.nextTextId++,
          content: parsed.content,
          x: 50, // Default top-left position
          y: 50,
          color: this.textColor,
          fontSize: this.textSize,
          fontFamily: this.textFont,
          scale: 1,
          rotation: 0
        };

        this.textOverlays.push(textOverlay);
        
        this.updateStatus('Added text "' + parsed.content + '" at top-left! Drag to reposition. 📝', 'ready');
        this.log('Added absolute text: ' + parsed.content);
      }

      // NEW: Clear all text overlays
      clearText() {
        this.textOverlays = [];
        this.currentHaiku = null;
        this.selectedTextForEdit = null;
        this.selectedOverlay = null; // Clear any selected text
        
        // Reset trash to default auto mode
        this.showTrash = false;
        this.trashMode = 'auto';
        
        // Clear text from accessory states
        for (const faceId in this.accessoryStates) {
          for (const key in this.accessoryStates[faceId]) {
            if (key.startsWith('text_')) {
              delete this.accessoryStates[faceId][key];
            }
          }
        }
        
        // Hide text-related UI
        document.getElementById('haiku-container').style.display = 'none';
        document.getElementById('add-haiku-btn').style.display = 'none';
        document.getElementById('text-edit-panel').style.display = 'none';
        
        this.updateStatus('All text cleared! 🧹', 'ready');
        this.log('All text overlays cleared');
      }

      selectFilter(filterType) {
        this.selectedFilter = filterType;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector('[data-filter="' + filterType + '"]');
        if (selectedBtn) {
          selectedBtn.classList.add('selected');
        }
        
        this.applyFilterToVideo();
        this.log('Selected filter: ' + filterType);
      }

      applyFilterToVideo() {
        const filterClasses = ['filter-none', 'filter-sepia', 'filter-grayscale', 'filter-vintage', 'filter-warm', 'filter-cool', 'filter-dramatic', 'filter-dreamy'];
        filterClasses.forEach(cls => {
          this.video.classList.remove(cls);
        });
        
        this.video.classList.add('filter-' + this.selectedFilter);
        this.log('Applied filter to video: filter-' + this.selectedFilter);
      }

      async applyFilterDescription() {
        try {
          const descriptionInput = document.getElementById('filter-description');
          const applyBtn = document.getElementById('apply-description-btn');
          const interpretationDiv = document.getElementById('filter-interpretation');
          
          const description = descriptionInput.value.trim();
          
          if (!description) {
            this.updateStatus('Please enter a description for the filter 📝', 'error');
            return;
          }
          
          this.log('Applying filter description: ' + description);
          
          applyBtn.disabled = true;
          applyBtn.textContent = '🤖 Thinking...';
          this.updateStatus('🤖 AI is interpreting your description...', 'loading');
          
          const response = await fetch('/api/filter-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
          });
          
          this.log('Filter description response status: ' + response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            this.log('Filter description error response: ' + errorText);
            throw new Error('AI filter interpretation failed');
          }
          
          const result = await response.json();
          this.log('Filter description result: ' + JSON.stringify(result));
          
          this.selectFilter(result.filter);
          interpretationDiv.textContent = result.interpretation;
          interpretationDiv.style.display = 'block';
          descriptionInput.value = '';
          
          this.updateStatus('🎨 Filter applied! AI interpreted: "' + description + '" → ' + result.filter, 'ready');
          
        } catch (error) {
          console.error('Filter description error:', error);
          this.log('Filter description error: ' + error.message);
          this.updateStatus('Failed to interpret description ❌: ' + error.message, 'error');
        } finally {
          const applyBtn = document.getElementById('apply-description-btn');
          applyBtn.disabled = false;
          applyBtn.textContent = '🤖 Apply';
        }
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
        
        this.log('Face detection started');
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
        try {
          if (!this.overlayCtx) {
            console.error('No overlay context available');
            return;
          }

          this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
          this.ensureAccessoryStates();
          
          if (this.showFaceBoxes) {
            this.drawFaceBoxes();
          }
          
          // Draw face-relative accessories and text
          const drawOrder = ['face', 'hat', 'glasses', 'extra'];
          this.detectedFaces.forEach((detection, faceIdx) => {
            const bbox = detection.boundingBox;
            const landmarks = detection.keypoints;
            const faceId = detection.faceId || faceIdx;
            
            // Draw traditional accessories
            drawOrder.forEach(type => {
              this.drawAccessory(faceId, type, bbox, landmarks);
            });
            
            // Draw face-relative text
            this.drawFaceText(faceId, bbox, landmarks);
          });
          
          // Draw absolute positioned text overlays
          this.drawAbsoluteText();
          
          // NEW: Draw trash can if visible
          if (this.showTrash) {
            console.log('Drawing trash can in drawOverlays');
            this.drawTrashCan();
          }
          
        } catch (error) {
          console.error('Error in drawOverlays:', error);
        }
      }

      // NEW: Draw trash can in bottom-right corner
      drawTrashCan() {
        try {
          if (!this.overlayCtx) {
            console.error('No overlay context for trash can');
            return;
          }

          const trashX = this.overlayCanvas.width - 90;
          const trashY = this.overlayCanvas.height - 90;
          const trashSize = 70;
          
          console.log('Drawing trash can at:', trashX, trashY, 'size:', trashSize);
          
          const ctx = this.overlayCtx;
          
          // Draw trash can background circle
          ctx.save();
          ctx.fillStyle = 'rgba(244, 67, 54, 0.8)'; // Semi-transparent red
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(trashX + trashSize/2, trashY + trashSize/2, trashSize/2 - 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          // Draw trash can emoji
          ctx.font = '32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText('🗑️', trashX + trashSize/2, trashY + trashSize/2);
          
          // Add "DELETE" text below
          ctx.font = '12px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText('DELETE', trashX + trashSize/2, trashY + trashSize + 15);
          
          ctx.restore();
          
          console.log('Trash can drawn successfully');
          
        } catch (error) {
          console.error('Error drawing trash can:', error);
        }
      }

      // NEW: Test trash drawing (for debugging)
      testDrawTrash() {
        console.log('=== TESTING TRASH CAN DRAWING ===');
        console.log('showTrash:', this.showTrash);
        console.log('overlayCanvas:', this.overlayCanvas);
        console.log('overlayCtx:', this.overlayCtx);
        console.log('Canvas dimensions:', this.overlayCanvas?.width, 'x', this.overlayCanvas?.height);
        
        try {
          // Force clear and redraw
          this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
          
          // Draw just the trash can for testing
          this.drawTrashCan();
          
          console.log('Test trash drawing completed');
        } catch (error) {
          console.error('Test trash drawing error:', error);
        }
      }

      // NEW: Draw face-relative text
      drawFaceText(faceId, bbox, landmarks) {
        const faceStates = this.accessoryStates[faceId];
        if (!faceStates) return;
        
        for (const [key, state] of Object.entries(faceStates)) {
          if (!key.startsWith('text_') || !state.content) continue;
          
          const ctx = this.overlayCtx;
          const base = this.getLandmarkPosition(landmarks, 'hat', bbox); // Use hat position as base
          let x = base.x * this.overlayCanvas.width + state.offsetX;
          let y = base.y * this.overlayCanvas.height + state.offsetY;
          
          this.drawTextElement(ctx, state, x, y, faceId, key);
        }
      }

      // NEW: Draw absolute positioned text
      drawAbsoluteText() {
        const ctx = this.overlayCtx;
        
        this.textOverlays.forEach(textOverlay => {
          this.drawTextElement(ctx, textOverlay, textOverlay.x, textOverlay.y, 'absolute', textOverlay.id);
        });
      }

      // NEW: Draw individual text element
      drawTextElement(ctx, textState, x, y, containerId, elementId) {
        const fontSize = (textState.fontSize || this.textSize) * (textState.scale || 1);
        const rotation = textState.rotation || 0;
        const fontFamily = textState.fontFamily || this.textFont;
        
        ctx.save();
        ctx.font = fontSize + 'px ' + fontFamily;
        ctx.fillStyle = textState.color || this.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Add text stroke for better visibility
        ctx.lineWidth = 2;
        ctx.strokeStyle = textState.color === '#ffffff' ? '#000000' : '#ffffff';
        ctx.strokeText(textState.content, 0, 0);
        ctx.fillText(textState.content, 0, 0);
        
        ctx.restore();
        
        // Check if this text is selected and draw selection UI
        const isSelected = this.selectedOverlay && 
                          this.selectedOverlay.containerId === containerId && 
                          this.selectedOverlay.elementId === elementId;
        
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = 3;
          ctx.beginPath();
          
          // Estimate text bounds for selection box
          const textWidth = ctx.measureText(textState.content).width * (textState.scale || 1);
          const textHeight = fontSize;
          
          ctx.rect(x - textWidth/2 - 5, y - textHeight/2 - 5, textWidth + 10, textHeight + 10);
          ctx.stroke();
          ctx.restore();
          
          // Draw resize handle
          const handleRadius = Math.max(this.resizeHandleSize, fontSize * 0.12);
          const handleX = x + Math.cos(rotation) * textWidth * 0.6;
          const handleY = y + Math.sin(rotation) * textWidth * 0.6;
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
          ctx.fillStyle = '#ff9800';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
          ctx.restore();
          
          // Store handle position for interaction
          textState._handleX = handleX;
          textState._handleY = handleY;
          textState._handleRadius = handleRadius;
        }
        
        // Store drawn position for interaction
        textState._drawnX = x;
        textState._drawnY = y;
        textState._drawnFontSize = fontSize;
        textState._drawnRotation = rotation;
        textState._containerId = containerId;
        textState._elementId = elementId;
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
        
        const isSelected = this.selectedOverlay && 
                          this.selectedOverlay.containerId === faceId && 
                          this.selectedOverlay.elementId === type;
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
        state._containerId = faceId;
        state._elementId = type;
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

      // UPDATED: Capture photo with auto-save and confirmation
      async capturePhoto() {
        this.log('Capturing photo...');
        this.updateStatus('📸 Capturing photo...', 'loading');
        
        const canvas = this.capturedCanvas;
        const ctx = this.capturedCtx;
        const container = document.getElementById('captured-photo-container');
        
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        
        ctx.filter = 'none';
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.video.videoWidth;
        tempCanvas.height = this.video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (this.selectedFilter !== 'none') {
          tempCtx.filter = this.getFilterCSS(this.selectedFilter);
        }
        
        tempCtx.drawImage(this.video, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = 'none';
        ctx.drawImage(this.overlayCanvas, 0, 0);
        ctx.drawImage(this.drawingCanvas, 0, 0);
        
        const filterClasses = ['filter-none', 'filter-sepia', 'filter-grayscale', 'filter-vintage', 'filter-warm', 'filter-cool', 'filter-dramatic', 'filter-dreamy'];
        filterClasses.forEach(cls => {
          canvas.classList.remove(cls);
        });
        
        container.classList.add('show');
        
        document.getElementById('download-btn').style.display = 'block';
        document.getElementById('upload-btn').style.display = 'block';
        document.getElementById('share-btn').style.display = 'none';
        document.getElementById('haiku-btn').style.display = 'block';
        
        const textCount = this.textOverlays.length + Object.values(this.accessoryStates).reduce((count, face) => {
          return count + Object.keys(face).filter(key => key.startsWith('text_')).length;
        }, 0);
        
        // Show capture confirmation immediately
        this.showCaptureConfirmation();
        
        this.updateStatus('📸 Photo captured! Auto-saving to cloud...', 'loading');
        this.log('Photo captured successfully with filter: ' + this.selectedFilter + ', text elements: ' + textCount);
        
        // Auto-save if enabled and not already uploading
        if (this.autoSave && !this.isUploading) {
          try {
            await this.uploadPhoto();
          } catch (error) {
            console.error('Auto-upload failed:', error);
            this.updateStatus('📸 Photo captured! Auto-save failed - use "Save to Cloud" button to try again. 💾', 'error');
          }
        } else {
          this.updateStatus('📸 Photo captured! Click "Save to Cloud" to upload. 💾', 'ready');
        }
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

      // UPDATED: Upload photo with upload state tracking
      async uploadPhoto() {
        if (this.isUploading) {
          this.log('Upload already in progress, skipping');
          return;
        }

        try {
          this.isUploading = true;
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
          formData.append('textOverlays', JSON.stringify(this.textOverlays)); // NEW: Include text overlays
          formData.append('textCount', (this.textOverlays.length + Object.values(this.accessoryStates).reduce((count, face) => {
            return count + Object.keys(face).filter(key => key.startsWith('text_')).length;
          }, 0)).toString());
          
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
          this.updateStatus('✅ Photo saved to cloud! Creative filename: ' + result.filename, 'ready');
          this.loadGallery();
          
        } catch (error) {
          console.error('Upload error:', error);
          this.log('Upload error: ' + error.message);
          this.updateStatus('Upload failed ❌: ' + error.message, 'error');
        } finally {
          this.isUploading = false;
        }
      }

      async generateHaiku() {
        try {
          this.log('Generating AI haiku...');
          this.updateStatus('🤖 AI is composing a haiku about your photo...', 'loading');
          
          const metadata = {
            accessories: this.selectedAccessories,
            filter: this.selectedFilter,
            hasDrawing: this.hasDrawing,
            textOverlays: this.textOverlays,
            photoId: this.lastPhotoId
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
          
          this.displayHaiku(result.haiku);
          
          if (result.savedToKV) {
            this.updateStatus('🎌 AI haiku generated and saved! ✨', 'ready');
          } else {
            this.updateStatus('🎌 AI haiku generated! ✨ (Upload photo first to save haiku)', 'ready');
          }
          
        } catch (error) {
          console.error('Haiku generation error:', error);
          this.log('Haiku error: ' + error.message);
          this.updateStatus('Haiku generation failed ❌: ' + error.message, 'error');
        }
      }

      async loadHaikuForPhoto(photoId) {
        try {
          this.log('Loading saved haiku for photo: ' + photoId);
          
          const response = await fetch('/api/haiku/' + photoId, {
            method: 'GET'
          });
          
          if (response.status === 404) {
            this.log('No saved haiku found for this photo');
            return null;
          }
          
          if (!response.ok) {
            throw new Error('Failed to load haiku');
          }
          
          const result = await response.json();
          this.log('Loaded haiku: ' + result.haiku);
          
          return result;
          
        } catch (error) {
          console.error('Haiku loading error:', error);
          this.log('Haiku loading error: ' + error.message);
          return null;
        }
      }

      // NEW: Update UI controls to reflect selected text properties
      updateUIForSelectedText(element, elementId) {
        // Only update UI for text elements
        if (!element.content && !elementId.startsWith('text_')) return;
        
        const textColor = element.color || this.textColor;
        const textSize = element.fontSize || this.textSize;
        const textFont = element.fontFamily || this.textFont;
        
        // Update color button selection
        document.querySelectorAll('.text-color-btn').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.color === textColor);
        });
        
        // Update text size slider
        const textSizeSlider = document.getElementById('text-size');
        if (textSizeSlider) {
          textSizeSlider.value = textSize;
        }
        
        // Update font button selection
        document.querySelectorAll('.font-btn').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.font === textFont);
        });
        
        // Update the global text properties to match selected text
        this.textColor = textColor;
        this.textSize = textSize;
        this.textFont = textFont;
        
        // Update text preview
        this.updateTextPreview();
        
        this.log('Updated UI controls for selected text: color=' + textColor + ', size=' + textSize + ', font=' + textFont);
      }

      // NEW: Toggle trash can visibility
      toggleTrash() {
        try {
          // Cycle through modes: auto -> always -> never -> auto
          if (this.trashMode === 'auto') {
            this.trashMode = 'always';
            this.showTrash = true;
          } else if (this.trashMode === 'always') {
            this.trashMode = 'never';
            this.showTrash = false;
          } else {
            this.trashMode = 'auto';
            this.showTrash = false;
          }
          
          console.log('Toggled trash mode to:', this.trashMode, 'showTrash:', this.showTrash);
          
          const button = document.getElementById('toggle-trash-btn');
          if (button) {
            const buttonText = {
              'auto': '🗑️ Auto Trash',
              'always': '🗑️ Always Show',
              'never': '🗑️ Never Show'
            };
            button.textContent = buttonText[this.trashMode];
            button.classList.toggle('active', this.trashMode === 'always');
          }
          
          const statusText = {
            'auto': '🗑️ Trash will show when dragging elements',
            'always': '🗑️ Trash can is now always visible!',
            'never': '🗑️ Trash can is disabled (no deletion possible)'
          };
          this.updateStatus(statusText[this.trashMode], 'ready');
          
          // Force redraw
          console.log('Forcing redraw after toggle');
          this.drawOverlays();
          
        } catch (error) {
          console.error('Error in toggleTrash:', error);
        }
      }

      // NEW: Enable text editing for selected element
      enableTextEditing(textElement, containerId, elementId) {
        this.selectedTextForEdit = {
          element: textElement,
          containerId: containerId,
          elementId: elementId
        };

        // Show edit panel
        const editPanel = document.getElementById('text-edit-panel');
        editPanel.style.display = 'block';

        // Populate current values
        document.getElementById('edit-text-color').value = textElement.color || this.textColor;
        document.getElementById('edit-text-size').value = textElement.fontSize || this.textSize;
        document.getElementById('edit-text-content').value = textElement.content || '';
        
        // Update font selection
        const currentFont = textElement.fontFamily || this.textFont;
        document.querySelectorAll('.edit-font-btn').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.font === currentFont);
        });

        this.updateStatus('Editing text: "' + (textElement.content || '').substring(0, 20) + '..." 📝', 'ready');
        this.log('Enabled text editing for: ' + textElement.content);
      }

      // NEW: Apply text edits
      applyTextEdits() {
        if (!this.selectedTextForEdit) return;

        const element = this.selectedTextForEdit.element;
        const newContent = document.getElementById('edit-text-content').value.trim();
        const newColor = document.getElementById('edit-text-color').value;
        const newSize = parseInt(document.getElementById('edit-text-size').value);
        
        // Get selected font
        const selectedFontBtn = document.querySelector('.edit-font-btn.selected');
        const newFont = selectedFontBtn ? selectedFontBtn.dataset.font : this.textFont;

        if (!newContent) {
          this.updateStatus('Text content cannot be empty! 📝', 'error');
          return;
        }

        // Apply changes
        element.content = newContent;
        element.color = newColor;
        element.fontSize = newSize;
        element.fontFamily = newFont;

        this.cancelTextEditing();
        this.updateStatus('Text updated successfully! ✅', 'ready');
        this.log('Applied text edits: ' + newContent);
      }

      // NEW: Cancel text editing
      cancelTextEditing() {
        this.selectedTextForEdit = null;
        document.getElementById('text-edit-panel').style.display = 'none';
        this.selectedOverlay = null;
        this.drawOverlays();
      }

      // NEW: Check if position is over trash can
      isOverTrash(x, y) {
        if (!this.showTrash || this.trashMode === 'never') return false;
        
        const trashX = this.overlayCanvas.width - 90;
        const trashY = this.overlayCanvas.height - 90;
        const trashSize = 70;
        
        const isOver = x >= trashX && x <= trashX + trashSize && 
                       y >= trashY && y <= trashY + trashSize;
        
        if (isOver) {
          this.log('Mouse is over trash can area!');
        }
        
        return isOver;
      }

      // NEW: Delete any element (text or accessory)
      deleteElement(containerId, elementId) {
        if (containerId === 'absolute') {
          // Remove from absolute text overlays
          this.textOverlays = this.textOverlays.filter(overlay => overlay.id !== elementId);
          this.updateStatus('Text deleted! 🗑️', 'ready');
        } else {
          // Handle face-relative elements (both text and accessories)
          if (this.accessoryStates[containerId] && this.accessoryStates[containerId][elementId]) {
            if (elementId.startsWith('text_')) {
              // It's face-relative text
              delete this.accessoryStates[containerId][elementId];
              this.updateStatus('Text deleted! 🗑️', 'ready');
            } else {
              // It's an emoji accessory (hat, glasses, face, extra)
              delete this.accessoryStates[containerId][elementId];
              // Also clear from selected accessories so it doesn't reappear
              if (this.selectedAccessories[elementId]) {
                this.selectedAccessories[elementId] = null;
                // Update UI to show accessory is deselected
                document.querySelectorAll('[data-type="' + elementId + '"]').forEach(btn => 
                  btn.classList.remove('selected')
                );
              }
              this.updateStatus('Accessory deleted! 🗑️', 'ready');
            }
          }
        }
        
        this.log('Deleted element: ' + containerId + '/' + elementId);
      }

      // Legacy function - now just calls the general delete function
      deleteTextElement(containerId, elementId) {
        this.deleteElement(containerId, elementId);
      }
      
      addHaikuToCanvas() {
        if (!this.currentHaiku) {
          this.updateStatus('No haiku available to add! Generate a haiku first. 🎌', 'error');
          return;
        }

        const textOverlay = {
          id: this.nextTextId++,
          content: this.currentHaiku,
          x: this.overlayCanvas.width * 0.75, // Place in bottom right area
          y: this.overlayCanvas.height * 0.8,
          color: this.textColor,
          fontSize: Math.max(16, this.textSize - 8), // Slightly smaller for haiku
          fontFamily: this.textFont,
          scale: 1,
          rotation: 0
        };

        this.textOverlays.push(textOverlay);
        
        this.updateStatus('Haiku added to photo! 🎌📝 Drag to reposition.', 'ready');
        this.log('Added haiku to canvas: ' + this.currentHaiku.substring(0, 20) + '...');
        
        // Hide the add button since haiku is now on canvas
        document.getElementById('add-haiku-btn').style.display = 'none';
      }

      displayHaiku(haiku) {
        this.currentHaiku = haiku; // Store for adding to canvas
        
        const haikuContainer = document.getElementById('haiku-container');
        const haikuText = document.getElementById('haiku-text');
        
        haikuText.textContent = haiku;
        haikuContainer.style.display = 'block';
        
        // Show the "Add to Photo" button
        document.getElementById('add-haiku-btn').style.display = 'inline-block';
        
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
        this.selectedOverlay = null; // Clear any selected overlays
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
        this.clearText(); // NEW: Clear text as well
        
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

      // Updated to handle text elements and update UI controls
      onOverlayPointerDown(e) {
        const pos = this.getPointerPos(e);
        let found = null;
        let foundResize = null;
        
        // Check absolute text overlays
        for (const textOverlay of this.textOverlays) {
          if (!textOverlay._drawnX || !textOverlay._drawnY) continue;
          
          const x = textOverlay._drawnX;
          const y = textOverlay._drawnY;
          const fontSize = textOverlay._drawnFontSize || textOverlay.fontSize || this.textSize;
          
          // Check handle first
          if (textOverlay._handleX && textOverlay._handleY) {
            const distToHandle = Math.hypot(pos.x - textOverlay._handleX, pos.y - textOverlay._handleY);
            if (distToHandle < (textOverlay._handleRadius || this.resizeHandleSize)) {
              foundResize = { containerId: 'absolute', elementId: textOverlay.id, element: textOverlay };
            }
          }
          
          // Check text bounds
          const textWidth = this.overlayCtx.measureText(textOverlay.content).width * (textOverlay.scale || 1);
          const textHeight = fontSize;
          
          if (pos.x >= x - textWidth/2 - 5 && pos.x <= x + textWidth/2 + 5 &&
              pos.y >= y - textHeight/2 - 5 && pos.y <= y + textHeight/2 + 5) {
            found = { containerId: 'absolute', elementId: textOverlay.id, element: textOverlay };
          }
        }
        
        // Check face-relative accessories and text
        for (const [faceId, types] of Object.entries(this.accessoryStates)) {
          for (const [type, state] of Object.entries(types)) {
            if ((!state.emoji && !state.content) || !state._drawnX || !state._drawnY) continue;
            
            const x = state._drawnX;
            const y = state._drawnY;
            const fontSize = state._drawnFontSize;
            
            // Check handle
            if (state._handleX && state._handleY) {
              const distToHandle = Math.hypot(pos.x - state._handleX, pos.y - state._handleY);
              if (distToHandle < (state._handleRadius || this.resizeHandleSize)) {
                foundResize = { containerId: faceId, elementId: type, element: state };
              }
            }
            
            // Check element bounds
            let hitRadius = fontSize * 0.6;
            if (type.startsWith('text_')) {
              const textWidth = this.overlayCtx.measureText(state.content).width * (state.scale || 1);
              const textHeight = fontSize;
              if (pos.x >= x - textWidth/2 - 5 && pos.x <= x + textWidth/2 + 5 &&
                  pos.y >= y - textHeight/2 - 5 && pos.y <= y + textHeight/2 + 5) {
                found = { containerId: faceId, elementId: type, element: state };
              }
            } else {
              const dist = Math.hypot(pos.x - x, pos.y - y);
              if (dist < hitRadius) {
                found = { containerId: faceId, elementId: type, element: state };
              }
            }
          }
        }
        
        if (foundResize) {
          this.selectedOverlay = foundResize;
          this.resizeMode = true;
          const state = foundResize.element;
          const x = state._drawnX;
          const y = state._drawnY;
          const dx = pos.x - x;
          const dy = pos.y - y;
          this.resizeStart = {
            x: pos.x,
            y: pos.y,
            scale: state.scale || 1,
            rotation: state.rotation || 0,
            offsetX: state.offsetX || 0,
            offsetY: state.offsetY || 0,
            cx: x,
            cy: y,
            startAngle: Math.atan2(dy, dx),
            startDist: Math.sqrt(dx * dx + dy * dy)
          };
          this.dragStart = { offsetX: state.offsetX || 0, offsetY: state.offsetY || 0 };
          
          // Show trash can when starting to drag (if in auto mode)
          if (this.trashMode === 'auto' && !this.showTrash) {
            this.showTrash = true;
            this.drawOverlays();
          }
          
          // Update UI controls if text is selected
          this.updateUIForSelectedText(foundResize.element, foundResize.elementId);
          
          e.preventDefault();
          return;
        }
        
        if (found) {
          this.selectedOverlay = found;
          const state = found.element;
          this.dragOffset = { x: pos.x - state._drawnX, y: pos.y - state._drawnY };
          this.isDragging = true;
          this.dragStart = { 
            offsetX: state.offsetX || (found.containerId === 'absolute' ? state.x : 0), 
            offsetY: state.offsetY || (found.containerId === 'absolute' ? state.y : 0)
          };
          
          // Show trash can when starting to drag (if in auto mode)
          if (this.trashMode === 'auto' && !this.showTrash) {
            this.showTrash = true;
            this.drawOverlays();
          }
          
          // Update UI controls if text is selected
          this.updateUIForSelectedText(found.element, found.elementId);
          
          e.preventDefault();
        } else {
          // Clicked on empty area - clear selection
          this.selectedOverlay = null;
          this.drawOverlays();
        }
      }

      onOverlayPointerMove(e) {
        const pos = this.getPointerPos(e);
        
        if (this.resizeMode && this.selectedOverlay) {
          const state = this.selectedOverlay.element;
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
        
        const pos2 = this.getPointerPos(e);
        const state = this.selectedOverlay.element;
        
        if (this.selectedOverlay.containerId === 'absolute') {
          // Absolute positioned text
          state.x = this.dragStart.offsetX + (pos2.x - state._drawnX);
          state.y = this.dragStart.offsetY + (pos2.y - state._drawnY);
        } else {
          // Face-relative positioned element
          state.offsetX = this.dragStart.offsetX + (pos2.x - state._drawnX);
          state.offsetY = this.dragStart.offsetY + (pos2.y - state._drawnY);
        }
        
        // Visual feedback when dragging over trash
        if (this.showTrash && this.isOverTrash(pos2.x, pos2.y)) {
          this.overlayCanvas.style.cursor = 'pointer';
          // Could add a visual highlight effect here if desired
        }
        
        this.drawOverlays();
        e.preventDefault();
      }

      // NEW: Handle double-click for text editing
      onOverlayDoubleClick(e) {
        const pos = this.getPointerPos(e);
        let foundText = null;
        
        // Check absolute text overlays
        for (const textOverlay of this.textOverlays) {
          if (!textOverlay._drawnX || !textOverlay._drawnY) continue;
          
          const x = textOverlay._drawnX;
          const y = textOverlay._drawnY;
          const fontSize = textOverlay._drawnFontSize || textOverlay.fontSize || this.textSize;
          const textWidth = this.overlayCtx.measureText(textOverlay.content).width * (textOverlay.scale || 1);
          const textHeight = fontSize;
          
          if (pos.x >= x - textWidth/2 - 5 && pos.x <= x + textWidth/2 + 5 &&
              pos.y >= y - textHeight/2 - 5 && pos.y <= y + textHeight/2 + 5) {
            foundText = { element: textOverlay, containerId: 'absolute', elementId: textOverlay.id };
            break;
          }
        }
        
        // Check face-relative text
        if (!foundText) {
          for (const [faceId, types] of Object.entries(this.accessoryStates)) {
            for (const [type, state] of Object.entries(types)) {
              if (!type.startsWith('text_') || !state.content) continue;
              if (!state._drawnX || !state._drawnY) continue;
              
              const x = state._drawnX;
              const y = state._drawnY;
              const fontSize = state._drawnFontSize;
              const textWidth = this.overlayCtx.measureText(state.content).width * (state.scale || 1);
              const textHeight = fontSize;
              
              if (pos.x >= x - textWidth/2 - 5 && pos.x <= x + textWidth/2 + 5 &&
                  pos.y >= y - textHeight/2 - 5 && pos.y <= y + textHeight/2 + 5) {
                foundText = { element: state, containerId: faceId, elementId: type };
                break;
              }
            }
            if (foundText) break;
          }
        }
        
        if (foundText) {
          this.enableTextEditing(foundText.element, foundText.containerId, foundText.elementId);
          e.preventDefault();
        }
      }

      onOverlayPointerUp(e) {
        if (this.isDragging && this.selectedOverlay) {
          // Check if released over trash (but not in 'never' mode)
          const pos = this.getPointerPos(e);
          if (this.trashMode !== 'never' && this.isOverTrash(pos.x, pos.y)) {
            this.deleteTextElement(this.selectedOverlay.containerId, this.selectedOverlay.elementId);
            this.selectedOverlay = null;
            this.isDragging = false;
            this.resizeMode = false;
            // Hide trash after deletion (if in auto mode)
            if (this.trashMode === 'auto') {
              this.showTrash = false;
            }
            this.drawOverlays();
            return;
          }
        }
        
        this.isDragging = false;
        this.resizeMode = false;
        
        // Hide trash can when dragging ends (only in auto mode)
        if (this.trashMode === 'auto' && this.showTrash) {
          this.showTrash = false;
        }
        
        // Keep the overlay selected for continued editing
        // Don't clear this.selectedOverlay here so user can continue editing
        
        this.drawOverlays();
      }

      onWheel(e) {
        if (!this.selectedOverlay) return;
        const state = this.selectedOverlay.element;
        state.scale = (state.scale || 1) + (e.deltaY < 0 ? 0.1 : -0.1);
        state.scale = Math.max(0.3, Math.min(4, state.scale));
        this.drawOverlays();
        e.preventDefault();
      }

      onCursorFeedback(e) {
        const pos = this.getPointerPos(e);
        let overHandle = false;
        let overTrash = this.isOverTrash(pos.x, pos.y);
        
        // Check absolute text overlays
        for (const textOverlay of this.textOverlays) {
          if (textOverlay._handleX && textOverlay._handleY && textOverlay._handleRadius) {
            const dist = Math.hypot(pos.x - textOverlay._handleX, pos.y - textOverlay._handleY);
            if (dist < textOverlay._handleRadius) {
              overHandle = true;
              break;
            }
          }
        }
        
        // Check face-relative elements
        if (!overHandle) {
          for (const [faceId, types] of Object.entries(this.accessoryStates)) {
            for (const [type, state] of Object.entries(types)) {
              if (!state.emoji && !state.content) continue;
              if (typeof state._handleX === 'number' && typeof state._handleY === 'number' && typeof state._handleRadius === 'number') {
                const dist = Math.hypot(pos.x - state._handleX, pos.y - state._handleY);
                if (dist < state._handleRadius) {
                  overHandle = true;
                  break;
                }
              }
            }
            if (overHandle) break;
          }
        }
        
        if (overTrash) {
          this.overlayCanvas.style.cursor = 'pointer';
        } else if (overHandle) {
          this.overlayCanvas.style.cursor = 'nwse-resize';
        } else {
          this.overlayCanvas.style.cursor = '';
        }
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