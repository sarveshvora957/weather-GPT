"use client";

import React, { useState } from "react";
import { HourlyForecastItem } from "@/types/weather";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Thermometer, Droplets, Wind, Sun, Activity } from "lucide-react";

interface WeatherChartsProps {
  hourly: HourlyForecastItem[];
  unit?: "C" | "F";
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({
  hourly,
  unit = "C",
}) => {
  const [activeTab, setActiveTab] = useState<"temp" | "rain" | "wind" | "humidity">("temp");

  const chartData = hourly.slice(0, 24).map((h, i) => {
    let hourStr = "Now";
    try {
      if (i > 0) {
        const d = new Date(h.time);
        hourStr = d.toLocaleTimeString([], { hour: "numeric", hour12: true });
      }
    } catch {
      hourStr = `${i}h`;
    }

    return {
      hour: hourStr,
      temperature: h.temperature,
      feelsLike: h.feelsLike,
      rainProb: h.precipitationProb,
      rainVol: h.precipitation,
      windSpeed: h.windSpeed,
      humidity: h.humidity,
      uvIndex: h.uvIndex,
    };
  });

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
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-aurora-cyan" />
            <span>24-Hour Meteorological Dynamics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Interactive multi-parameter telemetry analysis
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
          <button
            onClick={() => setActiveTab("temp")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "temp"
                ? "bg-brand-500 text-white shadow-neon-cyan"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setActiveTab("rain")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "rain"
                ? "bg-cyan-500 text-navy-950 shadow-neon-cyan"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Precipitation</span>
          </button>

          <button
            onClick={() => setActiveTab("wind")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "wind"
                ? "bg-teal-500 text-navy-950 shadow-neon-cyan"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </button>

          <button
            onClick={() => setActiveTab("humidity")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "humidity"
                ? "bg-purple-500 text-white shadow-neon-purple"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Humidity & UV</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "temp" ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb703" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ffb703" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit={`°${unit}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                unit={`°${unit}`}
                stroke="#00f0ff"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#tempGradient)"
              />
              <Area
                type="monotone"
                dataKey="feelsLike"
                name="Feels Like"
                unit={`°${unit}`}
                stroke="#ffb703"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#feelsGradient)"
              />
            </AreaChart>
          ) : activeTab === "rain" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rainProb" name="Rain Probability" unit="%" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : activeTab === "wind" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" km/h" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="windSpeed"
                name="Wind Speed"
                unit=" km/h"
                stroke="#2dd4bf"
                strokeWidth={3}
                dot={{ fill: "#2dd4bf", r: 4 }}
                activeDot={{ r: 6, stroke: "#ffffff" }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#9d4edd" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="humidity"
                name="Relative Humidity"
                unit="%"
                stroke="#a855f7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#humidityGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
