"use client";

import React, { useState } from "react";
import { UserCustomAlert } from "@/types/weather";
import { Bell, Plus, Trash2, Check, X, ShieldAlert, Sparkles } from "lucide-react";

interface SmartAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: UserCustomAlert[];
  onSaveAlert: (alert: UserCustomAlert) => void;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  currentCityName: string;
}

export const SmartAlertModal: React.FC<SmartAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onSaveAlert,
  onDeleteAlert,
  onToggleAlert,
  currentCityName,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [conditionType, setConditionType] = useState<UserCustomAlert["conditionType"]>("rain");
  const [threshold, setThreshold] = useState(60);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const unit =
      conditionType === "rain"
        ? "%"
        : conditionType.includes("temperature")
        ? "°C"
        : conditionType === "wind"
        ? "km/h"
        : "AQI";

    const newAlert: UserCustomAlert = {
      id: `alert-${Date.now()}`,
      name: name.trim(),
      location: currentCityName,
      conditionType,
      threshold,
      unit,
      enabled: true,
      notifyChannels: ["in-app", "push"],
      createdAt: new Date().toISOString(),
    };

    onSaveAlert(newAlert);
    setName("");
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl glass-panel border border-white/15 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-aurora-cyan">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Personalized Smart Alerts</h2>
              <p className="text-xs text-slate-400">Configure automated custom meteorological triggers</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Alerts List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No personalized alerts configured yet. Add your first trigger below!
            </div>
          ) : (
            alerts.map((al) => (
              <div
                key={al.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">{al.name}</span>
                  <span className="text-slate-400 text-[11px]">
                    Trigger if {al.conditionType.replace("_", " ")} &gt; {al.threshold}
                    {al.unit} ({al.location})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAlert(al.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-colors ${
                      al.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    {al.enabled ? "ACTIVE" : "PAUSED"}
                  </button>

                  <button
                    onClick={() => onDeleteAlert(al.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create New Trigger Accordion */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-xs font-bold text-aurora-cyan transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Custom Alert Trigger</span>
          </button>
        ) : (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-aurora-cyan">New Alert Configuration</h3>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Heavy Rain Alert before Commute"
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-aurora-cyan"
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Parameter</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as any)}
                  aria-label="Alert Parameter"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-navy-950 border border-white/15 text-white"
                >
                  <option value="rain">Rain Probability (%)</option>
                  <option value="temperature_high">Max Heat (°C)</option>
                  <option value="temperature_low">Min Cold (°C)</option>
                  <option value="wind">Wind Speed (km/h)</option>
                  <option value="aqi">Hazardous AQI</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Threshold Value</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  required
                  aria-label="Threshold Value"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-aurora-cyan text-navy-950 font-bold text-xs shadow-neon-cyan hover:brightness-110"
              >
                Save Trigger
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
