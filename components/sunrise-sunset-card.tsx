"use client";

import React from "react";
import { Sunrise, Sunset, Clock, Sun, Moon, Sparkles } from "lucide-react";

interface SunriseSunsetCardProps {
  sunrise: string;
  sunset: string;
  isDay?: boolean;
}

export const SunriseSunsetCard: React.FC<SunriseSunsetCardProps> = ({
  sunrise,
  sunset,
  isDay = true,
}) => {
  // Format times nicely (e.g., "06:14 AM")
  const formatTimeStr = (iso: string) => {
    if (!iso) return "--:--";
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) {
        // If string is already like "06:14"
        return iso;
      }
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  // Compute daylight duration & solar progress percentage
  const calculateSolarProgress = () => {
    try {
      const now = new Date().getTime();
      const riseDate = new Date(sunrise).getTime();
      const setDate = new Date(sunset).getTime();

      if (isNaN(riseDate) || isNaN(setDate)) {
        return { progress: isDay ? 60 : 10, dayLengthStr: "12h 45m", statusText: "Daylight active" };
      }

      const totalDaylightMs = setDate - riseDate;
      const hours = Math.floor(totalDaylightMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalDaylightMs % (1000 * 60 * 60)) / (1000 * 60));
      const dayLengthStr = `${hours}h ${minutes}m`;

      if (now < riseDate) {
        const msUntilSunrise = riseDate - now;
        const hUntil = Math.floor(msUntilSunrise / (1000 * 60 * 60));
        const mUntil = Math.floor((msUntilSunrise % (1000 * 60 * 60)) / (1000 * 60));
        return {
          progress: 0,
          dayLengthStr,
          statusText: `Sunrise in ${hUntil}h ${mUntil}m`,
        };
      } else if (now > setDate) {
        return {
          progress: 100,
          dayLengthStr,
          statusText: "Nighttime • Sun has set",
        };
      } else {
        const elapsed = now - riseDate;
        const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDaylightMs) * 100)));
        const msRemaining = setDate - now;
        const hRem = Math.floor(msRemaining / (1000 * 60 * 60));
        const mRem = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
        return {
          progress,
          dayLengthStr,
          statusText: `Sunset in ${hRem}h ${mRem}m (${progress}% elapsed)`,
        };
      }
    } catch {
      return { progress: 50, dayLengthStr: "12h 30m", statusText: "Sun position active" };
    }
  };

  const { progress, dayLengthStr, statusText } = calculateSolarProgress();

  // SVG Arc coordinate math
  // Arc path: Center (150, 110), Radius = 100, from angle 180° (PI) to 0° (0 rad)
  const angle = Math.PI - (progress / 100) * Math.PI;
  const sunX = 150 + 100 * Math.cos(angle);
  const sunY = 115 - 100 * Math.sin(angle);

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
      {/* Top Title & Day Length Badge */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Sunrise & Sunset</span>
          </h3>
          <p className="text-xs text-slate-400">Solar tracking & daylight arc</p>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Day: {dayLengthStr}</span>
        </span>
      </div>

      {/* Visual Solar Progress Arc SVG */}
      <div className="relative w-full h-32 flex items-center justify-center my-1">
        <svg viewBox="0 0 300 130" className="w-full h-full max-w-[280px]">
          <defs>
            {/* Gradient for Arc */}
            <linearGradient id="solarArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
            </linearGradient>

            {/* Sun Glow Filter */}
            <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizon line */}
          <line
            x1="30"
            y1="115"
            x2="270"
            y2="115"
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Dashed Background Arc */}
          <path
            d="M 50,115 A 100,100 0 0,1 250,115"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="2.5"
            strokeDasharray="5 5"
          />

          {/* Glowing Traveled Arc */}
          <path
            d="M 50,115 A 100,100 0 0,1 250,115"
            fill="none"
            stroke="url(#solarArcGradient)"
            strokeWidth="3.5"
            strokeDasharray="314"
            strokeDashoffset={314 - (progress / 100) * 314}
            strokeLinecap="round"
          />

          {/* Animated Sun / Moon Marker */}
          <g transform={`translate(${sunX}, ${sunY})`}>
            {isDay ? (
              <>
                <circle r="12" fill="rgba(251, 191, 36, 0.3)" filter="url(#sunGlow)" />
                <circle r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <circle r="10" fill="rgba(0, 240, 255, 0.25)" filter="url(#sunGlow)" />
                <circle r="6" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
              </>
            )}
          </g>
        </svg>

        {/* Current status pill overlay */}
        <div className="absolute bottom-1 px-3 py-1 rounded-full bg-navy-950/80 border border-white/10 backdrop-blur-md text-[11px] font-medium text-slate-300 shadow-sm">
          {statusText}
        </div>
      </div>

      {/* Sunrise & Sunset Times Footer */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
            <Sunrise className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
              Sunrise
            </span>
            <strong className="text-sm font-bold text-white font-mono">
              {formatTimeStr(sunrise)}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300">
            <Sunset className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
              Sunset
            </span>
            <strong className="text-sm font-bold text-white font-mono">
              {formatTimeStr(sunset)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
