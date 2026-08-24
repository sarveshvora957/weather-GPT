"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import {
  Sparkles,
  Search,
  ArrowRight,
  Send,
  MapPin,
  ShieldCheck,
  Zap,
  TrendingUp,
  Map,
  Trophy,
  Plane,
  Shirt,
  Sprout,
  Sun,
  CloudRain,
  Activity,
  ChevronRight,
  Bot,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const [heroInput, setHeroInput] = useState("");
  const router = useRouter();

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroInput.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(heroInput.trim())}`);
  };

  const suggestions = [
    { text: "☔ Will it rain today in Ahmedabad?", prompt: "Will it rain today in Ahmedabad? Should I carry an umbrella?" },
    { text: "🏏 Can I play cricket tomorrow at 5 PM?", prompt: "I have a cricket match tomorrow at 5 PM in Ahmedabad. Should we play?" },
    { text: "🌡️ What's the temperature in Mumbai tomorrow?", prompt: "What will the temperature be in Mumbai tomorrow?" },
    { text: "✈️ Is it safe to travel to Manali this weekend?", prompt: "Is it safe to drive to Manali this weekend considering weather?" },
    { text: "🌍 Climate trends in Ahmedabad over 15 years", prompt: "How has the climate and monsoon shifted in Ahmedabad over the past 15 years?" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <SIHDemoBanner />

      {/* Navigation Header */}
      <header className="w-full border-b border-white/10 glass-panel px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan">
              <div className="flex items-center justify-center w-full h-full rounded-2xl bg-navy-950">
                <Sparkles className="w-5 h-5 text-aurora-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white">
                Weather<span className="text-aurora-cyan">GPT</span>
              </span>
              <span className="text-[10px] ml-2 font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                SIH 2026
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/chat" className="hover:text-white transition-colors">AI Weather Chat</Link>
            <Link href="/forecast" className="hover:text-white transition-colors">Forecasts</Link>
            <Link href="/map" className="hover:text-white transition-colors">Radar Map</Link>
            <Link href="/climate" className="hover:text-white transition-colors">Climate</Link>
            <Link href="/compare" className="hover:text-white transition-colors">Compare</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 shadow-neon-cyan hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              <span>Launch WeatherGPT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 pt-12 pb-20 max-w-5xl mx-auto space-y-8">
        {/* SIH Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-aurora-cyan/30 text-aurora-cyan text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-4">
          <Zap className="w-3.5 h-3.5 fill-aurora-cyan" />
          <span>SIH 2026 Problem Statement: Conversational Meteorological Intelligence</span>
        </div>

        {/* Large Main Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Weather, <span className="bg-clip-text text-transparent bg-gradient-to-r from-aurora-cyan via-brand-300 to-aurora-teal">Explained by AI.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Ask anything about weather, forecasts, severe alerts and climate trends. WeatherGPT turns complex meteorological numerical models into simple, actionable answers.
          </p>
        </div>

        {/* Large Conversational Hero Input Field */}
        <div className="w-full max-w-3xl">
          <form
            onSubmit={handleHeroSubmit}
            className="p-2 rounded-3xl glass-panel border border-white/20 shadow-2xl flex items-center gap-2 bg-navy-950/70 backdrop-blur-2xl hover:border-aurora-cyan/40 transition-all"
          >
            <div className="pl-3 text-aurora-cyan">
              <Bot className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={heroInput}
              onChange={(e) => setHeroInput(e.target.value)}
              placeholder="Ask WeatherGPT anything about the weather (e.g. Will it rain in Ahmedabad tomorrow at 5 PM?)..."
              className="w-full bg-transparent px-3 py-3 text-sm sm:text-base text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-sm shadow-neon-cyan hover:brightness-110 transition-all shrink-0 flex items-center gap-2"
            >
              <span>Ask AI</span>
              <Send className="w-4 h-4 fill-navy-950" />
            </button>
          </form>

          {/* Quick Clickable Suggestions Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => router.push(`/chat?q=${encodeURIComponent(s.prompt)}`)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-aurora-cyan/15 text-xs text-slate-300 hover:text-aurora-cyan border border-white/10 hover:border-aurora-cyan/30 transition-all font-medium"
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/chat"
            className="px-6 py-3 rounded-2xl bg-brand-600/30 hover:bg-brand-600/40 text-aurora-cyan font-bold text-xs border border-aurora-cyan/40 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI Chat</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Explore Dashboard</span>
          </Link>
        </div>

        {/* Feature Grid Showcase */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-6 rounded-3xl glass-panel-interactive border border-white/10 space-y-2.5">
            <div className="p-3 rounded-2xl bg-brand-500/20 text-aurora-cyan w-fit">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Natural Language Reasoning</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ask natural questions like &ldquo;Can I play cricket tomorrow?&rdquo; or &ldquo;Should I carry an umbrella?&rdquo; and receive direct, grounded answers.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel-interactive border border-white/10 space-y-2.5">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 w-fit">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Interactive Radar & Maps</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-layer meteorological radar mapping for precipitation, temperature heatmaps, wind vectors, and severe storm clusters.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel-interactive border border-white/10 space-y-2.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 w-fit">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Smart & Severe Alerts</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated alerts for cyclonic winds, heatwaves, and downpours, plus custom user notifications (e.g. &ldquo;Notify if rain &gt; 60%&rdquo;).
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel-interactive border border-white/10 space-y-2.5">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 w-fit">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Historical Climate Intelligence</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Access 15-30 year climate archive reanalysis, decadal warming curves, seasonal shifts, and extreme heat events.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel-interactive border border-white/10 space-y-2.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 w-fit">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Domain Suitability Advisors</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Specialized activity intelligence for Cricket, Travel, Smart Wardrobe, Agricultural Spraying, and Outdoor Banquets.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel-interactive border border-white/10 space-y-2.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Copernicus Air Quality (AQI)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              High-resolution European CAMS air quality monitoring with PM2.5, PM10, ozone, and sensitive group health advisories.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 glass-panel py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 WeatherGPT. Developed for Smart India Hackathon (SIH 2026).</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/chat" className="hover:text-white">AI Assistant</Link>
            <Link href="/admin" className="hover:text-white">Admin Telemetry</Link>
            <Link href="/settings" className="hover:text-white">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
