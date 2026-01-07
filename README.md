# DOC-MIND: The Neural AI Brain 🧠

DOC-MIND is a cutting-edge document intelligence platform powered by **Google Gemini 3**. It transforms static PDFs into interactive, conversational knowledge bases with real-time streaming and voice synthesis.

## 🚀 Advanced Features

- **⚡ Neural Streaming**: Zero-latency responses. Watch the AI "think" and respond word-by-word in real-time.
- **🗣️ Neural Voice (TTS)**: One-click "Read Aloud" functionality using Gemini's professional-grade text-to-speech.
- **🌐 Deep Search (Grounding)**: Toggle web-search capabilities to verify document facts against the live internet.
- **📄 Privacy-First Analysis**: Documents are processed via secure Base64 streams. No data is stored or logged.
- **🎨 Elite UI/UX**: A dark-mode, glassmorphic terminal designed for high-focus document extraction.

## 🛠️ Technology Stack

- **Engine**: Google Gemini 3 (Flash & Pro versions)
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Framer-inspired animations
- **SDK**: Latest `@google/genai` (Native Audio & Streaming supported)

## 🔧 Getting Started

### Prerequisites
- A Google AI Studio API Key ([Get it here](https://aistudio.google.com/))

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Setup:
   Create a `.env` file:
   ```env
   VITE_API_KEY=your_gemini_key
   ```
4. Launch:
   ```bash
   npm start
   ```

## 🛡️ Data Security
- **Local Context**: Your conversation history stays in your browser's RAM.
- **Direct Link**: Secure, encrypted communication directly between your client and the Gemini API.
- **Session Wipe**: Click the reset icon to instantly clear all buffers and metadata from the current session.

---
*Built for speed. Designed for intelligence.*