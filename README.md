# DOC-MIND: The Neural AI Brain 🧠

DOC-MIND is a cutting-edge document intelligence platform powered by **Google Gemini**. It transforms static PDFs into interactive, conversational knowledge bases with real-time streaming and voice synthesis.

## 🚀 Advanced Features

- **⚡ Neural Streaming**: Zero-latency responses. Watch the AI "think" and respond word-by-word in real-time.
- **🗣️ Neural Voice (TTS)**: One-click "Read Aloud" functionality using Gemini's professional-grade text-to-speech.
- **🌐 Deep Search (Grounding)**: Toggle web-search capabilities to verify document facts against the live internet.
- **📄 Privacy-First Analysis**: Documents are processed via secure Base64 streams. No data is stored or logged.
- **🎨 Elite UI/UX**: A dark-mode, glassmorphic terminal designed for high-focus document extraction.
- **📝 Markdown Rendering**: AI responses are beautifully formatted with full markdown support.
- **♿ Accessibility**: WCAG-compliant with proper ARIA labels and screen reader support.

## 🛠️ Technology Stack

- **Engine**: Google Gemini 2.0 Flash
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Glassmorphic design
- **Build**: Vite 6
- **SDK**: `@google/genai` (Native Audio & Streaming)
- **Deployment**: Vercel (with secure serverless API)

## 🔒 Security Architecture

In production (Vercel), API calls are proxied through serverless functions to keep your API key secure:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  /api/analyze    │────▶│   Gemini    │
│   Client    │────▶│  /api/chat       │────▶│    API      │
│             │────▶│  /api/tts        │────▶│             │
└─────────────┘     └──────────────────┘     └─────────────┘
                    (API key hidden here)
```

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- A Google AI Studio API Key ([Get it here](https://aistudio.google.com/))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlphaTab435/doc-mind-the-neural-ai-brain.git
   cd doc-mind-the-neural-ai-brain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file (see `.env.example`):
   ```env
   VITE_API_KEY=your_gemini_key
   VITE_ENABLE_SEARCH=true  # Optional: Set to true to enable web search (paid quota required)
   ```

4. **Launch dev server**
   ```bash
   npm start
   ```

### Vercel Deployment

1. **Connect to Vercel**
   - Push to GitHub
   - Import project in [Vercel Dashboard](https://vercel.com/new)

2. **Configure Environment Variables**
   
   In Vercel Dashboard → Project Settings → Environment Variables:
   ```
   GEMINI_API_KEY = your_gemini_key
   ```

3. **Deploy**
   - Vercel auto-deploys on push to `main`

> **Note**: The `GEMINI_API_KEY` (server-side) is different from `VITE_API_KEY` (client-side). In production, only `GEMINI_API_KEY` is used and remains hidden.

## 📁 Project Structure

```
doc-mind-the-neural-ai-brain/
├── api/                    # Vercel Serverless Functions
│   ├── analyze.ts          # Document analysis endpoint
│   ├── chat.ts             # Streaming chat endpoint
│   └── tts.ts              # Text-to-speech endpoint
├── components/
│   ├── Chat.tsx            # Chat interface with markdown
│   ├── DocumentStats.tsx   # Document info & TTS
│   └── FileUpload.tsx      # PDF upload with drag & drop
├── services/
│   └── gemini.ts           # API client (proxy in prod, direct in dev)
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main application
├── index.html              # Entry HTML
└── vercel.json             # Vercel configuration
```

## 🛡️ Data Security

- **Local Context**: Your conversation history stays in your browser's RAM.
- **Secure Proxy**: In production, API keys never reach the client.
- **Direct Link**: Encrypted communication between client ↔ serverless ↔ Gemini.
- **Session Wipe**: Click the reset icon to instantly clear all buffers.

## 🧪 Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Run with Vercel Dev (test serverless functions locally)
```bash
npx vercel dev
```

## 📜 License

MIT License - Feel free to use and modify.

---
*Built for speed. Designed for intelligence. Secured by architecture.*