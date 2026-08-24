"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WeatherBackground } from "@/components/weather-background";
import { Sparkles, ArrowRight, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <WeatherBackground condition="clear" />

      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/15 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan mb-2">
            <div className="w-full h-full rounded-2xl bg-navy-950 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-aurora-cyan animate-pulse" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your account email to receive a password recovery link
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 space-y-2 text-center animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-white">Recovery Instructions Sent</p>
            <p className="text-slate-300 text-[11px]">
              If an account matches {email}, a recovery link has been dispatched.
            </p>
            <Link
              href="/auth/login"
              className="inline-block mt-2 text-xs font-bold text-aurora-cyan underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-xs shadow-neon-cyan hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <span>Send Recovery Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
          <Link href="/auth/login" className="text-aurora-cyan font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
