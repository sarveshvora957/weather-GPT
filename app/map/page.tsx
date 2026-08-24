"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { WeatherMap } from "@/components/weather-map";
import { LocationSearch } from "@/components/location-search";
import { LocationData, WeatherAlert } from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "@/lib/weather-service";
import { Map, Layers, Radio, ShieldAlert } from "lucide-react";

export default function MapPage() {
  const [currentLocation, setCurrentLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await WeatherService.getWeatherAlerts(
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.name
        );
        setAlerts(data);
      } catch (e) {
        console.error("Map alerts load error:", e);
      }
    }
    loadAlerts();
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-aurora-cyan" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Interactive Weather Radar & GIS Map
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time meteorological radar overlays, thermal gradients, wind vectors, and severe convective cells
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Radar Telemetry</span>
            </div>
          </div>

          {/* Interactive Radar Component */}
          <WeatherMap center={currentLocation} alerts={alerts} />

          {/* Regional Meteorological Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
              <span className="text-xs font-bold text-aurora-cyan uppercase tracking-wider block">
                Doppler Radar Network
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aggregated dual-polarization S-band and C-band radar sweeps updated every 10 minutes with precipitation reflectivity (dBZ).
              </p>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Thermal & Convective Heatmaps
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Global satellite infrared brightness temperature tracking surface heat anomalies and urban heat island contours.
              </p>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                Severe Storm Tracking
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Integrated early warning geofences for lightning strikes, cyclonic squalls, and sudden cloudburst intervals.
              </p>
            </div>
          </div>
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
