"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Video,
  BarChart2,
  Wand2,
  Settings,
  Play
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Chat", href: "/chat", icon: MessageSquare },
    { name: "Videos", href: "/videos", icon: Video },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Generator", href: "/generate", icon: Wand2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-[240px] bg-[#0a0a0f]/80 backdrop-blur-md border-r border-[#1e1e2e]/50 flex flex-col p-4 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-3 mb-10 px-2 pt-2">
        <div className="bg-gradient-to-br from-[#6366f1] to-[#22d3ee] p-2.5 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <Play size={20} className="text-white fill-current" />
        </div>
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a5b4fc] tracking-wide">
          YT Dashboard
        </h1>
      </div>

      <nav className="flex-1 space-y-3">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden ${
                isActive 
                  ? "text-white font-semibold shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                  : "text-[#94a3b8] hover:text-white hover:bg-[#1e1e2e]/60"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/20 to-transparent"></div>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#6366f1] rounded-r-full shadow-[0_0_10px_#6366f1]"></div>
              )}
              <Icon size={20} className={isActive ? "text-[#818cf8]" : ""} />
              <span className="relative z-10">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-[#1e1e2e]/50 px-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
          <p className="text-[10px] text-[#64748b] font-bold tracking-widest uppercase">POWERED BY MAYA AI</p>
        </div>
      </div>
    </div>
  );
}
