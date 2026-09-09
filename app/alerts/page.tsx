"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { AlertCard } from "@/components/alert-card";
import { SmartAlertModal } from "@/components/smart-alert-modal";
import { LocationSearch } from "@/components/location-search";
import { LocationData, WeatherAlert, UserCustomAlert } from "@/types/weather";
import { WeatherService } from "@/lib/weather-service";
import { useWeatherSettings } from "@/components/weather-context";
import { AlertTriangle, Bell, Plus, ShieldCheck, Zap } from "lucide-react";

export default function AlertsPage() {
  const { currentLocation, setCurrentLocation } = useWeatherSettings();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [customAlerts, setCustomAlerts] = useState<UserCustomAlert[]>([]);
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [liveAlerts, custom] = await Promise.all([
        WeatherService.getWeatherAlerts(
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.name
        ),
        fetch("/api/custom-alerts").then((r) => (r.ok ? r.json() : [])),
      ]);
      setAlerts(liveAlerts);
      setCustomAlerts(custom);
    } catch (e) {
      console.error("Alerts error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentLocation]);

  const handleSaveAlert = async (newAlert: UserCustomAlert) => {
    try {
      const res = await fetch("/api/custom-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAlert),
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomAlerts(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/custom-alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const updated = await res.json();
        setCustomAlerts(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/custom-alerts?id=${id}`, { method: "PATCH" });
      if (res.ok) {
        const updated = await res.json();
        setCustomAlerts(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="thunderstorm" />
      <Navbar
        currentLocation={currentLocation}
        onLocationChange={setCurrentLocation}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Severe Weather Bulletins & Smart Alerts
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official meteorological emergency warnings and personalized threshold triggers
              </p>
            </div>

            <button
              onClick={() => setSmartModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110 transition-all"
            >
              <Bell className="w-4 h-4 fill-navy-950" />
              <span>Configure Smart Triggers</span>
            </button>
          </div>

          {/* Active Severe Warnings */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Active Meteorological Bulletins for {currentLocation.name}</span>
            </h2>

            {loading ? (
              <div className="h-40 rounded-3xl glass-panel flex items-center justify-center border border-white/10">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-mono">Querying disaster management feeds...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((al) => (
                  <AlertCard key={al.id} alert={al} />
                ))}
              </div>
            )}
          </div>

          {/* User Smart Alerts List */}
          <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-aurora-cyan" />
                <span>Your Configured Smart Triggers</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {customAlerts.length} active triggers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customAlerts.map((ca) => (
                <div
                  key={ca.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{ca.name}</span>
                    <span className="text-[11px] text-slate-400">
                      If {ca.conditionType.replace("_", " ")} &gt; {ca.threshold}
                      {ca.unit} in {ca.location}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>Channels:</span>
                      {ca.notifyChannels.map((c) => (
                        <span key={c} className="px-1.5 py-0.2 rounded bg-black/40 text-slate-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAlert(ca.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-colors ${
                      ca.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    {ca.enabled ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <SmartAlertModal
        isOpen={smartModalOpen}
        onClose={() => setSmartModalOpen(false)}
        alerts={customAlerts}
        onSaveAlert={handleSaveAlert}
        onDeleteAlert={handleDeleteAlert}
        onToggleAlert={handleToggleAlert}
        currentCityName={currentLocation.name}
      />

      <LocationSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />
    </div>
  );
}
