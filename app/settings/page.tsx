"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import {
  Settings,
  Sun,
  Moon,
  Key,
  Zap,
  Globe,
  Sliders,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [windUnit, setWindUnit] = useState<"kmh" | "mph">("kmh");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openWeatherKey, setOpenWeatherKey] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("weathergpt_theme") as any) || "dark";
    setTheme(savedTheme);
    const key = localStorage.getItem("weathergpt_gemini_key") || "";
    setGeminiApiKey(key);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("weathergpt_theme", theme);
    localStorage.setItem("weathergpt_gemini_key", geminiApiKey);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <SIHDemoBanner />
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-4xl">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-aurora-cyan" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Application Settings & Preferences
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize units, LLM API keys, meteorological data providers, and theme aesthetics
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Units Section */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-aurora-cyan" />
                <span>Meteorological Units</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Temperature Scale</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUnit("C")}
                      className={`p-2.5 rounded-xl font-bold transition-all border ${
                        unit === "C"
                          ? "bg-brand-500 text-white border-aurora-cyan shadow-neon-cyan"
                          : "bg-white/5 text-slate-300 border-white/10"
                      }`}
                    >
                      Celsius (°C)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit("F")}
                      className={`p-2.5 rounded-xl font-bold transition-all border ${
                        unit === "F"
                          ? "bg-brand-500 text-white border-aurora-cyan shadow-neon-cyan"
                          : "bg-white/5 text-slate-300 border-white/10"
                      }`}
                    >
                      Fahrenheit (°F)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Wind Velocity</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWindUnit("kmh")}
                      className={`p-2.5 rounded-xl font-bold transition-all border ${
                        windUnit === "kmh"
                          ? "bg-brand-500 text-white border-aurora-cyan shadow-neon-cyan"
                          : "bg-white/5 text-slate-300 border-white/10"
                      }`}
                    >
                      Kilometers / Hour (km/h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWindUnit("mph")}
                      className={`p-2.5 rounded-xl font-bold transition-all border ${
                        windUnit === "mph"
                          ? "bg-brand-500 text-white border-aurora-cyan shadow-neon-cyan"
                          : "bg-white/5 text-slate-300 border-white/10"
                      }`}
                    >
                      Miles / Hour (mph)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Section */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-300" />
                <span>Visual Theme & Ambiance</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                    theme === "dark"
                      ? "bg-navy-900/90 border-aurora-cyan text-white shadow-neon-cyan"
                      : "bg-white/5 text-slate-300 border-white/10"
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="font-bold block">Futuristic Dark Mode</span>
                    <span className="text-[11px] text-slate-400">Deep Navy Glassmorphism & Neon</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                    theme === "light"
                      ? "bg-white/90 border-brand-500 text-slate-900 shadow-md"
                      : "bg-white/5 text-slate-300 border-white/10"
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="font-bold block">Crisp Light Mode</span>
                    <span className="text-[11px] text-slate-400">Clean High-Contrast Dashboard</span>
                  </div>
                </button>
              </div>
            </div>

            {/* API Key Configuration */}
            <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-aurora-cyan" />
                  <span>AI & Meteorological API Key Overrides</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Optional — Works 100% Free Out of Box
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                WeatherGPT uses free ECMWF / GFS global models natively. You can optionally supply your own Google Gemini API Key for customized LLM persona responses.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Google Gemini API Key (Optional)</label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-aurora-cyan"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-xs shadow-neon-cyan hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
