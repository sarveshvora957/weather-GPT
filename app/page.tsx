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
import { Weather3DIcon } from "@/components/weather-3d-icon";
import { WeatherAIView } from "@/components/weather-ai-view";
import { LocationSearch } from "@/components/location-search";
import { LocationSearchBar } from "@/components/location-search-bar";
import { convertTemp } from "@/lib/utils";
import {
  MapPin,
  Search,
  RefreshCw,
  Droplets,
  ExternalLink,
  Bot,
  Sparkles,
  Bookmark,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";

export default function WeatherGPTApp() {
  const { unit, toggleUnit, currentLocation, setCurrentLocation } = useWeatherSettings();

  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

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
          setLastRefreshed(
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
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

  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return isoString;
    }
  };

  const getDayName = (dateStr: string, index: number) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "long" });
    } catch {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return days[index % 7];
    }
  };

  const displayTemp = currentWeather ? convertTemp(currentWeather.temperature, unit) : 24;
  const displayFeelsLike = currentWeather ? convertTemp(currentWeather.feelsLike, unit) : 28;
  const rainChance =
    daily[0]?.precipitationProb ??
    (currentWeather && currentWeather.precipitation > 0 ? 90 : 15);

  const tomorrow = daily[1] || daily[0];
  const tomorrowMax = tomorrow ? convertTemp(tomorrow.tempMax, unit) : 28;
  const tomorrowMin = tomorrow ? convertTemp(tomorrow.tempMin, unit) : 23;
  const tomorrowRain = tomorrow?.precipitationProb ?? 80;
  const tomorrowCondition = tomorrow?.conditionText || "Cloudy / Rainy";

  const defaultPresets = [
    { name: "New York", country: "United States", lat: 40.7128, lon: -74.006, high: 28, low: 22, cond: "Cloudy", isNight: true },
    { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503, high: 30, low: 24, cond: "Thunderstorm", isNight: false },
    { name: "Vancouver", country: "Canada", lat: 49.2827, lon: -123.1207, high: 20, low: 12, cond: "Light Rain", isNight: false },
    { name: "Agartala", country: "Tripura, India", lat: 23.8315, lon: 91.2868, high: 31, low: 25, cond: "Light Rain", isNight: false },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between text-white selection:bg-sky-500 selection:text-white">
      {/* 1. Header Bar: Brand, Location Search & Quick Pills, Unit Toggle */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-navy-950 font-black text-sm shadow-md">
              W
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>WeatherGPT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Live
                </span>
              </h1>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleUnit}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-sky-300"
            >
              °{unit}
            </button>
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Prominent Location Search Input */}
        <div className="w-full md:max-w-md">
          <LocationSearchBar
            currentLocation={currentLocation}
            onSelectLocation={(loc) => setCurrentLocation(loc)}
            isLoading={loading}
          />
        </div>

        {/* Right Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setCurrentLocation({ ...currentLocation })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-blue-200 transition-colors"
            title="Refresh weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
            <span className="font-mono text-[11px]">{lastRefreshed ? `Sync ${lastRefreshed}` : "Sync"}</span>
          </button>

          <button
            onClick={toggleUnit}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold text-sky-300 shadow-sm transition-all active:scale-95"
            title="Toggle °C / °F"
          >
            °{unit}
          </button>
        </div>
      </header>

      {/* 2. Main Content Grid (Responsive for Laptop and Phone) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {loading || !currentWeather ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-blue-200">
            <div className="w-12 h-12 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-base font-medium">Fetching real-time meteorological observations...</span>
            <span className="text-xs text-blue-300/60 mt-1 font-mono">Open-Meteo High-Resolution Model</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================= LEFT COLUMN: TODAY HERO + 6-METRIC CARD + HOURLY STRIP + AI ================= */}
            <div className="lg:col-span-7 space-y-6">
              {/* SCREEN 1 HERO CARD: Location, 3D Icon, Condition, Large Temp, Feels Like */}
              <div className="royal-card p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                {/* Location Top Bar inside Card */}
                <div className="w-full flex items-center justify-between gap-2 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 text-left">
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {currentLocation.name}
                      {currentLocation.admin1 ? `, ${currentLocation.admin1}` : ""}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-blue-200/60 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {lastRefreshed ? `Updated ${lastRefreshed}` : "Live Data"}
                  </span>
                </div>

                {/* 3D Weather Illustration */}
                <div className="my-2">
                  <Weather3DIcon
                    condition={currentWeather.conditionText}
                    isNight={!currentWeather.isDay}
                    size="xl"
                  />
                </div>

                {/* Weather Condition */}
                <h2 className="text-lg sm:text-xl font-medium text-blue-100 tracking-wide mt-1">
                  {currentWeather.conditionText}
                </h2>

                {/* Large Temperature Typography */}
                <div className="flex items-start justify-center mt-2">
                  <span className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight text-white leading-none">
                    {displayTemp}
                  </span>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-light text-sky-200 ml-1 mt-2">°</span>
                </div>

                {/* Feels Like Text */}
                <p className="text-sm text-blue-200/80 mt-2 font-medium">
                  Feels like {displayFeelsLike}°
                </p>

                {/* 6-METRIC PARAMETERS CARD (2 rows x 3 columns matching reference) */}
                <div className="w-full mt-6 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center">
                    {/* Row 1 */}
                    <div>
                      <span className="text-xs text-blue-200/70 block">Wind speed</span>
                      <strong className="text-sm sm:text-base font-semibold text-white mt-0.5 block">
                        {Math.round(currentWeather.windSpeed)} km/h
                      </strong>
                    </div>

                    <div>
                      <span className="text-xs text-blue-200/70 block">Humidity</span>
                      <strong className="text-sm sm:text-base font-semibold text-white mt-0.5 block">
                        {currentWeather.humidity}%
                      </strong>
                    </div>

                    <div>
                      <span className="text-xs text-blue-200/70 block">Chance of rain</span>
                      <strong className="text-sm sm:text-base font-semibold text-white mt-0.5 block">
                        {rainChance}%
                      </strong>
                    </div>

                    {/* Row 2 */}
                    <div className="pt-3 border-t border-white/5">
                      <span className="text-xs text-blue-200/70 block">Sunrise</span>
                      <strong className="text-sm sm:text-base font-semibold text-white mt-0.5 block">
                        {formatTimeStr(currentWeather.sunrise)}
                      </strong>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <span className="text-xs text-blue-200/70 block">Sunset</span>
                      <strong className="text-sm sm:text-base font-semibold text-white mt-0.5 block">
                        {formatTimeStr(currentWeather.sunset)}
                      </strong>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <span className="text-xs text-blue-200/70 block">Pressure</span>
                      <strong className="text-sm sm:text-base font-semibold text-white mt-0.5 block">
                        {Math.round(currentWeather.pressure)} hPa
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24-HOUR HOURLY FORECAST STRIP */}
              <div className="royal-card p-5 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>Hourly Forecast</span>
                  </h3>
                  <span className="text-xs text-blue-200/70 font-mono">Next 24 Hours</span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {hourly.slice(0, 16).map((item, index) => {
                    const isFirst = index === 0;
                    const hTemp = convertTemp(item.temperature, unit);
                    const timeLabel = isFirst
                      ? "Now"
                      : new Date(item.time).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });

                    if (isFirst) {
                      return (
                        <div
                          key={item.time}
                          className="sky-highlight-card shrink-0 min-w-[80px] p-3.5 flex flex-col items-center justify-between text-center"
                        >
                          <span className="text-xs font-medium text-white">{timeLabel}</span>
                          <div className="my-2">
                            <Weather3DIcon condition={item.conditionText} size="sm" />
                          </div>
                          <span className="text-base font-bold text-white">{hTemp}°</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.time}
                        className="royal-card-interactive shrink-0 min-w-[80px] p-3.5 flex flex-col items-center justify-between text-center"
                      >
                        <span className="text-xs text-blue-200/80">{timeLabel}</span>
                        <div className="my-2">
                          <Weather3DIcon condition={item.conditionText} size="sm" />
                        </div>
                        <span className="text-base font-bold text-white">{hTemp}°</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WEATHERGPT CONVERSATIONAL AI ASSISTANT */}
              <div className="royal-card p-6 shadow-xl h-[480px]">
                <WeatherAIView
                  location={currentLocation}
                  current={currentWeather}
                  unit={unit}
                  onBack={() => {}}
                />
              </div>
            </div>

            {/* ================= RIGHT COLUMN: TOMORROW HIGHLIGHT + THIS WEEK FORECAST + SAVED CITIES ================= */}
            <div className="lg:col-span-5 space-y-6">
              {/* TOMORROW HIGHLIGHT CARD (Sky Blue gradient matching reference) */}
              <div className="sky-highlight-card p-6 shadow-xl flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-white/90 block">
                    Tomorrow
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-4xl font-bold text-white">
                      {tomorrowMax}°
                    </span>
                    <span className="text-xl font-light text-white/80">
                      {tomorrowMin}°
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 pt-1">
                    <Droplets className="w-3.5 h-3.5 fill-white text-white" />
                    <span>{tomorrowRain}% chance of rain</span>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <Weather3DIcon condition={tomorrowCondition} size="lg" />
                  <span className="text-xs font-semibold text-white mt-1 max-w-[110px] truncate">
                    {tomorrowCondition}
                  </span>
                </div>
              </div>

              {/* THIS WEEK / 7-DAY EXTENDED FORECAST LIST (Matching reference) */}
              <div className="royal-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>This Week</span>
                  </h3>
                  <span className="text-xs text-blue-200/70 font-mono">7-Day Forecast</span>
                </div>

                <div className="space-y-3.5">
                  {daily.slice(1, 8).map((day, index) => {
                    const max = convertTemp(day.tempMax, unit);
                    const min = convertTemp(day.tempMin, unit);
                    const dayName = getDayName(day.date, index + 1);
                    const rain = day.precipitationProb;

                    return (
                      <div
                        key={day.date}
                        className="flex items-center justify-between py-1 px-1 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        {/* Day Name */}
                        <span className="text-sm font-medium text-slate-200 w-28 truncate">
                          {dayName}
                        </span>

                        {/* Temperatures */}
                        <div className="flex items-center gap-2 font-mono text-sm font-semibold">
                          <span className="text-white">{max}°</span>
                          <span className="text-blue-200/70 font-normal">{min}°</span>
                        </div>

                        {/* Rain Chance & 3D Weather Icon */}
                        <div className="flex items-center gap-2 justify-end w-24">
                          {rain !== undefined && rain > 20 && (
                            <span className="text-xs font-medium text-sky-400 font-mono">
                              {rain}%
                            </span>
                          )}
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <Weather3DIcon condition={day.conditionText} size="sm" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SAVED LOCATIONS / WATCHLIST (Matching reference) */}
              <div className="royal-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-sky-400" />
                    <span>Saved Locations</span>
                  </h3>

                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-sky-300 hover:text-white font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add City</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {defaultPresets.map((loc) => {
                    const high = convertTemp(loc.high, unit);
                    const low = convertTemp(loc.low, unit);

                    return (
                      <div
                        key={loc.name}
                        onClick={() =>
                          setCurrentLocation({
                            name: loc.name,
                            country: loc.country,
                            latitude: loc.lat,
                            longitude: loc.lon,
                          })
                        }
                        className="royal-card-interactive p-4 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                            {loc.name}
                          </h4>
                          <span className="text-[11px] text-blue-200/70 block">
                            {loc.country}
                          </span>
                          <div className="flex items-baseline gap-2 pt-1 font-mono">
                            <span className="text-base font-bold text-white">{high}°</span>
                            <span className="text-xs text-blue-200/70">{low}°</span>
                          </div>
                          <span className="text-xs text-blue-200/80 block">
                            {loc.cond}
                          </span>
                        </div>

                        <div className="shrink-0">
                          <Weather3DIcon
                            condition={loc.cond}
                            isNight={loc.isNight}
                            size="md"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Global Location Search Modal */}
      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={(loc) => {
          setCurrentLocation(loc);
          setSearchModalOpen(false);
        }}
      />

      {/* 4. Footer */}
      <footer className="w-full max-w-7xl mx-auto py-6 px-4 text-center text-xs text-blue-200/60 font-medium">
        <span>WeatherGPT • Meteorological observations powered by </span>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline text-sky-400 hover:text-white inline-flex items-center gap-0.5"
        >
          Open-Meteo <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </footer>
    </div>
  );
}
