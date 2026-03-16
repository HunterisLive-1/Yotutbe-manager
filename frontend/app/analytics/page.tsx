"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart2, Star, TrendingUp, Clock, AlertCircle, Video as VideoIcon } from "lucide-react";
import StatCard from "@/components/StatCard";

interface Video {
  id: string;
  title: string;
  published_at: string;
  views: string;
  duration: string;
}

export default function AnalyticsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/stats/videos?max_results=50")
      .then(res => {
        if (res.status === 401) {
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then(data => setVideos(data))
      .catch((err) => {
        if (err.message === "unauthorized") {
           // handled in component
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 text-[#64748b] animate-pulse">Loading analytics...</div>;

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <AlertCircle size={48} className="text-[#64748b] mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect YouTube</h2>
        <p className="text-[#64748b]">
          We need to fetch your videos to generate meaningful analytics.
        </p>
      </div>
    );
  }

  if (videos.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <AlertCircle size={48} className="text-[#64748b] mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Enough Data</h2>
        <p className="text-[#64748b]">
          We need at least 5 videos to generate meaningful analytics. 
          Currently found {videos.length} videos.
        </p>
      </div>
    );
  }

  // --- Processing Data ---
  
  // 1. Time based stats
  const hourStats = new Map<number, { total: number, count: number }>();
  const dayStats = new Map<number, { total: number, count: number }>();
  
  let totalViews = 0;
  let bestVideo = videos[0];
  let shortsViews = 0, shortsCount = 0;
  let longViews = 0, longCount = 0;

  const isShort = (d: string) => d.includes("M") && !d.includes("H") && parseInt(d.split("M")[0].replace("PT", "")) < 1 || !d.includes("M");

  videos.forEach(v => {
    const views = parseInt(v.views);
    const date = new Date(v.published_at);
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday

    totalViews += views;
    if (views > parseInt(bestVideo.views)) bestVideo = v;

    if (isShort(v.duration)) {
      shortsViews += views; shortsCount++;
    } else {
      longViews += views; longCount++;
    }

    if (!hourStats.has(hour)) hourStats.set(hour, { total: 0, count: 0 });
    const h = hourStats.get(hour)!;
    h.total += views; h.count++;

    if (!dayStats.has(day)) dayStats.set(day, { total: 0, count: 0 });
    const d = dayStats.get(day)!;
    d.total += views; d.count++;
  });

  // Prepare chart arrays
  const hourlyData = Array.from({ length: 24 }).map((_, i) => {
    const stat = hourStats.get(i);
    return {
      hour: i,
      label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i >= 12 ? 'pm' : 'am'}`,
      avgViews: stat ? Math.round(stat.total / stat.count) : 0
    };
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyData = days.map((day, i) => {
    const stat = dayStats.get(i);
    return {
      day,
      dayIndex: i,
      avgViews: stat ? Math.round(stat.total / stat.count) : 0
    };
  });

  const timelineData = [...videos].reverse().map(v => ({
    title: v.title,
    date: new Date(v.published_at).toLocaleDateString(),
    views: parseInt(v.views)
  }));

  // Top hours
  const sortedHours = [...hourlyData].sort((a, b) => b.avgViews - a.avgViews);
  const top3Hours = sortedHours.slice(0, 3).map(h => h.hour);
  
  // Top day
  const bestDay = [...dailyData].sort((a, b) => b.avgViews - a.avgViews)[0];

  // Best time slots (combining day + hour simply by finding top 3 avg combinations if we tracked it, 
  // but since we only tracked separately, let's just show top 3 hours but map them to the best day context)
  // To be accurate to the prompt, I'll calculate Day+Hour combos.
  const dayHourStats = new Map<string, { total: number, count: number }>();
  videos.forEach(v => {
    const views = parseInt(v.views);
    const date = new Date(v.published_at);
    const key = `${date.getDay()}-${date.getHours()}`;
    if (!dayHourStats.has(key)) dayHourStats.set(key, { total: 0, count: 0 });
    const s = dayHourStats.get(key)!;
    s.total += views; s.count++;
  });
  
  const bestSlots = Array.from(dayHourStats.entries())
    .map(([key, stat]) => ({
      key,
      day: parseInt(key.split("-")[0]),
      hour: parseInt(key.split("-")[1]),
      avgViews: Math.round(stat.total / stat.count)
    }))
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 3);

  const formatHour = (h: number) => `${h === 0 ? 12 : h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111118] border border-[#1e1e2e] p-3 rounded-lg shadow-xl">
          <p className="text-[#e2e8f0] font-medium mb-1">{payload[0].payload.title || label}</p>
          <p className="text-[#22d3ee] font-bold">{payload[0].value.toLocaleString()} views</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="bg-[#6366f1] p-3 rounded-xl">
          <BarChart2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Analytics & Insights</h1>
          <p className="text-[#64748b]">Deep dive into your channel's performance</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111118] border border-[#1e1e2e] p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star size={64} />
          </div>
          <p className="text-sm font-medium text-[#64748b] mb-2 uppercase tracking-wider">Best Performing Video</p>
          <h3 className="text-lg font-bold text-white line-clamp-2 mb-4">{bestVideo.title}</h3>
          <p className="text-2xl font-bold text-[#22d3ee]">{parseInt(bestVideo.views).toLocaleString()} <span className="text-sm font-medium text-[#64748b]">views</span></p>
        </div>

        <StatCard 
          title="Average Views / Video" 
          value={Math.round(totalViews / videos.length).toLocaleString()} 
          icon={TrendingUp} 
        />

        <div className="bg-[#111118] border border-[#1e1e2e] p-6 rounded-xl">
          <p className="text-sm font-medium text-[#64748b] mb-4 uppercase tracking-wider flex items-center gap-2">
            <VideoIcon size={16} /> Format Comparison
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white font-medium">Shorts</span>
                <span className="text-[#22d3ee] font-bold">{shortsCount > 0 ? Math.round(shortsViews / shortsCount).toLocaleString() : 0} avg</span>
              </div>
              <div className="w-full bg-[#1e1e2e] rounded-full h-2">
                <div className="bg-[#22d3ee] h-2 rounded-full" style={{ width: shortsCount > 0 ? '100%' : '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white font-medium">Long Form</span>
                <span className="text-[#6366f1] font-bold">{longCount > 0 ? Math.round(longViews / longCount).toLocaleString() : 0} avg</span>
              </div>
              <div className="w-full bg-[#1e1e2e] rounded-full h-2">
                <div className="bg-[#6366f1] h-2 rounded-full" style={{ width: longCount > 0 && shortsCount > 0 ? `${(longViews/longCount) / (shortsViews/shortsCount) * 100}%` : '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Chart */}
        <div className="lg:col-span-2 bg-[#111118] border border-[#1e1e2e] p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6">Views by Hour Published</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1e2e' }} />
                <Bar dataKey="avgViews" radius={[4, 4, 0, 0]}>
                  {hourlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={top3Hours.includes(entry.hour) ? '#6366f1' : '#2d2d3f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Times Card */}
        <div className="bg-[#111118] border border-[#1e1e2e] p-6 rounded-xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <Clock size={20} className="text-[#22d3ee]" /> Best Times to Post
          </h3>
          <div className="space-y-4">
            {bestSlots.map((slot, i) => {
              const colors = [
                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                "bg-blue-500/20 text-blue-400 border-blue-500/30",
                "bg-purple-500/20 text-purple-400 border-purple-500/30"
              ];
              return (
                <div key={slot.key} className={`p-4 rounded-xl border flex justify-between items-center ${colors[i]}`}>
                  <span className="font-bold text-lg">{days[slot.day]} {formatHour(slot.hour)}</span>
                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-wider opacity-80">Avg Views</span>
                    <span className="font-bold">{slot.avgViews.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="bg-[#111118] border border-[#1e1e2e] p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6">Views by Day of Week</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1e2e' }} />
                <Bar dataKey="avgViews" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.dayIndex === bestDay?.dayIndex ? '#22d3ee' : '#2d2d3f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-[#111118] border border-[#1e1e2e] p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6">Performance Over Time</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#0a0a0f', stroke: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#22d3ee', stroke: '#0a0a0f' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
