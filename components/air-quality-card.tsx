"use client";

import React from "react";
import { AirQuality } from "@/types/weather";
import { Wind, ShieldAlert, Heart, Activity, Info } from "lucide-react";

interface AirQualityCardProps {
  aqi: AirQuality;
}

export const AirQualityCard: React.FC<AirQualityCardProps> = ({ aqi }) => {
  // Gauge needle position percentage (0 to 300 AQI clamped)
  const percent = Math.min(100, (aqi.aqi / 300) * 100);

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span>Air Quality Index (AQI)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Copernicus Atmospheric Monitoring Service (CAMS)
          </p>
        </div>

        <span
          className="px-3 py-1 rounded-full text-xs font-bold font-mono border"
          style={{
            backgroundColor: `${aqi.color}20`,
            borderColor: `${aqi.color}40`,
            color: aqi.color,
          }}
        >
          {aqi.category}
        </span>
      </div>

      {/* Numerical Gauge Bar */}
      <div className="my-4 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white">{aqi.aqi}</span>
            <span className="text-xs text-slate-400">AQI Index</span>
          </div>
          <span className="text-xs font-semibold" style={{ color: aqi.color }}>
            {aqi.recommendation}
          </span>
        </div>

        {/* Gradient progress bar */}
        <div className="relative h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="absolute h-full rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
              backgroundColor: aqi.color,
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 Good</span>
          <span>50 Mod</span>
          <span>100 Unhealthy</span>
          <span>200+ Hazard</span>
        </div>
      </div>

      {/* Pollutant Detailed Breakdown Matrix */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px] my-3">
        <div className="p-2 rounded-xl bg-black/20 border border-white/5">
          <span className="text-slate-400 block">PM2.5</span>
          <strong className="text-white font-mono">{aqi.pm25}</strong>
          <span className="text-[9px] text-slate-400 block">µg/m³</span>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/5">
          <span className="text-slate-400 block">PM10</span>
          <strong className="text-white font-mono">{aqi.pm10}</strong>
          <span className="text-[9px] text-slate-400 block">µg/m³</span>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/5">
          <span className="text-slate-400 block">NO₂</span>
          <strong className="text-white font-mono">{aqi.no2}</strong>
          <span className="text-[9px] text-slate-400 block">µg/m³</span>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/5">
          <span className="text-slate-400 block">O₃ (Ozone)</span>
          <strong className="text-white font-mono">{aqi.o3}</strong>
          <span className="text-[9px] text-slate-400 block">µg/m³</span>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/5">
          <span className="text-slate-400 block">SO₂</span>
          <strong className="text-white font-mono">{aqi.so2}</strong>
          <span className="text-[9px] text-slate-400 block">µg/m³</span>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/5">
          <span className="text-slate-400 block">CO</span>
          <strong className="text-white font-mono">{aqi.co}</strong>
          <span className="text-[9px] text-slate-400 block">µg/m³</span>
        </div>
      </div>

      {/* Sensitive Group Health Advisory */}
      <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-slate-300 flex items-start gap-2.5">
        <Heart className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block">Health Guidance:</span>
          <span>{aqi.sensitiveGroupAdvisory}</span>
        </div>
      </div>
    </div>
  );
};
