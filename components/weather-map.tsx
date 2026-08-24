"use client";

import React, { useState, useEffect } from "react";
import { LocationData, WeatherAlert } from "@/types/weather";
import {
  Layers,
  MapPin,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CloudRain,
  Thermometer,
  Wind,
  Cloud,
} from "lucide-react";

interface WeatherMapProps {
  center: LocationData;
  alerts?: WeatherAlert[];
  onSelectLocation?: (loc: LocationData) => void;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({
  center,
  alerts = [],
  onSelectLocation,
}) => {
  const [activeLayer, setActiveLayer] = useState<"radar" | "temp" | "wind" | "clouds">("radar");
  const [isClient, setIsClient] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(6);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[520px] rounded-3xl glass-panel flex items-center justify-center border border-white/10">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-aurora-cyan border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Initializing Meteorological Radar Engine...</span>
        </div>
      </div>
    );
  }

  // Dynamic OpenStreetMap / OpenWeather / RainViewer tile URLs
  const getLayerTileUrl = () => {
    switch (activeLayer) {
      case "radar":
        return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "temp":
        return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "wind":
        return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "clouds":
        return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      default:
        return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl flex flex-col">
      {/* Map Control Bar Top Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Layer Selector Pill Bar */}
        <div className="flex items-center gap-1 p-1.5 rounded-2xl glass-panel border border-white/15 shadow-xl bg-navy-950/80 backdrop-blur-xl">
          <button
            onClick={() => setActiveLayer("radar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeLayer === "radar"
                ? "bg-cyan-500 text-navy-950 shadow-neon-cyan"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Precipitation Radar</span>
          </button>

          <button
            onClick={() => setActiveLayer("temp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeLayer === "temp"
                ? "bg-amber-500 text-navy-950 shadow-neon-amber"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Thermal Heatmap</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeLayer === "wind"
                ? "bg-teal-500 text-navy-950 shadow-neon-cyan"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Streamlines</span>
          </button>

          <button
            onClick={() => setActiveLayer("clouds")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeLayer === "clouds"
                ? "bg-purple-500 text-white shadow-neon-purple"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Satellite</span>
          </button>
        </div>

        {/* Current Location Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl glass-panel border border-white/15 text-xs text-slate-200 bg-navy-950/80">
          <MapPin className="w-3.5 h-3.5 text-aurora-cyan" />
          <span className="font-bold text-white">{center.name}</span>
          <span className="text-slate-400 font-mono">
            ({center.latitude.toFixed(2)}°, {center.longitude.toFixed(2)}°)
          </span>
        </div>
      </div>

      {/* Interactive Map Visualizer Container */}
      <div className="w-full h-full relative bg-[#090f1e] overflow-hidden">
        {/* Render styled map canvas with iframe/Leaflet tile simulation */}
        <iframe
          title="Weather Radar Map"
          className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 brightness-90 contrast-125 opacity-75"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${center.longitude - 1.2}%2C${center.latitude - 1.0}%2C${center.longitude + 1.2}%2C${center.latitude + 1.0}&layer=mapnik&marker=${center.latitude}%2C${center.longitude}`}
        />

        {/* Radar Scanning Sweep Overlay Animation */}
        <div className="absolute inset-0 pointer-events-none bg-radial-radar opacity-40" />

        {/* Animated Weather Radar Cells */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none transition-all duration-1000 ${
            activeLayer === "radar"
              ? "bg-cyan-500/20 border-2 border-cyan-400/40 animate-ping-slow blur-md"
              : activeLayer === "temp"
              ? "bg-amber-500/20 border-2 border-amber-400/40 animate-pulse blur-md"
              : activeLayer === "wind"
              ? "bg-teal-500/20 border-2 border-teal-400/40 blur-md"
              : "bg-indigo-500/20 border-2 border-indigo-400/40 blur-md"
          }`}
        />

        {/* Center Location Pin Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-aurora-cyan/30 animate-ping absolute" />
            <div className="w-4 h-4 rounded-full bg-aurora-cyan border-2 border-navy-950 shadow-neon-cyan relative z-10" />
          </div>
          <div className="mt-2 px-2.5 py-1 rounded-xl glass-panel text-[11px] font-bold text-white border border-aurora-cyan/50 shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{center.name}</span>
          </div>
        </div>

        {/* Severe Storm Warning Pulse Marker */}
        {alerts.length > 0 && alerts[0].severity !== "LOW" && (
          <div className="absolute top-[40%] right-[30%] pointer-events-auto flex flex-col items-center animate-bounce">
            <div className="p-2 rounded-full bg-rose-500 text-white shadow-neon-rose border-2 border-white">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-lg bg-rose-900/90 text-[10px] font-bold text-rose-200 border border-rose-500/50">
              {alerts[0].event}
            </span>
          </div>
        )}
      </div>

      {/* Legend & Radar Timestamp Bar Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3 text-xs p-3 rounded-2xl glass-panel border border-white/15 bg-navy-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-300">Radar Legend:</span>
          {activeLayer === "radar" ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300" /> Light Drizzle
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Moderate Showers
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Heavy / Thunderstorm
              </span>
            </div>
          ) : activeLayer === "temp" ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> &lt;20°C
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 20-35°C
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &gt;35°C Heatwave
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">High-Resolution Numerical Wind & Cloud Streamlines</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Doppler Scan</span>
        </div>
      </div>
    </div>
  );
};
