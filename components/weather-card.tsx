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
  SunDim,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Sparkles,
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface WeatherCardProps {
  current: CurrentWeather;
  location: LocationData;
  todayDaily?: DailyForecastItem;
  unit?: "C" | "F";
  onToggleUnit?: () => void;
  onAskAI?: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  current,
  location,
  todayDaily,
  unit = "C",
  onToggleUnit,
  onAskAI,
}) => {
  const uvInfo = getUVLevel(current.uvIndex);
  const windDir = getWindDirectionName(current.windDirection);

  const renderWeatherIcon = () => {
    const code = current.weatherCode;
    if (code === 0) return <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 animate-spin-slow" />;
    if (code === 1) return <SunDim className="w-16 h-16 sm:w-20 sm:h-20 text-amber-300" />;
    if (code === 2) return <CloudSun className="w-16 h-16 sm:w-20 sm:h-20 text-amber-300" />;
    if (code === 3) return <Cloud className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300" />;
    if (code === 45 || code === 48) return <CloudFog className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400 animate-bounce" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-16 h-16 sm:w-20 sm:h-20 text-blue-200" />;
    if (code >= 95) return <CloudLightning className="w-16 h-16 sm:w-20 sm:h-20 text-purple-400 animate-pulse" />;
    return <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400" />;
  };

  // High & Low values
  const highTemp = todayDaily?.tempMax ?? current.tempMax ?? current.temperature + 3;
  const lowTemp = todayDaily?.tempMin ?? current.tempMin ?? current.temperature - 4;

  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-white/15 shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-500/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-aurora-cyan/10 blur-[90px] pointer-events-none" />

      {/* Top Header: Location, Badges & Ask AI */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <MapPin className="w-5 h-5 text-aurora-cyan" />
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {location.name}
            </h1>
            {location.countryCode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold border border-brand-500/30">
                {location.countryCode}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
            <span>{[location.admin2, location.admin1, location.country].filter(Boolean).join(", ")}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-aurora-cyan">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Updated {current.updatedAt ? new Date(current.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* °C / °F Unit Toggle */}
          {onToggleUnit && (
            <button
              onClick={onToggleUnit}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-white border border-white/20 transition-all shadow-sm"
              title="Toggle Celsius / Fahrenheit"
            >
              °{unit}
            </button>
          )}

          {onAskAI && (
            <button
              onClick={onAskAI}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-xs shadow-neon-cyan hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-navy-950" />
              <span>Ask AI About {location.name}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Temperature & Weather Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-6 relative z-10">
        {/* Left: Huge Temp & Condition */}
        <div className="lg:col-span-6 flex items-center gap-6">
          <div className="relative p-4 rounded-3xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center shrink-0">
            {renderWeatherIcon()}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl sm:text-7xl font-black tracking-tighter text-white font-mono">
                {formatTemp(current.temperature, unit)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Feels like <strong className="text-white font-mono">{formatTemp(current.feelsLike, unit)}</strong>
              </span>
            </div>

            <div className="text-lg sm:text-xl font-bold text-aurora-cyan">
              {current.conditionText}
            </div>

            {/* High / Low Badges */}
            <div className="flex items-center gap-3 pt-1 text-xs sm:text-sm font-mono text-slate-300">
              <span className="flex items-center gap-0.5 text-rose-400 font-bold">
                <ArrowUp className="w-3.5 h-3.5" />
                H: {formatTemp(highTemp, unit)}
              </span>
              <span className="flex items-center gap-0.5 text-cyan-400 font-bold">
                <ArrowDown className="w-3.5 h-3.5" />
                L: {formatTemp(lowTemp, unit)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Key Highlight Micro-Cards */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Humidity */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">{current.humidity}%</div>
            <span className="text-[10px] text-slate-400">Dew {formatTemp(current.dewPoint, unit)}</span>
          </div>

          {/* Wind */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Wind</span>
              <Wind className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">
              {formatWindSpeed(current.windSpeed)}
            </div>
            <span className="text-[10px] text-slate-400 truncate">{windDir} • {current.windGusts}km/h</span>
          </div>

          {/* UV Index */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>UV Index</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">{current.uvIndex}</div>
            <span className="text-[10px] font-bold" style={{ color: uvInfo.color }}>
              {uvInfo.level}
            </span>
          </div>

          {/* Pressure */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Pressure</span>
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">{Math.round(current.pressure)}</div>
            <span className="text-[10px] text-slate-400">hPa MSL</span>
          </div>
        </div>
      </div>

      {/* Footer: Quick Daylight & Optical Visibility Summary */}
      <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 relative z-10">
        <div className="flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Sunrise: <strong className="text-white font-mono">{current.sunrise ? current.sunrise.slice(11, 16) : "06:12"}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Sunset className="w-4 h-4 text-orange-400 shrink-0" />
          <span>Sunset: <strong className="text-white font-mono">{current.sunset ? current.sunset.slice(11, 16) : "19:04"}</strong></span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Visibility: <strong className="text-white font-mono">{current.visibility.toFixed(1)} km</strong></span>
        </div>
      </div>
    </div>
  );
};
