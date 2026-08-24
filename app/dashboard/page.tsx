"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { WeatherCard } from "@/components/weather-card";
import { HourlyForecast } from "@/components/hourly-forecast";
import { DailyForecast } from "@/components/daily-forecast";
import { WeatherCharts } from "@/components/weather-charts";
import { AirQualityCard } from "@/components/air-quality-card";
import { AlertCard } from "@/components/alert-card";
import { ActivityAdvisor } from "@/components/activity-advisor";
import { LocationSearch } from "@/components/location-search";
import { WeatherCardSkeleton, HourlySkeleton, ChartSkeleton } from "@/components/skeleton-loader";
import {
  LocationData,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQuality,
  WeatherAlert,
} from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "@/lib/weather-service";
import { Sparkles, MessageSquare, MapPin, Activity } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [aqi, setAqi] = useState<AirQuality | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Fetch weather when currentLocation changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [full, aqiData, alertsData] = await Promise.all([
          WeatherService.getFullWeather(currentLocation.latitude, currentLocation.longitude),
          WeatherService.getAirQuality(currentLocation.latitude, currentLocation.longitude),
          WeatherService.getWeatherAlerts(
            currentLocation.latitude,
            currentLocation.longitude,
            currentLocation.name
          ),
        ]);

        setCurrentWeather(full.current);
        setHourly(full.hourly);
        setDaily(full.daily);
        setAqi(aqiData);
        setAlerts(alertsData);
      } catch (err) {
        console.error("Dashboard weather fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentLocation]);

  // Greeting generator based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition={currentWeather?.conditionText.toLowerCase().includes("rain") ? "rain" : "clear"} />
      <SIHDemoBanner />
      <Navbar
        currentLocation={currentLocation}
        onLocationChange={(loc) => setCurrentLocation(loc)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Top Greeting Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {getGreeting()}, <span className="text-aurora-cyan">Observer</span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Here is your live meteorological briefing and AI atmospheric analysis for today.
              </p>
            </div>

            <button
              onClick={() => router.push(`/chat?location=${encodeURIComponent(currentLocation.name)}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-navy-950" />
              <span>Ask WeatherGPT about {currentLocation.name}</span>
            </button>
          </div>

          {/* Active Severe Weather Alert Banner if present */}
          {alerts.length > 0 && alerts[0].severity !== "LOW" && (
            <div className="animate-in fade-in slide-in-from-top-3">
              <AlertCard alert={alerts[0]} />
            </div>
          )}

          {/* Main Weather Card */}
          {loading || !currentWeather ? (
            <WeatherCardSkeleton />
          ) : (
            <WeatherCard
              current={currentWeather}
              location={currentLocation}
              todayDaily={daily[0]}
              onAskAI={() => router.push(`/chat?location=${encodeURIComponent(currentLocation.name)}`)}
            />
          )}

          {/* Hourly Forecast */}
          {loading ? <HourlySkeleton /> : <HourlyForecast items={hourly} />}

          {/* Charts & Extended Forecast Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              {loading ? <ChartSkeleton /> : <WeatherCharts hourly={hourly} />}
            </div>

            <div className="lg:col-span-5">
              {loading ? <HourlySkeleton /> : <DailyForecast items={daily.slice(0, 7)} />}
            </div>
          </div>

          {/* AQI & Activity Recommendations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              {aqi && <AirQualityCard aqi={aqi} />}
            </div>

            <div className="lg:col-span-7">
              {currentWeather && aqi && (
                <ActivityAdvisor
                  current={currentWeather}
                  daily={daily}
                  aqi={aqi}
                  location={currentLocation}
                  onAskChat={(prompt) => router.push(`/chat?q=${encodeURIComponent(prompt)}`)}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Global Location Search Modal */}
      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />
    </div>
  );
}
