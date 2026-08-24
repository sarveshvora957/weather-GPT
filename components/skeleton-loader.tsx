"use client";

import React from "react";

export const WeatherCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl glass-panel p-8 border border-white/10 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="w-40 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-24 h-4 rounded-lg skeleton-shimmer" />
        </div>
        <div className="w-28 h-8 rounded-xl skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl skeleton-shimmer" />
          <div className="space-y-2">
            <div className="w-32 h-12 rounded-xl skeleton-shimmer" />
            <div className="w-48 h-5 rounded-lg skeleton-shimmer" />
          </div>
        </div>
        <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const HourlySkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
      <div className="w-36 h-6 rounded-lg skeleton-shimmer" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-24 h-32 rounded-2xl skeleton-shimmer shrink-0" />
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
      <div className="flex justify-between">
        <div className="w-48 h-6 rounded-lg skeleton-shimmer" />
        <div className="w-64 h-8 rounded-xl skeleton-shimmer" />
      </div>
      <div className="w-full h-64 rounded-2xl skeleton-shimmer" />
    </div>
  );
};
