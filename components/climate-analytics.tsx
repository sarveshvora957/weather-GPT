"use client";

import React, { useState, useEffect } from "react";
import { ClimateHistory, LocationData } from "@/types/weather";
import { WeatherService } from "@/lib/weather-service";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Flame, CloudRain, Sun, Info, Compass } from "lucide-react";

interface ClimateAnalyticsProps {
  location: LocationData;
}

export const ClimateAnalytics: React.FC<ClimateAnalyticsProps> = ({ location }) => {
  const [climate, setClimate] = useState<ClimateHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"temperature" | "rainfall" | "heatwaves">("temperature");

  useEffect(() => {
    async function fetchClimate() {
      setLoading(true);
      try {
        const data = await WeatherService.getHistoricalClimate(
          location.latitude,
          location.longitude,
          location.name,
          location.country
        );
        setClimate(data);
      } catch (err) {
        console.error("Climate fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClimate();
  }, [location]);

  if (loading || !climate) {
    return (
      <div className="h-72 rounded-3xl glass-panel flex items-center justify-center border border-white/10">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-7 h-7 rounded-full border-2 border-aurora-cyan border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Aggregating historical climate reanalysis (1940-2024)...</span>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl glass-panel border border-aurora-cyan/30 shadow-2xl text-xs space-y-1">
          <p className="font-bold text-aurora-cyan">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-slate-200 flex items-center justify-between gap-4">
              <span className="text-slate-400 capitalize">{entry.name}:</span>
              <strong className="font-mono text-white">
                {entry.value} {entry.unit || ""}
              </strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Climate Shift Metric Badges */}
      <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-aurora-purple/20 text-purple-300 font-mono border border-aurora-purple/30">
                15-Year Longitudinal Climate Reanalysis
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {climate.startYear} – {climate.endYear}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Climate Shift & Decadal Trends: {climate.city}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {climate.summary}
        </p>

        {/* 3 Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Temperature Shift</span>
              <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">
                +{climate.temperatureRiseDecade}°C
              </span>
              <span className="text-[10px] text-slate-400">Over last 15 years</span>
            </div>
            <Flame className="w-8 h-8 text-rose-500/40" />
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Precipitation Shift</span>
              <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
                {climate.rainfallShiftPercent > 0 ? "+" : ""}{climate.rainfallShiftPercent}%
              </span>
              <span className="text-[10px] text-slate-400">Monsoon intensity delta</span>
            </div>
            <CloudRain className="w-8 h-8 text-cyan-500/40" />
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Extreme Heat Events</span>
              <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
                +4.2 Days
              </span>
              <span className="text-[10px] text-slate-400">Annual heatwave days anomaly</span>
            </div>
            <Sun className="w-8 h-8 text-amber-500/40" />
          </div>
        </div>
      </div>

      {/* Interactive Climate Trends Chart */}
      <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Historical Climate Graphs</h3>

          {/* Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab("temperature")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "temperature"
                  ? "bg-rose-500 text-white shadow-neon-rose"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mean Temperature
            </button>
            <button
              onClick={() => setActiveTab("rainfall")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "rainfall"
                  ? "bg-cyan-500 text-navy-950 shadow-neon-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual Rainfall
            </button>
            <button
              onClick={() => setActiveTab("heatwaves")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "heatwaves"
                  ? "bg-amber-500 text-navy-950 shadow-neon-amber"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Heatwave Days
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "temperature" ? (
              <LineChart data={climate.yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="°C" domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="avgTemp"
                  name="Mean Annual Temperature"
                  unit="°C"
                  stroke="#fb7185"
                  strokeWidth={3}
                  dot={{ fill: "#fb7185", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="maxTemp"
                  name="Peak Summer High"
                  unit="°C"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </LineChart>
            ) : activeTab === "rainfall" ? (
              <BarChart data={climate.yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" mm" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rainfallSum" name="Annual Precipitation Sum" unit=" mm" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={climate.yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" days" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="heatwaveDays" name="Annual Days > 40°C" unit=" days" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonal Climate Breakdown */}
      <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white">Seasonal Shifting Patterns</h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {climate.seasonalBreakdown.map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
              <span className="font-bold text-white block">{s.season}</span>
              <div className="flex items-center justify-between text-slate-400">
                <span>Avg Temp:</span>
                <strong className="text-slate-200 font-mono">{s.avgTemp.toFixed(1)}°C</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Rainfall:</span>
                <strong className="text-slate-200 font-mono">{s.rainfall} mm</strong>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-aurora-cyan/15 text-aurora-cyan font-semibold block text-center mt-1">
                {s.trend}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
