"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Eye, Film, Activity, Clock, RotateCw, Video, Wand2 } from "lucide-react";
import StatCard from "@/components/StatCard";

interface ChannelStats {
  title: string;
  subscribers: string;
  views: string;
  videos_count: string;
  thumbnail: string;
}

interface Video {
  id: string;
  title: string;
  published_at: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tip, setTip] = useState<string>("Loading tip...");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, videosRes] = await Promise.all([
        fetch("http://localhost:8000/api/stats/channel"),
        fetch("http://localhost:8000/api/stats/videos?max_results=5")
      ]);

      if (statsRes.status === 401 || videosRes.status === 401) {
        setError("youtube_auth_required");
        setLoading(false);
        return;
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (videosRes.ok) {
        setVideos(await videosRes.json());
      }

      fetchTip();
    } catch (err) {
      setError("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const fetchTip = async () => {
    setTip("Generating AI tip...");
    try {
      const res = await fetch("http://localhost:8000/api/chat/tip");
      const data = await res.json();
      setTip(data.tip || "Could not generate tip.");
    } catch (err) {
      setTip("Failed to fetch tip.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-[#1e1e2e] rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#1e1e2e] rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error === "youtube_auth_required") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-[#111118] p-8 rounded-2xl border border-[#1e1e2e] max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Connect YouTube</h2>
          <p className="text-[#64748b] mb-6">
            Please connect your YouTube channel in settings to view dashboard analytics.
          </p>
          <Link href="/settings" className="block bg-[#6366f1] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4f46e5] transition">
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  const avgViews = stats && stats.videos_count !== "0" 
    ? Math.round(parseInt(stats.views) / parseInt(stats.videos_count))
    : 0;

  return (
    <div className="animate-[fade-in_1s_ease-out]">
      <div className="flex items-center gap-5 mb-10">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#6366f1] to-[#22d3ee] rounded-full blur opacity-70"></div>
          {stats?.thumbnail ? (
            <img src={stats.thumbnail} alt="Channel" className="relative w-16 h-16 rounded-full border-2 border-[#111118]" />
          ) : (
            <div className="relative w-16 h-16 rounded-full bg-[#1e1e2e] border-2 border-[#111118]"></div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300">
            {stats?.title || "Dashboard"}
          </h1>
          <p className="text-[#94a3b8] font-medium tracking-wide mt-1">AI Channel Intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Subscribers" value={stats?.subscribers || "0"} icon={Users} change={12.5} />
        <StatCard title="Total Views" value={stats?.views || "0"} icon={Eye} change={8.2} />
        <StatCard title="Total Videos" value={stats?.videos_count || "0"} icon={Film} />
        <StatCard title="Avg Views / Video" value={avgViews} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-end mb-2 border-b border-[#1e1e2e]/50 pb-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Recent Content</h2>
            <Link href="/videos" className="text-sm font-semibold text-[#6366f1] hover:text-[#818cf8] transition flex items-center gap-1 group">
              View All <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          
          <div className="space-y-4">
            {videos.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center border-dashed border-[#2d2d3f]">
                <p className="text-[#64748b]">No videos found.</p>
              </div>
            ) : videos.map((video, idx) => (
              <div key={video.id} className="group relative bg-[#111118]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1e1e2e] hover:border-[#6366f1]/50 transition-all duration-300 flex flex-col sm:flex-row gap-5 items-center shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#6366f1] to-[#22d3ee] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <div className="relative overflow-hidden rounded-xl sm:w-48 w-full aspect-video flex-shrink-0 border border-[#1e1e2e]">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-cyan-200 transition-colors">{video.title}</h3>
                  <p className="text-xs text-[#94a3b8] font-medium tracking-wide mb-3 uppercase mt-1">{new Date(video.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="bg-[#1e1e2e]/80 border border-[#2d2d3f] px-3 py-1.5 rounded-full text-[#e2e8f0] flex items-center gap-1">
                      <Eye size={12} className="text-[#22d3ee]" /> {parseInt(video.views).toLocaleString()}
                    </span>
                    <span className="bg-[#1e1e2e]/80 border border-[#2d2d3f] px-3 py-1.5 rounded-full text-[#e2e8f0] flex items-center gap-1">
                      <span className="text-[#ef4444]">♥</span> {parseInt(video.likes).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link href={`/videos?id=${video.id}`} className="mt-4 sm:mt-0 w-full sm:w-auto text-center bg-[#1e1e2e] hover:bg-[#6366f1] hover:text-white border border-[#2d2d3f] hover:border-[#6366f1] px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md">
                  Analyze
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* AI Tip Glass Panel */}
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-[#6366f1]/50 to-[#22d3ee]/20 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] transition-shadow duration-500">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative h-full bg-[#0a0a0f]/95 backdrop-blur-2xl rounded-[23px] p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#6366f1]/20 p-2.5 rounded-xl border border-[#6366f1]/30">
                    <Wand2 size={24} className="text-[#818cf8]" />
                  </div>
                  <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">
                    MAYA Insights
                  </h2>
                </div>
                <button onClick={fetchTip} className="text-[#64748b] hover:text-[#22d3ee] transition-transform hover:rotate-180 duration-500 bg-[#1e1e2e] p-2 rounded-full border border-[#2d2d3f]">
                  <RotateCw size={16} />
                </button>
              </div>
              <p className="text-[#cbd5e1] leading-relaxed font-medium text-[15px] border-l-2 border-[#6366f1] pl-4 italic">"{tip}"</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8 text-white">
              <div className="bg-[#22d3ee]/20 p-2 rounded-lg border border-[#22d3ee]/30">
                <Clock size={20} className="text-[#22d3ee]" /> 
              </div>
              Prime Posting Windows
            </h2>
            <div className="space-y-4">
              <div className="group relative bg-[#111118]/60 border border-[#1e1e2e] hover:border-[#22d3ee]/50 p-4 rounded-2xl flex items-center justify-between transition-colors duration-300 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22d3ee] scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300"></div>
                <span className="font-bold text-[#e2e8f0] text-lg pl-2">Friday</span>
                <span className="font-black text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text px-3 py-1.5 border border-[#22d3ee]/20 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.2)]">6:00 PM</span>
              </div>
              <div className="group relative bg-[#111118]/60 border border-[#1e1e2e] hover:border-[#6366f1]/50 p-4 rounded-2xl flex items-center justify-between transition-colors duration-300 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6366f1] scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300"></div>
                <span className="font-bold text-[#e2e8f0] text-lg pl-2">Saturday</span>
                <span className="font-black text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text px-3 py-1.5 border border-[#6366f1]/20 rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.2)]">2:00 PM</span>
              </div>
              <div className="group relative bg-[#111118]/60 border border-[#1e1e2e] hover:border-[#a855f7]/50 p-4 rounded-2xl flex items-center justify-between transition-colors duration-300 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#a855f7] scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300"></div>
                <span className="font-bold text-[#e2e8f0] text-lg pl-2">Sunday</span>
                <span className="font-black text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text px-3 py-1.5 border border-[#a855f7]/20 rounded-lg shadow-[0_0_10px_rgba(168,85,247,0.2)]">11:00 AM</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748b] bg-[#1e1e2e]/50 px-3 py-1 rounded-full border border-[#2d2d3f]">
                <Activity size={12} className="text-[#6366f1]" /> AI Calibrated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
