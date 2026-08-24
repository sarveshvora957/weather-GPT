"use client";

import React, { useState, useEffect } from "react";
import { AdminAnalytics } from "@/lib/db";
import {
  Users,
  MessageSquare,
  Activity,
  Server,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const json = await res.json();
          setStats(json);
        }
      } catch (err) {
        console.error("Admin stats error:", err);
      }
    }
    loadStats();
  }, []);

  if (!stats) {
    return (
      <div className="h-64 rounded-3xl glass-panel flex items-center justify-center border border-white/10">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-7 h-7 rounded-full border-2 border-aurora-cyan border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Fetching telemetry telemetry streams...</span>
        </div>
      </div>
    );
  }

  const COLORS = ["#00f0ff", "#38bdf8", "#ffb703", "#9d4edd", "#ff006e"];

  return (
    <div className="space-y-6">
      {/* Top 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl glass-panel border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Registered Users</span>
            <span className="text-2xl font-black font-mono text-white mt-1 block">
              {stats.totalUsers.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">+{stats.activeToday} active today</span>
          </div>
          <Users className="w-8 h-8 text-brand-400/40" />
        </div>

        <div className="p-4 rounded-3xl glass-panel border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">AI Weather Inquiries</span>
            <span className="text-2xl font-black font-mono text-aurora-cyan mt-1 block">
              {stats.aiQueriesTotal.toLocaleString()}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Real-time LLM Grounding</span>
          </div>
          <MessageSquare className="w-8 h-8 text-cyan-400/40" />
        </div>

        <div className="p-4 rounded-3xl glass-panel border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">API Success Rate</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {stats.apiSuccessRate}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ECMWF / GFS Endpoints</span>
          </div>
          <Server className="w-8 h-8 text-emerald-400/40" />
        </div>

        <div className="p-4 rounded-3xl glass-panel border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Average Response Latency</span>
            <span className="text-2xl font-black font-mono text-amber-300 mt-1 block">
              {stats.avgLatencyMs}ms
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Sub-200ms Target</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400/40" />
        </div>
      </div>

      {/* Query Categories & Top Cities Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Asked Categories */}
        <div className="lg:col-span-6 rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurora-cyan" />
            <span>AI Intent Category Distribution</span>
          </h3>

          <div className="space-y-3 pt-2">
            {stats.mostAskedCategories.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{cat.category}</span>
                  <span className="text-slate-400 font-mono">
                    {cat.count} queries ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Searched Locations */}
        <div className="lg:col-span-6 rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-aurora-teal" />
            <span>Most Inquired Global Cities</span>
          </h3>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSearchedCities}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="city" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(13, 22, 45, 0.95)",
                    border: "1px solid rgba(0, 240, 255, 0.3)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Search Volume" fill="#00f0ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
