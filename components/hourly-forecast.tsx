"use client";

import React from "react";
import { HourlyForecastItem } from "@/types/weather";
import { formatTemp, formatWindSpeed } from "@/lib/utils";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Droplets,
  Wind,
} from "lucide-react";

interface HourlyForecastProps {
  items: HourlyForecastItem[];
  unit?: "C" | "F";
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  items,
  unit = "C",
}) => {
  const getIcon = (code: number) => {
    if (code === 0) return <Sun className="w-6 h-6 text-amber-400" />;
    if (code === 1 || code === 2) return <CloudSun className="w-6 h-6 text-amber-300" />;
    if (code === 3 || code === 45 || code === 48) return <Cloud className="w-6 h-6 text-slate-300" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-6 h-6 text-cyan-400" />;
    if (code >= 95) return <CloudLightning className="w-6 h-6 text-purple-400" />;
    return <Sun className="w-6 h-6 text-amber-400" />;
  };

  const formatHourString = (isoTime: string, index: number) => {
    if (index === 0) return "Now";
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString([], { hour: "numeric", hour12: true });
    } catch {
      return isoTime;
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Hourly Forecast (24 Hours)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time projection with precipitation probability and temperature trend
          </p>
        </div>
      </div>

      {/* Horizontally scrollable timeline */}
      <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {items.slice(0, 24).map((item, idx) => {
          const isNow = idx === 0;
          return (
            <div
              key={item.time || idx}
              className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[94px] shrink-0 border transition-all ${
                isNow
                  ? "bg-brand-500/20 border-brand-400/50 shadow-neon-cyan"
                  : "bg-white/5 hover:bg-white/10 border-white/5"
              }`}
            >
              {/* Hour */}
              <span className={`text-xs font-semibold ${isNow ? "text-aurora-cyan" : "text-slate-300"}`}>
                {formatHourString(item.time, idx)}
              </span>

              {/* Icon */}
              <div className="my-2.5">{getIcon(item.weatherCode)}</div>

              {/* Temp */}
              <span className="text-sm font-bold text-white">
                {formatTemp(item.temperature, unit)}
              </span>

              {/* Rain Chance Bar */}
              <div className="w-full mt-2.5 pt-2 border-t border-white/5 flex flex-col items-center">
                <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipitationProb}%</span>
                </div>
                {/* Visual indicator bar */}
                <div className="w-full h-1 rounded-full bg-slate-800 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${item.precipitationProb}%` }}
                  />
                </div>
              </div>

              {/* Wind Speed */}
              <span className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-0.5">
                <Wind className="w-2.5 h-2.5" />
                {Math.round(item.windSpeed)}km/h
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
