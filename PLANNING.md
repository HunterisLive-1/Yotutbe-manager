# YouTube AI Dashboard — PLANNING.md

## Project Overview
Ek local AI-powered dashboard jo YouTube creator @HunterIsLive-18 ke liye
channel growth, content strategy, aur video metadata management automate kare.

---

## Tech Stack
- **Backend**: Python + FastAPI
- **Frontend**: Next.js + TailwindCSS
- **AI**: Gemini 2.0 Flash (primary) + Claude API (optional fallback)
- **YouTube**: YouTube Data API v3 + OAuth2 (read + write)
- **Storage**: Local JSON files (chats, analytics cache)
- **Video Analysis**: Gemini Vision API

---

## Folder Structure
```
youtube-ai-dashboard/
├── backend/
│   ├── main.py              # FastAPI app + all routes
│   ├── youtube_service.py   # YouTube API wrapper
│   ├── ai_service.py        # Gemini + Claude logic
│   ├── chat_service.py      # Chat history management
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Dashboard home (stats overview)
│   │   ├── chat/page.tsx        # AI chat page
│   │   ├── videos/page.tsx      # Video manager
│   │   ├── analytics/page.tsx   # Best time tracker
│   │   ├── generate/page.tsx    # Title/desc/tags generator
│   │   └── settings/page.tsx    # API keys config
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── VideoCard.tsx
│   │   └── ChatWindow.tsx
│   └── package.json
├── data/
│   ├── chats/               # JSON files per session
│   ├── analytics/           # Cached analytics data
│   ├── config.json          # API keys (gitignored)
│   └── client_secrets.json  # YouTube OAuth (gitignored)
├── .env.example
├── .gitignore
├── README.md
└── start.bat                # Windows one-click start
```

---

## Features List

### 1. Dashboard Home
- Channel stats: subscribers, total views, video count
- Last 5 videos with views/likes
- Quick "best time to post" summary
- AI tip of the day (auto-generated)

### 2. AI Chat (ChatGPT-style)
- Sidebar with all past sessions
- New chat button
- Messages saved locally as JSON per session
- Model selector: Gemini / Claude
- System prompt pre-loaded with channel context
- Hinglish responses by default

### 3. Video Manager
- List all videos with thumbnail, stats
- Click any video → Edit title, description, tags inline
- "AI Improve" button → Gemini suggests better metadata
- One-click "Update on YouTube" via OAuth
- Filter: Shorts vs Long form

### 4. Metadata Generator
- Input: topic + video type (Short/Long)
- Output: 3 title options, full description, 15 tags, hook line
- Copy buttons for each field
- "Apply to Video" button if video selected

### 5. Analytics / Best Time Tracker
- Chart: hourly average views (bar chart)
- Chart: day-of-week performance
- Best 3 posting times highlighted
- Data source: YouTube Analytics API (or fallback to video published_at vs views correlation)

### 6. Video Analyzer (Gemini Vision)
- Upload video file (or paste YouTube URL)
- AI gives feedback: hook quality, pacing, audio, improvements
- Score out of 10
- Suggested titles based on actual video content

### 7. Settings
- Gemini API Key input
- Claude API Key input
- YouTube Channel ID input
- OAuth connect button (opens browser for Google login)
- Test connection buttons

---

## AI System Prompt (channel context)
```
You are a YouTube growth assistant for channel @HunterIsLive-18.
- Niche: AI & Tech (Science & Technology)
- ~140 subscribers, growing
- Best performing: MAYA AI Shorts (~1.6k views)
- Emotional/surprising hooks outperform technical hooks
- Creator: Rahul, communicates in Hinglish
- Goal: Grow to monetization (1000 subs + 4000 watch hours / 10M Shorts views)

Always give specific, actionable advice. Respond in Hinglish naturally.
```

---

## API Endpoints (Backend)
```
GET  /api/config                  → get saved config (keys masked)
POST /api/config                  → save API keys + channel ID

POST /api/youtube/auth            → trigger OAuth flow
GET  /api/stats/channel           → channel stats
GET  /api/stats/videos            → recent videos list
GET  /api/stats/analytics         → best time data

GET  /api/chat/sessions           → list all chat sessions
POST /api/chat/new                → create new session
GET  /api/chat/{session_id}       → load session messages
POST /api/chat/send               → send message, get AI reply

POST /api/generate/metadata       → generate title/desc/tags
POST /api/video/update            → update video on YouTube
POST /api/video/analyze           → upload video for Gemini analysis
```

---

## .gitignore Must Include
```
data/config.json
data/client_secrets.json
data/token.pickle
data/chats/
__pycache__/
.env
node_modules/
.next/
```
