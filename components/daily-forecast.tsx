"use client";

import React, { useState } from "react";
import { DailyForecastItem } from "@/types/weather";
import { formatTemp } from "@/lib/utils";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Droplets,
  Wind,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DailyForecastProps {
  items: DailyForecastItem[];
  unit?: "C" | "F";
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  items,
  unit = "C",
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getIcon = (code: number) => {
    if (code === 0) return <Sun className="w-5 h-5 text-amber-400" />;
    if (code === 1 || code === 2) return <CloudSun className="w-5 h-5 text-amber-300" />;
    if (code === 3 || code === 45 || code === 48) return <Cloud className="w-5 h-5 text-slate-300" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-5 h-5 text-cyan-400" />;
    if (code >= 95) return <CloudLightning className="w-5 h-5 text-purple-400" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  // Find min and max across all days for normalized temperature bar
  const globalMin = Math.min(...items.map((i) => i.tempMin));
  const globalMax = Math.max(...items.map((i) => i.tempMax));
  const tempRange = Math.max(1, globalMax - globalMin);

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Extended Daily Forecast (7 - 14 Days)
          </h2>
          <p className="text-xs text-slate-400">
            High/Low range, rain probability, and UV projections
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((day, idx) => {
          const isToday = idx === 0;
          const isTomorrow = idx === 1;
          const isExpanded = expandedIndex === idx;

          // Calculate left and width percentages for temperature gradient bar
          const leftPercent = ((day.tempMin - globalMin) / tempRange) * 100;
          const barWidth = Math.max(15, ((day.tempMax - day.tempMin) / tempRange) * 100);

          return (
            <div
              key={day.date || idx}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isToday
                  ? "bg-brand-500/10 border-brand-500/30 shadow-sm"
                  : "bg-white/5 hover:bg-white/10 border-white/5"
              }`}
            >
              {/* Row Header */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
              >
                {/* Day name & condition */}
                <div className="flex items-center gap-3 w-36 sm:w-44 shrink-0">
                  {getIcon(day.weatherCode)}
                  <div>
                    <span className={`text-xs font-bold block ${isToday ? "text-aurora-cyan" : "text-white"}`}>
                      {day.dayName} {isToday ? "(Today)" : isTomorrow ? "(Tomorrow)" : ""}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                      {day.conditionText}
                    </span>
                  </div>
                </div>

                {/* Rain chance pill */}
                <div className="flex items-center gap-1.5 w-16 shrink-0">
                  {day.precipitationProb > 0 ? (
                    <span className="text-[11px] font-semibold text-cyan-300 font-mono flex items-center gap-0.5">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      {day.precipitationProb}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">—</span>
                  )}
                </div>

                {/* Temperature Range Bar */}
                <div className="flex-1 items-center gap-2 hidden md:flex">
                  <span className="text-xs text-slate-400 font-mono w-9 text-right">
                    {formatTemp(day.tempMin, unit)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 relative overflow-hidden">
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${barWidth}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white font-mono w-9">
                    {formatTemp(day.tempMax, unit)}
                  </span>
                </div>

                {/* Mobile temp text */}
                <div className="md:hidden text-xs font-mono font-bold text-white">
                  {formatTemp(day.tempMin, unit)} / {formatTemp(day.tempMax, unit)}
                </div>

                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-black/20">
                  <div>
                    <span className="text-slate-400 block">Rainfall Volume</span>
                    <strong className="text-white font-mono">{day.precipitationSum} mm</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Max Wind Speed</span>
                    <strong className="text-white font-mono">{day.windSpeedMax} km/h</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Max UV Index</span>
                    <strong className="text-white font-mono">{day.uvIndexMax}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Daylight Hours</span>
                    <strong className="text-white font-mono">{day.sunrise ? `${day.sunrise.slice(11, 16)} - ${day.sunset.slice(11, 16)}` : "12.8 hrs"}</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
