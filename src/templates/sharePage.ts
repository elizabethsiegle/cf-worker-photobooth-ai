export function generateSharePageHTML(baseUrl: string, photoId: string): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <title>Shared Photo - Cloud Photo Booth</title>
      <meta property="og:title" content="Check out my photo booth picture!" />
      <meta property="og:image" content="${baseUrl}/api/photo/${photoId}" />
      <meta property="og:description" content="Made with Cloud Photo Booth" />
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        }
        .container { 
          background: white; 
          border-radius: 20px; 
          padding: 30px; 
          max-width: 600px; 
          margin: 0 auto; 
        }
        img { 
          max-width: 100%; 
          border-radius: 15px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
        }
        .btn { 
          padding: 15px 25px; 
          background: linear-gradient(135deg, #667eea, #764ba2); 
          color: white; 
          border: none; 
          border-radius: 12px; 
          text-decoration: none; 
          margin: 10px; 
          display: inline-block; 
        }
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
  }
  