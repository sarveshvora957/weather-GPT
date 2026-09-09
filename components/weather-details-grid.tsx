"use client";

import React from "react";
import { CurrentWeather, DailyForecastItem } from "@/types/weather";
import {
  formatTemp,
  formatWindSpeed,
  getWindDirectionName,
  getUVLevel,
} from "@/lib/utils";
import {
  Droplets,
  Sun,
  Thermometer,
  CloudRain,
  Wind,
  Eye,
  Gauge,
  Cloud,
  Compass,
  Navigation,
} from "lucide-react";

interface WeatherDetailsGridProps {
  current: CurrentWeather;
  todayDaily?: DailyForecastItem;
  unit?: "C" | "F";
}

export const WeatherDetailsGrid: React.FC<WeatherDetailsGridProps> = ({
  current,
  todayDaily,
  unit = "C",
}) => {
  const uvInfo = getUVLevel(current.uvIndex);
  const windDirName = getWindDirectionName(current.windDirection);

  // Humidity comfort analysis
  const getHumidityComfort = (humidity: number) => {
    if (humidity < 30) return { label: "Dry", color: "text-amber-400" };
    if (humidity <= 60) return { label: "Comfortable", color: "text-emerald-400" };
    if (humidity <= 75) return { label: "Humid", color: "text-cyan-400" };
    return { label: "Very Muggy", color: "text-rose-400" };
  };
  const humComfort = getHumidityComfort(current.humidity);

  // Visibility quality
  const getVisibilityQuality = (km: number) => {
    if (km >= 10) return { label: "Crystal Clear", color: "text-emerald-400" };
    if (km >= 6) return { label: "Good Visibility", color: "text-cyan-400" };
    if (km >= 2) return { label: "Moderate Haze", color: "text-amber-400" };
    return { label: "Dense Fog/Haze", color: "text-rose-400" };
  };
  const visQuality = getVisibilityQuality(current.visibility);

  // Pressure system
  const getPressureSystem = (hpa: number) => {
    if (hpa > 1020) return "High Pressure System";
    if (hpa < 1005) return "Low Pressure System";
    return "Normal Atmospheric Pressure";
  };

  // Feels-like difference
  const tempDiff = current.feelsLike - current.temperature;
  const convertedDiff = unit === "F" ? Math.round(tempDiff * 1.8) : Math.round(tempDiff);
  const tempDiffText =
    Math.abs(tempDiff) < 0.5
      ? "Similar to actual temperature"
      : tempDiff > 0
      ? `+${convertedDiff}°${unit} warmer due to humidity`
      : `${convertedDiff}°${unit} cooler due to wind chill`;

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10 space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Comprehensive Weather Telemetry
        </h2>
        <p className="text-xs text-slate-400">
          Real-time atmospheric measurements and derived indices
        </p>
      </div>

      {/* Grid of 6 - 8 Detailed Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {/* 1. Humidity Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {current.humidity}%
            </span>
            <span className={`text-xs font-semibold ${humComfort.color}`}>
              {humComfort.label}
            </span>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dew Point</span>
            <strong className="text-slate-200 font-mono">{formatTemp(current.dewPoint, unit)}</strong>
          </div>
        </div>

        {/* 2. UV Index Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">UV Index</span>
            <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {current.uvIndex}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-bold"
              style={{ backgroundColor: `${uvInfo.color}20`, color: uvInfo.color }}
            >
              {uvInfo.level}
            </span>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 truncate">
            {uvInfo.advice}
          </div>
        </div>

        {/* 3. Feels Like Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Feels Like</span>
            <Thermometer className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {formatTemp(current.feelsLike, unit)}
            </span>
            <span className="text-xs text-slate-400">
              Actual: {formatTemp(current.temperature, unit)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 truncate">
            {tempDiffText}
          </div>
        </div>

        {/* 4. Rainfall Chance Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Rainfall Chance</span>
            <CloudRain className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
              {todayDaily?.precipitationProb || (current.precipitation > 0 ? 80 : 10)}%
            </span>
            <span className="text-xs text-slate-400">
              Vol: {todayDaily?.precipitationSum || current.precipitation}mm
            </span>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Precipitation Rate</span>
            <strong className="text-slate-200 font-mono">{current.precipitation} mm/h</strong>
          </div>
        </div>

        {/* 5. Wind Speed & Direction Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Wind Velocity</span>
            <Wind className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {formatWindSpeed(current.windSpeed)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-teal-300 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20">
              <Navigation
                className="w-3 h-3 text-teal-400 transform"
                style={{ transform: `rotate(${current.windDirection}deg)` }}
              />
              <span>{windDirName} {current.windDirection}°</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Wind Gusts</span>
            <strong className="text-slate-200 font-mono">{current.windGusts} km/h</strong>
          </div>
        </div>

        {/* 6. Visibility Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Visibility</span>
            <Eye className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {current.visibility.toFixed(1)} km
            </span>
            <span className={`text-xs font-semibold ${visQuality.color}`}>
              {visQuality.label}
            </span>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 truncate">
            Optical atmospheric clarity
          </div>
        </div>

        {/* 7. Barometric Pressure Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pressure (MSL)</span>
            <Gauge className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {Math.round(current.pressure)}
            </span>
            <span className="text-xs text-slate-400 font-mono">hPa</span>
          </div>
          <div className="pt-1.5 border-t border-white/5 text-[11px] text-slate-400 truncate">
            {getPressureSystem(current.pressure)}
          </div>
        </div>

        {/* 8. Cloud Coverage Card */}
        <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cloud Cover</span>
            <Cloud className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {current.cloudCover}%
            </span>
            <span className="text-xs text-slate-300">
              {current.cloudCover < 20 ? "Clear Sky" : current.cloudCover < 60 ? "Partly Cloudy" : "Overcast"}
            </span>
          </div>
          {/* Visual cloud fill bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full"
              style={{ width: `${current.cloudCover}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
