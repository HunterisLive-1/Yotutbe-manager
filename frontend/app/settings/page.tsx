"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Key, Youtube, ExternalLink, CheckCircle2, XCircle, Info, ChevronDown } from "lucide-react";

interface Config {
  gemini_api_key: string;
  claude_api_key: string;
  youtube_channel_id: string;
  has_gemini: boolean;
  has_claude: boolean;
  has_youtube_auth: boolean;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [channelId, setChannelId] = useState("");

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/config");
      const data = await res.json();
      setConfig(data);
      setGeminiKey(data.gemini_api_key);
      setClaudeKey(data.claude_api_key);
      setChannelId(data.youtube_channel_id);
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: geminiKey,
          claude_api_key: claudeKey,
          youtube_channel_id: channelId
        })
      });

      if (res.ok) {
        toast.success("Settings saved successfully!");
        fetchConfig();
      } else {
        toast.error("Failed to save settings");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleYoutubeAuth = async () => {
    toast.info("Opening browser for Google Login...");
    try {
      const res = await fetch("http://localhost:8000/api/youtube/auth", {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Successfully authenticated with YouTube!");
        fetchConfig();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Authentication failed. Check client_secrets.json");
      }
    } catch (err) {
      toast.error("Network error during auth");
    }
  };

  if (loading) return <div className="text-center mt-20 text-[#64748b]">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16 animate-[fade-in_0.5s_ease-out]">
      <div className="flex items-center gap-5 mb-12">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50"></div>
          <div className="relative bg-[#111118] p-3.5 rounded-xl border border-[#ffffff0a]">
            <Settings size={28} className="text-[#cbd5e1]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#94a3b8]">System Configuration</h1>
          <p className="text-[#64748b] font-medium tracking-wide mt-1">Manage core API keys and YouTube channel integrations</p>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-8">
        
        {/* API Keys Section */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Key size={20} className="text-[#22d3ee]" /> API Keys
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-[#e2e8f0] flex items-center gap-2">
                  Gemini API Key 
                  {config?.has_gemini ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                </label>
                <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-xs text-[#6366f1] hover:underline flex items-center gap-1">
                  Get free key <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#6366f1]"
                />
                <button type="button" onClick={() => fetch("http://localhost:8000/health").then(res=>res.ok?toast.success("Backend is running!"):toast.error("Backend error")).catch(()=>toast.error("Backend not reachable"))} className="px-4 bg-[#2d2d3f] hover:bg-[#3f3f5a] rounded-lg text-sm font-medium transition">Test</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-[#e2e8f0] flex items-center gap-2">
                  Claude API Key (Optional)
                  {config?.has_claude ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                </label>
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-xs text-[#6366f1] hover:underline flex items-center gap-1">
                  Get key <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={claudeKey}
                  onChange={e => setClaudeKey(e.target.value)}
                  placeholder="sk-ant..."
                  className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#6366f1]"
                />
                <button type="button" onClick={() => fetch("http://localhost:8000/health").then(res=>res.ok?toast.success("Backend is running!"):toast.error("Backend error")).catch(()=>toast.error("Backend not reachable"))} className="px-4 bg-[#2d2d3f] hover:bg-[#3f3f5a] rounded-lg text-sm font-medium transition">Test</button>
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Section */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Youtube size={20} className="text-[#ef4444]" /> YouTube Setup
          </h2>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-medium text-[#e2e8f0]">Channel ID</label>
            </div>
            <input 
              type="text"
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="UC..."
              className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#6366f1]"
            />
          </div>

          <div className="pt-4 border-t border-[#1e1e2e]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white mb-1">OAuth Authentication</h3>
                <p className="text-xs text-[#64748b] flex items-center gap-1">
                  <Info size={14} /> Place <code className="bg-[#2d2d3f] px-1 rounded">client_secrets.json</code> in data/ folder first.
                </p>
              </div>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-xs text-[#6366f1] hover:underline flex items-center gap-1">
                Google Cloud Console <ExternalLink size={12} />
              </a>
            </div>

            <button
              type="button"
              onClick={handleYoutubeAuth}
              className={`w-full flex justify-center items-center gap-2 py-3 rounded-lg font-bold transition ${
                config?.has_youtube_auth 
                  ? "bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20"
                  : "bg-[#ef4444] text-white hover:bg-red-600"
              }`}
            >
              <Youtube size={20} />
              {config?.has_youtube_auth ? "YouTube Connected ✓" : "Connect YouTube Account"}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-8 py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden mt-12">
        <div className="p-4 bg-[#1e1e2e]/50 border-b border-[#1e1e2e]">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Info size={18} className="text-[#64748b]" /> Setup Instructions
          </h2>
        </div>

        <div className="divide-y divide-[#1e1e2e]">
          {/* Item 1 */}
          <div>
            <button 
              onClick={() => setOpenAccordion(openAccordion === "yt" ? null : "yt")}
              className="w-full flex justify-between items-center p-4 hover:bg-[#1e1e2e]/30 transition"
            >
              <span className="font-medium text-[#e2e8f0]">How to get YouTube OAuth client_secrets.json</span>
              <ChevronDown size={18} className={`text-[#64748b] transition-transform ${openAccordion === "yt" ? "rotate-180" : ""}`} />
            </button>
            {openAccordion === "yt" && (
              <div className="p-4 pt-0 text-sm text-[#64748b] space-y-2">
                <p>1. Go to Google Cloud Console and create a new project.</p>
                <p>2. Enable the "YouTube Data API v3" in APIs & Services.</p>
                <p>3. Go to OAuth consent screen, configure as "External", and add test users if unverified.</p>
                <p>4. Go to Credentials, click "Create Credentials" → "OAuth client ID".</p>
                <p>5. Application type: "Desktop app". Name it "YT Dashboard".</p>
                <p>6. Download the JSON file, rename it to <code>client_secrets.json</code> and place it in the <code>data/</code> folder.</p>
              </div>
            )}
          </div>

          {/* Item 2 */}
          <div>
            <button 
              onClick={() => setOpenAccordion(openAccordion === "gemini" ? null : "gemini")}
              className="w-full flex justify-between items-center p-4 hover:bg-[#1e1e2e]/30 transition"
            >
              <span className="font-medium text-[#e2e8f0]">How to get Gemini API key</span>
              <ChevronDown size={18} className={`text-[#64748b] transition-transform ${openAccordion === "gemini" ? "rotate-180" : ""}`} />
            </button>
            {openAccordion === "gemini" && (
              <div className="p-4 pt-0 text-sm text-[#64748b] space-y-2">
                <p>1. Go to <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#6366f1] hover:underline">Google AI Studio</a>.</p>
                <p>2. Sign in with your Google account.</p>
                <p>3. Click "Get API key" on the left sidebar.</p>
                <p>4. Create API key in new project.</p>
                <p>5. Copy the key and paste it above.</p>
              </div>
            )}
          </div>

          {/* Item 3 */}
          <div>
            <button 
              onClick={() => setOpenAccordion(openAccordion === "channel" ? null : "channel")}
              className="w-full flex justify-between items-center p-4 hover:bg-[#1e1e2e]/30 transition"
            >
              <span className="font-medium text-[#e2e8f0]">How to find your YouTube Channel ID</span>
              <ChevronDown size={18} className={`text-[#64748b] transition-transform ${openAccordion === "channel" ? "rotate-180" : ""}`} />
            </button>
            {openAccordion === "channel" && (
              <div className="p-4 pt-0 text-sm text-[#64748b] space-y-2">
                <p>1. Go to YouTube and sign in to your channel.</p>
                <p>2. Click your profile picture → "Settings".</p>
                <p>3. Click "Advanced settings" from the left menu.</p>
                <p>4. Copy the "Channel ID" (starts with UC...).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
