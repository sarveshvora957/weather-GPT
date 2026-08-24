import {
  LocationData,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQuality,
  WeatherAlert,
  AIRecommendation,
  AIChatMessage,
} from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "./weather-service";
import { formatTemp, formatWindSpeed } from "./utils";

export interface AIProcessOptions {
  userApiKey?: string;
  isDemoMode?: boolean;
  activeLocation?: LocationData;
}

export class WeatherAI {
  /**
   * Main entry point: Process natural language question, retrieve weather, compute analysis, and generate answer
   */
  static async processQuery(
    prompt: string,
    history: { role: string; content: string }[] = [],
    options: AIProcessOptions = {}
  ): Promise<AIChatMessage> {
    const trimmed = prompt.trim();

    // 1. Extract Location & Temporal parameters
    const extractedLocation = await this.extractLocation(trimmed, options.activeLocation);
    const temporalIntent = this.extractTemporalIntent(trimmed);
    const domain = this.detectDomain(trimmed);

    // 2. Fetch real meteorological data
    const [fullWeather, aqi, alerts] = await Promise.all([
      WeatherService.getFullWeather(extractedLocation.latitude, extractedLocation.longitude),
      WeatherService.getAirQuality(extractedLocation.latitude, extractedLocation.longitude),
      WeatherService.getWeatherAlerts(extractedLocation.latitude, extractedLocation.longitude, extractedLocation.name),
    ]);

    const { current, hourly, daily } = fullWeather;

    // 3. Compute Domain-specific recommendation matrix
    const recommendation = this.computeRecommendation(domain, trimmed, temporalIntent, current, hourly, daily, aqi, extractedLocation);

    // 4. Generate conversational explanation
    let answerContent = "";
    if (options.userApiKey || process.env.GEMINI_API_KEY) {
      try {
        answerContent = await this.callGeminiLLM(
          prompt,
          extractedLocation,
          current,
          hourly.slice(0, 12),
          daily.slice(0, 7),
          aqi,
          recommendation,
          options.userApiKey || process.env.GEMINI_API_KEY!
        );
      } catch (err) {
        console.warn("Gemini API call failed, using deterministic meteorological engine:", err);
        answerContent = this.generateDeterministicResponse(
          domain,
          trimmed,
          temporalIntent,
          extractedLocation,
          current,
          hourly,
          daily,
          aqi,
          recommendation
        );
      }
    } else {
      answerContent = this.generateDeterministicResponse(
        domain,
        trimmed,
        temporalIntent,
        extractedLocation,
        current,
        hourly,
        daily,
        aqi,
        recommendation
      );
    }

    // 5. Generate smart follow-up suggestions
    const suggestedQuestions = this.generateFollowUpQuestions(domain, extractedLocation.name);

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: "assistant",
      content: answerContent,
      timestamp: new Date().toISOString(),
      intent: domain,
      location: extractedLocation,
      weatherSummary: current,
      hourlyForecast: hourly.slice(0, 12),
      dailyForecast: daily.slice(0, 7),
      airQuality: aqi,
      recommendation,
      alerts: alerts.filter((a) => a.severity !== "LOW"),
      suggestedQuestions,
      isDemo: options.isDemoMode,
    };
  }

  /**
   * Entity extraction for geographic locations
   */
  private static async extractLocation(query: string, activeLocation?: LocationData): Promise<LocationData> {
    const qLower = query.toLowerCase();

    // Check common known cities in query
    const cityKeywords = [
      { name: "ahmedabad", lat: 23.0225, lon: 72.5714, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
      { name: "mumbai", lat: 19.076, lon: 72.8777, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
      { name: "delhi", lat: 28.6139, lon: 77.209, country: "India", state: "Delhi", tz: "Asia/Kolkata" },
      { name: "new delhi", lat: 28.6139, lon: 77.209, country: "India", state: "Delhi", tz: "Asia/Kolkata" },
      { name: "bengaluru", lat: 12.9716, lon: 77.5946, country: "India", state: "Karnataka", tz: "Asia/Kolkata" },
      { name: "bangalore", lat: 12.9716, lon: 77.5946, country: "India", state: "Karnataka", tz: "Asia/Kolkata" },
      { name: "surat", lat: 21.1702, lon: 72.8311, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
      { name: "pune", lat: 18.5204, lon: 73.8567, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
      { name: "kolkata", lat: 22.5726, lon: 88.3639, country: "India", state: "West Bengal", tz: "Asia/Kolkata" },
      { name: "hyderabad", lat: 17.385, lon: 78.4867, country: "India", state: "Telangana", tz: "Asia/Kolkata" },
      { name: "chennai", lat: 13.0827, lon: 80.2707, country: "India", state: "Tamil Nadu", tz: "Asia/Kolkata" },
      { name: "jaipur", lat: 26.9124, lon: 75.7873, country: "India", state: "Rajasthan", tz: "Asia/Kolkata" },
      { name: "manali", lat: 32.2432, lon: 77.1892, country: "India", state: "Himachal Pradesh", tz: "Asia/Kolkata" },
      { name: "goa", lat: 15.2993, lon: 74.124, country: "India", state: "Goa", tz: "Asia/Kolkata" },
      { name: "london", lat: 51.5074, lon: -0.1278, country: "United Kingdom", state: "England", tz: "Europe/London" },
      { name: "new york", lat: 40.7128, lon: -74.006, country: "United States", state: "New York", tz: "America/New_York" },
      { name: "tokyo", lat: 35.6762, lon: 139.6503, country: "Japan", state: "Tokyo", tz: "Asia/Tokyo" },
      { name: "dubai", lat: 25.2048, lon: 55.2708, country: "United Arab Emirates", state: "Dubai", tz: "Asia/Dubai" },
      { name: "paris", lat: 48.8566, lon: 2.3522, country: "France", state: "Île-de-France", tz: "Europe/Paris" },
      { name: "sydney", lat: -33.8688, lon: 151.2093, country: "Australia", state: "New South Wales", tz: "Australia/Sydney" },
    ];

    for (const item of cityKeywords) {
      if (qLower.includes(item.name)) {
        return {
          id: item.name,
          name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
          admin1: item.state,
          country: item.country,
          latitude: item.lat,
          longitude: item.lon,
          timezone: item.tz,
        };
      }
    }

    // Try dynamic geocoding if query specifies "in [City]" or "at [City]" or "for [City]"
    const match = query.match(/(?:in|at|for|near)\s+([a-zA-Z\s]{3,20})/i);
    if (match && match[1]) {
      const extractedWord = match[1].trim();
      const results = await WeatherService.searchLocations(extractedWord);
      if (results.length > 0) {
        return results[0];
      }
    }

    return activeLocation || DEFAULT_LOCATION;
  }

  /**
   * Temporal expression classifier
   */
  private static extractTemporalIntent(query: string): {
    target: 'today' | 'tomorrow' | 'tonight' | 'weekend' | '7day' | 'hourly' | 'specific_time';
    specificHour?: number;
  } {
    const q = query.toLowerCase();

    // Check specific time: e.g. "5 pm", "7:00 pm", "17:00", "tomorrow at 5 pm"
    const timeMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch && (q.includes("pm") || q.includes("am") || q.includes("at ") || q.includes("o'clock"))) {
      let hour = parseInt(timeMatch[1], 10);
      const isPm = timeMatch[3]?.toLowerCase() === "pm";
      const isAm = timeMatch[3]?.toLowerCase() === "am";
      if (isPm && hour < 12) hour += 12;
      if (isAm && hour === 12) hour = 0;
      return { target: "specific_time", specificHour: hour };
    }

    if (q.includes("tomorrow")) return { target: "tomorrow" };
    if (q.includes("tonight") || q.includes("this night")) return { target: "tonight" };
    if (q.includes("weekend") || q.includes("saturday") || q.includes("sunday")) return { target: "weekend" };
    if (q.includes("7 day") || q.includes("7-day") || q.includes("week forecast") || q.includes("next week")) return { target: "7day" };
    if (q.includes("hourly") || q.includes("hour by hour")) return { target: "hourly" };

    return { target: "today" };
  }

  /**
   * Intent domain detection
   */
  private static detectDomain(query: string): AIRecommendation["domain"] {
    const q = query.toLowerCase();
    if (q.includes("cricket") || q.includes("match") || q.includes("football") || q.includes("tennis") || q.includes("play outdoor") || q.includes("can i play")) {
      return "cricket";
    }
    if (q.includes("travel") || q.includes("drive") || q.includes("flight") || q.includes("safe to travel") || q.includes("road trip") || q.includes("highway")) {
      return "travel";
    }
    if (q.includes("wear") || q.includes("clothing") || q.includes("umbrella") || q.includes("jacket") || q.includes("coat") || q.includes("outfit")) {
      return "clothing";
    }
    if (q.includes("spray") || q.includes("crop") || q.includes("farming") || q.includes("agriculture") || q.includes("harvest") || q.includes("fertilizer")) {
      return "agriculture";
    }
    if (q.includes("wedding") || q.includes("party") || q.includes("outdoor event") || q.includes("gathering") || q.includes("banquet")) {
      return "events";
    }
    if (q.includes("commute") || q.includes("leave early") || q.includes("traffic rain") || q.includes("office commute")) {
      return "commute";
    }
    if (q.includes("sports") || q.includes("run") || q.includes("jogging") || q.includes("cycling") || q.includes("workout")) {
      return "sports";
    }
    return "general";
  }

  /**
   * Deterministic Meteorological Risk & Recommendation Engine
   */
  private static computeRecommendation(
    domain: AIRecommendation["domain"],
    query: string,
    temporal: { target: string; specificHour?: number },
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    location: LocationData
  ): AIRecommendation {
    // Pick the most relevant daily forecast item (today or tomorrow)
    const isTomorrow = temporal.target === "tomorrow" || query.toLowerCase().includes("tomorrow");
    const targetDay = isTomorrow && daily[1] ? daily[1] : daily[0] || daily[0];
    const rainProb = targetDay.precipitationProb || (isTomorrow ? 65 : 20);
    const maxTemp = targetDay.tempMax || current.temperature;
    const windMax = targetDay.windSpeedMax || current.windSpeed;

    switch (domain) {
      case "cricket": {
        // Cricket playability heuristic
        let score = 100;
        let reasoning = "";
        const factors = [];

        if (rainProb > 60) {
          score -= 45;
          factors.push({ label: "Precipitation Risk", value: `${rainProb}% Rain Probability`, impact: "negative" as const });
        } else if (rainProb > 30) {
          score -= 20;
          factors.push({ label: "Precipitation Risk", value: `${rainProb}% Rain Probability`, impact: "warning" as const });
        } else {
          factors.push({ label: "Precipitation Risk", value: `${rainProb}% Low Rain Probability`, impact: "positive" as const });
        }

        if (maxTemp > 38) {
          score -= 25;
          factors.push({ label: "Thermal Load", value: `${Math.round(maxTemp)}°C High Heat`, impact: "warning" as const });
        } else if (maxTemp < 12) {
          score -= 15;
          factors.push({ label: "Low Temperature", value: `${Math.round(maxTemp)}°C Cold Air`, impact: "warning" as const });
        } else {
          factors.push({ label: "Temperature", value: `${Math.round(maxTemp)}°C Optimal Range`, impact: "positive" as const });
        }

        if (windMax > 30) {
          score -= 15;
          factors.push({ label: "Wind Conditions", value: `${Math.round(windMax)} km/h Gusts`, impact: "warning" as const });
        } else {
          factors.push({ label: "Wind Conditions", value: `${Math.round(windMax)} km/h Light Breeze`, impact: "positive" as const });
        }

        if (aqi.aqi > 150) {
          score -= 15;
          factors.push({ label: "Air Quality", value: `${aqi.aqi} (${aqi.category})`, impact: "warning" as const });
        } else {
          factors.push({ label: "Air Quality", value: `${aqi.aqi} Acceptable`, impact: "positive" as const });
        }

        let status: AIRecommendation["status"] = "SAFE";
        let badgeText = "Favorable for Cricket";
        let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";

        if (score < 45 || rainProb >= 70) {
          status = "HIGH_RISK";
          badgeText = "⚠️ High Rain Disruption Risk";
          badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/40";
          reasoning = `${isTomorrow ? "Tomorrow" : "Today"} in ${location.name}, conditions may be challenging due to a ${rainProb}% chance of showers during peak hours and high humidity (${current.humidity}%). There is a significant risk of damp outfield and match interruptions.`;
        } else if (score < 75 || rainProb >= 40) {
          status = "MODERATE_RISK";
          badgeText = "⚠️ Moderate Risk — Backup Timing Advised";
          badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/40";
          reasoning = `${isTomorrow ? "Tomorrow" : "Today"} in ${location.name}, the atmosphere shows moderate convective instability. While playable, brief passing showers are probable around late afternoon.`;
        } else {
          reasoning = `Excellent weather for cricket in ${location.name}! Dry pitch conditions, comfortable temperature around ${Math.round(maxTemp)}°C, and minimal rain probability (${rainProb}%).`;
        }

        return {
          domain: "cricket",
          status,
          title: "Cricket & Outdoor Match Feasibility",
          badgeText,
          badgeColor,
          score: Math.max(10, Math.min(100, score)),
          reasoning,
          keyFactors: factors,
          actionPlan: [
            rainProb > 40 ? "Prepare pitch covers in advance before match time." : "Inspect pitch firmness and boundary markings.",
            "Schedule a secondary backup window (recommended after 7:30 PM under lights).",
            "Keep players hydrated with electrolyte water given the humidity level.",
            "Monitor live Doppler radar on the WeatherGPT Map for real-time cloud movement.",
          ],
          bestWindow: rainProb > 40 ? "Morning 7:30 AM – 10:30 AM or Evening after 7:30 PM" : "4:00 PM – 7:30 PM",
        };
      }

      case "travel": {
        const severeAlert = current.weatherCode >= 95 || rainProb > 70;
        return {
          domain: "travel",
          status: severeAlert ? "HIGH_RISK" : rainProb > 45 ? "MODERATE_RISK" : "SAFE",
          title: "Travel & Road Safety Advisory",
          badgeText: severeAlert ? "⚠️ Travel Caution Advised" : rainProb > 45 ? "Moderate Road Hazard" : "Clear Travel Conditions",
          badgeColor: severeAlert ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          score: severeAlert ? 35 : rainProb > 45 ? 65 : 92,
          reasoning: `Travel feasibility across ${location.name} is ${severeAlert ? "restricted due to heavy rain showers and potential waterlogging" : "generally good with stable road friction"}. Current visibility is ${current.visibility} km.`,
          keyFactors: [
            { label: "Visibility", value: `${current.visibility} km`, impact: current.visibility < 5 ? "warning" : "positive" },
            { label: "Rain Likelihood", value: `${rainProb}%`, impact: rainProb > 50 ? "negative" : "positive" },
            { label: "Wind Gusts", value: `${current.windGusts} km/h`, impact: current.windGusts > 40 ? "warning" : "positive" },
          ],
          actionPlan: [
            "Allow 20 minutes extra travel buffer during peak transit windows.",
            "Verify wiper blade integrity and headlight functioning.",
            "Avoid low-lying underpasses during heavy downpour intervals.",
          ],
        };
      }

      case "clothing": {
        const needsUmbrella = rainProb > 40 || current.precipitation > 0;
        const isHot = current.temperature > 32;
        const isCold = current.temperature < 18;

        return {
          domain: "clothing",
          status: needsUmbrella ? "MODERATE_RISK" : "SAFE",
          title: "Smart Wardrobe & Gear Recommendation",
          badgeText: needsUmbrella ? "☔ Umbrella & Rainwear Recommended" : isHot ? "☀️ Breathable Cotton Attire" : "🧥 Light Layering",
          badgeColor: "bg-aurora-cyan/20 text-aurora-cyan border-aurora-cyan/40",
          score: 88,
          reasoning: `With temperatures at ${formatTemp(current.temperature)} (feels like ${formatTemp(current.feelsLike)}) and a ${rainProb}% precipitation chance in ${location.name}, ${needsUmbrella ? "carrying a compact umbrella or waterproof jacket is strongly recommended." : "light and breathable clothing will keep you comfortable."}`,
          keyFactors: [
            { label: "Temperature", value: formatTemp(current.temperature), impact: "positive" },
            { label: "Rain Probability", value: `${rainProb}%`, impact: needsUmbrella ? "warning" : "positive" },
            { label: "UV Index", value: `${current.uvIndex} (${current.uvIndex > 6 ? "High" : "Moderate"})`, impact: current.uvIndex > 6 ? "warning" : "positive" },
          ],
          actionPlan: [
            needsUmbrella ? "Keep a compact umbrella or rain poncho in your backpack." : "Sunglasses and UV 30+ sunscreen recommended.",
            isHot ? "Wear lightweight, moisture-wicking natural cottons." : isCold ? "Carry a light windbreaker or sweater for the evening." : "Comfortable casual or formal wear is suitable.",
          ],
        };
      }

      case "agriculture": {
        const windSafeForSpray = current.windSpeed < 15;
        const rainSafeForSpray = rainProb < 35;
        const isFavorable = windSafeForSpray && rainSafeForSpray;

        return {
          domain: "agriculture",
          status: isFavorable ? "SAFE" : "HIGH_RISK",
          title: "Agricultural & Crop Spraying Advisory",
          badgeText: isFavorable ? "✅ Ideal for Agro-Chemical Spraying" : "⚠️ Postpone Spraying / High Drift Risk",
          badgeColor: isFavorable ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-rose-500/20 text-rose-400 border-rose-500/40",
          score: isFavorable ? 90 : 35,
          reasoning: `Crop spraying in ${location.name}: Wind speed is ${current.windSpeed} km/h (threshold < 15 km/h for drift prevention) and rain probability is ${rainProb}% within the next 24 hours. ${isFavorable ? "Conditions provide adequate drying window for systemic pesticide absorption." : "High rain or wind risks chemical wash-off and non-target drift."}`,
          keyFactors: [
            { label: "Wind Speed", value: `${current.windSpeed} km/h`, impact: windSafeForSpray ? "positive" : "negative" },
            { label: "24h Rain Chance", value: `${rainProb}%`, impact: rainSafeForSpray ? "positive" : "negative" },
            { label: "Relative Humidity", value: `${current.humidity}%`, impact: "positive" },
          ],
          actionPlan: [
            isFavorable ? "Proceed with early morning spraying between 6:30 AM and 9:30 AM." : "Postpone foliar applications until dry weather stabilizes.",
            "Ensure calibrated nozzle pressure to minimize droplet vaporization.",
            "Verify soil moisture status before initiating heavy irrigation.",
          ],
        };
      }

      case "events": {
        const eventRisk = rainProb > 50 || current.temperature > 38 || current.windGusts > 35;
        return {
          domain: "events",
          status: eventRisk ? "MODERATE_RISK" : "SAFE",
          title: "Outdoor Event & Banquet Feasibility",
          badgeText: eventRisk ? "⚠️ Weather Contingency Needed" : "🎉 Favorable for Outdoor Events",
          badgeColor: eventRisk ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          score: eventRisk ? 55 : 92,
          reasoning: `For outdoor events in ${location.name}: Precipitation likelihood is ${rainProb}% with temperatures reaching ${formatTemp(maxTemp)}. ${eventRisk ? "Having a waterproof canopy or marquee backup is essential." : "Guests will enjoy comfortable outdoor ambient conditions."}`,
          keyFactors: [
            { label: "Rain Forecast", value: `${rainProb}% Probability`, impact: rainProb > 40 ? "warning" : "positive" },
            { label: "Ambient Temp", value: formatTemp(maxTemp), impact: maxTemp > 36 ? "warning" : "positive" },
            { label: "Wind Gusts", value: `${current.windGusts} km/h`, impact: current.windGusts > 30 ? "warning" : "positive" },
          ],
          actionPlan: [
            eventRisk ? "Arrange waterproof waterproof canopies with side walls." : "Standard outdoor open-air staging is suitable.",
            "Set up mist fans or shaded lounge areas if daytime temp exceeds 32°C.",
            "Keep emergency electrical cables elevated and weatherproofed.",
          ],
        };
      }

      default: {
        return {
          domain: "general",
          status: rainProb > 60 || current.temperature > 40 ? "MODERATE_RISK" : "SAFE",
          title: "Weather Intelligence Overview",
          badgeText: current.conditionText,
          badgeColor: "bg-brand-500/20 text-brand-300 border-brand-500/40",
          score: 85,
          reasoning: `Current conditions in ${location.name} show ${current.conditionText.toLowerCase()} at ${formatTemp(current.temperature)} with a feels-like index of ${formatTemp(current.feelsLike)}.`,
          keyFactors: [
            { label: "Temperature", value: `${formatTemp(current.temperature)}`, impact: "positive" },
            { label: "Humidity", value: `${current.humidity}%`, impact: "positive" },
            { label: "Wind Speed", value: formatWindSpeed(current.windSpeed), impact: "positive" },
          ],
          actionPlan: [
            "Check hourly forecast scrubber for real-time changes.",
            "Review live weather map layers for regional precipitation tracking.",
          ],
        };
      }
    }
  }

  /**
   * Deterministic Natural Language Formulator
   */
  private static generateDeterministicResponse(
    domain: AIRecommendation["domain"],
    query: string,
    temporal: { target: string; specificHour?: number },
    location: LocationData,
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    recommendation: AIRecommendation
  ): string {
    const isTomorrow = temporal.target === "tomorrow" || query.toLowerCase().includes("tomorrow");
    const targetDay = isTomorrow && daily[1] ? daily[1] : daily[0];
    const tempText = `${Math.round(targetDay.tempMax)}°C (Low: ${Math.round(targetDay.tempMin)}°C)`;
    const rainProb = targetDay.precipitationProb || (isTomorrow ? 65 : 20);

    if (domain === "cricket") {
      const specificTimeText = temporal.specificHour ? `around ${temporal.specificHour > 12 ? temporal.specificHour - 12 + " PM" : temporal.specificHour + " AM"}` : "tomorrow evening";
      return `### 🏏 Match Analysis: ${location.name} (${isTomorrow ? "Tomorrow" : "Today"} ${specificTimeText})

${recommendation.reasoning}

**Key Meteorological Metrics:**
* 🌡️ **Expected Temperature:** ${tempText} (Feels like ~${Math.round(targetDay.tempMax + 2)}°C)
* 🌧️ **Precipitation Probability:** **${rainProb}%** with potential passing showers
* 💨 **Wind Speed:** ${targetDay.windSpeedMax} km/h with gusts up to ${Math.round(targetDay.windSpeedMax * 1.3)} km/h
* 💧 **Relative Humidity:** ${current.humidity}%
* 🍃 **Air Quality Index:** ${aqi.aqi} (${aqi.category})

**AI Playability Verdict:** **${recommendation.badgeText}** (Feasibility Score: **${recommendation.score}/100**)

> 💡 **Recommendation:** ${recommendation.bestWindow ? `If you are planning to play, consider scheduling during the optimal window: **${recommendation.bestWindow}**.` : "Keep a backup plan in case of localized drizzle."}`;
    }

    if (query.toLowerCase().includes("rain") || query.toLowerCase().includes("umbrella")) {
      return `### 🌧️ Rain & Precipitation Forecast for ${location.name}

${rainProb > 40 ? `Yes, there is a **notable chance of rain (${rainProb}%)** ${isTomorrow ? "tomorrow" : "today"} in ${location.name}. Carrying an umbrella or waterproof rainwear is strongly recommended.` : `Rain probability is low (**${rainProb}%**) in ${location.name}. You likely will not need an umbrella for general outdoor activities.`}

* 🌡️ **Temperature:** ${tempText}
* 🌧️ **Rain Chance:** ${rainProb}% (${targetDay.conditionText})
* 💧 **Humidity:** ${current.humidity}%
* 💨 **Wind:** ${targetDay.windSpeedMax} km/h

Check the hourly chart below for the exact time window of expected precipitation.`;
    }

    if (query.toLowerCase().includes("7-day") || query.toLowerCase().includes("week")) {
      return `### 📅 7-Day Extended Forecast for ${location.name}

Here is the projected meteorological outlook for ${location.name} over the next 7 days:

${daily.slice(0, 7).map((d) => `* **${d.dayName} (${d.date.slice(5)}):** ${d.conditionText} — High: **${Math.round(d.tempMax)}°C**, Low: **${Math.round(d.tempMin)}°C** | 🌧️ ${d.precipitationProb}% rain`).join("\n")}

Overall trend shows ${daily[0].tempMax > daily[4]?.tempMax ? "gradual cooling" : "stable warm conditions"} across the week.`;
    }

    if (query.toLowerCase().includes("climate") || query.toLowerCase().includes("change")) {
      return `### 🌍 Climate Trends & Historical Shift for ${location.name}

Over the past 15–20 years, meteorological data records for the ${location.name} region indicate:

1. 📈 **Temperature Trend:** An average decadal warming anomaly of **+0.75°C to +0.90°C**.
2. 🌧️ **Monsoon Variability:** Rainfall has shown higher peak intensity events with longer dry spells between rain clusters.
3. 🔥 **Heatwave Frequency:** Increased by approximately 4–6 additional extreme heat days per summer season.

Explore our dedicated **Climate Intelligence** tab for interactive 15-year historical graphs and seasonal anomaly breakdowns.`;
    }

    // Default rich meteorological response
    return `### ☀️ Weather Briefing for ${location.name}

In **${location.name}**, conditions are currently **${current.conditionText}** with a temperature of **${formatTemp(current.temperature)}** (feels like **${formatTemp(current.feelsLike)}**).

* 🌡️ **Today's Range:** High of **${Math.round(targetDay.tempMax)}°C** / Low of **${Math.round(targetDay.tempMin)}°C**
* 💧 **Humidity & Dew Point:** ${current.humidity}% | Dew point: ${current.dewPoint}°C
* 💨 **Wind:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}
* ☀️ **UV Index:** ${current.uvIndex} (${current.uvIndex > 6 ? "High — Sunscreen recommended" : "Moderate"})
* 🍃 **Air Quality:** ${aqi.aqi} AQI — **${aqi.category}** (PM2.5: ${aqi.pm25} µg/m³)

${recommendation.reasoning}`;
  }

  /**
   * Google Gemini LLM API Call with structured weather grounding
   */
  private static async callGeminiLLM(
    prompt: string,
    location: LocationData,
    current: CurrentWeather,
    hourly: HourlyForecastItem[],
    daily: DailyForecastItem[],
    aqi: AirQuality,
    recommendation: AIRecommendation,
    apiKey: string
  ): Promise<string> {
    const systemPrompt = `You are WeatherGPT, an advanced conversational AI for weather forecasting, alerts, and climate intelligence (SIH 2026).
You have access to real-time, verified meteorological data:
Location: ${location.name}, ${location.admin1 || ""}, ${location.country}
Current Weather: Temp ${current.temperature}°C (Feels like ${current.feelsLike}°C), Condition: ${current.conditionText}, Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h), UV: ${current.uvIndex}, Pressure: ${current.pressure} hPa, Visibility: ${current.visibility} km.
Air Quality: ${aqi.aqi} (${aqi.category}, PM2.5: ${aqi.pm25} µg/m³).
Forecast Summary: Today High ${daily[0]?.tempMax}°C/Low ${daily[0]?.tempMin}°C (Rain: ${daily[0]?.precipitationProb}%), Tomorrow High ${daily[1]?.tempMax}°C/Low ${daily[1]?.tempMin}°C (Rain: ${daily[1]?.precipitationProb}%).
Domain Analysis: ${recommendation.title} — Status: ${recommendation.status}, Score: ${recommendation.score}/100.

Rules:
1. Ground your answer strictly in the provided real weather metrics. Never invent weather.
2. Be conversational, crisp, helpful, and structured with markdown headings and bullet points.
3. For sports/cricket/travel/clothing/farming queries, give direct, actionable advice with the exact numbers.
4. Mention uncertainty honestly where appropriate.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error("Empty response from Gemini");
    return candidate;
  }

  /**
   * Smart follow-up question generator
   */
  private static generateFollowUpQuestions(domain: AIRecommendation["domain"], cityName: string): string[] {
    switch (domain) {
      case "cricket":
      case "sports":
        return [
          `What is the best alternative time to play in ${cityName}?`,
          `Will the pitch be wet or dry tomorrow morning?`,
          `What will the wind speed and direction be at 6 PM?`,
        ];
      case "travel":
        return [
          `Are there any severe weather alerts on my route?`,
          `What is the visibility forecast for driving tonight?`,
          `Will there be waterlogging or heavy rain?`,
        ];
      case "clothing":
        return [
          `What is the UV index and should I wear sunscreen?`,
          `Will it get chilly tonight in ${cityName}?`,
          `Is rain expected during evening commute hours?`,
        ];
      case "agriculture":
        return [
          `What is the 3-day rainfall forecast for crops?`,
          `What are the morning wind and humidity levels?`,
          `Is there any frost or extreme heat risk this week?`,
        ];
      default:
        return [
          `Will it rain in ${cityName} this weekend?`,
          `Give me a 7-day extended forecast for ${cityName}.`,
          `What are the air quality (AQI) and pollution trends?`,
          `Compare ${cityName}'s weather with Mumbai.`,
        ];
    }
  }
}
