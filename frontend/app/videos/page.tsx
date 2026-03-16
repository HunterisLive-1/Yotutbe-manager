"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Save, Wand2, Star, Video } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  tags: string[];
  published_at: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
  duration: string;
}

function VideosPageContent() {
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get("id");

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState<"all" | "shorts" | "long">("all");
  const [sort, setSort] = useState<"latest" | "most_views" | "least_views">("latest");

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  
  const [saving, setSaving] = useState(false);
  
  // AI Improvement states
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // Analysis states
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis: string, score: number } | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/stats/videos?max_results=50");
      if (res.status === 401) {
        toast.error("YouTube not connected. Go to settings.");
        setVideos([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
        
        if (initialVideoId) {
          const vid = data.find((v: Video) => v.id === initialVideoId);
          if (vid) handleSelectVideo(vid);
        }
      } else {
        toast.error("Failed to fetch videos");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const isShort = (duration: string) => {
    return duration.includes("M") && !duration.includes("H") && parseInt(duration.split("M")[0].replace("PT", "")) < 1 || !duration.includes("M"); 
  };

  const filteredVideos = videos
    .filter(v => {
      const short = isShort(v.duration);
      if (filter === "shorts") return short;
      if (filter === "long") return !short;
      return true;
    })
    .sort((a, b) => {
      if (sort === "latest") return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      if (sort === "most_views") return parseInt(b.views) - parseInt(a.views);
      if (sort === "least_views") return parseInt(a.views) - parseInt(b.views);
      return 0;
    });

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    setEditTitle(video.title);
    setEditDesc(video.description);
    setEditTags((video.tags || []).join(", "));
    setAiSuggestions(null);
  };

  const saveToYouTube = async () => {
    if (!selectedVideo) return;
    setSaving(true);
    
    try {
      const tagsArray = editTags.split(",").map(t => t.trim()).filter(Boolean);
      
      const res = await fetch("http://localhost:8000/api/video/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          title: editTitle,
          description: editDesc,
          tags: tagsArray
        })
      });

      if (res.ok) {
        toast.success("Saved to YouTube!");
        fetchVideos(); // Refresh
      } else {
        toast.error("Failed to update video");
      }
    } catch (err) {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleAiImprove = async () => {
    if (!selectedVideo) return;
    setGenerating(true);
    
    try {
      const short = isShort(selectedVideo.duration);
      const res = await fetch("http://localhost:8000/api/generate/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: editTitle,
          video_type: short ? "short" : "long",
          current_title: editTitle,
          current_desc: editDesc
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data);
        toast.success("Suggestions generated!");
      } else {
        toast.error("Failed to generate suggestions");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/video/analyze", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        toast.success("Analysis complete!");
      } else {
        toast.error("Failed to analyze video");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-[#64748b]">Loading videos...</div>;
  }

  return (
    <div className="flex gap-8 pb-8">
      {/* Main Content */}
      <div className="flex-1 space-y-8 animate-[fade-in_0.5s_ease-out]">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#6366f1] to-[#22d3ee] rounded-xl blur opacity-50"></div>
            <div className="relative bg-[#111118] p-3 rounded-xl border border-[#1e1e2e]">
              <Video className="text-[#818cf8]" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#94a3b8]">Video Manager</h1>
            <p className="text-[#64748b] font-medium tracking-wide">AI-assisted content optimization</p>
          </div>
        </div>
          
        <div className="flex flex-wrap gap-4 items-center justify-between glass-panel p-4 rounded-2xl">
          <div className="flex gap-2">
            {(["all", "shorts", "long"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                  filter === f 
                    ? "bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                    : "bg-[#1e1e2e]/50 text-[#94a3b8] hover:bg-[#2d2d3f] hover:text-white"
                }`}
              >
                {f === "all" ? "All Content" : f === "long" ? "Long Form" : "Shorts"}
              </button>
            ))}
          </div>
          
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-[#1a1a24] border border-[#2d2d3f] rounded-xl px-5 py-2.5 text-sm font-bold text-[#e2e8f0] outline-none hover:border-[#6366f1]/50 focus:border-[#6366f1] transition-colors cursor-pointer appearance-none shadow-sm"
          >
            <option value="latest">Latest First</option>
            <option value="most_views">Most Views</option>
            <option value="least_views">Least Views</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <div 
              key={video.id} 
              onClick={() => handleSelectVideo(video)}
              className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden cursor-pointer hover:border-[#6366f1] transition group"
            >
              <div className="relative">
                <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                  {video.duration.replace("PT", "").replace("M", ":").replace("S", "")}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-[#6366f1] transition">{video.title}</h3>
                <div className="flex justify-between text-xs text-[#64748b]">
                  <span>{video.views} views</span>
                  <span>{new Date(video.published_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Analyzer Section */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 mt-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="text-[#22d3ee]" size={24} /> AI Video Analyzer
          </h2>
          <p className="text-[#64748b] mb-6">Upload a video before publishing to get a hook analysis and score.</p>
          
          <div className="flex gap-4 items-center mb-6">
            <input 
              type="file" 
              accept="video/mp4" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm text-[#e2e8f0] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6366f1] file:text-white hover:file:bg-[#4f46e5]"
            />
            <button 
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="bg-[#22d3ee] text-[#0a0a0f] px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition"
            >
              {analyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {analysisResult && (
            <div className="bg-[#1e1e2e] p-6 rounded-lg border border-[#2d2d3f]">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-white">Analysis Result</h3>
                <div className="bg-[#0a0a0f] border-4 border-[#22d3ee] rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl text-white">
                  {analysisResult.score}/10
                </div>
              </div>
              <p className="text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {analysisResult.analysis}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Panel (Right Side) */}
      {selectedVideo && (
        <div className="w-[400px] flex-shrink-0 bg-[#111118] border border-[#1e1e2e] rounded-xl flex flex-col sticky top-8" style={{ height: "calc(100vh - 64px)" }}>
          <div className="p-4 border-b border-[#1e1e2e] flex justify-between items-center bg-[#0a0a0f] rounded-t-xl">
            <h2 className="font-bold">Edit Video</h2>
            <button onClick={() => setSelectedVideo(null)} className="text-[#64748b] hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <img src={selectedVideo.thumbnail} alt="thumb" className="w-full rounded-lg aspect-video object-cover" />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-3 py-2 text-white outline-none focus:border-[#6366f1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={6}
                  className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-3 py-2 text-white outline-none focus:border-[#6366f1] resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748b] mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full bg-[#1e1e2e] border border-[#2d2d3f] rounded-lg px-3 py-2 text-white outline-none focus:border-[#6366f1]"
                />
              </div>
            </div>

            {/* AI Suggestions Panel */}
            <div className="pt-4 border-t border-[#1e1e2e]">
              <button 
                onClick={handleAiImprove}
                disabled={generating}
                className="w-full flex justify-center items-center gap-2 bg-[#1e1e2e] hover:bg-[#2d2d3f] text-[#22d3ee] border border-[#22d3ee]/30 py-3 rounded-lg font-medium transition"
              >
                <Wand2 size={18} /> {generating ? "Generating..." : "AI Improve Metadata"}
              </button>

              {aiSuggestions && (
                <div className="mt-4 space-y-4 bg-[#1e1e2e]/50 p-4 rounded-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex justify-between">
                      Best Title 
                      <button onClick={() => setEditTitle(aiSuggestions.best_title)} className="text-xs text-[#6366f1] hover:underline">Use This</button>
                    </h4>
                    <p className="text-sm text-[#e2e8f0]">{aiSuggestions.best_title}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex justify-between">
                      Description
                      <button onClick={() => setEditDesc(aiSuggestions.description)} className="text-xs text-[#6366f1] hover:underline">Use This</button>
                    </h4>
                    <p className="text-sm text-[#e2e8f0] line-clamp-3">{aiSuggestions.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex justify-between">
                      Tags
                      <button onClick={() => setEditTags(aiSuggestions.tags.join(", "))} className="text-xs text-[#6366f1] hover:underline">Use This</button>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {aiSuggestions.tags.slice(0, 5).map((t: string) => (
                        <span key={t} className="text-[10px] bg-[#2d2d3f] px-2 py-1 rounded text-[#e2e8f0]">{t}</span>
                      ))}
                      {aiSuggestions.tags.length > 5 && <span className="text-[10px] text-[#64748b]">+{aiSuggestions.tags.length - 5} more</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-[#1e1e2e] bg-[#0a0a0f] rounded-b-xl">
            <button 
              onClick={saveToYouTube}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              <Save size={18} /> {saving ? "Saving..." : "Save to YouTube"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-[#64748b]">Loading manager...</div>}>
      <VideosPageContent />
    </Suspense>
  );
}