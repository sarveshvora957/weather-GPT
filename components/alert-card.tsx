"use client";

import React from "react";
import { WeatherAlert } from "@/types/weather";
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  MapPin,
  PhoneCall,
  CheckCircle2,
  Info,
} from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

interface AlertCardProps {
  alert: WeatherAlert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const isExtreme = alert.severity === "EXTREME";
  const isHigh = alert.severity === "HIGH";
  const isModerate = alert.severity === "MODERATE";

  const getBorderColor = () => {
    if (isExtreme) return "border-rose-500/60 bg-rose-950/20";
    if (isHigh) return "border-orange-500/50 bg-orange-950/20";
    if (isModerate) return "border-amber-500/40 bg-amber-950/15";
    return "border-emerald-500/30 bg-emerald-950/10";
  };

  const getBadgeStyle = () => {
    if (isExtreme) return "bg-rose-500 text-white shadow-neon-rose";
    if (isHigh) return "bg-orange-500 text-navy-950 font-bold";
    if (isModerate) return "bg-amber-400 text-navy-950 font-bold";
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
  };

  return (
    <div className={`rounded-3xl glass-panel p-5 sm:p-6 border transition-all ${getBorderColor()} shadow-2xl`}>
      {/* Alert Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-2xl ${
              isExtreme || isHigh ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-white/10 text-slate-300"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${getBadgeStyle()}`}>
                {alert.severity} SEVERITY
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-aurora-cyan" />
                {alert.areaDesc}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {alert.event}
            </h3>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
          <Clock className="w-3.5 h-3.5 text-aurora-cyan" />
          <span>Expires: {formatTime(alert.expires)} ({formatDate(alert.expires)})</span>
        </div>
      </div>

      {/* Headline & Description */}
      <div className="my-4 space-y-2 text-xs sm:text-sm text-slate-200">
        <p className="font-semibold text-aurora-cyan leading-snug">
          {alert.headline}
        </p>
        <p className="text-slate-300 leading-relaxed text-xs">
          {alert.description}
        </p>
      </div>

      {/* Safety Instructions & Recommended Action */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>Recommended Public Safety Action:</span>
        </span>
        <p className="text-xs text-slate-200 leading-relaxed pl-5">
          {alert.instruction}
        </p>
      </div>

      {/* Authority Source & Helpline Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <span>Issued by: <strong className="text-slate-300">{alert.senderName}</strong></span>
        <div className="flex items-center gap-2">
          <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
          <span>National Emergency Helpline: <strong className="text-white font-mono">112 / 1077</strong></span>
        </div>
      </div>
    </div>
  );
};
