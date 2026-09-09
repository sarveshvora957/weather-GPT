import {
  LocationData,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQuality,
  WeatherAlert,
  AIRecommendation,
  AIChatMessage,
  ComparisonData,
} from "@/types/weather";
import { WeatherService, DEFAULT_LOCATION } from "./weather-service";
import { formatTemp, formatWindSpeed } from "./utils";

export interface AIProcessOptions {
  userApiKey?: string;
  isDemoMode?: boolean;
  activeLocation?: LocationData;
  unit?: "C" | "F";
}

export class WeatherAI {
  /**
   * Main entry point: Process natural language question, retrieve weather, compute analysis, and generate answer
   */
  static async processQuery(
    prompt: string,
    history: { role: string; content?: string; location?: LocationData }[] = [],
    options: AIProcessOptions = {}
  ): Promise<AIChatMessage> {
    const trimmed = prompt.trim();
    let unit: "C" | "F" = options.unit === "F" ? "F" : "C";

    // Auto-detect unit conversion request in user query
    if (/\b(?:in fahrenheit|to fahrenheit|convert to fahrenheit|fahrenheit|in f|to f)\b/i.test(trimmed)) {
      unit = "F";
    } else if (/\b(?:in celsius|to celsius|convert to celsius|celsius|in c|to c)\b/i.test(trimmed)) {
      unit = "C";
    }

    // 0. Check for dual-city comparative query (e.g., "Ahmedabad vs Surat", "Compare it with Ahmedabad", "Which is better for travelling today, Ahmedabad or Surat?")
    const twoLocations = await this.extractTwoLocations(trimmed, history, options.activeLocation);
    if (twoLocations) {
      const [cityA, cityB] = twoLocations;
      const comparison = await WeatherService.compareCities(cityA, cityB);
      const comparativeContent = this.generateComparativeResponse(
        trimmed,
        cityA,
        cityB,
        comparison,
        unit
      );

      return {
        id: `msg-comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: "assistant",
        content: comparativeContent,
        timestamp: new Date().toISOString(),
        intent: "travel",
        location: cityA,
        comparisonData: comparison,
        suggestedQuestions: [
          `Detailed 7-day forecast for ${cityA.name}`,
          `Detailed 7-day forecast for ${cityB.name}`,
          `Will it rain today in ${cityA.name}?`,
          `Should I carry an umbrella in ${cityB.name}?`,
        ],
        isDemo: options.isDemoMode,
      };
    }

    // 1. Extract Location & Temporal parameters with conversational memory
    const extractedLocation = await this.extractLocation(trimmed, history, options.activeLocation);
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
    const recommendation = this.computeRecommendation(domain, trimmed, temporalIntent, current, hourly, daily, aqi, extractedLocation, unit);

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
          options.userApiKey || process.env.GEMINI_API_KEY!,
          unit
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
          recommendation,
          unit
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
        recommendation,
        unit
      );
    }

    // 5. Generate smart follow-up suggestions
    const suggestedQuestions = this.generateFollowUpQuestions(domain, extractedLocation.name);

    // Only attach recommendation (Feasibility Score & Action Plan) if user specifically asked about activities / playability / sports / outdoor plans
    const qLower = trimmed.toLowerCase();
    const isActivityQuery =
      domain === "cricket" ||
      domain === "sports" ||
      domain === "events" ||
      qLower.includes("outside") ||
      qLower.includes("outdoor") ||
      qLower.includes("go out") ||
      qLower.includes("can we play") ||
      qLower.includes("activities");

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
      recommendation: isActivityQuery ? recommendation : undefined,
      alerts: alerts.filter((a) => a.severity !== "LOW"),
      suggestedQuestions,
      isDemo: options.isDemoMode,
    };
  }

  /**
   * Entity extraction for geographic locations
   */
  /**
   * Comprehensive dictionary of major Indian & global cities, states, and tourist hubs (sorted length descending)
   */
  private static readonly cityKeywords: { name: string; lat: number; lon: number; country: string; state: string; tz?: string; displayName?: string }[] = [
    // Multi-word Indian Cities & Hubs
    { name: "new delhi", lat: 28.6139, lon: 77.209, country: "India", state: "Delhi", tz: "Asia/Kolkata", displayName: "New Delhi" },
    { name: "navi mumbai", lat: 19.033, lon: 73.0297, country: "India", state: "Maharashtra", tz: "Asia/Kolkata", displayName: "Navi Mumbai" },
    { name: "greater noida", lat: 28.4744, lon: 77.504, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata", displayName: "Greater Noida" },
    // Major Indian Cities & Tier-2/3 Metros
    { name: "ahmedabad", lat: 23.0225, lon: 72.5714, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "mumbai", lat: 19.076, lon: 72.8777, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
    { name: "delhi", lat: 28.6139, lon: 77.209, country: "India", state: "Delhi", tz: "Asia/Kolkata" },
    { name: "bengaluru", lat: 12.9716, lon: 77.5946, country: "India", state: "Karnataka", tz: "Asia/Kolkata" },
    { name: "bangalore", lat: 12.9716, lon: 77.5946, country: "India", state: "Karnataka", tz: "Asia/Kolkata", displayName: "Bengaluru" },
    { name: "surat", lat: 21.1702, lon: 72.8311, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "vadodara", lat: 22.3072, lon: 73.1812, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "baroda", lat: 22.3072, lon: 73.1812, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Vadodara" },
    { name: "rajkot", lat: 22.3039, lon: 70.8022, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "jetpur", lat: 21.7554, lon: 70.6276, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Jetpur" },
    { name: "morbi", lat: 22.812, lon: 70.8384, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Morbi" },
    { name: "gondal", lat: 21.9619, lon: 70.7997, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Gondal" },
    { name: "porbandar", lat: 21.6417, lon: 69.6293, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Porbandar" },
    { name: "somnath", lat: 20.9014, lon: 70.4011, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Somnath" },
    { name: "anand", lat: 22.5645, lon: 72.9289, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Anand" },
    { name: "mehsana", lat: 23.588, lon: 72.3693, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Mehsana" },
    { name: "bhuj", lat: 23.242, lon: 69.6669, country: "India", state: "Gujarat", tz: "Asia/Kolkata", displayName: "Bhuj" },
    { name: "gandhinagar", lat: 23.2156, lon: 72.6369, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "bhavnagar", lat: 21.7645, lon: 72.1519, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "jamnagar", lat: 22.4707, lon: 70.0577, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "junagadh", lat: 21.5222, lon: 70.4579, country: "India", state: "Gujarat", tz: "Asia/Kolkata" },
    { name: "pune", lat: 18.5204, lon: 73.8567, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
    { name: "nagpur", lat: 21.1458, lon: 79.0882, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
    { name: "nashik", lat: 19.9975, lon: 73.7898, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
    { name: "kolhapur", lat: 16.705, lon: 74.2433, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
    { name: "aurangabad", lat: 19.8762, lon: 75.3433, country: "India", state: "Maharashtra", tz: "Asia/Kolkata" },
    { name: "kolkata", lat: 22.5726, lon: 88.3639, country: "India", state: "West Bengal", tz: "Asia/Kolkata" },
    { name: "hyderabad", lat: 17.385, lon: 78.4867, country: "India", state: "Telangana", tz: "Asia/Kolkata" },
    { name: "chennai", lat: 13.0827, lon: 80.2707, country: "India", state: "Tamil Nadu", tz: "Asia/Kolkata" },
    { name: "coimbatore", lat: 11.0168, lon: 76.9558, country: "India", state: "Tamil Nadu", tz: "Asia/Kolkata" },
    { name: "madurai", lat: 9.9252, lon: 78.1198, country: "India", state: "Tamil Nadu", tz: "Asia/Kolkata" },
    { name: "jaipur", lat: 26.9124, lon: 75.7873, country: "India", state: "Rajasthan", tz: "Asia/Kolkata" },
    { name: "jodhpur", lat: 26.2389, lon: 73.0243, country: "India", state: "Rajasthan", tz: "Asia/Kolkata" },
    { name: "udaipur", lat: 24.5854, lon: 73.7125, country: "India", state: "Rajasthan", tz: "Asia/Kolkata" },
    { name: "kota", lat: 25.2138, lon: 75.8648, country: "India", state: "Rajasthan", tz: "Asia/Kolkata" },
    { name: "bhopal", lat: 23.2599, lon: 77.4126, country: "India", state: "Madhya Pradesh", tz: "Asia/Kolkata" },
    { name: "indore", lat: 22.7196, lon: 75.8577, country: "India", state: "Madhya Pradesh", tz: "Asia/Kolkata" },
    { name: "gwalior", lat: 26.2183, lon: 78.1828, country: "India", state: "Madhya Pradesh", tz: "Asia/Kolkata" },
    { name: "jabalpur", lat: 23.1815, lon: 79.9864, country: "India", state: "Madhya Pradesh", tz: "Asia/Kolkata" },
    { name: "ujjain", lat: 23.1765, lon: 75.7885, country: "India", state: "Madhya Pradesh", tz: "Asia/Kolkata" },
    { name: "lucknow", lat: 26.8467, lon: 80.9462, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "kanpur", lat: 26.4499, lon: 80.3319, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "varanasi", lat: 25.3176, lon: 82.9739, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "agra", lat: 27.1767, lon: 78.0081, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "prayagraj", lat: 25.4358, lon: 81.8463, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "allahabad", lat: 25.4358, lon: 81.8463, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata", displayName: "Prayagraj" },
    { name: "noida", lat: 28.5355, lon: 77.391, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "ghaziabad", lat: 28.6692, lon: 77.4538, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "meerut", lat: 28.9845, lon: 77.7064, country: "India", state: "Uttar Pradesh", tz: "Asia/Kolkata" },
    { name: "patna", lat: 25.5941, lon: 85.1376, country: "India", state: "Bihar", tz: "Asia/Kolkata" },
    { name: "gaya", lat: 24.7914, lon: 85.0002, country: "India", state: "Bihar", tz: "Asia/Kolkata" },
    { name: "chandigarh", lat: 30.7333, lon: 76.7794, country: "India", state: "Chandigarh", tz: "Asia/Kolkata" },
    { name: "ludhiana", lat: 30.901, lon: 75.8573, country: "India", state: "Punjab", tz: "Asia/Kolkata" },
    { name: "amritsar", lat: 31.634, lon: 74.8723, country: "India", state: "Punjab", tz: "Asia/Kolkata" },
    { name: "jalandhar", lat: 31.326, lon: 75.5762, country: "India", state: "Punjab", tz: "Asia/Kolkata" },
    { name: "gurgaon", lat: 28.4595, lon: 77.0266, country: "India", state: "Haryana", tz: "Asia/Kolkata" },
    { name: "gurugram", lat: 28.4595, lon: 77.0266, country: "India", state: "Haryana", tz: "Asia/Kolkata", displayName: "Gurugram" },
    { name: "faridabad", lat: 28.4089, lon: 77.3178, country: "India", state: "Haryana", tz: "Asia/Kolkata" },
    { name: "srinagar", lat: 34.0837, lon: 74.7973, country: "India", state: "Jammu and Kashmir", tz: "Asia/Kolkata" },
    { name: "jammu", lat: 32.7266, lon: 74.857, country: "India", state: "Jammu and Kashmir", tz: "Asia/Kolkata" },
    { name: "shimla", lat: 31.1048, lon: 77.1734, country: "India", state: "Himachal Pradesh", tz: "Asia/Kolkata" },
    { name: "manali", lat: 32.2432, lon: 77.1892, country: "India", state: "Himachal Pradesh", tz: "Asia/Kolkata" },
    { name: "dharamshala", lat: 32.219, lon: 76.3234, country: "India", state: "Himachal Pradesh", tz: "Asia/Kolkata" },
    { name: "dehradun", lat: 30.3165, lon: 78.0322, country: "India", state: "Uttarakhand", tz: "Asia/Kolkata" },
    { name: "rishikesh", lat: 30.0869, lon: 78.2676, country: "India", state: "Uttarakhand", tz: "Asia/Kolkata" },
    { name: "haridwar", lat: 29.9457, lon: 78.1642, country: "India", state: "Uttarakhand", tz: "Asia/Kolkata" },
    { name: "nainital", lat: 29.3919, lon: 79.4542, country: "India", state: "Uttarakhand", tz: "Asia/Kolkata" },
    { name: "goa", lat: 15.2993, lon: 74.124, country: "India", state: "Goa", tz: "Asia/Kolkata" },
    { name: "panaji", lat: 15.4909, lon: 73.8278, country: "India", state: "Goa", tz: "Asia/Kolkata" },
    { name: "kochi", lat: 9.9312, lon: 76.2673, country: "India", state: "Kerala", tz: "Asia/Kolkata" },
    { name: "cochin", lat: 9.9312, lon: 76.2673, country: "India", state: "Kerala", tz: "Asia/Kolkata", displayName: "Kochi" },
    { name: "thiruvananthapuram", lat: 8.5241, lon: 76.9366, country: "India", state: "Kerala", tz: "Asia/Kolkata" },
    { name: "trivandrum", lat: 8.5241, lon: 76.9366, country: "India", state: "Kerala", tz: "Asia/Kolkata", displayName: "Thiruvananthapuram" },
    { name: "kozhikode", lat: 11.2588, lon: 75.7804, country: "India", state: "Kerala", tz: "Asia/Kolkata" },
    { name: "visakhapatnam", lat: 17.6868, lon: 83.2185, country: "India", state: "Andhra Pradesh", tz: "Asia/Kolkata" },
    { name: "vizag", lat: 17.6868, lon: 83.2185, country: "India", state: "Andhra Pradesh", tz: "Asia/Kolkata", displayName: "Visakhapatnam" },
    { name: "vijayawada", lat: 16.5062, lon: 80.648, country: "India", state: "Andhra Pradesh", tz: "Asia/Kolkata" },
    { name: "bhubaneswar", lat: 20.2961, lon: 85.8245, country: "India", state: "Odisha", tz: "Asia/Kolkata" },
    { name: "cuttack", lat: 20.4625, lon: 85.883, country: "India", state: "Odisha", tz: "Asia/Kolkata" },
    { name: "puri", lat: 19.8135, lon: 85.8312, country: "India", state: "Odisha", tz: "Asia/Kolkata" },
    { name: "ranchi", lat: 23.3441, lon: 85.3096, country: "India", state: "Jharkhand", tz: "Asia/Kolkata" },
    { name: "jamshedpur", lat: 22.8046, lon: 86.2029, country: "India", state: "Jharkhand", tz: "Asia/Kolkata" },
    { name: "raipur", lat: 21.2514, lon: 81.6296, country: "India", state: "Chhattisgarh", tz: "Asia/Kolkata" },
    { name: "guwahati", lat: 26.1445, lon: 91.7362, country: "India", state: "Assam", tz: "Asia/Kolkata" },
    { name: "shillong", lat: 25.5788, lon: 91.8933, country: "India", state: "Meghalaya", tz: "Asia/Kolkata" },
    { name: "gangtok", lat: 27.3389, lon: 88.6065, country: "India", state: "Sikkim", tz: "Asia/Kolkata" },
    { name: "leh", lat: 34.1526, lon: 77.5771, country: "India", state: "Ladakh", tz: "Asia/Kolkata" },
    { name: "ooty", lat: 11.4102, lon: 76.695, country: "India", state: "Tamil Nadu", tz: "Asia/Kolkata" },
    { name: "darjeeling", lat: 27.041, lon: 88.2663, country: "India", state: "West Bengal", tz: "Asia/Kolkata" },
    { name: "mysore", lat: 12.2958, lon: 76.6394, country: "India", state: "Karnataka", tz: "Asia/Kolkata" },
    { name: "mysuru", lat: 12.2958, lon: 76.6394, country: "India", state: "Karnataka", tz: "Asia/Kolkata", displayName: "Mysuru" },
    { name: "mangalore", lat: 12.9141, lon: 74.856, country: "India", state: "Karnataka", tz: "Asia/Kolkata" },
    // Global Metros
    { name: "san francisco", lat: 37.7749, lon: -122.4194, country: "United States", state: "California", tz: "America/Los_Angeles", displayName: "San Francisco" },
    { name: "los angeles", lat: 34.0522, lon: -118.2437, country: "United States", state: "California", tz: "America/Los_Angeles", displayName: "Los Angeles" },
    { name: "new york", lat: 40.7128, lon: -74.006, country: "United States", state: "New York", tz: "America/New_York", displayName: "New York" },
    { name: "chicago", lat: 41.8781, lon: -87.6298, country: "United States", state: "Illinois", tz: "America/Chicago" },
    { name: "seattle", lat: 47.6062, lon: -122.3321, country: "United States", state: "Washington", tz: "America/Los_Angeles" },
    { name: "boston", lat: 42.3601, lon: -71.0589, country: "United States", state: "Massachusetts", tz: "America/New_York" },
    { name: "london", lat: 51.5074, lon: -0.1278, country: "United Kingdom", state: "England", tz: "Europe/London" },
    { name: "manchester", lat: 53.4808, lon: -2.2426, country: "United Kingdom", state: "England", tz: "Europe/London" },
    { name: "paris", lat: 48.8566, lon: 2.3522, country: "France", state: "Île-de-France", tz: "Europe/Paris" },
    { name: "berlin", lat: 52.52, lon: 13.405, country: "Germany", state: "Berlin", tz: "Europe/Berlin" },
    { name: "tokyo", lat: 35.6762, lon: 139.6503, country: "Japan", state: "Tokyo", tz: "Asia/Tokyo" },
    { name: "dubai", lat: 25.2048, lon: 55.2708, country: "United Arab Emirates", state: "Dubai", tz: "Asia/Dubai" },
    { name: "abu dhabi", lat: 24.4539, lon: 54.3773, country: "United Arab Emirates", state: "Abu Dhabi", tz: "Asia/Dubai", displayName: "Abu Dhabi" },
    { name: "singapore", lat: 1.3521, lon: 103.8198, country: "Singapore", state: "Singapore", tz: "Asia/Singapore" },
    { name: "sydney", lat: -33.8688, lon: 151.2093, country: "Australia", state: "New South Wales", tz: "Australia/Sydney" },
    { name: "melbourne", lat: -37.8136, lon: 144.9631, country: "Australia", state: "Victoria", tz: "Australia/Melbourne" },
    { name: "toronto", lat: 43.6532, lon: -79.3832, country: "Canada", state: "Ontario", tz: "America/Toronto" },
    { name: "vancouver", lat: 49.2827, lon: -123.1207, country: "Canada", state: "British Columbia", tz: "America/Vancouver" },
    { name: "bangkok", lat: 13.7563, lon: 100.5018, country: "Thailand", state: "Bangkok", tz: "Asia/Bangkok" },
    { name: "kuala lumpur", lat: 3.139, lon: 101.6869, country: "Malaysia", state: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur", displayName: "Kuala Lumpur" },
    { name: "hong kong", lat: 22.3193, lon: 114.1694, country: "China", state: "Hong Kong", tz: "Asia/Hong_Kong", displayName: "Hong Kong" },
  ];

  /**
   * Helper to inspect prior conversation messages backwards for active location context
   */
  private static findLocationInHistory(
    history: { role: string; content?: string; location?: LocationData }[] = []
  ): LocationData | null {
    if (!history || history.length === 0) return null;
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.location && msg.location.name && msg.location.latitude && msg.location.longitude) {
        return msg.location;
      }
      if (msg.content) {
        const lower = msg.content.toLowerCase();
        for (const item of this.cityKeywords) {
          const regex = new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
          if (regex.test(lower)) {
            return {
              id: `${item.name}_${item.lat}_${item.lon}`,
              name: item.displayName || (item.name.charAt(0).toUpperCase() + item.name.slice(1)),
              admin1: item.state,
              country: item.country,
              latitude: item.lat,
              longitude: item.lon,
              timezone: item.tz || "Asia/Kolkata",
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Entity extraction for geographic locations (Supports 150+ instant lookup cities + dynamic Open-Meteo geocoding for any place on Earth)
   */
  private static async extractLocation(
    query: string,
    history: { role: string; content?: string; location?: LocationData }[] = [],
    activeLocation?: LocationData
  ): Promise<LocationData> {
    const qRaw = query.trim();
    const qLower = qRaw.toLowerCase();

    // Direct check for "near me" or "my location"
    if (qLower.includes("near me") || qLower.includes("my location") || qLower.includes("current location")) {
      return activeLocation || DEFAULT_LOCATION;
    }

    // Helper to sanitize candidate search text
    const cleanLocationCandidate = (raw: string): string => {
      let s = raw.replace(/[?,!:;'"()[\]{}]/g, " ");
      const stopPatterns = [
        /\b(?:tomorrow|today|tonight|yesterday|this weekend|next week|weekend|morning|afternoon|evening|night|now|currently|right now)\b/gi,
        /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
        /\b(?:at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|o'clock)\b/gi,
        /\b(?:please|can|could|should|will|would|how|what|is|the|are|about|tell|me|show|give|check|forecast|weather|temperature|temp|rain|raining|rainy|humidity|wind|aqi|climate|conditions|outlook|update|report|match|play|cricket|travel|safe|drive)\b/gi,
        /\b(?:carry|umbrella|coat|jacket|wear|sunglasses|sunscreen|uv|index|dangerous|safe|radiation|around|near|here|my|location|current|outside|outdoors|which|better|difference|between|vs|versus)\b/gi,
        /\b(?:be|been|being|have|has|had|do|does|did|an|a|i|we|you|he|she|it|they|them|my|me|mine|your|yours|our|ours)\b/gi,
        /\b(?:activities|activity|good|bad|suitable|recommend|recommendation|advice|convert|conversion|fahrenheit|celsius|degrees|degree|in|to)\b/gi,
      ];
      for (const pat of stopPatterns) {
        s = s.replace(pat, " ");
      }
      return s.replace(/\s+/g, " ").trim();
    };

    // 1. Direct match from city lookup (longest city names first)
    for (const item of this.cityKeywords) {
      const regex = new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(qLower)) {
        return {
          id: `${item.name}_${item.lat}_${item.lon}`,
          name: item.displayName || (item.name.charAt(0).toUpperCase() + item.name.slice(1)),
          admin1: item.state,
          country: item.country,
          latitude: item.lat,
          longitude: item.lon,
          timezone: item.tz || "Asia/Kolkata",
        };
      }
    }

    // 2. Preposition pattern match: "in [City]", "of [City]", "for [City]", "at [City]", "from [City]"
    const prepPatterns = [
      /(?:in|of|for|at|from)\s+([a-zA-Z\u0080-\uFFFF\s\.\-]{2,35})/gi,
      /(?:weather|forecast|temperature|climate|rain|aqi|humidity)\s+(?:in|of|for|at)?\s*([a-zA-Z\u0080-\uFFFF\s\.\-]{2,35})/gi,
    ];

    const ignoreWords = new Set([
      "pm", "am", "clock", "now", "today", "tomorrow", "tonight", "day", "week",
      "near", "around", "here", "umbrella", "outdoor", "outdoors", "outside",
      "activity", "activities", "fahrenheit", "celsius", "convert", "safe",
      "good", "better", "need", "it", "this", "that"
    ]);

    for (const pattern of prepPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(qRaw)) !== null) {
        if (match[1]) {
          const candidate = cleanLocationCandidate(match[1]);
          if (candidate.length >= 2 && !ignoreWords.has(candidate.toLowerCase())) {
            const results = await WeatherService.searchLocations(candidate);
            if (results && results.length > 0) {
              return results[0];
            }
          }
        }
      }
    }

    // 3. Whole query cleaned extraction (e.g., "Vadodara weather", "Chicago 5 day forecast", "Tokyo")
    const cleanedQuery = cleanLocationCandidate(qRaw);
    if (cleanedQuery.length >= 3 && cleanedQuery.length <= 40) {
      if (!ignoreWords.has(cleanedQuery.toLowerCase())) {
        const results = await WeatherService.searchLocations(cleanedQuery);
        if (results && results.length > 0) {
          return results[0];
        }
      }
    }

    // 4. Follow-up Context Memory: If query did not specify a new location, inherit from previous turn in history!
    const fromHistory = this.findLocationInHistory(history);
    if (fromHistory) {
      return fromHistory;
    }

    // 5. Fallback: Use user's currently selected location on the web app (or Ahmedabad if none)
    return activeLocation || DEFAULT_LOCATION;
  }

  /**
   * Dual-location entity extraction for comparative queries (e.g., "Compare Ahmedabad and Surat", "Which is better for travelling today, Ahmedabad or Surat?", "Ahmedabad vs Surat")
   */
  public static async extractTwoLocations(
    query: string,
    history: { role: string; content?: string; location?: LocationData }[] = [],
    activeLocation?: LocationData
  ): Promise<[LocationData, LocationData] | null> {
    const qRaw = query.trim();
    const qLower = qRaw.toLowerCase();

    // Check if query implies comparison
    const isComparative =
      /\b(?:compare|comparison|versus|vs|difference between|which is better|better for|better city|or)\b/i.test(qLower);

    if (!isComparative) return null;

    // Check for "compare it with [City]" or "compare with [City]" or "how does it compare to [City]"
    const singleComparePattern = /\b(?:compare|comparison|versus|vs)\s+(?:it\s+)?(?:with|to|against)\s+([a-zA-Z\s\.\-]{2,30})/i;
    const singleMatch = qRaw.match(singleComparePattern);
    if (singleMatch && singleMatch[1]) {
      const cleanB = singleMatch[1].replace(/\b(?:weather|city|temperature|forecast|today|tomorrow|travelling|travel|in|for|\?)\b/gi, "").trim();
      const historyLoc = this.findLocationInHistory(history) || activeLocation;
      if (historyLoc && cleanB.length >= 2) {
        const locB = await this.extractLocation(cleanB, history, activeLocation);
        if (locB && locB.name.toLowerCase() !== historyLoc.name.toLowerCase()) {
          return [historyLoc, locB];
        }
      }
    }

    // Patterns to capture Candidate A and Candidate B
    const patterns = [
      /\b(?:compare|comparison between)\s+([a-zA-Z\s\.\-]{2,30}?)\s+(?:and|with|to|vs|versus)\s+([a-zA-Z\s\.\-]{2,30})/i,
      /\bdifference\s+between\s+([a-zA-Z\s\.\-]{2,30}?)\s+and\s+([a-zA-Z\s\.\-]{2,30})/i,
      /\b(?:which is better|better for\s+[a-zA-Z\s]+|better|preferable)\s+(?:in|between|today|tomorrow)?\s*([a-zA-Z\s\.\-]{2,30}?)\s+(?:or|and|vs|versus)\s+([a-zA-Z\s\.\-]{2,30})/i,
      /\b([a-zA-Z]{3,25})\s+(?:vs|versus)\s+([a-zA-Z]{3,25})\b/i,
      /\b([a-zA-Z]{3,25})\s+or\s+([a-zA-Z]{3,25})\b/i,
    ];

    for (const pat of patterns) {
      const match = qRaw.match(pat);
      if (match && match[1] && match[2]) {
        // Clean candidates of common filler words
        const cleanA = match[1].replace(/\b(?:weather|city|temperature|forecast|today|tomorrow|travelling|travel|in|for|between)\b/gi, "").trim();
        const cleanB = match[2].replace(/\b(?:weather|city|temperature|forecast|today|tomorrow|travelling|travel|in|for|\?)\b/gi, "").trim();

        if (cleanA.toLowerCase() === "it" || cleanA.length === 0) {
          const historyLoc = this.findLocationInHistory(history) || activeLocation;
          if (historyLoc && cleanB.length >= 2) {
            const locB = await this.extractLocation(cleanB, history, activeLocation);
            if (locB && locB.name.toLowerCase() !== historyLoc.name.toLowerCase()) {
              return [historyLoc, locB];
            }
          }
        } else if (cleanA.length >= 2 && cleanB.length >= 2) {
          const [locA, locB] = await Promise.all([
            this.extractLocation(cleanA, history, activeLocation),
            this.extractLocation(cleanB, history, activeLocation),
          ]);

          if (locA && locB && locA.name.toLowerCase() !== locB.name.toLowerCase()) {
            return [locA, locB];
          }
        }
      }
    }

    return null;
  }

  /**
   * Dual-City Comparative Natural Language Response Formulator
   */
  private static generateComparativeResponse(
    query: string,
    cityA: LocationData,
    cityB: LocationData,
    comp: ComparisonData,
    unit: "C" | "F" = "C"
  ): string {
    const isTravel =
      query.toLowerCase().includes("travel") ||
      query.toLowerCase().includes("trip") ||
      query.toLowerCase().includes("visit") ||
      query.toLowerCase().includes("tour");
    const recs = comp.recommendations;

    const currentA = comp.cityA.current;
    const currentB = comp.cityB.current;
    const aqiA = comp.cityA.aqi;
    const aqiB = comp.cityB.aqi;

    const tempA = formatTemp(currentA.temperature, unit);
    const tempB = formatTemp(currentB.temperature, unit);
    const feelsA = formatTemp(currentA.feelsLike, unit);
    const feelsB = formatTemp(currentB.feelsLike, unit);
    const rainA = comp.cityA.daily[0]?.precipitationProb ?? 0;
    const rainB = comp.cityB.daily[0]?.precipitationProb ?? 0;

    let verdict = "";
    if (isTravel) {
      verdict = `### ✈️ Travel Recommendation: Choose **${recs.betterForTravel}**\n\nFor travelling today, **${recs.betterForTravel}** is the more favorable choice due to ${
        rainA < rainB
          ? `significantly lower rain risk (${rainA}% vs ${rainB}%)`
          : currentA.temperature < currentB.temperature
          ? `more comfortable ambient temperatures (${tempA} vs ${tempB})`
          : `more stable overall weather conditions`
      }.`;
    } else {
      verdict = `### ⚖️ Meteorological Comparison: **${cityA.name} vs ${cityB.name}**\n\n* 🏆 **Best for Travel / Outdoor Activities:** **${recs.betterForTravel}**\n* 🍃 **Cleaner Air (AQI):** **${recs.betterAirQuality}** (${aqiA.aqi < aqiB.aqi ? aqiA.aqi : aqiB.aqi} AQI)\n* ❄️ **Cooler Destination:** **${recs.coolerClimate}** (${recs.coolerClimate === cityA.name ? tempA : tempB})`;
    }

    return `${verdict}

**Side-by-Side Comparison Matrix:**

| Parameter | ${cityA.name} | ${cityB.name} | Advantage / Note |
| :--- | :--- | :--- | :--- |
| 🌡️ **Temperature** | **${tempA}** (Feels ${feelsA}) | **${tempB}** (Feels ${feelsB}) | ${recs.coolerClimate} is cooler |
| 🌧️ **Rain Probability** | **${rainA}%** (${currentA.conditionText}) | **${rainB}%** (${currentB.conditionText}) | ${rainA <= rainB ? cityA.name : cityB.name} has lower rain risk |
| 💧 **Humidity** | ${currentA.humidity}% | ${currentB.humidity}% | ${currentA.humidity < currentB.humidity ? cityA.name : cityB.name} is less humid |
| 💨 **Wind Speed** | ${Math.round(currentA.windSpeed)} km/h | ${Math.round(currentB.windSpeed)} km/h | ${Math.abs(currentA.windSpeed - currentB.windSpeed).toFixed(1)} km/h difference |
| ☀️ **UV Index** | ${currentA.uvIndex} | ${currentB.uvIndex} | ${currentA.uvIndex > 6 || currentB.uvIndex > 6 ? "High UV" : "Moderate"} |
| 🍃 **Air Quality (AQI)** | ${aqiA.aqi} (${aqiA.category}) | ${aqiB.aqi} (${aqiB.category}) | ${recs.betterAirQuality} has cleaner air |

> 💡 **Meteorologist Verdict:** ${comp.verdict}`;
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
    location: LocationData,
    unit: "C" | "F" = "C"
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
          factors.push({ label: "Thermal Load", value: `${formatTemp(maxTemp, unit)} High Heat`, impact: "warning" as const });
        } else if (maxTemp < 12) {
          score -= 15;
          factors.push({ label: "Low Temperature", value: `${formatTemp(maxTemp, unit)} Cold Air`, impact: "warning" as const });
        } else {
          factors.push({ label: "Temperature", value: `${formatTemp(maxTemp, unit)} Optimal Range`, impact: "positive" as const });
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

        if (score < 50) {
          status = "HIGH_RISK";
          badgeText = "Cricket Playability at High Risk";
          badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/40";
          reasoning = `Unfavorable conditions detected in ${location.name} for competitive cricket: ${rainProb > 45 ? `Rain risk is elevated (${rainProb}%) with damp pitch hazards.` : `Heat stress or strong gusts (${Math.round(windMax)} km/h) will impede ball trajectory.`}`;
        } else if (score < 75) {
          status = "MODERATE_RISK";
          badgeText = "Moderate Playability (Watch Forecast)";
          badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/40";
          reasoning = `Cricket is playable in ${location.name} with minor caution: ${rainProb > 25 ? `A ${rainProb}% passing shower risk could delay play.` : `Elevated temperatures around ${formatTemp(maxTemp, unit)} will require frequent player hydration breaks.`}`;
        } else {
          reasoning = `Excellent weather envelope in ${location.name} for an evening or afternoon match: Rain probability is low (${rainProb}%), temperature stands at a comfortable ${formatTemp(maxTemp, unit)}, and winds are manageable at ${Math.round(windMax)} km/h.`;
        }

        return {
          domain: "cricket",
          status,
          title: "Cricket & Sports Playability Intelligence",
          badgeText,
          badgeColor,
          score: Math.max(10, Math.min(100, score)),
          reasoning,
          keyFactors: factors,
          actionPlan: [
            rainProb > 30 ? "Keep ground covers and super soppers ready." : "Standard pitch preparation recommended.",
            maxTemp > 34 ? "Schedule mandatory drink breaks every 15 overs." : "No thermal fatigue concerns.",
            "Verify outfield friction index before coin toss.",
          ],
          bestWindow: isTomorrow ? "Tomorrow 4:30 PM – 7:30 PM (Lower Thermal & Rain Risk)" : "Today 5:00 PM – 8:00 PM (Ideal twilight conditions)",
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
          reasoning: `Travel feasibility across ${location.name} is ${severeAlert ? "restricted due to heavy rain showers and potential waterlogging" : "generally good with stable road friction"}. Current visibility is ${current.visibility.toFixed(1)} km.`,
          keyFactors: [
            { label: "Visibility", value: `${current.visibility.toFixed(1)} km`, impact: current.visibility < 5 ? "warning" : "positive" },
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
          reasoning: `With temperatures at ${formatTemp(current.temperature, unit)} (feels like ${formatTemp(current.feelsLike, unit)}) and a ${rainProb}% precipitation chance in ${location.name}, ${needsUmbrella ? "carrying a compact umbrella or waterproof jacket is strongly recommended." : "light and breathable clothing will keep you comfortable."}`,
          keyFactors: [
            { label: "Temperature", value: formatTemp(current.temperature, unit), impact: "positive" },
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
          reasoning: `For outdoor events in ${location.name}: Precipitation likelihood is ${rainProb}% with temperatures reaching ${formatTemp(maxTemp, unit)}. ${eventRisk ? "Having a waterproof canopy or marquee backup is essential." : "Guests will enjoy comfortable outdoor ambient conditions."}`,
          keyFactors: [
            { label: "Rain Forecast", value: `${rainProb}% Probability`, impact: rainProb > 40 ? "warning" : "positive" },
            { label: "Ambient Temp", value: formatTemp(maxTemp, unit), impact: maxTemp > 36 ? "warning" : "positive" },
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
          reasoning: `Current conditions in ${location.name} show ${current.conditionText.toLowerCase()} at ${formatTemp(current.temperature, unit)} with a feels-like index of ${formatTemp(current.feelsLike, unit)}.`,
          keyFactors: [
            { label: "Temperature", value: `${formatTemp(current.temperature, unit)}`, impact: "positive" },
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
    recommendation: AIRecommendation,
    unit: "C" | "F" = "C"
  ): string {
    const isTomorrow = temporal.target === "tomorrow" || query.toLowerCase().includes("tomorrow");
    const targetDay = isTomorrow && daily[1] ? daily[1] : daily[0] || daily[0];
    const tempText = `${formatTemp(targetDay.tempMax, unit)} (Low: ${formatTemp(targetDay.tempMin, unit)})`;
    const rainProb = targetDay.precipitationProb || (isTomorrow ? 65 : 20);
    const qLower = query.toLowerCase();

    // 0. Unit conversion query (e.g., "Convert the temperature to Fahrenheit", "In Fahrenheit")
    if (qLower.includes("fahrenheit") || (qLower.includes("convert") && (qLower.includes("f") || qLower.includes("temp")))) {
      const fTemp = formatTemp(current.temperature, "F");
      const fFeels = formatTemp(current.feelsLike, "F");
      const fHigh = formatTemp(targetDay.tempMax, "F");
      const fLow = formatTemp(targetDay.tempMin, "F");
      return `### 🌡️ Temperature in ${location.name} (Fahrenheit)

In **${location.name}**, the current temperature converted to Fahrenheit is **${fTemp}** (feels like **${fFeels}**).

* 🔺 **Today's High:** **${fHigh}**
* 🔻 **Overnight Low:** **${fLow}**
* 💧 **Relative Humidity:** ${current.humidity}%
* 💨 **Wind Speed:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}

Current atmospheric conditions are **${current.conditionText.toLowerCase()}**.`;
    }

    // 0b. Outdoor activities query (e.g., "Is it good for outdoor activities?", "Can I go outside today?")
    if (
      qLower.includes("outdoor") ||
      qLower.includes("outside") ||
      qLower.includes("go out") ||
      qLower.includes("activities") ||
      qLower.includes("going out")
    ) {
      const isGood = rainProb <= 35 && current.temperature <= (unit === "F" ? 95 : 35) && current.temperature >= (unit === "F" ? 50 : 10) && aqi.aqi <= 150;
      const bestWindow = "5:00 PM – 7:30 PM (cooler temperatures & pleasant breeze)";
      return `### ☀️ Outdoor Activity Recommendation: ${location.name}

${isGood ? `✅ **YES, conditions are favorable for outdoor activities!** Weather in **${location.name}** is pleasant.` : `⚠️ **Exercise caution for outdoor activities.** Weather in **${location.name}** is sub-optimal.`}

* 🕒 **Recommended Window:** ${bestWindow}
* 🌡️ **Temperature:** ${formatTemp(current.temperature, unit)} (Feels like ${formatTemp(current.feelsLike, unit)})
* 🌧️ **Precipitation Probability:** **${rainProb}%** (${rainProb > 40 ? "Passing showers possible" : "Dry conditions"})
* ☀️ **UV Index:** ${current.uvIndex} (${current.uvIndex >= 6 ? "High — Wear sunscreen" : "Moderate"})
* 🍃 **Air Quality:** ${aqi.aqi} AQI (${aqi.category})

${isGood ? "Great conditions for walking, jogging, cycling, or casual travel." : "Keep hydration and rain gear handy if you need to be outdoors."}`;
    }

    // 1. Specific Hour query (e.g., "What will be the weather around 6 PM?", "at 5 pm in Ahmedabad")
    if (temporal.specificHour !== undefined) {
      const hour = temporal.specificHour;
      const hourFormatted =
        hour === 0 ? "12:00 AM" : hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;

      const matchedHour =
        hourly.find((h) => {
          const hNum = parseInt(h.time.split(":")[0] || "0", 10);
          return hNum === hour;
        }) || hourly[0] || {
          time: hourFormatted,
          temperature: current.temperature,
          feelsLike: current.feelsLike,
          conditionText: current.conditionText,
          precipitationProb: 15,
          windSpeed: current.windSpeed,
          humidity: current.humidity,
          cloudCover: current.cloudCover,
          uvIndex: current.uvIndex,
        };

      const hTemp = formatTemp(matchedHour.temperature, unit);
      const hFeels = formatTemp(matchedHour.feelsLike, unit);
      const hRain = matchedHour.precipitationProb ?? 15;

      return `### 🕕 Weather Outlook at ${hourFormatted} in ${location.name}

Around **${hourFormatted}** ${isTomorrow ? "tomorrow" : "today"}, conditions in **${location.name}** are projected to be **${matchedHour.conditionText}** with a temperature of **${hTemp}** (feels like **${hFeels}**).

* 🌡️ **Expected Temperature:** **${hTemp}** (Feels like ${hFeels})
* 🌧️ **Precipitation Probability:** **${hRain}%**
* 💧 **Relative Humidity:** ${matchedHour.humidity}%
* 💨 **Wind Speed:** ${Math.round(matchedHour.windSpeed)} km/h
* ☁️ **Cloud Cover:** ${matchedHour.cloudCover}%

> 💡 **Advisory for ${hourFormatted}:** ${
        hRain > 50
          ? `High probability of rainfall around ${hourFormatted}. Carrying an umbrella or rain poncho is strongly advised.`
          : matchedHour.temperature > 35
          ? `Elevated thermal index expected. Stay hydrated and avoid strenuous outdoor exercise around ${hourFormatted}.`
          : `Stable and comfortable weather envelope expected around ${hourFormatted}. Great for travel or outdoor plans.`
      }`;
    }

    // 2. UV Index Danger Query (e.g., "Is UV index dangerous right now?")
    if (qLower.includes("uv") || qLower.includes("sunscreen") || qLower.includes("solar radiation")) {
      const uv = current.uvIndex;
      let category = "Low";
      let isDangerous = false;
      let advice = "";

      if (uv >= 11) {
        category = "Extreme";
        isDangerous = true;
        advice = "Hazardous solar radiation. Skin damage occurs in under 10 minutes without SPF 50+ protection. Avoid midday sun.";
      } else if (uv >= 8) {
        category = "Very High";
        isDangerous = true;
        advice = "High risk of harm from unprotected sun exposure. Wear SPF 30+ sunscreen, UV-blocking sunglasses, and protective hat.";
      } else if (uv >= 6) {
        category = "High";
        isDangerous = true;
        advice = "UV index is elevated. Seek shade during peak midday hours (11:00 AM – 4:00 PM) and apply broad-spectrum sunscreen.";
      } else if (uv >= 3) {
        category = "Moderate";
        isDangerous = false;
        advice = "Moderate solar radiation. Sunglasses and light sun lotion recommended if staying outdoors for extended periods.";
      } else {
        category = "Low";
        isDangerous = false;
        advice = "Minimal solar radiation risk. You can safely stay outdoors with standard precautions.";
      }

      return `### ☀️ UV Index & Sun Protection Advisory: ${location.name}

${isDangerous ? `⚠️ **YES, UV INDEX IS ELEVATED & POTENTIALLY DANGEROUS!**` : `✅ **NO, UV Index is currently at a SAFE level.**`}

* ☀️ **Current UV Index:** **${uv}** (${category})
* 🌡️ **Ambient Temperature:** ${formatTemp(current.temperature, unit)} (Feels like ${formatTemp(current.feelsLike, unit)})
* ☁️ **Cloud Cover:** ${current.cloudCover}% (Clouds only filter ~20% of UV rays)

> 🛡️ **Dermatological Recommendation:** ${advice}`;
    }

    // 3. Direct Temperature Query (e.g., "What is the temperature in Jetpur?")
    if (
      (qLower.includes("temperature") || qLower.includes("temp") || qLower.includes("how hot") || qLower.includes("how cold")) &&
      !qLower.includes("cricket")
    ) {
      return `### 🌡️ Temperature in ${location.name}

The current temperature in **${location.name}** is **${formatTemp(current.temperature, unit)}** (feels like **${formatTemp(current.feelsLike, unit)}**).

* 🔺 **Today's High:** **${formatTemp(targetDay.tempMax, unit)}**
* 🔻 **Overnight Low:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **Relative Humidity:** ${current.humidity}% | Dew Point: ${formatTemp(current.dewPoint, unit)}
* 💨 **Wind Speed:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}

Current atmospheric conditions are **${current.conditionText.toLowerCase()}**.`;
    }

    // 4. Rain & Umbrella Query (e.g., "Will it rain in Rajkot today?", "Should I carry an umbrella?")
    if (qLower.includes("rain") || qLower.includes("umbrella") || qLower.includes("precipitation") || qLower.includes("shower")) {
      const willRain = rainProb >= 40 || current.precipitation > 0;
      const umbrellaDirective = willRain
        ? `☔ **YES, carry an umbrella!** There is a **${rainProb}% chance of rain** ${isTomorrow ? "tomorrow" : "today"} in ${location.name}.`
        : `☀️ **NO umbrella needed.** Rain probability is low (**${rainProb}%**) in ${location.name}.`;

      return `### 🌧️ Rain & Umbrella Forecast: ${location.name}

${umbrellaDirective}

* 🌡️ **Temperature:** ${tempText}
* 🌧️ **Rain Probability:** **${rainProb}%** (${targetDay.conditionText})
* 💧 **Current Humidity:** ${current.humidity}%
* ☁️ **Cloud Cover:** ${current.cloudCover}%
* 💨 **Wind:** ${targetDay.windSpeedMax} km/h

> 💡 **Precipitation Outlook:** ${
        rainProb > 60
          ? "Localized convective downpours or thunderstorm showers are likely. Keep waterproof gear ready."
          : rainProb > 30
          ? "Passing showers possible during evening or afternoon intervals. Keeping a compact umbrella is a good precaution."
          : "Predominantly dry conditions with negligible rain risk."
      }`;
    }

    // 5. Tomorrow's Forecast (e.g., "What's the weather tomorrow in Jetpur?")
    if (isTomorrow || qLower.includes("tomorrow")) {
      const tomorrow = daily[1] || daily[0];
      return `### 📅 Tomorrow's Weather Forecast for ${location.name}

Tomorrow in **${location.name}**, expect **${tomorrow.conditionText}** with temperatures reaching a high of **${formatTemp(tomorrow.tempMax, unit)}** and an overnight low of **${formatTemp(tomorrow.tempMin, unit)}**.

* 🌡️ **Temperature Range:** High of **${formatTemp(tomorrow.tempMax, unit)}** / Low of **${formatTemp(tomorrow.tempMin, unit)}**
* 🌧️ **Precipitation Likelihood:** **${tomorrow.precipitationProb}%** (${tomorrow.precipitationProb > 40 ? "Rain showers likely" : "Mostly dry"})
* 💨 **Peak Wind Gusts:** ${tomorrow.windSpeedMax} km/h
* 🍃 **Air Quality Forecast:** ${aqi.category} category (~${aqi.aqi} AQI)

Overall atmospheric conditions remain stable for your daily plans.`;
    }

    // 6. 7-Day Extended Forecast (e.g., "7-day weather forecast for Ahmedabad")
    if (qLower.includes("7-day") || qLower.includes("7 day") || qLower.includes("week forecast") || qLower.includes("weekly") || qLower.includes("extended")) {
      return `### 📅 7-Day Extended Forecast for ${location.name}

Here is the projected meteorological outlook for **${location.name}** over the next 7 days:

| Day | Date | Condition | High / Low | Rain % |
| :--- | :--- | :--- | :--- | :--- |
${daily.slice(0, 7).map((d) => `| **${d.dayName}** | ${d.date.slice(5)} | ${d.conditionText} | **${formatTemp(d.tempMax, unit)}** / ${formatTemp(d.tempMin, unit)} | 🌧️ ${d.precipitationProb}% |`).join("\n")}

> 📈 **Week Trend:** Temperatures will peak at ${formatTemp(Math.max(...daily.slice(0, 7).map((d) => d.tempMax)), unit)} with ${daily.some((d) => d.precipitationProb > 40) ? "scattered shower opportunities" : "predominantly clear skies"}.`;
    }

    // 7. Cricket & Sports Playability
    if (domain === "cricket") {
      const specificTimeText = temporal.specificHour ? `around ${temporal.specificHour > 12 ? temporal.specificHour - 12 + " PM" : temporal.specificHour + " AM"}` : "tomorrow evening";
      return `### 🏏 Match Analysis: ${location.name} (${isTomorrow ? "Tomorrow" : "Today"} ${specificTimeText})

${recommendation.reasoning}

**Key Meteorological Metrics:**
* 🌡️ **Expected Temperature:** ${tempText} (Feels like ~${formatTemp(targetDay.tempMax + 2, unit)})
* 🌧️ **Precipitation Probability:** **${rainProb}%** with potential passing showers
* 💨 **Wind Speed:** ${targetDay.windSpeedMax} km/h with gusts up to ${Math.round(targetDay.windSpeedMax * 1.3)} km/h
* 💧 **Relative Humidity:** ${current.humidity}%
* 🍃 **Air Quality Index:** ${aqi.aqi} (${aqi.category})

**AI Playability Verdict:** **${recommendation.badgeText}** (Feasibility Score: **${recommendation.score}/100**)

> 💡 **Recommendation:** ${recommendation.bestWindow ? `If you are planning to play, consider scheduling during the optimal window: **${recommendation.bestWindow}**.` : "Keep a backup plan in case of localized drizzle."}`;
    }

    if (qLower.includes("climate") || qLower.includes("change")) {
      return `### 🌍 Climate Trends & Historical Shift for ${location.name}

Over the past 15–20 years, meteorological data records for the ${location.name} region indicate:

1. 📈 **Temperature Trend:** An average decadal warming anomaly of **+0.75°C to +0.90°C**.
2. 🌧️ **Monsoon Variability:** Rainfall has shown higher peak intensity events with longer dry spells between rain clusters.
3. 🔥 **Heatwave Frequency:** Increased by approximately 4–6 additional extreme heat days per summer season.

Explore our dedicated **Climate Intelligence** tab for interactive 15-year historical graphs and seasonal anomaly breakdowns.`;
    }

    // Default rich meteorological response
    return `### ☀️ Weather in ${location.name}

In **${location.name}**, conditions are currently **${current.conditionText}** with a temperature of **${formatTemp(current.temperature, unit)}** (feels like **${formatTemp(current.feelsLike, unit)}**).

* 🔺 **Today's High:** **${formatTemp(targetDay.tempMax, unit)}** / **Low:** **${formatTemp(targetDay.tempMin, unit)}**
* 💧 **Relative Humidity:** ${current.humidity}% | Dew point: ${formatTemp(current.dewPoint, unit)}
* 💨 **Wind:** ${formatWindSpeed(current.windSpeed)} with gusts up to ${formatWindSpeed(current.windGusts)}
* ☀️ **UV Index:** ${current.uvIndex} (${current.uvIndex > 6 ? "High — Sunscreen recommended" : "Moderate"})
* 🍃 **Air Quality:** ${aqi.aqi} AQI — **${aqi.category}** (PM2.5: ${aqi.pm25} µg/m³)

Atmospheric conditions are steady and comfortable throughout the day.`;
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
    apiKey: string,
    unit: "C" | "F" = "C"
  ): Promise<string> {
    const systemPrompt = `You are WeatherGPT, an advanced conversational AI for weather forecasting, alerts, and climate intelligence.
You have access to real-time, verified meteorological data:
Location: ${location.name}, ${[location.admin2, location.admin1, location.country].filter(Boolean).join(", ")}
Current Weather: Temp ${formatTemp(current.temperature, unit)} (Feels like ${formatTemp(current.feelsLike, unit)}), Condition: ${current.conditionText}, Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h), UV: ${current.uvIndex}, Pressure: ${current.pressure} hPa, Visibility: ${current.visibility.toFixed(1)} km.
Air Quality: ${aqi.aqi} (${aqi.category}, PM2.5: ${aqi.pm25} µg/m³).
Forecast Summary: Today High ${formatTemp(daily[0]?.tempMax || current.tempMax, unit)}/Low ${formatTemp(daily[0]?.tempMin || current.tempMin, unit)} (Rain: ${daily[0]?.precipitationProb}%), Tomorrow High ${formatTemp(daily[1]?.tempMax || current.tempMax, unit)}/Low ${formatTemp(daily[1]?.tempMin || current.tempMin, unit)} (Rain: ${daily[1]?.precipitationProb}%).
Domain Analysis: ${recommendation.title} — Status: ${recommendation.status}, Score: ${recommendation.score}/100.
User Temperature Preference: °${unit} (Always state temperatures in °${unit}).

Rules:
1. Ground your answer strictly in the provided real weather metrics. Never invent weather.
2. Be conversational, crisp, helpful, and structured with markdown headings and bullet points.
3. For sports/cricket/travel/clothing/farming queries, give direct, actionable advice with the exact numbers.
4. Always format temperatures in °${unit}.`;

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
