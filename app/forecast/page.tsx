"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { HourlyForecast } from "@/components/hourly-forecast";
import { DailyForecast } from "@/components/daily-forecast";
import { WeatherCharts } from "@/components/weather-charts";
import { LocationSearch } from "@/components/location-search";
import { HourlySkeleton, ChartSkeleton } from "@/components/skeleton-loader";
import { LocationData, HourlyForecastItem, DailyForecastItem } from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "@/lib/weather-service";
import { CalendarDays, MapPin } from "lucide-react";

export default function ForecastPage() {
  const [currentLocation, setCurrentLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      try {
        const full = await WeatherService.getFullWeather(
          currentLocation.latitude,
          currentLocation.longitude
        );
        setHourly(full.hourly);
        setDaily(full.daily);
      } catch (err) {
        console.error("Forecast fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-aurora-cyan" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Detailed Meteorological Forecast
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                High-resolution 48-hour and 14-day numerical simulation models for {currentLocation.name}
              </p>
            </div>
          </div>

          {/* Hourly Scroller */}
          {loading ? <HourlySkeleton /> : <HourlyForecast items={hourly} />}

          {/* Meteorological Dynamic Charts */}
          {loading ? <ChartSkeleton /> : <WeatherCharts hourly={hourly} />}

          {/* 14-Day Extended Daily Cards */}
          {loading ? <HourlySkeleton /> : <DailyForecast items={daily} />}
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
