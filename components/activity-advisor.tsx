"use client";

import React, { useState } from "react";
import {
  CurrentWeather,
  DailyForecastItem,
  AirQuality,
  LocationData,
  AIRecommendation,
} from "@/types/weather";
import {
  Trophy,
  Plane,
  Shirt,
  Sprout,
  PartyPopper,
  Car,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatTemp } from "@/lib/utils";

interface ActivityAdvisorProps {
  current: CurrentWeather;
  daily: DailyForecastItem[];
  aqi: AirQuality;
  location: LocationData;
  onAskChat?: (prompt: string) => void;
}

export const ActivityAdvisor: React.FC<ActivityAdvisorProps> = ({
  current,
  daily,
  aqi,
  location,
  onAskChat,
}) => {
  const [selectedTab, setSelectedTab] = useState<
    "cricket" | "travel" | "clothing" | "agriculture" | "events" | "commute"
  >("cricket");

  const rainProb = daily[0]?.precipitationProb || 25;
  const isHot = current.temperature > 36;
  const isWet = rainProb > 50;

  const activities = [
    {
      id: "cricket",
      label: "Cricket & Sports",
      icon: Trophy,
      title: "Cricket Match Playability Index",
      score: isWet ? 48 : isHot ? 65 : 92,
      status: isWet ? "⚠️ Moderate Rain Risk" : isHot ? "⚠️ Thermal Caution" : "✅ High Playability",
      badgeColor: isWet ? "text-amber-400 bg-amber-500/20" : isHot ? "text-orange-400 bg-orange-500/20" : "text-emerald-400 bg-emerald-500/20",
      reasoning: `In ${location.name}, conditions show ${rainProb}% precipitation probability and ${current.humidity}% humidity. Pitch bounce will remain stable, though late afternoon passing clouds may require brief cover inspection.`,
      keyFactors: [
        { label: "Outfield Dampness", val: isWet ? "Moderate" : "Dry & Fast" },
        { label: "Precipitation Risk", val: `${rainProb}%` },
        { label: "Optimal Window", val: "4:30 PM – 7:15 PM" },
      ],
      tips: [
        "Inspect pitch run-ups for morning moisture.",
        "Keep pitch covers on standby near boundary line.",
        "Maintain hydration intervals every 20 overs.",
      ],
      prompt: `Can I play a cricket match tomorrow at 5 PM in ${location.name}? What are the pitch and rain conditions?`,
    },
    {
      id: "travel",
      label: "Travel & Road Trips",
      icon: Plane,
      title: "Interstate & Mountain Travel Safety",
      score: isWet ? 62 : 95,
      status: isWet ? "⚠️ Wet Surface Advisory" : "✅ Safe Driving Envelope",
      badgeColor: isWet ? "text-amber-400 bg-amber-500/20" : "text-emerald-400 bg-emerald-500/20",
      reasoning: `Visibility is ${current.visibility} km with wind speeds of ${current.windSpeed} km/h. Highway transit around ${location.name} is smooth, with standard braking distances expected.`,
      keyFactors: [
        { label: "Visibility", val: `${current.visibility} km (Clear)` },
        { label: "Crosswind Gusts", val: `${current.windGusts} km/h` },
        { label: "Hydroplaning Risk", val: isWet ? "Moderate" : "Low" },
      ],
      tips: [
        "Check tire tread depth and headlight alignment.",
        "Allow 15 minutes buffer for bridge and flyover transit.",
        "Download offline maps in case of cell dead-zones.",
      ],
      prompt: `Is it safe to drive from ${location.name} to neighboring cities this weekend?`,
    },
    {
      id: "clothing",
      label: "Smart Wardrobe",
      icon: Shirt,
      title: "Atmospheric Clothing & Layering Guide",
      score: 90,
      status: isHot ? "☀️ Lightweight Cottons" : isWet ? "☔ Rainwear Recommended" : "👕 Casual Comfort",
      badgeColor: "text-aurora-cyan bg-brand-500/20",
      reasoning: `Ambient temperature is ${formatTemp(current.temperature)} (feels like ${formatTemp(current.feelsLike)}). Solar radiation index is ${current.uvIndex}.`,
      keyFactors: [
        { label: "Primary Layer", val: isHot ? "Breathable Linen" : "Cotton T-Shirt" },
        { label: "Umbrella Needed", val: isWet ? "Yes (Essential)" : "Optional" },
        { label: "UV Protection", val: current.uvIndex > 5 ? "Sunscreen SPF 30+" : "Standard" },
      ],
      tips: [
        "Wear polarized sunglasses during midday hours.",
        "Keep a compact umbrella or lightweight poncho in your bag.",
        "Choose light-colored natural fabrics to reflect thermal radiation.",
      ],
      prompt: `What should I wear today in ${location.name} considering temperature and rain chance?`,
    },
    {
      id: "agriculture",
      label: "Agri & Spraying",
      icon: Sprout,
      title: "Agro-Meteorological Spray & Irrigation Advisory",
      score: current.windSpeed < 15 && !isWet ? 88 : 40,
      status: current.windSpeed < 15 && !isWet ? "✅ Optimal for Crop Spraying" : "⚠️ High Drift & Wash-off Risk",
      badgeColor: current.windSpeed < 15 && !isWet ? "text-emerald-400 bg-emerald-500/20" : "text-rose-400 bg-rose-500/20",
      reasoning: `Wind velocity is ${current.windSpeed} km/h (ideal threshold < 15 km/h) with ${rainProb}% rain probability within 24 hours. Sufficient drying window available for pesticide uptake.`,
      keyFactors: [
        { label: "Droplet Drift Risk", val: current.windSpeed > 15 ? "High" : "Low" },
        { label: "Wash-off Probability", val: `${rainProb}%` },
        { label: "Soil Evaporation", val: "Moderate" },
      ],
      tips: [
        "Spray between 6:30 AM and 9:30 AM to avoid midday vaporization.",
        "Calibrate tractor nozzle pressure for uniform droplet distribution.",
        "Avoid application if rain is imminent within 4 hours.",
      ],
      prompt: `Is tomorrow suitable for spraying crops in ${location.name}? What are the wind and rain parameters?`,
    },
    {
      id: "events",
      label: "Event & Wedding",
      icon: PartyPopper,
      title: "Outdoor Event & Banquet Feasibility",
      score: isWet ? 54 : 94,
      status: isWet ? "⚠️ Waterproof Canopy Required" : "🎉 Favorable for Outdoor Events",
      badgeColor: isWet ? "text-amber-400 bg-amber-500/20" : "text-emerald-400 bg-emerald-500/20",
      reasoning: `For open-air events in ${location.name}, evening temperatures will average around 26°C with comfortable ambient breeze.`,
      keyFactors: [
        { label: "Rain Likelihood", val: `${rainProb}%` },
        { label: "Evening Thermal Comfort", val: "Pleasant (26°C)" },
        { label: "Wind Stability", val: `${current.windSpeed} km/h` },
      ],
      tips: [
        "Arrange a waterproof waterproof canopy as a contingency.",
        "Position heavy stage sound arrays against prevailing wind direction.",
        "Ensure power generator lines are elevated from ground moisture.",
      ],
      prompt: `Which day this week is best for hosting an outdoor event in ${location.name}?`,
    },
    {
      id: "commute",
      label: "Daily Commute",
      icon: Car,
      title: "Commuting & Traffic Inconvenience Index",
      score: isWet ? 68 : 96,
      status: isWet ? "⚠️ Minor Traffic Delays" : "✅ Smooth Transit",
      badgeColor: isWet ? "text-amber-400 bg-amber-500/20" : "text-emerald-400 bg-emerald-500/20",
      reasoning: `Peak commute hours in ${location.name} will experience normal vehicular flow. Road surfaces remain dry with good visibility.`,
      keyFactors: [
        { label: "Road Wetness", val: isWet ? "Damp / Slick" : "Dry" },
        { label: "Visibility", val: `${current.visibility} km` },
        { label: "AQI Inhalation", val: `${aqi.aqi} (${aqi.category})` },
      ],
      tips: [
        "Leave 10 minutes early if commuting by two-wheeler during rush hour.",
        "Turn on vehicle AC in recirculate mode if AQI exceeds 120.",
      ],
      prompt: `Should I leave early for office today in ${location.name} because of weather or rain?`,
    },
  ];

  const currentActivity = activities.find((a) => a.id === selectedTab) || activities[0];

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurora-cyan" />
            <span>AI Domain Recommendations</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time suitability matrices powered by meteorological telemetry
          </p>
        </div>
      </div>

      {/* Activity Category Tab Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {activities.map((act) => {
          const Icon = act.icon;
          const isSelected = selectedTab === act.id;
          return (
            <button
              key={act.id}
              onClick={() => setSelectedTab(act.id as any)}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                isSelected
                  ? "bg-brand-500/20 border-aurora-cyan text-aurora-cyan shadow-neon-cyan"
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold text-center leading-tight">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Activity Assessment Card */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-white">{currentActivity.title}</h3>
            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${currentActivity.badgeColor}`}>
              {currentActivity.status}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Feasibility Score</span>
            <span className="text-2xl font-black font-mono text-white">
              {currentActivity.score}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {currentActivity.reasoning}
        </p>

        {/* Factors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {currentActivity.keyFactors.map((f, i) => (
            <div key={i} className="p-3 rounded-xl bg-black/25 border border-white/5 text-xs">
              <span className="text-slate-400 block text-[11px]">{f.label}</span>
              <strong className="text-white mt-0.5 block">{f.val}</strong>
            </div>
          ))}
        </div>

        {/* Actionable Tips */}
        <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs space-y-1.5">
          <span className="font-semibold text-aurora-cyan block">
            Recommended Preparations:
          </span>
          {currentActivity.tips.map((tip, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>

        {/* Ask WeatherGPT trigger */}
        {onAskChat && (
          <button
            onClick={() => onAskChat(currentActivity.prompt)}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-aurora-cyan text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span>Ask WeatherGPT detailed plan for this</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
