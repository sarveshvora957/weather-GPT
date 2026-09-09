"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocationData, WeatherAlert, CurrentWeather, DailyForecastItem, AirQuality } from "@/types/weather";
import { WeatherService } from "@/lib/weather-service";
import { convertTemp } from "@/lib/utils";
import { useWeatherSettings } from "@/components/weather-context";
import { Weather3DIcon } from "@/components/weather-3d-icon";
import { LocationSearchBar } from "@/components/location-search-bar";
import {
  Layers,
  MapPin,
  CloudRain,
  Thermometer,
  Wind,
  Cloud,
  Sun,
  Droplets,
  Gauge,
  Eye,
  Compass,
  Sunrise,
  Sunset,
  Bot,
  Calendar,
  Navigation,
  ExternalLink,
  ChevronRight,
  Radio,
  X,
  Sparkles,
} from "lucide-react";

// Dynamically import Leaflet inner map to prevent SSR window reference errors
const WeatherMapInner = dynamic(() => import("./weather-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a152d] text-sky-300">
      <div className="w-10 h-10 rounded-full border-3 border-sky-400 border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-mono">Initializing Leaflet Weather Radar Canvas...</span>
    </div>
  ),
});

interface WeatherMapProps {
  center: LocationData;
  alerts?: WeatherAlert[];
  onSelectLocation?: (loc: LocationData) => void;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({
  center,
  alerts = [],
  onSelectLocation,
}) => {
  const router = useRouter();
  const { unit, toggleUnit, setCurrentLocation } = useWeatherSettings();

  const [activeLayer, setActiveLayer] = useState<"standard" | "radar" | "temp" | "wind" | "clouds">("radar");
  const [mapCenter, setMapCenter] = useState<[number, number]>([center.latitude, center.longitude]);
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [radarPath, setRadarPath] = useState<string | null>(null);

  // Selected Location Weather State
  const [activeLoc, setActiveLoc] = useState<LocationData>(center);
  const [liveWeather, setLiveWeather] = useState<CurrentWeather | null>(null);
  const [todayForecast, setTodayForecast] = useState<DailyForecastItem | null>(null);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [panelOpen, setPanelOpen] = useState<boolean>(true);

  // Sync center prop when changed externally
  useEffect(() => {
    setMapCenter([center.latitude, center.longitude]);
    setActiveLoc(center);
    fetchWeatherForLocation(center.latitude, center.longitude, center.name);
  }, [center]);

  // Fetch RainViewer radar timestamp on mount
  useEffect(() => {
    async function fetchRadarTimestamp() {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (res.ok) {
          const data = await res.json();
          const past = data.radar?.past;
          if (past && past.length > 0) {
            setRadarPath(past[past.length - 1].path);
          }
        }
      } catch (err) {
        console.warn("RainViewer fetch failed, using fallback radar tiles:", err);
      }
    }
    fetchRadarTimestamp();
  }, []);

  // Fetch weather and reverse-geocode when coordinates change
  const fetchWeatherForLocation = async (lat: number, lon: number, defaultName?: string) => {
    setIsLoadingWeather(true);
    setPanelOpen(true);

    try {
      // 1. Reverse geocode coordinates via BigDataCloud (free, open, no key required)
      let resolvedName = defaultName || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      let adminState = "";
      let country = "India";

      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          resolvedName =
            geoData.city ||
            geoData.locality ||
            geoData.principalSubdivision ||
            defaultName ||
            `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
          adminState = geoData.principalSubdivision || "";
          country = geoData.countryName || "India";
        }
      } catch (e) {
        console.warn("Reverse geocode error:", e);
      }

      const updatedLoc: LocationData = {
        name: resolvedName,
        admin1: adminState,
        country,
        latitude: lat,
        longitude: lon,
      };

      setActiveLoc(updatedLoc);
      if (onSelectLocation) onSelectLocation(updatedLoc);

      // 2. Fetch live real weather & AQI from Open-Meteo
      const [fullWeather, aqi] = await Promise.all([
        WeatherService.getFullWeather(lat, lon),
        WeatherService.getAirQuality(lat, lon),
      ]);

      setLiveWeather(fullWeather.current);
      setTodayForecast(fullWeather.daily[0] || null);
      setAirQuality(aqi);
    } catch (err) {
      console.error("Map weather fetch error:", err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Handler for clicking anywhere on the map
  const handleMapClick = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    fetchWeatherForLocation(lat, lng);
  };

  // Handler for selecting city via search bar
  const handleSelectFromSearch = (loc: LocationData) => {
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(9);
    setActiveLoc(loc);
    fetchWeatherForLocation(loc.latitude, loc.longitude, loc.name);
  };

  // GPS Locate User
  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(10);
        fetchWeatherForLocation(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        alert("Unable to retrieve your location. Please check browser permissions.");
      },
      { timeout: 8000 }
    );
  };

  // Navigation to Full Forecast
  const handleGoToForecast = () => {
    setCurrentLocation(activeLoc);
    router.push("/forecast");
  };

  // Navigation to AI Weather Agent with pre-loaded location
  const handleAskAI = () => {
    setCurrentLocation(activeLoc);
    const query = `What is the weather and forecast for ${activeLoc.name}?`;
    router.push(
      `/chat?location=${encodeURIComponent(activeLoc.name)}&lat=${activeLoc.latitude}&lon=${activeLoc.longitude}&q=${encodeURIComponent(query)}`
    );
  };

  // Calculations for UI
  const displayTemp = liveWeather ? convertTemp(liveWeather.temperature, unit) : "--";
  const displayFeels = liveWeather ? convertTemp(liveWeather.feelsLike, unit) : "--";
  const displayMax = todayForecast ? convertTemp(todayForecast.tempMax, unit) : "--";
  const displayMin = todayForecast ? convertTemp(todayForecast.tempMin, unit) : "--";
  const rainChance =
    todayForecast?.precipitationProb ?? (liveWeather && liveWeather.precipitation > 0 ? 90 : 15);

  return (
    <div className="relative w-full h-[640px] sm:h-[720px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl flex flex-col bg-[#0a152d]">
      {/* 1. TOP OVERLAY: Search Bar & GPS Locate Button */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-none">
        {/* Left: Location Search Bar */}
        <div className="pointer-events-auto max-w-sm w-full shadow-2xl">
          <LocationSearchBar
            currentLocation={activeLoc}
            onSelectLocation={handleSelectFromSearch}
            isLoading={isLoadingWeather}
          />
        </div>

        {/* Right: GPS Locate & Layer Selector */}
        <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={handleLocateMe}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl glass-panel border border-white/15 bg-navy-950/80 hover:bg-navy-900 text-sky-400 hover:text-white text-xs font-semibold shadow-xl transition-all"
            title="Pan to my GPS location"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Location</span>
          </button>

          {/* Layer Selector Bar */}
          <div className="flex items-center gap-1 p-1 rounded-2xl glass-panel border border-white/15 bg-navy-950/80 backdrop-blur-xl shadow-xl">
            <button
              onClick={() => setActiveLayer("radar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === "radar"
                  ? "bg-sky-500 text-navy-950 shadow-neon-cyan font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Real-Time Doppler Precipitation Radar"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Precipitation Radar</span>
              <span className="md:hidden">Radar</span>
            </button>

            <button
              onClick={() => setActiveLayer("standard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === "standard"
                  ? "bg-white/20 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Standard Map View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>

            <button
              onClick={() => setActiveLayer("clouds")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === "clouds"
                  ? "bg-indigo-500 text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Satellite Cloud Infrared Layer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clouds</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. LEAFLET INTERACTIVE MAP CANVAS */}
      <div className="w-full h-full relative z-0">
        <WeatherMapInner
          center={mapCenter}
          zoom={mapZoom}
          activeLayer={activeLayer}
          radarTilePath={radarPath}
          onMapClick={handleMapClick}
          selectedLocation={{
            name: activeLoc.name,
            lat: activeLoc.latitude,
            lng: activeLoc.longitude,
          }}
        />
      </div>

      {/* 3. CLICK-ANYWHERE HINT PILL */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-950/80 border border-sky-400/30 text-sky-200 text-xs font-medium shadow-2xl backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        <span>Click anywhere on the map to inspect live weather & radar</span>
      </div>

      {/* 4. FLOATING WEATHER PANEL (Bottom Left / Bottom Full) */}
      {panelOpen && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 pointer-events-auto animate-in slide-in-from-bottom-3 duration-300">
          <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/20 bg-navy-950/90 backdrop-blur-2xl shadow-2xl space-y-3.5">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {activeLoc.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {[activeLoc.admin1, activeLoc.country].filter(Boolean).join(", ")} • ({activeLoc.latitude.toFixed(2)}°, {activeLoc.longitude.toFixed(2)}°)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={toggleUnit}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-sky-300 border border-white/10 transition-colors"
                  title="Toggle °C / °F"
                >
                  °{unit}
                </button>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weather Metrics Body */}
            {isLoadingWeather ? (
              <div className="py-6 flex flex-col items-center justify-center text-sky-300 gap-2">
                <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Fetching live telemetry...</span>
              </div>
            ) : liveWeather ? (
              <>
                {/* Hero Condition & Temperature */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        {displayTemp}°{unit}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-300">
                        Feels {displayFeels}°
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-sky-300 mt-1 flex items-center gap-1">
                      <span>{liveWeather.conditionText}</span>
                      <span className="text-slate-400 font-normal">
                        (H: {displayMax}° / L: {displayMin}°)
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Weather3DIcon
                      condition={liveWeather.conditionText}
                      isNight={!liveWeather.isDay}
                      size="sm"
                    />
                  </div>
                </div>

                {/* 6 Key Weather Parameters Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-400" /> Rain Prob
                    </span>
                    <strong className="text-white mt-0.5">{rainChance}%</strong>
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-teal-400" /> Wind
                    </span>
                    <strong className="text-white mt-0.5">
                      {Math.round(liveWeather.windSpeed)} km/h
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" /> UV Index
                    </span>
                    <strong className="text-white mt-0.5">
                      {liveWeather.uvIndex} ({liveWeather.uvIndex >= 6 ? "High" : "Safe"})
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-emerald-400" /> AQI
                    </span>
                    <strong className="text-white mt-0.5">
                      {airQuality?.aqi ?? 45} ({airQuality?.category ?? "Good"})
                    </strong>
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                    </span>
                    <strong className="text-white mt-0.5">{liveWeather.humidity}%</strong>
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-indigo-400" /> Visibility
                    </span>
                    <strong className="text-white mt-0.5">
                      {liveWeather.visibility ? liveWeather.visibility.toFixed(1) : "10.0"} km
                    </strong>
                  </div>
                </div>

                {/* Extra Actions on Selected Location */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleGoToForecast}
                    className="w-full py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>View Full Forecast</span>
                  </button>

                  <button
                    onClick={handleAskAI}
                    className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-sky-500 via-brand-500 to-aurora-cyan text-navy-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-neon-cyan hover:brightness-110"
                  >
                    <Bot className="w-3.5 h-3.5 fill-navy-950" />
                    <span>Ask AI about this location</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No weather data available for these coordinates.
              </p>
            )}
          </div>
        </div>
      )}

      {/* If panel closed, reopen button */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute bottom-4 left-4 z-30 px-4 py-2.5 rounded-2xl glass-panel border border-white/15 bg-navy-950/80 text-white font-bold text-xs shadow-2xl flex items-center gap-2 hover:bg-navy-900 transition-all"
        >
          <MapPin className="w-4 h-4 text-sky-400" />
          <span>Show {activeLoc.name} Weather Card</span>
        </button>
      )}
    </div>
  );
};
