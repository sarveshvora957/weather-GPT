"use client";

import React, { useState, useEffect, useRef } from "react";
import { AIChatMessage, LocationData } from "@/types/weather";
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
  Flame,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  ArrowRight,
  Bot,
  User,
} from "lucide-react";
import { formatTemp } from "@/lib/utils";

interface ChatBoxProps {
  initialMessages?: AIChatMessage[];
  currentLocation: LocationData;
  onSendMessage: (text: string) => Promise<AIChatMessage>;
  isDemoMode?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  initialMessages = [],
  currentLocation,
  onSendMessage,
  isDemoMode = false,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

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
      alert("Speech recognition is not supported in this browser. Try Chrome/Edge!");
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

    // Clean markdown hashes and asterisks for smooth audio speech
    const cleanText = text
      .replace(/[*#>`]/g, "")
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userPrompt = inputText.trim();
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
          content: "Weather data is temporarily unavailable. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestionPills = [
    `🏏 Can I play cricket tomorrow at 5 PM in ${currentLocation.name}?`,
    `☔ Will it rain today in ${currentLocation.name}? Should I carry an umbrella?`,
    `🌡️ What will the temperature be tonight in ${currentLocation.name}?`,
    `✈️ Is it safe to travel this weekend?`,
    `🌍 How has the climate shifted in ${currentLocation.name} over the past 15 years?`,
    `🌾 Is tomorrow suitable for spraying crops in ${currentLocation.name}?`,
  ];

  return (
    <div className="flex flex-col h-[680px] w-full rounded-3xl glass-panel border border-white/10 shadow-2xl overflow-hidden">
      {/* Top Chat Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-navy-950/40">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-aurora-cyan p-[1px]">
            <div className="w-full h-full rounded-xl bg-navy-950 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-aurora-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">WeatherGPT Assistant</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ground Truth Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Conversational forecasting, alerts, and climate intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-aurora-cyan to-brand-400 p-[1px] shadow-neon-cyan flex items-center justify-center">
              <div className="w-full h-full rounded-3xl bg-navy-950 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-aurora-cyan" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ask WeatherGPT Anything</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ask natural questions about precipitation windows, sports match playability, road safety, travel, smart wardrobe, or climate shift.
              </p>
            </div>

            {/* Starter Suggestion Pills */}
            <div className="w-full grid grid-cols-1 gap-2 pt-2 text-left">
              {suggestionPills.slice(0, 4).map((pill, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputText(pill);
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
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-none shadow-lg"
                      : "glass-panel border border-white/15 text-slate-100 rounded-bl-none shadow-2xl"
                  }`}
                >
                  {/* Message Text Content */}
                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Embedded Weather Cards / Recommendation Badge */}
                  {!isUser && msg.recommendation && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
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

                      {/* Key Factors Chips */}
                      {msg.recommendation.keyFactors && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {msg.recommendation.keyFactors.map((kf, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-black/25 border border-white/5 text-[11px]"
                            >
                              <span className="text-slate-400 block">{kf.label}</span>
                              <strong className="text-white">{kf.value}</strong>
                            </div>
                          ))}
                        </div>
                      )}

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
                          onClick={() => {
                            setInputText(q);
                          }}
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
            <div className="p-4 rounded-3xl glass-panel border border-white/15 rounded-bl-none flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-aurora-cyan animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-aurora-teal animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Querying numerical atmospheric models & analyzing conditions...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Box Bottom */}
      <div className="p-4 border-t border-white/10 bg-navy-950/60 backdrop-blur-xl">
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
            title={isListening ? "Listening... click to stop" : "Speak to WeatherGPT (Voice STT)"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask WeatherGPT anything about ${currentLocation.name} or any city...`}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20 transition-all shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-aurora-cyan to-brand-400 text-navy-950 font-black text-sm shadow-neon-cyan hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <span>Ask</span>
            <Send className="w-4 h-4 fill-navy-950" />
          </button>
        </form>
      </div>
    </div>
  );
};
