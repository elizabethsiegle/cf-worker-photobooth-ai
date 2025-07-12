// File: templates/sharePage.ts
// Template for shared photo pages

export function generateSharePageHTML(baseUrl: string, photoId: string): string {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shared Photo - AI Photo Booth</title>
    <meta property="og:title" content="Check out my AI Photo Booth creation!">
    <meta property="og:description" content="A fun photo with AI-generated effects and accessories">
    <meta property="og:image" content="${baseUrl}/api/photo/${photoId}">
    <meta property="og:type" content="image">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${baseUrl}/api/photo/${photoId}">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .container {
        background: white;
        border-radius: 20px;
        padding: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 600px;
        width: 100%;
      }
      
      .title {
        font-size: 2rem;
        margin-bottom: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .subtitle {
        color: #666;
        margin-bottom: 30px;
        font-size: 1rem;
      }
      
      .photo-container {
        margin: 20px 0;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }
      
      .photo {
        width: 100%;
        height: auto;
        display: block;
      }
      
      .actions {
        margin-top: 30px;
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .btn-secondary {
        background: #f8f9fa;
        color: #495057;
        border: 2px solid #dee2e6;
      }
      
      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      }
      
      .footer {
        margin-top: 30px;
        color: #888;
        font-size: 0.9rem;
      }
      
      .footer a {
        color: #667eea;
        text-decoration: none;
      }
      
      @media (max-width: 480px) {
        .container {
          padding: 20px;
        }
        
        .title {
          font-size: 1.5rem;
        }
        
        .actions {
          flex-direction: column;
        }
        
        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="title">🎭 AI Photo Booth</h1>
      <p class="subtitle">Someone shared their creative photo with you!</p>
      
      <div class="photo-container">
        <img src="${baseUrl}/api/photo/${photoId}" alt="Shared Photo" class="photo" />
      </div>
      
      <div class="actions">
        <a href="${baseUrl}" class="btn btn-primary">
          🎨 Create Your Own
        </a>
        <button onclick="downloadPhoto()" class="btn btn-secondary">
          💾 Download
        </button>
        <button onclick="sharePhoto()" class="btn btn-secondary">
          📤 Share
        </button>
      </div>
      
      <div class="footer">
        Made with ♥ using 
        <a href="https://workers.cloudflare.com" target="_blank">Cloudflare Workers</a>, 
        <a href="https://mediapipe.dev" target="_blank">MediaPipe</a> & 
        <a href="https://developers.cloudflare.com/workers-ai/" target="_blank">Workers AI</a>
      </div>
    </div>
  
    <script>
      function downloadPhoto() {
        const link = document.createElement('a');
        link.href = '${baseUrl}/api/photo/${photoId}';
        link.download = 'ai-photo-booth-${photoId}';
        link.click();
      }
      
      async function sharePhoto() {
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Check out my AI Photo Booth creation!',
              text: 'I made this fun photo with AI-generated effects!',
              url: window.location.href
            });
          } catch (err) {
            copyToClipboard();
          }
        } else {
          copyToClipboard();
        }
      }
      
      function copyToClipboard() {
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Link copied to clipboard! 📋');
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = window.location.href;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Link copied to clipboard! 📋');
        });
      }
    </script>
  </body>
  </html>`;
  }