"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { WeatherBackground } from "@/components/weather-background";
import { LocationSearchBar } from "@/components/location-search-bar";
import { WeatherCard } from "@/components/weather-card";
import { HourlyForecast } from "@/components/hourly-forecast";
import { SunriseSunsetCard } from "@/components/sunrise-sunset-card";
import { RainfallCard } from "@/components/rainfall-card";
import { WeatherDetailsGrid } from "@/components/weather-details-grid";
import { WeatherCharts } from "@/components/weather-charts";
import { WeatherAlertsSection } from "@/components/weather-alerts-section";
import { DailyForecast } from "@/components/daily-forecast";
import { AskAIPanel } from "@/components/ask-ai-panel";
import { AirQualityCard } from "@/components/air-quality-card";
import { ActivityAdvisor } from "@/components/activity-advisor";
import { LocationSearch } from "@/components/location-search";
import {
  WeatherCardSkeleton,
  HourlySkeleton,
  ChartSkeleton,
} from "@/components/skeleton-loader";
import {
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQuality,
  WeatherAlert,
} from "@/types/weather";
import { WeatherService } from "@/lib/weather-service";
import { useWeatherSettings } from "@/components/weather-context";
import {
  RefreshCw,
  Bot,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from "lucide-react";

export default function WeatherGPTDashboard() {
  const router = useRouter();
  const { unit, toggleUnit, currentLocation, setCurrentLocation } = useWeatherSettings();

  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [aqi, setAqi] = useState<AirQuality | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // Fetch weather when currentLocation changes
  useEffect(() => {
    let isCancelled = false;

    async function loadWeatherData() {
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

        if (!isCancelled) {
          setCurrentWeather(full.current);
          setHourly(full.hourly);
          setDaily(full.daily);
          setAqi(aqiData);
          setAlerts(alertsData);
          setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (err) {
        console.error("Dashboard weather fetch error:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadWeatherData();

    return () => {
      isCancelled = true;
    };
  }, [currentLocation]);

  const currentConditionText = currentWeather?.conditionText || "clear";
  const isNightTime = currentWeather ? !currentWeather.isDay : false;

  const scrollToAI = () => {
    const aiPanel = document.getElementById("ask-ai-section");
    if (aiPanel) {
      aiPanel.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/chat?location=${encodeURIComponent(currentLocation.name)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden text-slate-100">
      {/* 1. Dynamic Weather Background (reacts to conditions & day/night) */}
      <WeatherBackground condition={currentConditionText} isNight={isNightTime} />

      {/* 2. Top Navigation Bar with °C/°F Toggle, Direct Links, & Quick Cities */}
      <Navbar
        currentLocation={currentLocation}
        onLocationChange={setCurrentLocation}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Content Area: Centered, Clean Modern Weather App Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 sm:space-y-8">
        {/* Prominent Location Search & Quick Shortcuts */}
        <div className="w-full">
          <LocationSearchBar
            currentLocation={currentLocation}
            onSelectLocation={setCurrentLocation}
            isLoading={loading}
          />
        </div>

        {/* Live Telemetry & Quick Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <MapPin className="w-4 h-4 text-aurora-cyan" />
              <span>
                {currentLocation.name}
                {currentLocation.admin2 ? `, ${currentLocation.admin2}` : ""}
                {currentLocation.admin1 ? `, ${currentLocation.admin1}` : ""}
              </span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastRefreshed ? `Updated ${lastRefreshed}` : "Live Data"}
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-brand-300 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Open-Meteo Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentLocation({ ...currentLocation })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all active:scale-95"
              title="Refresh Live Weather Observations"
              aria-label="Refresh weather data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-aurora-cyan" : ""}`} />
              <span className="font-mono text-[11px]">Refresh</span>
            </button>

            <button
              onClick={scrollToAI}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 active:scale-95 transition-all"
            >
              <Bot className="w-3.5 h-3.5 fill-navy-950" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* 3. Hero Current Weather Card */}
        <section aria-label="Current Weather">
          {loading || !currentWeather ? (
            <WeatherCardSkeleton />
          ) : (
            <WeatherCard
              current={currentWeather}
              location={currentLocation}
              todayDaily={daily[0]}
              unit={unit}
              onToggleUnit={toggleUnit}
              onAskAI={scrollToAI}
            />
          )}
        </section>

        {/* 4. 24-Hour Scrollable Hourly Forecast Strip */}
        <section aria-label="Hourly Forecast">
          {loading ? (
            <HourlySkeleton />
          ) : (
            <HourlyForecast items={hourly} unit={unit} />
          )}
        </section>

        {/* 5. Main Weather Grid: 7-Day Extended Forecast + Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 7-Day Forecast & Solar/Rain Cards */}
          <div className="lg:col-span-6 space-y-6">
            <section aria-label="7-Day Extended Forecast">
              {loading ? (
                <HourlySkeleton />
              ) : (
                <DailyForecast items={daily.slice(0, 7)} unit={unit} />
              )}
            </section>

            {/* Sunrise / Sunset & Precipitation Probability */}
            {currentWeather && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SunriseSunsetCard
                  sunrise={currentWeather.sunrise}
                  sunset={currentWeather.sunset}
                  isDay={currentWeather.isDay}
                />
                <RainfallCard
                  precipitationProb={
                    daily[0]?.precipitationProb ||
                    (currentWeather.precipitation > 0 ? 80 : 10)
                  }
                  precipitationSum={
                    daily[0]?.precipitationSum || currentWeather.precipitation
                  }
                  currentPrecipitation={currentWeather.precipitation}
                  hourlyItems={hourly}
                />
              </div>
            )}
          </div>

          {/* Right Column: Weather Details Grid & Air Quality Card */}
          <div className="lg:col-span-6 space-y-6">
            <section aria-label="Current Weather Conditions Grid">
              {currentWeather && (
                <WeatherDetailsGrid
                  current={currentWeather}
                  todayDaily={daily[0]}
                  unit={unit}
                />
              )}
            </section>

            {aqi && (
              <section aria-label="Air Quality Index">
                <AirQualityCard aqi={aqi} />
              </section>
            )}
          </div>
        </div>

        {/* 6. Interactive 24-Hour Trend Charts */}
        <section aria-label="Interactive Temperature and Weather Charts">
          {loading ? <ChartSkeleton /> : <WeatherCharts hourly={hourly} unit={unit} />}
        </section>

        {/* 7. Real-Time Meteorological Alerts Section */}
        <section aria-label="Weather Alerts">
          <WeatherAlertsSection alerts={alerts} location={currentLocation} />
        </section>

        {/* 8. Activity Advisor */}
        {currentWeather && aqi && (
          <section aria-label="Daily Activity & Lifestyle Advisor">
            <ActivityAdvisor
              current={currentWeather}
              daily={daily}
              aqi={aqi}
              location={currentLocation}
              onAskChat={(prompt) => router.push(`/chat?q=${encodeURIComponent(prompt)}`)}
            />
          </section>
        )}

        {/* 9. Dedicated Sleek "Ask WeatherGPT" AI Panel */}
        <section id="ask-ai-section" className="scroll-mt-6" aria-label="WeatherGPT AI Assistant">
          {currentWeather && (
            <AskAIPanel
              currentLocation={currentLocation}
              currentWeather={currentWeather}
              hourly={hourly}
              daily={daily}
              aqi={aqi}
              unit={unit}
            />
          )}
        </section>
      </main>

      {/* Global Location Search Modal */}
      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={setCurrentLocation}
      />

      {/* Consumer Weather App Footer */}
      <footer className="border-t border-white/10 glass-panel py-8 px-6 text-xs text-slate-400 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <p className="text-slate-300 font-medium">
              WeatherGPT • Intelligent Meteorological Forecasting
            </p>
            <p className="text-slate-500 text-[11px]">
              Live weather telemetry provided by{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="text-aurora-cyan hover:underline inline-flex items-center gap-0.5"
              >
                Open-Meteo <ExternalLink className="w-2.5 h-2.5" />
              </a>{" "}
              • Free & Open Data API.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Weather</Link>
            <Link href="/chat" className="hover:text-white transition-colors">AI Weather Chat</Link>
            <Link href="/forecast" className="hover:text-white transition-colors">Extended Forecast</Link>
            <Link href="/map" className="hover:text-white transition-colors">Radar Map</Link>
            <Link href="/climate" className="hover:text-white transition-colors">Climate</Link>
            <Link href="/compare" className="hover:text-white transition-colors">Compare</Link>
            <Link href="/alerts" className="hover:text-white transition-colors">Alerts</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
