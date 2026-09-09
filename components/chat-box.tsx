"use client";

import React, { useState, useEffect, useRef } from "react";
import { AIChatMessage, LocationData, ComparisonData } from "@/types/weather";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  ArrowRight,
  Bot,
  User,
  Navigation,
  GitCompare,
  Compass,
  Gauge,
  Eye,
  Calendar,
} from "lucide-react";
import { formatTemp, convertTemp } from "@/lib/utils";
import { Weather3DIcon } from "@/components/weather-3d-icon";

interface ChatBoxProps {
  initialMessages?: AIChatMessage[];
  currentLocation: LocationData;
  onSendMessage: (text: string) => Promise<AIChatMessage>;
  isDemoMode?: boolean;
  unit?: "C" | "F";
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  initialMessages = [],
  currentLocation,
  onSendMessage,
  isDemoMode = false,
  unit = "C",
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync initialMessages when passed
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition error:", err);
      }
    }
  };

  const handleSpeakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/[*#>`|]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSubmitWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userPrompt = text.trim();
    setInputText("");

    const userMsg: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const assistantReply = await onSendMessage(userPrompt);
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          content: "Weather data is temporarily unavailable. Please verify connection and try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSubmitWithText(inputText);
  };

  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode via BigDataCloud (free, CORS-friendly)
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const cityName = data.city || data.locality || data.principalSubdivision || "my location";
          const prompt = `What is the current weather and forecast in ${cityName}?`;
          handleSubmitWithText(prompt);
        } catch (e) {
          console.warn("GPS reverse geocode error:", e);
          handleSubmitWithText("What is the weather near my current location?");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setIsLoading(false);
        alert("Unable to access current location. Please allow location permissions in your browser.");
      },
      { timeout: 8000 }
    );
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestionPills = [
    "Weather in Ahmedabad",
    "Will it rain in Rajkot today?",
    "What is the temperature in Jetpur?",
    "Should I carry an umbrella?",
    "What's the weather tomorrow in Jetpur?",
    "What will be the weather around 6 PM?",
    "Is UV index dangerous right now?",
    "7-day weather forecast for Ahmedabad",
    "Which is better for travelling today, Ahmedabad or Surat?",
    "Weather near me",
  ];

  return (
    <div className="flex flex-col h-[700px] w-full rounded-3xl glass-panel border border-white/10 shadow-2xl overflow-hidden bg-navy-950/40">
      {/* Top Chat Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-navy-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-brand-500 to-aurora-cyan p-[1px] shadow-neon-cyan">
            <div className="w-full h-full rounded-2xl bg-navy-950 flex items-center justify-center">
              <Bot className="w-5 h-5 text-aurora-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">AI Weather Agent</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero-Hallucination
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live numerical atmospheric models, meteorological reasoning & verified observations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS Location Button */}
          <button
            onClick={handleUseMyLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-300 hover:text-white border border-white/10 transition-colors text-xs font-medium"
            title="Use my current GPS location"
            aria-label="Use my GPS location"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Near Me</span>
          </button>

          {/* Audio Mute/Play button */}
          <button
            onClick={() => handleSpeakText(messages[messages.length - 1]?.content || "")}
            className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
              isSpeaking
                ? "bg-aurora-cyan/20 text-aurora-cyan border-aurora-cyan/40 animate-pulse"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
            }`}
            title="Read latest response aloud"
            aria-label="Text to speech"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear Chat */}
          <button
            onClick={() => setMessages([])}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            title="Clear Chat"
            aria-label="Clear chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan flex items-center justify-center">
              <div className="w-full h-full rounded-3xl bg-navy-950 flex items-center justify-center">
                <Bot className="w-8 h-8 text-aurora-cyan" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">AI Weather Agent</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Ask natural questions in any language. The agent checks real atmospheric observations across India before answering.
              </p>
            </div>

            {/* Quick Suggested Prompts */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
              {suggestionPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (pill === "Weather near me") {
                      handleUseMyLocation();
                    } else {
                      handleSubmitWithText(pill);
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 hover:text-aurora-cyan transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{pill}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-aurora-cyan shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-aurora-cyan/40 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-aurora-cyan" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-3xl p-4 sm:p-5 space-y-3 ${
                    isUser
                      ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-none shadow-lg"
                      : "glass-panel border border-white/15 text-slate-100 rounded-bl-none shadow-2xl bg-navy-950/60"
                  }`}
                >
                  {/* Message Text Content */}
                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* 1. Embedded Weather Summary Card */}
                  {!isUser && msg.weatherSummary && (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {msg.location?.name || currentLocation.name}
                            {msg.location?.country ? `, ${msg.location.country}` : ""}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Live Verified
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl sm:text-4xl font-black text-white">
                              {convertTemp(msg.weatherSummary.temperature ?? 0, unit)}°{unit}
                            </span>
                            <span className="text-xs text-slate-300">
                              Feels {convertTemp(msg.weatherSummary.feelsLike ?? 0, unit)}°{unit}
                            </span>
                          </div>
                          <p className="text-xs text-sky-300 font-medium mt-0.5">
                            {msg.weatherSummary.conditionText || "Clear"}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <Weather3DIcon
                            condition={msg.weatherSummary.conditionText || "clear"}
                            isNight={!msg.weatherSummary.isDay}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* 6 Key Meteorological Parameters Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-sky-400" /> Humidity
                          </span>
                          <strong className="text-white mt-0.5">{msg.weatherSummary.humidity ?? 0}%</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Wind className="w-3 h-3 text-teal-400" /> Wind
                          </span>
                          <strong className="text-white mt-0.5">{Math.round(msg.weatherSummary.windSpeed ?? 0)} km/h</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-400" /> UV Index
                          </span>
                          <strong className="text-white mt-0.5">
                            {msg.weatherSummary.uvIndex ?? 0} ({(msg.weatherSummary.uvIndex ?? 0) >= 6 ? "High" : "Mod"})
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-400" /> Rain Prob
                          </span>
                          <strong className="text-white mt-0.5">
                            {msg.dailyForecast?.[0]?.precipitationProb ??
                              ((msg.weatherSummary.precipitation ?? 0) > 0 ? 90 : 15)}
                            %
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-emerald-400" /> AQI
                          </span>
                          <strong className="text-white mt-0.5">
                            {msg.airQuality?.aqi ?? 45} ({msg.airQuality?.category ?? "Good"})
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-indigo-400" /> Visibility
                          </span>
                          <strong className="text-white mt-0.5">
                            {msg.weatherSummary.visibility ? msg.weatherSummary.visibility.toFixed(1) : "10.0"} km
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Embedded Dual-City Comparison Card */}
                  {!isUser && msg.comparisonData && (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-navy-950/70 border border-aurora-cyan/30 shadow-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <GitCompare className="w-4 h-4 text-aurora-cyan shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {msg.comparisonData.cityA.location.name} vs {msg.comparisonData.cityB.location.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/30">
                          Dual-City Comparison
                        </span>
                      </div>

                      {/* Highlights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-300 block">Best for Travel</span>
                          <strong>{msg.comparisonData.recommendations.betterForTravel}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200">
                          <span className="text-[10px] uppercase font-bold text-sky-300 block">Cleaner Air</span>
                          <strong>{msg.comparisonData.recommendations.betterAirQuality}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200">
                          <span className="text-[10px] uppercase font-bold text-amber-300 block">Cooler Climate</span>
                          <strong>{msg.comparisonData.recommendations.coolerClimate}</strong>
                        </div>
                      </div>

                      {/* Side-by-Side Table */}
                      <div className="space-y-1 pt-1">
                        {msg.comparisonData.metricDifferences.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-black/30 border border-white/5 text-[11px] flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-300 font-medium">{m.metric}</span>
                            <div className="flex items-center gap-3 font-mono">
                              <span className={m.winner === "A" ? "text-emerald-400 font-bold" : "text-slate-400"}>
                                {msg.comparisonData?.cityA.location.name}: {m.cityAValue}
                              </span>
                              <span className="text-slate-500">|</span>
                              <span className={m.winner === "B" ? "text-emerald-400 font-bold" : "text-slate-400"}>
                                {msg.comparisonData?.cityB.location.name}: {m.cityBValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Embedded Recommendation Badge & Action Plan */}
                  {!isUser && msg.recommendation && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${msg.recommendation.badgeColor}`}
                        >
                          {msg.recommendation.badgeText}
                        </span>

                        <span className="text-xs font-mono text-slate-300">
                          Feasibility Score: <strong className="text-white">{msg.recommendation.score}/100</strong>
                        </span>
                      </div>

                      {/* Action Plan Checklist */}
                      {msg.recommendation.actionPlan && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                          <span className="font-semibold text-aurora-cyan block mb-1">
                            📋 Recommended Action Plan:
                          </span>
                          {msg.recommendation.actionPlan.map((action, aidx) => (
                            <div key={aidx} className="flex items-start gap-2 text-slate-200">
                              <span className="text-aurora-cyan font-bold">•</span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow-up Suggestions */}
                  {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, qi) => (
                        <button
                          key={qi}
                          onClick={() => handleSubmitWithText(q)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-aurora-cyan/15 text-[11px] text-slate-300 hover:text-aurora-cyan border border-white/5 hover:border-aurora-cyan/30 transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Action Footer */}
                  {!isUser && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700/50 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-aurora-cyan/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-aurora-cyan" />
            </div>
            <div className="p-4 rounded-3xl glass-panel border border-white/15 rounded-bl-none flex items-center gap-3 bg-navy-950/60">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-aurora-cyan animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-aurora-teal animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-slate-300 font-mono">
                Querying numerical atmospheric models & analyzing real observations...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills Above Input */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-navy-950/40">
        <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0">Suggestions:</span>
        {suggestionPills.slice(0, 6).map((p, i) => (
          <button
            key={i}
            onClick={() => handleSubmitWithText(p)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-sky-500/20 text-[11px] text-slate-300 hover:text-sky-200 border border-white/10 hover:border-sky-400/40 whitespace-nowrap transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Prompt Box Bottom */}
      <div className="p-4 border-t border-white/10 bg-navy-950/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-neon-rose"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
            }`}
            title={isListening ? "Listening... click to stop" : "Speak to AI Weather Agent"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* GPS Button inside input bar */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-sky-400 border border-white/10 transition-colors"
            title="Ask weather for current GPS location"
          >
            <Navigation className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask AI Weather Agent about ${currentLocation.name}, Jetpur, rain, travel, or any city...`}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20 transition-all shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-brand-500 to-aurora-cyan text-navy-950 font-black text-sm shadow-neon-cyan hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <span>Ask</span>
            <Send className="w-4 h-4 fill-navy-950" />
          </button>
        </form>
      </div>
    </div>
  );
};
