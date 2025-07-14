### Cloudflare AI Photo Booth w/ Mediapipe 
A real-time face detection photo booth with drawing tools, Instagram-style filters, and cloud storage (R2). Built with Cloudflare Workers, MediaPipe, HTML5 Canvas, and Cloudflare R2.

#### Features

- Real-time face detection using [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js)
- Interactive accessories - add, drag, resize, rotate, and remove emojis on faces and heads
- Drawing mode with customizable brushes and colors to write/draw directly on picture
- Instagram-style filters (Sepia, B&W, Vintage, Warm, Cool, Dramatic, Dreamy) + AI-generated filters you describe
- Cloud storage with [Cloudflare R2](https://developers.cloudflare.com/r2/)
- Aggregate analytics data storage + photo sharing management with [Cloudflare KV](https://developers.cloudflare.com/kv/)
- AI haiku generation about your photos w/ [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/)
- AI-powered creative R2 filenames using Workers AI (Llama 4 Scout)
- LLM observability with [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- Photo sharing with shareable links
- Gallery view of all photos saved to R2

#### Prerequisites

- Node.js 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) for Workers, KV, and R2
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

#### Get Started
1. Clone + install
```bash
git clone https://github.com/elizabethsiegle/cf-worker-photobooth-ai.git
cd cf-worker-photobooth-ai # photoboothworkerai
npm install # npm install @mediapipe/tasks-vision
# Install Wrangler CLI if not already installed
npm install -g wrangler
```
2. Setup Cloudflare R2
```bash
wrangler r2 bucket create photobooth-photos
```

3. Setup Cloudflare KV
```bash
wrangler kv:namespace create PHOTOBOOTH_KV 
```

4. Update your `wrangler.jsonc` with the info returned in steps 2 and 3
```jsonc
"ai": { // for ai gateway and llama model to generate haiku and r2 image names, parse filter and image queries
		"binding": "AI"
	},
"kv_namespaces": [
		{ 
			"binding": "PHOTOBOOTH_KV",
			"id": "YOUR-ID"
		}
	],
	"r2_buckets": [
    {
      "binding": "PHOTOBOOTH_PHOTOS",
      "bucket_name": "photobooth-photos"
    }
  ]
```

#### Development
##### Local Development
```bash
# Start local development server
npm run dev

# Alternative: Use Wrangler directly
wrangler dev
```

#### Deploy to Cloudflare Workers
```bash
# Deploy to production
npm run deploy

# Alternative: Use Wrangler directly
wrangler deploy
```