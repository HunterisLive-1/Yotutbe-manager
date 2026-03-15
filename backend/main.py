import json
import os
import pickle
import uuid
import datetime
import tempfile
import time
import re
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import google.generativeai as genai
import anthropic

app = FastAPI(title="YouTube AI Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
CLIENT_SECRETS_FILE = os.path.join(DATA_DIR, "client_secrets.json")
TOKEN_FILE = os.path.join(DATA_DIR, "token.pickle")
CHATS_DIR = os.path.join(DATA_DIR, "chats")

os.makedirs(CHATS_DIR, exist_ok=True)

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl"
]

SYSTEM_PROMPT = """You are a YouTube growth assistant for channel @HunterIsLive-18.
Niche: AI & Tech. ~140 subscribers. Best content: MAYA AI Shorts (1.6k views).
Emotional hooks outperform technical hooks. Creator: Rahul.
Always give specific, actionable advice. Respond naturally in Hinglish."""

class ConfigData(BaseModel):
    gemini_api_key: Optional[str] = ""
    claude_api_key: Optional[str] = ""
    youtube_channel_id: Optional[str] = ""

class ChatMessage(BaseModel):
    session_id: str
    message: str
    model: str = "gemini"

def load_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"gemini_api_key": "", "claude_api_key": "", "youtube_channel_id": ""}

def save_config(config_data: dict):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2)

def get_youtube_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
            
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
        except Exception:
            # Token refresh failed, so we should delete the token and require re-authentication
            os.remove(TOKEN_FILE)
            return None
            
    if creds and creds.valid:
        return build('youtube', 'v3', credentials=creds)
    return None

def load_chat_history(session_id: str) -> dict:
    file_path = os.path.join(CHATS_DIR, f"{session_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_chat_history(session_id: str, data: dict):
    file_path = os.path.join(CHATS_DIR, f"{session_id}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/config")
def get_config():
    config = load_config()
    return {
        "gemini_api_key": "***" if config.get("gemini_api_key") else "",
        "claude_api_key": "***" if config.get("claude_api_key") else "",
        "youtube_channel_id": config.get("youtube_channel_id", ""),
        "has_gemini": bool(config.get("gemini_api_key")),
        "has_claude": bool(config.get("claude_api_key")),
        "has_youtube_auth": os.path.exists(TOKEN_FILE)
    }

@app.post("/api/config")
def update_config(data: ConfigData):
    config = load_config()
    if data.gemini_api_key and data.gemini_api_key != "***":
        config["gemini_api_key"] = data.gemini_api_key
    if data.claude_api_key and data.claude_api_key != "***":
        config["claude_api_key"] = data.claude_api_key
    if data.youtube_channel_id:
        config["youtube_channel_id"] = data.youtube_channel_id
        
    save_config(config)
    return {"status": "success"}

@app.post("/api/youtube/auth")
def youtube_auth():
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=400, detail="client_secrets.json missing in data folder")
        
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
    creds = flow.run_local_server(port=8765)
    
    with open(TOKEN_FILE, 'wb') as token:
        pickle.dump(creds, token)
        
    return {"status": "authenticated"}

@app.get("/api/stats/channel")
def get_channel_stats():
    youtube = get_youtube_service()
    if not youtube:
        raise HTTPException(status_code=401, detail="YouTube not authenticated")
        
    config = load_config()
    channel_id = config.get("youtube_channel_id")
    if not channel_id:
        raise HTTPException(status_code=400, detail="YouTube Channel ID not configured")
        
    try:
        request = youtube.channels().list(
            part="snippet,statistics",
            id=channel_id
        )
        response = request.execute()
    except Exception as e:
        print(f"Error fetching channel stats: {e}")
        # If we got an auth error, return 401
        raise HTTPException(status_code=401, detail="YouTube authentication expired or invalid")
    
    if not response.get("items"):
        raise HTTPException(status_code=404, detail="Channel not found")
        
    channel = response["items"][0]
    return {
        "title": channel["snippet"]["title"],
        "description": channel["snippet"]["description"],
        "thumbnail": channel["snippet"]["thumbnails"]["default"]["url"],
        "subscribers": channel["statistics"]["subscriberCount"],
        "views": channel["statistics"]["viewCount"],
        "videos_count": channel["statistics"]["videoCount"]
    }

@app.get("/api/stats/videos")
def get_recent_videos(max_results: int = 20):
    youtube = get_youtube_service()
    if not youtube:
        raise HTTPException(status_code=401, detail="YouTube not authenticated")
        
    config = load_config()
    channel_id = config.get("youtube_channel_id")
    if not channel_id:
        raise HTTPException(status_code=400, detail="YouTube Channel ID not configured")
        
    try:
        search_request = youtube.search().list(
            part="id",
            channelId=channel_id,
            maxResults=max_results,
            order="date",
            type="video"
        )
        search_response = search_request.execute()
        
        video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]
        
        if not video_ids:
            return []
            
        videos_request = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=",".join(video_ids)
        )
        videos_response = videos_request.execute()
    except Exception as e:
        print(f"Error fetching videos: {e}")
        # If we got an auth error, return 401
        raise HTTPException(status_code=401, detail="YouTube authentication expired or invalid")
    
    result = []
    for item in videos_response.get("items", []):
        snippet = item.get("snippet", {})
        statistics = item.get("statistics", {})
        content_details = item.get("contentDetails", {})
        
        result.append({
            "id": item["id"],
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "tags": snippet.get("tags", []),
            "published_at": snippet.get("publishedAt", ""),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "views": statistics.get("viewCount", "0"),
            "likes": statistics.get("likeCount", "0"),
            "comments": statistics.get("commentCount", "0"),
            "duration": content_details.get("duration", "")
        })
        
    return result

@app.get("/api/chat/sessions")
def list_chat_sessions():
    sessions = []
    if not os.path.exists(CHATS_DIR):
        return sessions
        
    for filename in os.listdir(CHATS_DIR):
        if filename.endswith(".json"):
            file_path = os.path.join(CHATS_DIR, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                sessions.append({
                    "session_id": data.get("session_id"),
                    "created": data.get("created"),
                    "title": data.get("title", "New Chat"),
                    "message_count": len(data.get("messages", []))
                })
                
    sessions.sort(key=lambda x: x.get("created", ""), reverse=True)
    return sessions

@app.post("/api/chat/new")
def create_new_chat():
    session_id = str(uuid.uuid4())[:8]
    data = {
        "session_id": session_id,
        "created": datetime.datetime.utcnow().isoformat(),
        "title": "New Chat",
        "messages": []
    }
    save_chat_history(session_id, data)
    return {"session_id": session_id}

@app.get("/api/chat/{session_id}")
def get_chat_session(session_id: str):
    data = load_chat_history(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return data

@app.delete("/api/chat/{session_id}")
def delete_chat_session(session_id: str):
    file_path = os.path.join(CHATS_DIR, f"{session_id}.json")
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/api/chat/send")
def send_chat_message(chat_msg: ChatMessage):
    data = load_chat_history(chat_msg.session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    config = load_config()
    
    # Append user message
    user_message = {
        "role": "user",
        "content": chat_msg.message,
        "time": datetime.datetime.utcnow().isoformat()
    }
    data["messages"].append(user_message)
    
    # Set title if first message
    if len(data["messages"]) <= 2: # 1 user msg (length=1) or maybe an empty title logic
        if data.get("title") == "New Chat":
            data["title"] = chat_msg.message[:40] + ("..." if len(chat_msg.message) > 40 else "")
            
    reply_content = ""
    
    if chat_msg.model == "gemini":
        gemini_key = config.get("gemini_api_key")
        if not gemini_key:
            raise HTTPException(status_code=400, detail="Gemini API Key not configured")
            
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT
        )
        
        # Build history format for Gemini
        history = []
        for msg in data["messages"][:-1]: # exclude the last user message
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})
            
        chat = model.start_chat(history=history)
        response = chat.send_message(chat_msg.message)
        reply_content = response.text
        
    elif chat_msg.model == "claude":
        claude_key = config.get("claude_api_key")
        if not claude_key:
            raise HTTPException(status_code=400, detail="Claude API Key not configured")
            
        client = anthropic.Anthropic(api_key=claude_key)
        
        # Build history format for Claude
        messages = []
        for msg in data["messages"]:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})
            
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            system=SYSTEM_PROMPT,
            max_tokens=2048,
            messages=messages
        )
        reply_content = response.content[0].text
    else:
        raise HTTPException(status_code=400, detail="Invalid model selected")
        
    assistant_message = {
        "role": "assistant",
        "content": reply_content,
        "time": datetime.datetime.utcnow().isoformat()
    }
    data["messages"].append(assistant_message)
    save_chat_history(chat_msg.session_id, data)
    
    return {"reply": reply_content, "session_id": chat_msg.session_id}
class MetadataRequest(BaseModel):
    topic: str
    video_type: str
    current_title: Optional[str] = ""
    current_desc: Optional[str] = ""

class VideoUpdateRequest(BaseModel):
    video_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

@app.post("/api/generate/metadata")
def generate_metadata(req: MetadataRequest):
    config = load_config()
    gemini_key = config.get("gemini_api_key")
    if not gemini_key:
        raise HTTPException(status_code=400, detail="Gemini API Key not configured")
        
    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    
    prompt = f"""You are a YouTube SEO expert for an Indian AI/Tech channel (@HunterIsLive-18).
Generate metadata for: Topic: {req.topic}, Type: {req.video_type}
Current Title (if any): {req.current_title}
Current Description (if any): {req.current_desc}

Return ONLY valid JSON (no markdown):
{{
  "titles": ["option 1", "option 2", "option 3"],
  "description": "full 150-200 word SEO description with hashtags",
  "tags": ["tag1", "tag2"],
  "hook": "first 3 seconds hook line",
  "best_title": "top pick"
}}
Titles should be emotional/curiosity-driven, not just technical.
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
        
    try:
        data = json.loads(text.strip())
        return data
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON", "raw": text}

@app.post("/api/video/update")
def update_video(req: VideoUpdateRequest):
    youtube = get_youtube_service()
    if not youtube:
        raise HTTPException(status_code=401, detail="YouTube not authenticated")
        
    try:
        video_response = youtube.videos().list(
            part="snippet",
            id=req.video_id
        ).execute()
        
        if not video_response.get("items"):
            raise HTTPException(status_code=404, detail="Video not found")
            
        video = video_response["items"][0]
        snippet = video["snippet"]
        
        if req.title is not None:
            snippet["title"] = req.title
        if req.description is not None:
            snippet["description"] = req.description
        if req.tags is not None:
            snippet["tags"] = req.tags
            
        update_response = youtube.videos().update(
            part="snippet",
            body={
                "id": req.video_id,
                "snippet": snippet
            }
        ).execute()
    except Exception as e:
        print(f"Error updating video: {e}")
        raise HTTPException(status_code=401, detail="YouTube authentication expired or invalid")
    
    return {"status": "updated", "video_id": req.video_id}

@app.post("/api/video/analyze")
async def analyze_video(file: UploadFile = File(...)):
    config = load_config()
    gemini_key = config.get("gemini_api_key")
    if not gemini_key:
        raise HTTPException(status_code=400, detail="Gemini API Key not configured")
        
    genai.configure(api_key=gemini_key)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp:
        content = await file.read()
        temp.write(content)
        temp_path = temp.name
        
    try:
        uploaded_file = genai.upload_file(path=temp_path)
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(2)
            uploaded_file = genai.get_file(uploaded_file.name)
            
        if uploaded_file.state.name == "FAILED":
            raise HTTPException(status_code=500, detail="Video processing failed on Gemini")
            
        model = genai.GenerativeModel(model_name="gemini-2.0-flash-exp")
        prompt = """Analyze this YouTube video. Give feedback in Hinglish:
1. Hook Analysis (pehle 3-5 sec)
2. Content Quality (audio, visuals, pacing)
3. Engagement Factors
4. What to Improve (specific)
5. Three better title suggestions
6. Overall Score /10"""
        
        response = model.generate_content([uploaded_file, prompt])
        analysis = response.text
        
        score = 0
        match = re.search(r'(\d+(?:\.\d+)?)\s*/\s*10', analysis)
        if match:
            score = float(match.group(1))
            
        return {"analysis": analysis, "score": score}
    finally:
        os.remove(temp_path)

@app.get("/api/chat/tip")
def get_daily_tip():
    config = load_config()
    gemini_key = config.get("gemini_api_key")
    if not gemini_key:
        return {"tip": "Add your Gemini API key in settings to get AI tips!"}
        
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        
        prompt = "Give a 1-sentence, actionable YouTube growth tip for an AI/Tech channel with 140 subs. Respond naturally in Hinglish. No quotes, no markdown."
        response = model.generate_content(prompt)
        return {"tip": response.text.strip()}
    except Exception as e:
        return {"tip": f"Error generating tip: {str(e)}"}
