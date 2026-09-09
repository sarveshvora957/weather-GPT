"use client";

import React from "react";
import { Droplets, CloudRain, Umbrella, AlertCircle, TrendingUp } from "lucide-react";
import { HourlyForecastItem } from "@/types/weather";

interface RainfallCardProps {
  precipitationProb: number;
  precipitationSum?: number;
  currentPrecipitation?: number;
  hourlyItems?: HourlyForecastItem[];
}

export const RainfallCard: React.FC<RainfallCardProps> = ({
  precipitationProb = 0,
  precipitationSum = 0,
  currentPrecipitation = 0,
  hourlyItems = [],
}) => {
  const isRainExpected = precipitationProb >= 40 || currentPrecipitation > 0 || precipitationSum > 1.0;
  const isHighRisk = precipitationProb >= 70 || currentPrecipitation >= 2.5;

  // Next 8 hours forecast
  const nextHours = hourlyItems.slice(0, 8);

  const getRainStatusMessage = () => {
    if (currentPrecipitation > 2.0) return "Active rainfall currently occurring.";
    if (isHighRisk) return "High probability of showers expected today.";
    if (isRainExpected) return "Moderate chance of scattered precipitation.";
    return "Dry conditions expected with minimal rain risk.";
  };

  return (
    <div
      className={`rounded-3xl glass-panel p-5 sm:p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
        isHighRisk
          ? "border-cyan-400/40 bg-cyan-950/20 shadow-neon-cyan"
          : isRainExpected
          ? "border-cyan-500/20 bg-navy-950/40"
          : "border-white/10"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <CloudRain className={`w-4 h-4 ${isRainExpected ? "text-cyan-400 animate-bounce" : "text-slate-400"}`} />
            <span>Rainfall & Precipitation</span>
          </h3>
          <p className="text-xs text-slate-400">Precipitation probability & accumulation</p>
        </div>

        {isRainExpected && (
          <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1">
            <Umbrella className="w-3.5 h-3.5" />
            <span>Carry Umbrella</span>
          </span>
        )}
      </div>

      {/* Main Gauge & Value Display */}
      <div className="my-2 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-cyan-400">{precipitationProb}%</span>
            <span className="text-xs text-slate-300 font-semibold">Chance of Rain</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Expected Volume</span>
            <strong className="text-sm font-bold text-white font-mono">
              {precipitationSum > 0 ? `${precipitationSum.toFixed(1)} mm` : currentPrecipitation > 0 ? `${currentPrecipitation.toFixed(1)} mm/h` : "0.0 mm"}
            </strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 relative overflow-hidden p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isHighRisk
                ? "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-neon-cyan"
                : "bg-gradient-to-r from-teal-400 to-cyan-400"
            }`}
            style={{ width: `${Math.max(4, precipitationProb)}%` }}
          />
        </div>

        <p className="text-xs text-slate-300 flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{getRainStatusMessage()}</span>
        </p>
      </div>

      {/* 8-Hour Precipitation Probability Timeline Bar Chart */}
      {nextHours.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-medium">
            <span>Hourly Rain Trend (Next 8h)</span>
            <span className="text-cyan-400">Peak: {Math.max(...nextHours.map((h) => h.precipitationProb))}%</span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 items-end h-16 pt-1">
            {nextHours.map((h, i) => {
              let hourLabel = "Now";
              try {
                if (i > 0) {
                  const d = new Date(h.time);
                  hourLabel = d.toLocaleTimeString([], { hour: "numeric" });
                }
              } catch {
                hourLabel = `${i}h`;
              }

              const prob = h.precipitationProb || 0;

              return (
                <div key={i} className="flex flex-col items-center gap-1 h-full justify-end group">
                  {/* Probability number on hover */}
                  <span className="text-[9px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {prob}%
                  </span>

                  {/* Vertical bar */}
                  <div className="w-full bg-slate-800 rounded-t-md h-full max-h-9 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        prob >= 60 ? "bg-cyan-400 shadow-sm" : prob >= 30 ? "bg-cyan-500/70" : "bg-cyan-500/30"
                      }`}
                      style={{ height: `${Math.max(12, prob)}%` }}
                    />
                  </div>

                  {/* Hour label */}
                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-full">
                    {hourLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
