import { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number; // percentage change
}

export default function StatCard({ title, value, icon: Icon, change }: StatCardProps) {
  return (
    <div className="relative group rounded-2xl p-0.5 bg-gradient-to-b from-[#1e1e2e] to-[#0a0a0f] hover:from-[#6366f1]/40 hover:to-[#22d3ee]/10 transition-all duration-500 overflow-hidden shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
      
      <div className="relative h-full bg-[#111118]/90 backdrop-blur-xl border border-[#ffffff0a] rounded-[14px] p-6 flex flex-col z-10">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-[#94a3b8] font-semibold text-sm tracking-wide uppercase">{title}</h3>
          <div className="bg-gradient-to-br from-[#1e1e2e] to-[#0a0a0f] border border-[#2d2d3f] p-2.5 rounded-xl shadow-inner group-hover:border-[#6366f1]/50 transition-colors">
            <Icon size={20} className="text-[#22d3ee] group-hover:text-[#818cf8] transition-colors" />
          </div>
        </div>
        
        <div className="flex items-end gap-3 mt-auto">
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#cbd5e1]">{value}</span>
          
          {change !== undefined && (
            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full mb-1 border ${
              change >= 0 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {change >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}