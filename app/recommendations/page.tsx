"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { ActivityAdvisor } from "@/components/activity-advisor";
import { LocationSearch } from "@/components/location-search";
import {
  LocationData,
  CurrentWeather,
  DailyForecastItem,
  AirQuality,
} from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "@/lib/weather-service";
import { Lightbulb, Sparkles } from "lucide-react";

export default function RecommendationsPage() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [aqi, setAqi] = useState<AirQuality | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [full, aqiData] = await Promise.all([
          WeatherService.getFullWeather(currentLocation.latitude, currentLocation.longitude),
          WeatherService.getAirQuality(currentLocation.latitude, currentLocation.longitude),
        ]);
        setCurrentWeather(full.current);
        setDaily(full.daily);
        setAqi(aqiData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentLocation]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <SIHDemoBanner />
      <Navbar
        currentLocation={currentLocation}
        onLocationChange={(loc) => setCurrentLocation(loc)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-300" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Domain-Specific AI Recommendations
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Meteorologically grounded feasibility matrices for sports, travel, clothing, farming, and events in {currentLocation.name}
              </p>
            </div>
          </div>

          {loading || !currentWeather || !aqi ? (
            <div className="h-64 rounded-3xl glass-panel flex items-center justify-center border border-white/10">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-7 h-7 rounded-full border-2 border-aurora-cyan border-t-transparent animate-spin" />
                <span className="text-xs font-mono">Synthesizing meteorological recommendation models...</span>
              </div>
            </div>
          ) : (
            <ActivityAdvisor
              current={currentWeather}
              daily={daily}
              aqi={aqi}
              location={currentLocation}
              onAskChat={(prompt) => router.push(`/chat?q=${encodeURIComponent(prompt)}`)}
            />
          )}
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
