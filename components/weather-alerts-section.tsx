"use client";

import React from "react";
import { WeatherAlert, LocationData } from "@/types/weather";
import { AlertCard } from "@/components/alert-card";
import { ShieldCheck, AlertTriangle, BellRing, Info } from "lucide-react";

interface WeatherAlertsSectionProps {
  alerts: WeatherAlert[];
  location: LocationData;
}

export const WeatherAlertsSection: React.FC<WeatherAlertsSectionProps> = ({
  alerts = [],
  location,
}) => {
  // Filter for active severe / moderate alerts (excluding LOW severity fallback)
  const activeAlerts = alerts.filter(
    (a) => a.severity === "EXTREME" || a.severity === "HIGH" || a.severity === "MODERATE"
  );

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-4 h-4 text-aurora-cyan" />
            <span>Real-time Meteorological Alerts</span>
          </h2>
          <p className="text-xs text-slate-400">
            Official severe weather warnings, advisories, and disaster management guidance
          </p>
        </div>

        {activeAlerts.length > 0 ? (
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono animate-pulse">
            {activeAlerts.length} Active {activeAlerts.length === 1 ? "Alert" : "Alerts"}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>All Clear</span>
          </span>
        )}
      </div>

      {/* Render Alert Cards if active */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        /* Reassuring Calm Weather State */
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300">
                ✓ No active weather alerts for {location.name}.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Current atmospheric parameters in {location.name}, {location.country} are within standard seasonal thresholds. No cyclone, severe downpour, or extreme heat threats detected.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-emerald-400/80 bg-black/20 px-2.5 py-1 rounded-lg border border-emerald-500/10 shrink-0">
            Updated just now
          </span>
        </div>
      )}
    </div>
  );
};
