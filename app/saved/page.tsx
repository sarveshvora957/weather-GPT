"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { LocationSearch } from "@/components/location-search";
import { LocationData, CurrentWeather } from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION, POPULAR_LOCATIONS } from "@/lib/weather-service";
import { formatTemp } from "@/lib/utils";
import { BookmarkCheck, Plus, Trash2, MapPin, ArrowRight, Sun } from "lucide-react";

export default function SavedLocationsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<LocationData[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [weatherMap, setWeatherMap] = useState<Record<string, CurrentWeather>>({});
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved-locations");
      if (res.ok) {
        const list: LocationData[] = await res.json();
        setSaved(list);

        // Fetch current weather for each saved location
        const map: Record<string, CurrentWeather> = {};
        await Promise.all(
          list.map(async (l) => {
            try {
              const full = await WeatherService.getFullWeather(l.latitude, l.longitude);
              map[l.name] = full.current;
            } catch (e) {}
          })
        );
        setWeatherMap(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/saved-locations?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updated = await res.json();
        setSaved(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLocation = async (loc: LocationData) => {
    try {
      const res = await fetch("/api/saved-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loc),
      });
      if (res.ok) {
        const updated = await res.json();
        setSaved(updated);
        fetchSaved();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <SIHDemoBanner />
      <Navbar
        currentLocation={saved[0] || DEFAULT_LOCATION}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-aurora-cyan" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Saved Cities & Watchlist
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick-switch between bookmarked meteorological tracking points
              </p>
            </div>

            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4 fill-navy-950" />
              <span>Add City to Watchlist</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((loc) => {
              const cur = weatherMap[loc.name];
              return (
                <div
                  key={loc.name}
                  onClick={() => router.push(`/dashboard?loc=${encodeURIComponent(loc.name)}`)}
                  className="p-5 rounded-3xl glass-panel-interactive border border-white/10 flex flex-col justify-between h-44 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-aurora-cyan transition-colors">
                        {loc.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {loc.admin1 ? `${loc.admin1}, ` : ""}
                        {loc.country}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleRemove(loc.name, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      aria-label="Remove city"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {cur ? (
                    <div className="flex items-end justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="text-3xl font-black text-white font-mono">
                          {formatTemp(cur.temperature)}
                        </span>
                        <span className="text-xs text-aurora-cyan font-medium block">
                          {cur.conditionText}
                        </span>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        <span>Humidity: {cur.humidity}%</span>
                        <span className="block">Wind: {cur.windSpeed} km/h</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 rounded-xl skeleton-shimmer" />
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={handleAddLocation}
      />
    </div>
  );
}
