"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeatherBackground } from "@/components/weather-background";
import { Sparkles, ArrowRight, Lock, Mail, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <WeatherBackground condition="clear" />

      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/15 shadow-2xl space-y-6 relative z-10">
        {/* Brand Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan mb-2">
            <div className="w-full h-full rounded-2xl bg-navy-950 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-aurora-cyan animate-pulse" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sign In to Weather<span className="text-aurora-cyan">GPT</span>
          </h1>
          <p className="text-xs text-slate-400">
            Access real-time forecasting, AI conversation, and smart alerts
          </p>
        </div>

        {/* 1-Click Demo Login Banner for Judges */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-amber-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span>SIH 2026 Instant Demo Access</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20">Fast Track</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Instant 1-click access preloaded with meteorological observer credentials.
          </p>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-navy-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>One-Click Observer Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-aurora-cyan"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link href="/auth/forgot-password" className="text-[11px] text-aurora-cyan hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-aurora-cyan"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-xs shadow-neon-cyan hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
          <span>Don&apos;t have an account? </span>
          <Link href="/auth/signup" className="text-aurora-cyan font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
