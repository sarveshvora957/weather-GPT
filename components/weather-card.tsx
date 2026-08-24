"use client";

import React from "react";
import {
  CurrentWeather,
  LocationData,
  DailyForecastItem,
} from "@/types/weather";
import {
  formatTemp,
  formatWindSpeed,
  getWindDirectionName,
  getUVLevel,
} from "@/lib/utils";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Eye,
  Compass,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface WeatherCardProps {
  current: CurrentWeather;
  location: LocationData;
  todayDaily?: DailyForecastItem;
  unit?: "C" | "F";
  onAskAI?: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  current,
  location,
  todayDaily,
  unit = "C",
  onAskAI,
}) => {
  const uvInfo = getUVLevel(current.uvIndex);
  const windDir = getWindDirectionName(current.windDirection);

  const renderWeatherIcon = () => {
    const code = current.weatherCode;
    if (code === 0) return <Sun className="w-16 h-16 text-amber-400 animate-spin-slow" />;
    if (code === 1 || code === 2) return <CloudSun className="w-16 h-16 text-amber-300" />;
    if (code === 3 || code === 45 || code === 48) return <Cloud className="w-16 h-16 text-slate-300" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-16 h-16 text-cyan-400 animate-bounce" />;
    if (code >= 95) return <CloudLightning className="w-16 h-16 text-purple-400 animate-pulse" />;
    return <Sun className="w-16 h-16 text-amber-400" />;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 shadow-2xl">
      {/* Background ambient decorative glowing orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-brand-500/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-aurora-cyan/10 blur-[80px] pointer-events-none" />

      {/* Top Header: Location & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {location.name}
            </h1>
            {location.countryCode && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {location.countryCode}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {location.admin1 ? `${location.admin1}, ` : ""}
            {location.country} • Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {onAskAI && (
          <button
            onClick={onAskAI}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-aurora-cyan text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-navy-950" />
            <span>Ask WeatherGPT</span>
          </button>
        )}
      </div>

      {/* Main Temperature & Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-6 relative z-10">
        {/* Left: Huge Temp & Condition */}
        <div className="lg:col-span-6 flex items-center gap-6">
          <div className="relative p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            {renderWeatherIcon()}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter text-white">
                {formatTemp(current.temperature, unit)}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Feels like {formatTemp(current.feelsLike, unit)}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-base font-semibold text-aurora-cyan">
                {current.conditionText}
              </span>
              <span className="text-xs text-slate-400">
                High: <strong className="text-slate-200">{formatTemp(current.tempMax, unit)}</strong> • Low: <strong className="text-slate-200">{formatTemp(current.tempMin, unit)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Key Micro Highlight Badges */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Humidity */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{current.humidity}%</div>
            <span className="text-[10px] text-slate-400">Dew point {current.dewPoint}°C</span>
          </div>

          {/* Wind */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Wind</span>
              <Wind className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {formatWindSpeed(current.windSpeed)}
            </div>
            <span className="text-[10px] text-slate-400">{windDir} • Gusts {current.windGusts}km/h</span>
          </div>

          {/* UV Index */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>UV Index</span>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{current.uvIndex}</div>
            <span className="text-[10px] font-semibold" style={{ color: uvInfo.color }}>
              {uvInfo.level}
            </span>
          </div>

          {/* Pressure */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Pressure</span>
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1">{current.pressure}</div>
            <span className="text-[10px] text-slate-400">hPa (Stable)</span>
          </div>
        </div>
      </div>

      {/* Solar Arc & Visibility Footer */}
      <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 relative z-10">
        <div className="flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-amber-400" />
          <span>Sunrise: <strong className="text-white font-mono">06:12 AM</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Sunset className="w-4 h-4 text-orange-400" />
          <span>Sunset: <strong className="text-white font-mono">07:05 PM</strong></span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Visibility: <strong className="text-white font-mono">{current.visibility} km</strong> (Clear)</span>
        </div>
      </div>
    </div>
  );
};
