"use client";

import React, { useState } from "react";
import { SIH_DEMO_SCENARIOS } from "@/lib/demo-scenarios";
import { SIHDemoScenario, LocationData } from "@/types/weather";
import { Zap, ChevronRight, X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface SIHDemoBannerProps {
  onSelectScenario?: (scenario: SIHDemoScenario) => void;
}

export const SIHDemoBanner: React.FC<SIHDemoBannerProps> = ({ onSelectScenario }) => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-navy-950 font-bold text-xs shadow-2xl hover:scale-105 transition-all border border-amber-300"
      >
        <Zap className="w-4 h-4 fill-navy-950" />
        <span>SIH 2026 Scenarios</span>
      </button>
    );
  }

  const handleScenarioClick = (scenario: SIHDemoScenario) => {
    if (onSelectScenario) {
      onSelectScenario(scenario);
    } else {
      router.push(`/chat?scenario=${scenario.id}`);
    }
  };

  return (
    <div className="relative z-30 w-full bg-gradient-to-r from-amber-950/80 via-navy-900/90 to-brand-950/80 border-b border-amber-500/30 px-4 py-2.5 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500 text-navy-950 font-black text-xs shrink-0">
            <Zap className="w-3.5 h-3.5 fill-navy-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 tracking-tight">SIH 2026 Demo Mode</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30 hidden sm:inline">
                Live Prototype Evaluation
              </span>
            </div>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SIH_DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleScenarioClick(s)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/10 hover:bg-amber-400/20 text-slate-200 hover:text-amber-200 border border-white/10 hover:border-amber-400/40 transition-all flex items-center gap-1"
            >
              <span>{s.tag}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="self-end md:self-auto p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 text-xs"
          aria-label="Close demo banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
