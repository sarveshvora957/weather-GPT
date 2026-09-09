"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-aurora-cyan border-t-transparent rounded-full animate-spin" />
        <span>Loading WeatherGPT...</span>
      </div>
    </div>
  );
}
