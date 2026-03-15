# YouTube AI Dashboard — CURSOR_PROMPTS.md
# Ek ek prompt copy karo Cursor me. Sequence follow karo.

---

## PROMPT 1 — Project Setup + Backend Foundation

```
Create a new project called "youtube-ai-dashboard" with this structure:

youtube-ai-dashboard/
├── backend/
│   ├── main.py
│   ├── requirements.txt
└── frontend/  (empty for now)

In backend/requirements.txt add:
fastapi uvicorn google-generativeai anthropic google-api-python-client
google-auth-oauthlib google-auth-httplib2 python-multipart

In backend/main.py create a FastAPI app with CORS enabled for all origins.

Create these folders at project root:
data/chats/
data/analytics/

Create data/config.json with empty values:
{"gemini_api_key": "", "claude_api_key": "", "youtube_channel_id": ""}

Add a GET /health endpoint that returns {"status": "ok"}.

Also create start.bat at project root:
@echo off
start cmd /k "cd backend && uvicorn main:app --reload --port 8000"
start cmd /k "cd frontend && npm run dev"
```

---

## PROMPT 2 — Backend: Config + YouTube Auth

```
In backend/main.py add the following:

1. CONFIG SYSTEM:
   - load_config() reads data/config.json
   - save_config() writes to data/config.json
   - GET /api/config → returns config with keys masked as "***"
     also returns has_gemini, has_claude, has_youtube_auth booleans
   - POST /api/config with body {gemini_api_key, claude_api_key, youtube_channel_id}
     saves to config.json (skip if value is "***")

2. YOUTUBE AUTH:
   - SCOPES = ["youtube.readonly", "youtube.force-ssl"]
   - get_youtube_service() → loads token from data/token.pickle,
     refreshes if expired, returns youtube service or None
   - POST /api/youtube/auth → runs InstalledAppFlow from data/client_secrets.json
     on port 8765, saves credentials to data/token.pickle
     Returns {"status": "authenticated"} or error if client_secrets.json missing

3. CHANNEL STATS:
   - GET /api/stats/channel → uses YouTube API channels().list()
     with part="snippet,statistics" and channelId from config
     Returns: title, description, thumbnail, subscribers, views, videos count
   - GET /api/stats/videos?max_results=20 → search().list() then videos().list()
     Returns array of: id, title, description, tags, published_at, thumbnail,
     views, likes, comments, duration
```

---

## PROMPT 3 — Backend: AI Chat System

```
In backend/main.py add a complete chat system:

CHAT STORAGE:
- Each session = one JSON file in data/chats/{session_id}.json
- Format: {session_id, created, title, messages: [{role, content, time}]}
- load_chat_history(session_id) and save_chat_history(session_id, data)

ENDPOINTS:
- GET /api/chat/sessions → list all .json files in data/chats/,
  return [{session_id, created, title, message_count}] sorted newest first
- POST /api/chat/new → create new session with uuid4()[:8] id, return {session_id}
- GET /api/chat/{session_id} → return full session data
- DELETE /api/chat/{session_id} → delete session file

- POST /api/chat/send with body {session_id, message, model: "gemini"|"claude"}:
  1. Load history
  2. Append user message
  3. If first message, set session title = first 40 chars of message
  4. If model=="gemini" and has gemini key:
     - Use gemini-2.0-flash with system_instruction
     - Build history for Gemini format
     - Get response
  5. Elif model=="claude" and has claude key:
     - Use claude-sonnet-4-20250514
     - Pass full messages array
  6. Append assistant reply
  7. Save history
  8. Return {reply, session_id}

SYSTEM PROMPT to use:
"You are a YouTube growth assistant for channel @HunterIsLive-18.
Niche: AI & Tech. ~140 subscribers. Best content: MAYA AI Shorts (1.6k views).
Emotional hooks outperform technical hooks. Creator: Rahul.
Always give specific, actionable advice. Respond naturally in Hinglish."
```

---

## PROMPT 4 — Backend: Metadata Generator + Video Update

```
In backend/main.py add:

1. POST /api/generate/metadata
   Body: {topic, video_type: "short"|"long", current_title?, current_desc?}
   
   Call gemini-2.0-flash with this prompt:
   "You are a YouTube SEO expert for an Indian AI/Tech channel (@HunterIsLive-18).
   Generate metadata for: Topic: {topic}, Type: {video_type}
   Return ONLY valid JSON (no markdown):
   {
     titles: [3 options],
     description: 'full 150-200 word SEO description with hashtags',
     tags: [15 tags, mix English + Hinglish],
     hook: 'first 3 seconds hook line',
     best_title: 'top pick'
   }
   Titles should be emotional/curiosity-driven, not just technical."
   
   Parse and return the JSON. Strip ```json fences if present.

2. POST /api/video/update
   Body: {video_id, title?, description?, tags?}
   - Get current snippet via videos().list(part="snippet")
   - Update only provided fields
   - Call videos().update(part="snippet")
   - Return {status: "updated", video_id}

3. POST /api/video/analyze (multipart file upload)
   - Accept video file upload
   - Save to temp file
   - Upload to Gemini via genai.upload_file()
   - Wait for processing (poll state)
   - Send to gemini-2.0-flash-exp with prompt:
     "Analyze this YouTube video. Give feedback in Hinglish:
     1. Hook Analysis (pehle 3-5 sec)
     2. Content Quality (audio, visuals, pacing)
     3. Engagement Factors
     4. What to Improve (specific)
     5. Three better title suggestions
     6. Overall Score /10"
   - Return {analysis: text, score: extracted_number}
```

---

## PROMPT 5 — Frontend Setup + Layout

```
In the frontend/ folder, create a Next.js 14 app with TailwindCSS.
Use app router. TypeScript.

Run: npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

Design: Dark theme. Color palette:
- Background: #0a0a0f
- Card bg: #111118
- Border: #1e1e2e
- Primary accent: #6366f1 (indigo)
- Secondary: #22d3ee (cyan)
- Text: #e2e8f0
- Muted: #64748b

Create components/Sidebar.tsx:
- Fixed left sidebar, 240px wide
- App name "YT Dashboard" at top with a play icon
- Navigation links with icons (use lucide-react):
  / → Dashboard (LayoutDashboard icon)
  /chat → AI Chat (MessageSquare icon)
  /videos → Videos (Video icon)
  /analytics → Analytics (BarChart2 icon)
  /generate → Generator (Wand2 icon)
  /settings → Settings (Settings icon)
- Active link highlighted with indigo bg
- Bottom: small "MAYA AI" branding

Create app/layout.tsx:
- Import Sidebar
- Main content area with left padding for sidebar
- Background #0a0a0f

Create components/StatCard.tsx:
- Props: title, value, icon, change (optional % change)
- Dark card with subtle border
- Show green up arrow or red down for change
```

---

## PROMPT 6 — Frontend: Dashboard Home Page

```
Create app/page.tsx — the main dashboard.

Fetch from:
- GET http://localhost:8000/api/stats/channel
- GET http://localhost:8000/api/stats/videos

Show:
1. Top row: 4 StatCards
   - Subscribers (with Users icon)
   - Total Views (with Eye icon)
   - Total Videos (with Film icon)
   - Avg Views/Video (calculated)

2. "Recent Videos" section — last 5 videos as cards:
   - Thumbnail on left
   - Title, published date
   - Views, likes, comments as small badges
   - "Edit" button → goes to /videos?id={video_id}

3. "AI Tip" card on the right:
   - Call GET /api/chat/tip (create this endpoint too)
   - Shows a daily growth tip auto-generated by Gemini
   - Refresh button

4. "Best Time to Post" mini card:
   - Show top 3 recommended times
   - Simple colored time badges

Use loading skeletons while fetching.
Handle errors gracefully (show "Connect YouTube" button if 401).
```

---

## PROMPT 7 — Frontend: AI Chat Page

```
Create app/chat/page.tsx — ChatGPT-style interface.

Layout:
- Left panel (260px): Session list
  - "New Chat" button at top
  - List of past sessions (title + date + message count)
  - Click to load session
  - Delete button (trash icon) on hover
  - Active session highlighted

- Right panel: Chat window
  - Messages area (scrollable, flex-col)
  - User messages: right-aligned, indigo bubble
  - Assistant messages: left-aligned, dark card with subtle border
  - Timestamps below each message (small, muted)
  - Loading indicator: 3 animated dots when waiting

- Bottom input area:
  - Textarea (auto-resize, max 4 rows)
  - Model selector dropdown: Gemini / Claude
  - Send button (disabled if empty or loading)
  - Keyboard: Ctrl+Enter to send

State management:
- sessions list from GET /api/chat/sessions
- active session from GET /api/chat/{session_id}
- POST /api/chat/send for sending
- POST /api/chat/new for new session

If no sessions exist, show empty state with "Start your first chat" message.
Auto-scroll to bottom on new message.
```

---

## PROMPT 8 — Frontend: Video Manager

```
Create app/videos/page.tsx

Features:
1. Video list:
   - Fetch GET /api/stats/videos
   - Grid of video cards: thumbnail, title, stats
   - Filter buttons: All / Shorts / Long Form
   - Sort by: Latest / Most Views / Least Views

2. Click video → open edit panel (right side or modal):
   - Editable title input
   - Editable description textarea  
   - Tags input (comma-separated, shown as chips)
   - "AI Improve" button:
     - Calls POST /api/generate/metadata with current title + video topic
     - Shows generated suggestions in a panel
     - Individual "Use This" buttons per field
   - "Save to YouTube" button → POST /api/video/update
   - Show success/error toast after update

3. "Analyze Video" section:
   - File upload area (drag & drop)
   - Upload button → POST /api/video/analyze
   - Show analysis result in a formatted card
   - Score shown as a circular progress indicator

Show loading states. Toast notifications for success/error.
```

---

## PROMPT 9 — Frontend: Metadata Generator Page

```
Create app/generate/page.tsx — standalone metadata generator.

Form:
- Topic input (text, e.g. "MAYA AI girlfriend feature demo")
- Video Type selector: Short / Long Form
- Optional: Current Title input
- Optional: Current Description textarea
- "Generate" button → POST /api/generate/metadata

Results section (show after generation):
- Titles section: 3 title cards, each with:
  - The title text
  - "Copy" button
  - "⭐ Best Pick" badge on recommended one
- Hook line: highlighted box with copy button
- Description: full textarea (editable) with copy button
- Tags: shown as chips, each removable, "Copy All" button

"Apply to Video" button:
- Dropdown to select which video to apply to
- Calls POST /api/video/update
- Success toast

History section below:
- Show last 5 generations (stored in localStorage)
- Click to restore
```

---

## PROMPT 10 — Frontend: Analytics Page

```
Create app/analytics/page.tsx

Fetch GET /api/stats/videos to compute analytics from video data.

Charts (use recharts library):

1. "Views by Hour Published" bar chart:
   - X-axis: 0-23 hours
   - Y-axis: average views
   - Highlight top 3 bars in indigo
   - Tooltip: "Avg views for videos published at Xam/pm"

2. "Views by Day of Week" bar chart:
   - X-axis: Mon-Sun
   - Y-axis: average views
   - Highlight best day

3. "Video Performance Over Time" line chart:
   - X-axis: publish date
   - Y-axis: views
   - Each point is a video, tooltip shows title

4. "Best Times to Post" card:
   - Calculated from chart data
   - Show top 3 time slots as big colored badges
   - e.g. "Saturday 7 PM", "Sunday 8 PM"

5. Summary stats row:
   - Best performing video
   - Average views per video
   - Shorts vs Long form avg views comparison

Compute everything from the videos API data (published_at + viewCount).
Show empty state if < 5 videos.
```

---

## PROMPT 11 — Frontend: Settings Page

```
Create app/settings/page.tsx

Sections:

1. API Keys:
   - Gemini API Key: password input + save button
     Link: "Get free key → aistudio.google.com"
   - Claude API Key: password input + save button
     Link: "Get key → console.anthropic.com"
   - Show green checkmark if key is saved, red X if not
   - "Test" button for each → calls /api/health or test endpoint

2. YouTube Setup:
   - Channel ID input + save
   - "Connect YouTube Account" big button:
     - Calls POST /api/youtube/auth
     - Shows browser will open message
     - Show green "Connected ✓" if token exists
   - Instructions: "Place client_secrets.json in data/ folder first"
   - Link to YouTube API Console

3. Instructions accordion:
   - How to get YouTube OAuth client secrets (step by step)
   - How to get Gemini API key
   - How to find your Channel ID

Fetch GET /api/config on load to show current status.
All saves call POST /api/config.
```

---

## PROMPT 12 — Final Polish + README

```
1. Add a .gitignore at project root:
data/config.json
data/client_secrets.json
data/token.pickle
data/chats/
data/analytics/
__pycache__/
.env
node_modules/
.next/
*.pyc

2. Create .env.example:
# Copy to data/config.json and fill values
GEMINI_API_KEY=your_key_here
CLAUDE_API_KEY=your_key_here (optional)
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxx

3. Create README.md with:
- Project description
- Setup steps:
  1. pip install -r backend/requirements.txt
  2. cd frontend && npm install
  3. Place client_secrets.json in data/
  4. Run start.bat (Windows) or run both manually
  5. Open http://localhost:3000
  6. Go to Settings and add API keys
  7. Connect YouTube account

4. Add toast notification component (react-hot-toast or sonner)
   Install in frontend: npm install sonner
   Add Toaster to layout.tsx

5. Add loading spinner component used across all pages

6. Make sure all pages handle:
   - Loading state (skeleton cards)
   - Error state (error message + retry button)
   - Empty state (helpful message)
```

---

## ORDER TO RUN PROMPTS:
1 → 2 → 3 → 4 (backend complete)
5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 (frontend complete)

## TESTING AFTER EACH BACKEND PROMPT:
- Open http://localhost:8000/docs (FastAPI auto-docs)
- Test each endpoint there before building frontend

## IMPORTANT NOTES FOR CURSOR:
- Agar Cursor code split kare multiple files me, that's fine
- After each prompt, test karo before next prompt
- If error aaye, paste error in Cursor and say "fix this error"
- YouTube OAuth ke liye client_secrets.json Google Cloud Console se download karna hoga
```
