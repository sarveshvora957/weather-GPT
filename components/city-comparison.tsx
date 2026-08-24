"use client";

import React, { useState, useEffect } from "react";
import { LocationData, ComparisonData } from "@/types/weather";
import { WeatherService, POPULAR_LOCATIONS } from "@/lib/weather-service";
import { GitCompare, Trophy, Check, ArrowRight, Sparkles } from "lucide-react";
import { formatTemp } from "@/lib/utils";

interface CityComparisonProps {
  initialCityA?: LocationData;
  initialCityB?: LocationData;
}

export const CityComparison: React.FC<CityComparisonProps> = ({
  initialCityA = POPULAR_LOCATIONS[0], // Ahmedabad
  initialCityB = POPULAR_LOCATIONS[1], // Mumbai
}) => {
  const [cityA, setCityA] = useState<LocationData>(initialCityA);
  const [cityB, setCityB] = useState<LocationData>(initialCityB);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await WeatherService.compareCities(cityA, cityB);
        setComparison(data);
      } catch (err) {
        console.error("Comparison error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cityA, cityB]);

  return (
    <div className="space-y-6">
      {/* City Selector Header */}
      <div className="rounded-3xl glass-panel p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-aurora-cyan" />
            <span>Dual-City Meteorological Face-Off</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side comparative analysis of live weather, air quality, and outdoor viability
          </p>
        </div>

        {/* Quick Switch Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={cityA.id || cityA.name}
            onChange={(e) => {
              const selected = POPULAR_LOCATIONS.find((l) => (l.id || l.name) === e.target.value);
              if (selected) setCityA(selected);
            }}
            aria-label="Select primary city"
            className="px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-aurora-cyan font-semibold"
          >
            {POPULAR_LOCATIONS.map((l) => (
              <option key={`a-${l.name}`} value={l.id || l.name} className="bg-navy-950 text-white">
                City A: {l.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400">VS</span>

          <select
            value={cityB.id || cityB.name}
            onChange={(e) => {
              const selected = POPULAR_LOCATIONS.find((l) => (l.id || l.name) === e.target.value);
              if (selected) setCityB(selected);
            }}
            aria-label="Select comparison city"
            className="px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-aurora-cyan font-semibold"
          >
            {POPULAR_LOCATIONS.map((l) => (
              <option key={`b-${l.name}`} value={l.id || l.name} className="bg-navy-950 text-white">
                City B: {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !comparison ? (
        <div className="h-64 rounded-3xl glass-panel flex items-center justify-center border border-white/10">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="w-7 h-7 rounded-full border-2 border-aurora-cyan border-t-transparent animate-spin" />
            <span className="text-xs font-mono">Running dual-city comparative algorithms...</span>
          </div>
        </div>
      ) : (
        <>
          {/* AI Verdict Banner */}
          <div className="rounded-3xl p-6 bg-gradient-to-r from-brand-900/60 via-navy-900/80 to-aurora-purple/20 border border-aurora-cyan/30 glass-panel shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-aurora-cyan font-bold text-sm">
              <Sparkles className="w-4 h-4 fill-aurora-cyan" />
              <span>WeatherGPT Comparative Verdict</span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed font-medium">
              {comparison.verdict}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-slate-400 block text-[11px]">Best for Outdoor Sports</span>
                <strong className="text-emerald-400 mt-0.5 block">{comparison.recommendations.betterForOutdoor}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-slate-400 block text-[11px]">Cleaner Air Quality</span>
                <strong className="text-aurora-cyan mt-0.5 block">{comparison.recommendations.betterAirQuality}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-slate-400 block text-[11px]">Cooler Ambient Temp</span>
                <strong className="text-amber-300 mt-0.5 block">{comparison.recommendations.coolerClimate}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-slate-400 block text-[11px]">Smoother Travel Envelope</span>
                <strong className="text-purple-300 mt-0.5 block">{comparison.recommendations.betterForTravel}</strong>
              </div>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">Parameter Differences</h3>

            <div className="space-y-2.5">
              {comparison.metricDifferences.map((metric, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="w-48 shrink-0">
                    <span className="text-xs font-bold text-white block">{metric.metric}</span>
                    <span className="text-[11px] text-slate-400">{metric.insight}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                    {/* City A Metric */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        metric.winner === "A"
                          ? "bg-aurora-cyan/15 border-aurora-cyan/40 text-aurora-cyan font-bold"
                          : "bg-black/20 border-white/5 text-slate-300"
                      }`}
                    >
                      <span>{cityA.name}: {metric.cityAValue}</span>
                      {metric.winner === "A" && <Trophy className="w-3.5 h-3.5 text-aurora-cyan" />}
                    </div>

                    {/* City B Metric */}
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        metric.winner === "B"
                          ? "bg-aurora-cyan/15 border-aurora-cyan/40 text-aurora-cyan font-bold"
                          : "bg-black/20 border-white/5 text-slate-300"
                      }`}
                    >
                      <span>{cityB.name}: {metric.cityBValue}</span>
                      {metric.winner === "B" && <Trophy className="w-3.5 h-3.5 text-aurora-cyan" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
