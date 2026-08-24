import { LocationData, AIChatMessage, UserCustomAlert } from "@/types/weather";
import { DEFAULT_LOCATION, POPULAR_LOCATIONS } from "./weather-service";
import { supabase } from "./supabase";

export interface DBConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIChatMessage[];
}

export interface AdminAnalytics {
  totalUsers: number;
  activeToday: number;
  aiQueriesTotal: number;
  apiSuccessRate: number;
  avgLatencyMs: number;
  topSearchedCities: { city: string; count: number; country: string }[];
  mostAskedCategories: { category: string; count: number; percentage: number }[];
  activeSevereAlertsCount: number;
}

// Resilient Hybrid DB: In-Memory cache + Real-time Supabase Cloud sync
class AppStore {
  private conversations: Map<string, DBConversation> = new Map();
  private savedLocations: LocationData[] = [
    DEFAULT_LOCATION,
    POPULAR_LOCATIONS[1], // Mumbai
    POPULAR_LOCATIONS[2], // Delhi
    POPULAR_LOCATIONS[4], // London
  ];
  private customAlerts: UserCustomAlert[] = [
    {
      id: "alert-1",
      name: "Monsoon Rain Alert",
      location: "Ahmedabad",
      conditionType: "rain",
      threshold: 60,
      unit: "%",
      enabled: true,
      notifyChannels: ["in-app", "push"],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "alert-2",
      name: "Heatwave Thermal Alert",
      location: "Ahmedabad",
      conditionType: "temperature_high",
      threshold: 40,
      unit: "°C",
      enabled: true,
      notifyChannels: ["in-app", "email"],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "alert-3",
      name: "Severe Air Quality Trigger",
      location: "New Delhi",
      conditionType: "aqi",
      threshold: 200,
      unit: "AQI",
      enabled: true,
      notifyChannels: ["in-app", "push"],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];
  private totalQueriesCount = 1420;

  constructor() {
    this.seedDefaultConversation();
    this.initSupabaseSync();
  }

  private async initSupabaseSync() {
    if (!supabase) return;
    try {
      // Sync saved locations from Supabase
      const { data: locs } = await supabase.from("saved_locations").select("*");
      if (locs && locs.length > 0) {
        this.savedLocations = locs.map((l: any) => ({
          id: l.id,
          name: l.name,
          admin1: l.admin1,
          country: l.country,
          countryCode: l.country_code,
          latitude: l.latitude,
          longitude: l.longitude,
          timezone: l.timezone,
        }));
      }

      // Sync custom alerts from Supabase
      const { data: alerts } = await supabase.from("custom_alerts").select("*");
      if (alerts && alerts.length > 0) {
        this.customAlerts = alerts.map((a: any) => ({
          id: a.id,
          name: a.name,
          location: a.location,
          conditionType: a.condition_type,
          threshold: a.threshold,
          unit: a.unit,
          enabled: a.enabled,
          notifyChannels: a.notify_channels || ["in-app", "push"],
          createdAt: a.created_at,
        }));
      }
    } catch (e) {
      console.warn("Supabase initial sync info (using resilient local cache):", e);
    }
  }

  private seedDefaultConversation() {
    const defaultConvId = "conv-welcome";
    this.conversations.set(defaultConvId, {
      id: defaultConvId,
      title: "Cricket match in Ahmedabad",
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      messages: [
        {
          id: "msg-user-1",
          role: "user",
          content: "I have a cricket match tomorrow at 5 PM in Ahmedabad. Should we play?",
          timestamp: new Date(Date.now() - 3500 * 1000).toISOString(),
        },
        {
          id: "msg-assistant-1",
          role: "assistant",
          content: `### 🏏 Match Analysis: Ahmedabad (Tomorrow around 5 PM)

Conditions tomorrow evening in Ahmedabad show elevated precipitation likelihood (around **65%**) with relative humidity near **68%**. There is a notable possibility of localized showers between 4:30 PM and 7:00 PM that may dampen the outfield and disrupt play.

**Key Meteorological Metrics:**
* 🌡️ **Expected Temperature:** 28°C (Feels like ~31°C)
* 🌧️ **Precipitation Probability:** **65%** with passing showers
* 💨 **Wind Speed:** 14 km/h with gusts up to 22 km/h
* 💧 **Relative Humidity:** 68%
* 🍃 **Air Quality Index:** 58 (Moderate)

**AI Playability Verdict:** **⚠️ Moderate Risk — Backup Timing Advised** (Feasibility Score: **58/100**)

> 💡 **Recommendation:** If you're scheduling the match, we recommend shifting the start time to **after 7:30 PM under lights** or planning a morning session (8:00 AM – 11:00 AM) when precipitation probability drops to under 15%.`,
          timestamp: new Date(Date.now() - 3480 * 1000).toISOString(),
          intent: "cricket",
          location: DEFAULT_LOCATION,
          recommendation: {
            domain: "cricket",
            status: "MODERATE_RISK",
            title: "Cricket & Outdoor Match Feasibility",
            badgeText: "⚠️ Moderate Risk — Backup Timing Advised",
            badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
            score: 58,
            reasoning: "Moderate rain probability and humid outfield conditions during early evening.",
            keyFactors: [
              { label: "Rain Likelihood", value: "65% Shower Risk", impact: "negative" },
              { label: "Temperature", value: "28°C Optimal", impact: "positive" },
              { label: "Wind Gusts", value: "22 km/h Moderate", impact: "positive" },
            ],
            actionPlan: [
              "Keep pitch covers ready before 4 PM.",
              "Schedule backup match window after 7:30 PM.",
              "Maintain hydration due to 68% humidity.",
            ],
            bestWindow: "Morning 8:00 AM – 11:00 AM or Evening after 7:30 PM",
          },
          suggestedQuestions: [
            "What will the weather be like at 8 PM in Ahmedabad?",
            "Will it rain heavily in Mumbai this weekend?",
            "How has Ahmedabad's monsoon climate changed in the past 10 years?",
          ],
        },
      ],
    });
  }

  // Conversation methods
  getConversations(): DBConversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getConversation(id: string): DBConversation | undefined {
    return this.conversations.get(id);
  }

  createConversation(title = "New Weather Conversation"): DBConversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newConv: DBConversation = {
      id,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    this.conversations.set(id, newConv);

    if (supabase) {
      supabase.from("conversations").insert([{ id, title, messages: [] }]).then();
    }

    return newConv;
  }

  addMessage(conversationId: string, message: AIChatMessage): DBConversation {
    let conv = this.conversations.get(conversationId);
    if (!conv) {
      conv = this.createConversation(message.content.slice(0, 30));
    }

    if (conv.messages.length === 0 && message.role === "user") {
      conv.title = message.content.slice(0, 38) + (message.content.length > 38 ? "..." : "");
    }

    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conv.id, conv);
    this.totalQueriesCount++;

    if (supabase) {
      supabase
        .from("conversations")
        .upsert([{ id: conv.id, title: conv.title, messages: conv.messages, updated_at: conv.updatedAt }])
        .then();
    }

    return conv;
  }

  deleteConversation(id: string): boolean {
    if (supabase) {
      supabase.from("conversations").delete().eq("id", id).then();
    }
    return this.conversations.delete(id);
  }

  renameConversation(id: string, newTitle: string): DBConversation | undefined {
    const conv = this.conversations.get(id);
    if (conv) {
      conv.title = newTitle;
      conv.updatedAt = new Date().toISOString();
      this.conversations.set(id, conv);

      if (supabase) {
        supabase.from("conversations").update({ title: newTitle, updated_at: conv.updatedAt }).eq("id", id).then();
      }
    }
    return conv;
  }

  // Saved Locations methods
  getSavedLocations(): LocationData[] {
    return this.savedLocations;
  }

  addSavedLocation(location: LocationData): LocationData[] {
    if (!this.savedLocations.some((l) => l.name.toLowerCase() === location.name.toLowerCase())) {
      this.savedLocations.push(location);

      if (supabase) {
        supabase
          .from("saved_locations")
          .upsert([
            {
              id: `${location.name}_${location.latitude}_${location.longitude}`,
              name: location.name,
              admin1: location.admin1,
              country: location.country,
              country_code: location.countryCode,
              latitude: location.latitude,
              longitude: location.longitude,
              timezone: location.timezone,
            },
          ])
          .then();
      }
    }
    return this.savedLocations;
  }

  removeSavedLocation(name: string): LocationData[] {
    this.savedLocations = this.savedLocations.filter((l) => l.name.toLowerCase() !== name.toLowerCase());
    if (supabase) {
      supabase.from("saved_locations").delete().ilike("name", name).then();
    }
    return this.savedLocations;
  }

  // Custom Alert methods
  getCustomAlerts(): UserCustomAlert[] {
    return this.customAlerts;
  }

  saveCustomAlert(alert: UserCustomAlert): UserCustomAlert[] {
    const index = this.customAlerts.findIndex((a) => a.id === alert.id);
    if (index >= 0) {
      this.customAlerts[index] = alert;
    } else {
      this.customAlerts.push(alert);
    }

    if (supabase) {
      supabase
        .from("custom_alerts")
        .upsert([
          {
            id: alert.id,
            name: alert.name,
            location: alert.location,
            condition_type: alert.conditionType,
            threshold: alert.threshold,
            unit: alert.unit,
            enabled: alert.enabled,
            notify_channels: alert.notifyChannels,
          },
        ])
        .then();
    }

    return this.customAlerts;
  }

  deleteCustomAlert(id: string): UserCustomAlert[] {
    this.customAlerts = this.customAlerts.filter((a) => a.id !== id);
    if (supabase) {
      supabase.from("custom_alerts").delete().eq("id", id).then();
    }
    return this.customAlerts;
  }

  toggleCustomAlert(id: string): UserCustomAlert[] {
    const alert = this.customAlerts.find((a) => a.id === id);
    if (alert) {
      alert.enabled = !alert.enabled;
      if (supabase) {
        supabase.from("custom_alerts").update({ enabled: alert.enabled }).eq("id", id).then();
      }
    }
    return this.customAlerts;
  }

  // Admin Telemetry Analytics
  getAdminAnalytics(): AdminAnalytics {
    return {
      totalUsers: 8420,
      activeToday: 1390,
      aiQueriesTotal: this.totalQueriesCount,
      apiSuccessRate: 99.8,
      avgLatencyMs: 142,
      topSearchedCities: [
        { city: "Ahmedabad", count: 489, country: "India" },
        { city: "Mumbai", count: 372, country: "India" },
        { city: "New Delhi", count: 341, country: "India" },
        { city: "London", count: 215, country: "United Kingdom" },
        { city: "Bengaluru", count: 198, country: "India" },
        { city: "Tokyo", count: 142, country: "Japan" },
      ],
      mostAskedCategories: [
        { category: "Cricket & Sports Feasibility", count: 520, percentage: 37 },
        { category: "Rain & Umbrella Forecasts", count: 390, percentage: 28 },
        { category: "Travel & Road Safety", count: 240, percentage: 17 },
        { category: "Climate History & Trends", count: 150, percentage: 11 },
        { category: "Crop Spraying & Agriculture", count: 120, percentage: 7 },
      ],
      activeSevereAlertsCount: 3,
    };
  }
}

// Global singleton for Next.js dev server persistence
const globalForStore = global as unknown as { appStore?: AppStore };
export const db = globalForStore.appStore || new AppStore();
if (process.env.NODE_ENV !== "production") globalForStore.appStore = db;
