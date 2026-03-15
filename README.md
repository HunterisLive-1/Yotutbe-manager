# YouTube AI Dashboard / MAYA Insights

An advanced, AI-powered local dashboard designed to help automate YouTube channel growth, metadata generation, video analytics, and content strategy using Google Gemini 2.0 and Anthropic Claude. Built for modern creators.

![YT Dashboard Overview](https://img.shields.io/badge/Status-Active-brightgreen) ![Tech Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20FastAPI%20%7C%20TailwindCSS-blue)

## ✨ Core Features
- **Channel Intelligence:** Beautiful dashboard with top analytics, format comparisons, and AI-calibrated prime posting windows.
- **AI Strategy Chat:** Conversational interface (Hinglish/English) powered by Gemini or Claude to help brainstorm ideas based on your channel's specific data.
- **Video Manager & Metadata Generator:** Automatically generate emotional/curiosity-driven titles, SEO descriptions, and tags. Apply them directly to your YouTube videos with 1-click.
- **AI Video Analyzer:** Upload a draft video and get it analyzed by Gemini Vision. Receive feedback on hook quality, pacing, audio, and an overall score out of 10 before publishing.

## 🚀 Tech Stack
- **Frontend:** Next.js 14, TailwindCSS v4, Recharts, Lucide Icons
- **Backend:** Python, FastAPI, Uvicorn
- **AI Models:** Google Gemini 2.0 Flash, Claude 3.5 Sonnet
- **Integrations:** YouTube Data API v3 (Read/Write OAuth2)

## 💻 Setup Instructions

1. **Install Backend Dependencies:**
   Make sure you have Python installed.
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Install Frontend Dependencies:**
   Make sure you have Node.js installed.
   ```bash
   cd frontend
   npm install
   ```

3. **Provide YouTube Secrets:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Create OAuth 2.0 Client IDs for a Desktop Application.
   - Download the JSON file, rename it to `client_secrets.json`, and place it inside the `data/` folder.

4. **Start Application:**
   Run `start.bat` on Windows, or start the backend and frontend manually:
   - Backend: `cd backend && uvicorn main:app --reload --port 8000`
   - Frontend: `cd frontend && npm run dev`

5. **Access Dashboard:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Configure Keys & Channel:**
   Go to the **Settings** page in the dashboard and add your Gemini API Key, Claude API Key, and your YouTube Channel ID.

7. **Connect YouTube Account:**
   Click "Connect YouTube Account" in Settings to authenticate the app and allow it to read your analytics and update your video metadata.

## 🔒 Privacy & Data
All chats, analytics caches, and config settings are stored locally in the `data/` folder. No data is sent to external servers other than the YouTube and AI APIs.

---
*Powered by MAYA AI*