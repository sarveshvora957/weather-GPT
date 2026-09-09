"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareCode,
  CalendarDays,
  Map,
  AlertTriangle,
  TrendingUp,
  GitCompare,
  Lightbulb,
  BookmarkCheck,
  ShieldAlert,
  Settings,
  Zap,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "Live" },
    { name: "AI Weather Agent", href: "/chat", icon: MessageSquareCode, badge: "AI Agent", highlight: true },
    { name: "Weather Map", href: "/map", icon: Map, badge: "Live Radar" },
    { name: "Detailed Forecast", href: "/forecast", icon: CalendarDays },
    { name: "Alerts & Warnings", href: "/alerts", icon: AlertTriangle, badgeColor: "bg-rose-500/20 text-rose-300" },
    { name: "Climate Trends", href: "/climate", icon: TrendingUp },
    { name: "City Comparison", href: "/compare", icon: GitCompare },
    { name: "AI Recommendations", href: "/recommendations", icon: Lightbulb },
    { name: "Saved Locations", href: "/saved", icon: BookmarkCheck },
    { name: "Admin Telemetry", href: "/admin", icon: ShieldAlert },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 glass-panel min-h-[calc(100vh-61px)] p-4 justify-between transition-colors">
      <div className="space-y-6">
        {/* Navigation Sections */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Intelligence Suite
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-brand-600/30 to-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/40 shadow-sm font-semibold"
                      : item.highlight
                      ? "text-slate-200 hover:bg-brand-500/10 hover:text-aurora-cyan border border-brand-500/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-aurora-cyan" : item.highlight ? "text-brand-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        item.badgeColor || "bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SIH Hackathon Demo Card in Sidebar */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs mb-1">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>SIH 2026 Presentation</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Switch between 5 judge-ready presentation scenarios with real meteorological telemetry.
          </p>
          <Link
            href="/chat?demo=true"
            className="inline-block mt-2.5 text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
          >
            Launch Scenarios →
          </Link>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ECMWF/GFS Online</span>
        </div>
        <span>v1.0 Pro</span>
      </div>
    </aside>
  );
};
