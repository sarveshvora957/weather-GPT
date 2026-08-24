"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { WeatherBackground } from "@/components/weather-background";
import { SIHDemoBanner } from "@/components/sih-demo-banner";
import { AdminDashboard } from "@/components/admin-dashboard";
import { ShieldAlert } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <WeatherBackground condition="clear" />
      <SIHDemoBanner />
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-400" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  System Admin Telemetry & Analytics
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live monitoring of AI query volumes, numerical model latency, error rates, and user trends
              </p>
            </div>
          </div>

          <AdminDashboard />
        </main>
      </div>
    </div>
  );
}
