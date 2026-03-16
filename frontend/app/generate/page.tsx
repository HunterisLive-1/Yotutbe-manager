"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wand2, Copy, Star, CheckCheck, Clock, Save, X } from "lucide-react";

interface Video {
  id: string;
  title: string;
}

interface GenerationResult {
  id: string;
  topic: string;
  video_type: string;
  date: string;
  result: {
    titles: string[];
    description: string;
    tags: string[];
    hook: string;
    best_title: string;
  };
}

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [videoType, setVideoType] = useState<"short" | "long">("short");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentDesc, setCurrentDesc] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult["result"] | null>(null);
  const [editableDesc, setEditableDesc] = useState("");
  const [editableTags, setEditableTags] = useState<string[]>([]);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [applying, setApplying] = useState(false);

  const [history, setHistory] = useState<GenerationResult[]>([]);

  useEffect(() => {
    // Load history
    const saved = localStorage.getItem("yt_generator_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }

    // Load videos for dropdown
    fetch("http://localhost:8000/api/stats/videos?max_results=50")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setVideos(data);
      })
      .catch(() => {});
  }, []);

  const saveToHistory = (newResult: GenerationResult["result"]) => {
    const entry: GenerationResult = {
      id: Date.now().toString(),
      topic,
      video_type: videoType,
      date: new Date().toISOString(),
      result: newResult
    };
    
    const newHistory = [entry, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("yt_generator_history", JSON.stringify(newHistory));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error("Topic is required");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/generate/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          video_type: videoType,
          current_title: currentTitle,
          current_desc: currentDesc
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setEditableDesc(data.description);
        setEditableTags(data.tags);
        saveToHistory(data);
        toast.success("Metadata generated!");
      } else {
        toast.error("Failed to generate metadata");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const removeTag = (tagToRemove: string) => {
    setEditableTags(editableTags.filter(t => t !== tagToRemove));
  };

  const handleApplyToVideo = async () => {
    if (!selectedVideoId || !result) return;
    setApplying(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/video/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: selectedVideoId,
          title: result.best_title,
          description: editableDesc,
          tags: editableTags
        })
      });

      if (res.ok) {
        toast.success("Applied to YouTube video!");
      } else {
        toast.error("Failed to apply");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setApplying(false);
    }
  };

  const loadHistoryEntry = (entry: GenerationResult) => {
    setTopic(entry.topic);
    setVideoType(entry.video_type as any);
    setResult(entry.result);
    setEditableDesc(entry.result.description);
    setEditableTags(entry.result.tags);
    toast.info("Restored from history");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-16 animate-[fade-in_0.5s_ease-out] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#6366f1] to-[#22d3ee] rounded-2xl blur opacity-60"></div>
          <div className="relative bg-[#111118] p-4 rounded-2xl border border-[#ffffff0a]">
            <Wand2 size={32} className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-cyan-300" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#94a3b8]">Metadata Generator</h1>
          <p className="text-[#64748b] font-medium tracking-wide mt-1">AI-powered titles, descriptions, and tags engineered for growth</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Section */}
        <div className="lg:col-span-5 space-y-8">
          <form onSubmit={handleGenerate} className="glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366f1]/10 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <label className="block text-sm font-bold text-[#e2e8f0] mb-2 uppercase tracking-wide">Video Topic <span className="text-[#ef4444]">*</span></label>
              <input 
                type="text" 
                required
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. MAYA AI girlfriend feature demo"
                className="w-full bg-[#0a0a0f]/80 backdrop-blur-md border border-[#2d2d3f] rounded-xl px-5 py-3 text-white outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/50 shadow-inner transition-all placeholder:text-[#475569]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e2e8f0] mb-2">Video Type</label>
              <div className="flex gap-2">
                {(["short", "long"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVideoType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
                      videoType === t ? "bg-[#6366f1] text-white" : "bg-[#1e1e2e] text-[#e2e8f0] hover:bg-[#2d2d3f]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">Current Title (Optional)</label>
              <input 
                type="text" 
                value={currentTitle}
                onChange={e => setCurrentTitle(e.target.value)}
                placeholder="Paste your draft title..."
                className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-2 text-white outline-none focus:border-[#6366f1] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">Current Description (Optional)</label>
              <textarea 
                value={currentDesc}
                onChange={e => setCurrentDesc(e.target.value)}
                rows={3}
                placeholder="Paste your draft description..."
                className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-2 text-white outline-none focus:border-[#6366f1] transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : <><Wand2 size={18} /> Generate</>}
            </button>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-[#111118] p-6 rounded-xl border border-[#1e1e2e] space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-[#e2e8f0]">
                <Clock size={18} /> Recent Generations
              </h3>
              <div className="space-y-2">
                {history.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => loadHistoryEntry(entry)}
                    className="w-full text-left bg-[#1e1e2e] hover:bg-[#2d2d3f] p-3 rounded-lg transition"
                  >
                    <p className="text-sm font-medium text-white truncate">{entry.topic}</p>
                    <p className="text-xs text-[#64748b]">{new Date(entry.date).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center text-[#64748b] border-dashed p-8 text-center">
              <Wand2 size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Fill the form and generate to see results here.</p>
            </div>
          )}

          {loading && (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center text-[#64748b] p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366f1] mb-4"></div>
              <p>Crafting perfect metadata...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Titles */}
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-bold">Generated Titles</h3>
                <div className="space-y-3">
                  {result.titles.map((title, idx) => {
                    const isBest = title === result.best_title;
                    return (
                      <div key={idx} className={`p-4 rounded-lg border ${isBest ? 'bg-[#6366f1]/10 border-[#6366f1]' : 'bg-[#1e1e2e] border-[#2d2d3f]'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                        <div className="flex-1 w-full">
                          {isBest && <span className="inline-flex items-center gap-1 text-xs font-bold text-[#6366f1] bg-[#6366f1]/20 px-2 py-1 rounded mb-2">
                            <Star size={12} className="fill-current" /> BEST PICK
                          </span>}
                          <p className="text-[#e2e8f0] font-medium break-words whitespace-pre-wrap leading-relaxed">{title}</p>
                        </div>
                        <button onClick={() => copyToClipboard(title)} className="p-2 bg-[#2d2d3f] hover:bg-[#3f3f5a] rounded-lg transition text-[#e2e8f0] self-end sm:self-auto shrink-0 mt-2 sm:mt-0">
                          <Copy size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hook */}
              {result.hook && (
                <div className="bg-gradient-to-r from-[#22d3ee]/20 to-[#6366f1]/20 border border-[#6366f1]/30 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-[#22d3ee] uppercase tracking-wider">Opening Hook (First 3s)</h3>
                    <button onClick={() => copyToClipboard(result.hook)} className="text-[#64748b] hover:text-white transition">
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="text-lg font-medium text-white italic">"{result.hook}"</p>
                </div>
              )}

              {/* Description */}
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Description</h3>
                  <button onClick={() => copyToClipboard(editableDesc)} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition bg-[#1e1e2e] px-3 py-1.5 rounded-lg">
                    <Copy size={14} /> Copy Full
                  </button>
                </div>
                <textarea
                  value={editableDesc}
                  onChange={e => setEditableDesc(e.target.value)}
                  rows={8}
                  className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-3 text-[#e2e8f0] outline-none focus:border-[#6366f1] resize-y"
                />
              </div>

              {/* Tags */}
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Tags</h3>
                  <button onClick={() => copyToClipboard(editableTags.join(", "))} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition bg-[#1e1e2e] px-3 py-1.5 rounded-lg">
                    <Copy size={14} /> Copy All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editableTags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-[#2d2d3f] text-[#e2e8f0] px-3 py-1.5 rounded-full text-sm">
                      <span>{tag}</span>
                      <button onClick={() => removeTag(tag)} className="text-[#64748b] hover:text-red-400 transition ml-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {editableTags.length === 0 && <span className="text-sm text-[#64748b]">No tags</span>}
                </div>
              </div>

              {/* Apply to Video */}
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Save size={20} className="text-[#22d3ee]" /> Apply Directly to YouTube
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={selectedVideoId}
                    onChange={e => setSelectedVideoId(e.target.value)}
                    className="w-full sm:flex-1 bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-4 py-3 text-[#e2e8f0] outline-none focus:border-[#6366f1]"
                  >
                    <option value="">Select a recent video...</option>
                    {videos.map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyToVideo}
                    disabled={!selectedVideoId || applying}
                    className="w-full sm:w-auto bg-[#22d3ee] text-[#0a0a0f] px-8 py-3 rounded-lg font-bold transition disabled:opacity-50 hover:bg-cyan-400 whitespace-nowrap shrink-0"
                  >
                    {applying ? "Applying..." : "Update Video"}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
