"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { ClimateAnalytics } from "@/components/climate-analytics";
import { LocationSearch } from "@/components/location-search";
import { LocationData } from "@/types/weather";
import { useWeatherSettings } from "@/components/weather-context";
import { TrendingUp, Globe, Sparkles } from "lucide-react";

export default function ClimatePage() {
  const { currentLocation, setCurrentLocation } = useWeatherSettings();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <Navbar
        currentLocation={currentLocation}
        onLocationChange={setCurrentLocation}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-aurora-purple" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Long-Term Climate Intelligence & Decadal Shifts
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Distinguishing daily weather fluctuations from 15–30 year historical climate anomalies and monsoon variations
              </p>
            </div>
          </div>

          <ClimateAnalytics location={currentLocation} />
        </main>
      </div>

      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />
    </div>
  );
}
