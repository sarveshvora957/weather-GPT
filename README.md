# WeatherGPT — Conversational AI for Weather Forecasting, Alerts & Climate Information

> **Smart India Hackathon (SIH 2026)**
> **Problem Statement:** *“WeatherGPT: Conversational AI for Weather Forecasting, Alerts, and Climate Information”*

WeatherGPT unites conversational generative AI with global numerical atmospheric models (ECMWF, GFS, DWD ICON, Copernicus CAMS) to provide real-time forecasting, severe weather warnings, historical climate intelligence, and activity suitability recommendations.

---

## 🌟 Key Product Features

### 1. Conversational AI Weather Assistant
- **Natural Language Understanding**: Understands spatial entities, dates, times, and activity intents (e.g. *“Can I play cricket tomorrow at 5 PM in Ahmedabad?”* or *“Is it safe to drive to Manali this weekend?”*).
- **Meteorological Risk Matrices**: Calculates domain feasibility scores (0–100) and provides actionable checklists with alternative time slots.
- **Voice I/O**: Integrated Speech-to-Text (Voice Microphone) and Text-to-Speech (Audio Voice Briefings).
- **Embedded Visual Weather Cards**: Displays temperature, rain probability bars, wind vectors, and AQI gauges directly inside chat responses.

### 2. Live Weather Intelligence & Radar Maps
- **High-Resolution Telemetry**: Live temperature, feels-like, UV index, humidity, dew point, atmospheric pressure, visibility, and solar progress arcs.
- **Interactive Multi-Layer Map**: Precipitation radar, thermal heatmaps, wind streamlines, cloud satellite layers, and severe storm clusters.
- **24-Hour Hourly Scrubber & 14-Day Daily Projection**: Real-time precipitation probability bars and normalized temperature range gradients.
- **Interactive Recharts**: 24-hour temperature curves, precipitation volume charts, wind gust charts, and humidity & UV curves.

### 3. Severe Weather Bulletins & Smart Alerts
- **Real-Time Bulletins**: Automatic detection of heatwaves, thunderstorms, cyclonic squalls, flash flood risks, and air pollution inversions with Low / Moderate / High / Extreme severity classifications.
- **User Smart Triggers**: Configure personalized threshold alerts (e.g. *“Notify me if rain > 60%”*, *“Notify me if temperature > 40°C”*).

### 4. Climate Intelligence & City Comparison
- **15–30 Year Climate Trends**: Longitudinal climate reanalysis, annual mean temperature rise per decade, monsoon shift percentages, and heatwave day anomalies.
- **Dual-City Comparison Engine**: Side-by-side battle comparison (e.g. Ahmedabad vs Mumbai) with metric winner highlights and outdoor viability verdicts.

### 5. Domain-Specific Activity Advisors
- 🏏 **Cricket & Sports**: Outfield dampness, rain windows, pitch firmness, optimal play times.
- ✈️ **Travel & Highway Safety**: Fog visibility, crosswinds, hydroplaning risks.
- 👕 **Smart Wardrobe**: Layering, rain gear necessities, UV protection.
- 🌾 **Agriculture & Crop Spraying**: Wind drift thresholds, pesticide drying windows.
- 🎪 **Event & Wedding Planning**: Open-air feasibility, waterproof canopy contingencies.
- 🚗 **Daily Commuting**: Peak rush-hour traffic rain delays.

### 6. SIH 2026 Presentation Demo Mode
Instant 1-click evaluation of 5 presentation scenarios:
1. **Scenario 1**: Approaching Monsoon & Cyclone Alert in Western India (Ahmedabad)
2. **Scenario 2**: 45°C Extreme Heatwave & High UV Advisory (New Delhi)
3. **Scenario 3**: Outdoor Cricket Match Feasibility at 5 PM (Ahmedabad)
4. **Scenario 4**: Mountain Highway Travel & Landslide Risk Advisor (Manali)
5. **Scenario 5**: Dual-City Climate Shift Comparison (Ahmedabad vs Mumbai)

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS (Glassmorphism, dark/light themes, neon glowing accents)
- **Visual Effects**: Weather-reactive HTML5 Canvas particle system (Rain, snow, thunderstorm flashes, sunbeams, stars)
- **Charts & Maps**: Recharts, Leaflet, OpenStreetMap
- **Icons & Motion**: Lucide React, Framer Motion
- **Data Providers**: Open-Meteo API (ECMWF & GFS multi-model numerical forecasts, Copernicus CAMS air quality, historical archive back to 1940)
- **AI Core**: Grounded Meteorological Reasoning Engine + Google Gemini API integration

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ or v20+ LTS

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📂 Project Architecture

```
weather-gpt/
├── app/
│   ├── page.tsx               # Landing page with hero & playground
│   ├── dashboard/page.tsx     # Main weather briefing & metrics
│   ├── chat/page.tsx          # WeatherGPT AI conversational chat
│   ├── forecast/page.tsx      # Detailed 48h & 14-day forecast
│   ├── map/page.tsx           # Interactive weather radar map
│   ├── alerts/page.tsx        # Severe bulletins & smart alert triggers
│   ├── climate/page.tsx       # Climate intelligence & historical trends
│   ├── compare/page.tsx       # Dual-city comparison engine
│   ├── recommendations/page.tsx # Domain-specific activity advisors
│   ├── saved/page.tsx         # Saved locations & watchlist
│   ├── admin/page.tsx         # Admin telemetry & analytics dashboard
│   ├── settings/page.tsx      # Settings & preferences
│   ├── auth/                  # Login, Sign Up, Forgot Password
│   ├── api/                   # Next.js App Router API endpoints
│   └── globals.css            # Futuristic glassmorphic styling
├── components/                # Modular reusable UI components
├── lib/
│   ├── weather-service.ts     # Open-Meteo & Copernicus data client
│   ├── weather-ai.ts          # Natural language weather intelligence
│   ├── demo-scenarios.ts      # SIH 2026 presentation presets
│   ├── db.ts                  # In-memory persistent data store
│   └── utils.ts               # Formatting and conversion utilities
└── types/                     # TypeScript data interfaces
```

---

## 🛡️ SIH 2026 AI Safety & Ground Truth Principles
1. **Grounded In Real Data**: Every response is computed from real numerical atmospheric models.
2. **Zero Fabrication**: When weather data is uncertain, WeatherGPT explicitly reports confidence intervals and recommended backup windows.
3. **Emergency Awareness**: High-severity weather warnings direct citizens to official state disaster management authorities and emergency helplines (112/1077).
