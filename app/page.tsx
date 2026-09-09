"use client";

import React, { useState, useEffect } from "react";
import { useWeatherSettings } from "@/components/weather-context";
import { WeatherService, POPULAR_LOCATIONS } from "@/lib/weather-service";
import {
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  LocationData,
} from "@/types/weather";
import { WeatherTodayView } from "@/components/weather-today-view";
import { WeatherWeekView } from "@/components/weather-week-view";
import { WeatherSavedView } from "@/components/weather-saved-view";
import { WeatherAIView } from "@/components/weather-ai-view";
import { BottomNavBar, WeatherTab } from "@/components/bottom-nav-bar";
import { LocationSearch } from "@/components/location-search";
import {
  Smartphone,
  Layers,
  Search,
  Sparkles,
  MapPin,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function WeatherGPTApp() {
  const { unit, toggleUnit, currentLocation, setCurrentLocation } = useWeatherSettings();

  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state for Single Phone mode and individual phone mockups
  const [activeTab, setActiveTab] = useState<WeatherTab>("today");
  const [phone1Tab, setPhone1Tab] = useState<WeatherTab>("today");
  const [phone2Tab, setPhone2Tab] = useState<WeatherTab>("week");
  const [phone3Tab, setPhone3Tab] = useState<WeatherTab>("saved");

  // View mode on desktop: "showcase" (3 phones side-by-side) or "single" (focused phone)
  const [viewMode, setViewMode] = useState<"showcase" | "single">("showcase");
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Saved locations state
  const [savedLocations, setSavedLocations] = useState<LocationData[]>([]);
  const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});

  // Fetch live weather data when currentLocation changes
  useEffect(() => {
    let isCancelled = false;

    async function loadWeatherData() {
      setLoading(true);
      try {
        const full = await WeatherService.getFullWeather(
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (!isCancelled) {
          setCurrentWeather(full.current);
          setHourly(full.hourly);
          setDaily(full.daily);
        }
      } catch (err) {
        console.error("Failed to load weather data:", err);
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

  // Load saved locations and their current weather
  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch("/api/saved-locations");
        if (res.ok) {
          const list: LocationData[] = await res.json();
          setSavedLocations(list);

          const map: Record<string, CurrentWeather> = {};
          await Promise.all(
            list.slice(0, 6).map(async (l) => {
              try {
                const full = await WeatherService.getFullWeather(l.latitude, l.longitude);
                map[l.name] = full.current;
              } catch (e) {}
            })
          );
          setWeatherMap(map);
        }
      } catch (e) {
        console.warn("Could not load saved locations:", e);
      }
    }
    loadSaved();
  }, []);

  const handleSelectLocation = (loc: LocationData) => {
    setCurrentLocation(loc);
    setSearchModalOpen(false);
    setActiveTab("today");
    setPhone1Tab("today");
    setPhone2Tab("week");
  };

  // Render view for a specific tab inside a phone container
  const renderTabContent = (
    tab: WeatherTab,
    onChangeTab: (t: WeatherTab) => void
  ) => {
    if (loading || !currentWeather) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-blue-200">
          <div className="w-9 h-9 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-sm font-medium">Fetching meteorological telemetry...</span>
          <span className="text-xs text-blue-300/60 mt-1 font-mono">Open-Meteo API</span>
        </div>
      );
    }

    switch (tab) {
      case "today":
        return (
          <WeatherTodayView
            location={currentLocation}
            current={currentWeather}
            todayDaily={daily[0]}
            hourly={hourly}
            unit={unit}
            onToggleUnit={toggleUnit}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        );
      case "week":
        return (
          <WeatherWeekView
            location={currentLocation}
            daily={daily}
            unit={unit}
            onToggleUnit={toggleUnit}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        );
      case "saved":
        return (
          <WeatherSavedView
            savedLocations={savedLocations}
            weatherMap={weatherMap}
            unit={unit}
            onSelectLocation={handleSelectLocation}
            onBack={() => onChangeTab("today")}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        );
      case "ai":
        return (
          <WeatherAIView
            location={currentLocation}
            current={currentWeather}
            unit={unit}
            onBack={() => onChangeTab("today")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen canvas-backdrop flex flex-col items-center justify-between text-white selection:bg-sky-500 selection:text-white">
      {/* 1. Desktop Top Control Bar (Clean & Unobtrusive) */}
      <header className="w-full max-w-6xl px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-500 flex items-center justify-center text-navy-950 font-black text-xs shadow-md">
            W
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-navy-950 tracking-tight flex items-center gap-1.5">
              <span>WeatherGPT</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/60 text-navy-900 border border-navy-900/10">
                Live
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Active Location Indicator */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white/90 text-navy-900 text-xs font-semibold shadow-sm transition-all border border-navy-900/10"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>
            {currentLocation.name}
            {currentLocation.admin1 ? `, ${currentLocation.admin1}` : ""}
          </span>
          <Search className="w-3 h-3 text-slate-500 ml-1" />
        </button>

        {/* Right Controls: Mode Toggle, °C/°F, Refresh */}
        <div className="flex items-center gap-2">
          {/* Toggle between 3-Phone Showcase & Single Phone on Desktop */}
          <div className="hidden lg:flex items-center p-0.5 rounded-full bg-navy-950/15 border border-navy-950/10 text-xs font-medium">
            <button
              onClick={() => setViewMode("showcase")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                viewMode === "showcase"
                  ? "bg-white text-navy-950 shadow-sm font-bold"
                  : "text-navy-900/80 hover:text-navy-950"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>3-Screen Showcase</span>
            </button>

            <button
              onClick={() => setViewMode("single")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                viewMode === "single"
                  ? "bg-white text-navy-950 shadow-sm font-bold"
                  : "text-navy-900/80 hover:text-navy-950"
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Single Phone</span>
            </button>
          </div>

          {/* Unit Switcher */}
          <button
            onClick={toggleUnit}
            className="px-3 py-1.5 rounded-full bg-white/70 hover:bg-white/90 text-navy-950 font-bold text-xs shadow-sm border border-navy-900/10 transition-colors"
          >
            °{unit}
          </button>
        </div>
      </header>

      {/* 2. Main Visual Canvas */}
      <main className="w-full flex-1 flex items-center justify-center p-2 sm:p-6 lg:p-8">
        {/* VIEW 1: DESKTOP 3-SCREEN SHOWCASE (Matches user's reference image 100%) */}
        {viewMode === "showcase" ? (
          <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 xl:gap-10 py-4">
            {/* Phone 1: Screen 1 (Today / Current Weather & Hourly) */}
            <div className="phone-viewport w-[340px] sm:w-[360px] h-[680px] sm:h-[720px] flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_30px_70px_-10px_rgba(6,17,39,0.8)]">
              <div className="flex-1 overflow-hidden">
                {renderTabContent(phone1Tab, setPhone1Tab)}
              </div>
              <BottomNavBar activeTab={phone1Tab} onChangeTab={setPhone1Tab} />
            </div>

            {/* Phone 2: Screen 2 (This Week / 7-Day Forecast & Tomorrow Highlight) */}
            <div className="phone-viewport w-[340px] sm:w-[360px] h-[680px] sm:h-[720px] flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_30px_70px_-10px_rgba(6,17,39,0.8)]">
              <div className="flex-1 overflow-hidden">
                {renderTabContent(phone2Tab, setPhone2Tab)}
              </div>
              <BottomNavBar activeTab={phone2Tab} onChangeTab={setPhone2Tab} />
            </div>

            {/* Phone 3: Screen 3 (Saved Locations / Watchlist Cards) */}
            <div className="phone-viewport w-[340px] sm:w-[360px] h-[680px] sm:h-[720px] flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_30px_70px_-10px_rgba(6,17,39,0.8)]">
              <div className="flex-1 overflow-hidden">
                {renderTabContent(phone3Tab, setPhone3Tab)}
              </div>
              <BottomNavBar activeTab={phone3Tab} onChangeTab={setPhone3Tab} />
            </div>
          </div>
        ) : (
          /* VIEW 2: SINGLE FOCUSED PHONE (Interactive 4-tab mobile view) */
          <div className="phone-viewport w-full max-w-[370px] sm:max-w-[390px] h-[100dvh] sm:h-[740px] flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="flex-1 overflow-hidden">
              {renderTabContent(activeTab, setActiveTab)}
            </div>
            <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
          </div>
        )}
      </main>

      {/* 3. Global Location Search Modal */}
      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* 4. Subtle Footer Attribution */}
      <footer className="w-full py-4 text-center text-[11px] text-navy-950/70 font-medium">
        <span>WeatherGPT • Meteorological data powered by </span>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline hover:text-navy-950 inline-flex items-center gap-0.5"
        >
          Open-Meteo <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </footer>
    </div>
  );
}
